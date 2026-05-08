// POST /api/create-checkout-session
// Body: { plan: 'flexible'|'annual', venue_name, contact_email, ...all the form fields }
// Returns: { url: <Stripe Checkout redirect URL> }
//
// Required env vars:
//   STRIPE_SECRET_KEY            sk_live_... or sk_test_...
//   STRIPE_PRICE_FLEXIBLE        price_...   ($1,485 recurring every 3 months — "$495/mo, billed quarterly")
//   STRIPE_PRICE_ANNUAL          price_...   ($2,190 recurring every 6 months — "$365/mo, 12-mo commitment, billed semi-annually")
//   PUBLIC_BASE_URL              https://boothfunnel.com  (no trailing slash)
//
// "bulk" (50+ booths) is handled on the client — it short-circuits to /contact?topic=bulk
// rather than going through self-serve checkout.
//
// Backward compat: STRIPE_PRICE_GROWTH still works if set, mapped to plan='growth'.

const Stripe = require('stripe');

const PRICE_BY_PLAN = {
  flexible: process.env.STRIPE_PRICE_FLEXIBLE,
  annual:   process.env.STRIPE_PRICE_ANNUAL,
  // Legacy mapping — keep so old links/tests keep working until env is migrated.
  growth:   process.env.STRIPE_PRICE_GROWTH,
};

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    return res.status(500).json({ error: 'stripe_not_configured' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const baseUrl = process.env.PUBLIC_BASE_URL || `https://${req.headers.host}`;

  // Vercel auto-parses JSON bodies, but be defensive in case raw text is delivered.
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  body = body || {};

  const plan = String(body.plan || '').toLowerCase();
  const priceId = PRICE_BY_PLAN[plan];
  if (!priceId) {
    return res.status(400).json({ error: 'invalid_plan' });
  }

  // Strip undefined values so we don't push junk to Stripe metadata.
  // Stripe metadata: 50 keys max, 500 chars per value.
  const metadata = {};
  ['venue_name', 'venue_type', 'contact_name', 'contact_email', 'contact_phone',
   'brand_display', 'brand_color', 'brand_hashtag', 'brand_instagram',
   'logo_url', 'logo_filename',
   'ship_address1', 'ship_address2', 'ship_city', 'ship_state', 'ship_zip', 'ship_network',
   'ship_notes'].forEach(function (k) {
    if (body[k]) metadata[k] = String(body[k]).slice(0, 500);
  });
  metadata.plan = plan;

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      customer_email: body.contact_email || undefined,
      success_url: baseUrl + '/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: baseUrl + '/cancel',
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata,
      subscription_data: { metadata },
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[create-checkout-session]', err && err.message);
    return res.status(500).json({ error: 'stripe_error' });
  }
};
