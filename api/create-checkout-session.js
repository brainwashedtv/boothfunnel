// POST /api/create-checkout-session
// Body: { plan: 'flexible'|'annual', venue_name, contact_email, ...all the form fields }
// Returns: { url: <Stripe Checkout redirect URL> }
//
// Required env vars:
//   STRIPE_SECRET_KEY                sk_live_... or sk_test_...
//   STRIPE_PRICE_FLEXIBLE_MONTHLY    price_...  recurring $495/mo
//   STRIPE_PRICE_ANNUAL              price_...  recurring $4,380/year — full year up front
//   PUBLIC_BASE_URL                  https://boothfunnel.com  (no trailing slash)
//
// Billing model:
//   flexible: $495/mo, charged monthly from day 1. 3-month minimum commitment is enforced
//             contractually via the Terms — Stripe just bills monthly. Backed by the
//             100-contacts-month-1 money-back guarantee handled out of band.
//   annual:   $4,380/year subscription — charges today, renews annually.
//   group:    handled client-side; 5-49 booths route to /contact?topic=group.
//   bulk:     handled client-side; 50+ booths route to /contact?topic=bulk.
//
// Backward compat: STRIPE_PRICE_GROWTH still works if set, mapped to plan='growth'.

const Stripe = require('stripe');

const PLAN_CONFIG = {
  flexible: {
    recurring: process.env.STRIPE_PRICE_FLEXIBLE_MONTHLY,
  },
  annual: {
    recurring: process.env.STRIPE_PRICE_ANNUAL,
  },
  // Legacy: old single-tier $499/mo. Kept so links during migration don't 400.
  growth: {
    recurring: process.env.STRIPE_PRICE_GROWTH,
  },
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
  const config = PLAN_CONFIG[plan];
  if (!config || !config.recurring) {
    return res.status(400).json({ error: 'invalid_plan', plan: plan });
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

  // Both Flexible and Annual are simple recurring subscriptions — single line item, no trial.
  // (Group and Bulk redirect to /contact and never reach this handler.)
  const lineItems = [{ price: config.recurring, quantity: 1 }];
  const subscriptionData = { metadata: metadata };

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: lineItems,
      customer_email: body.contact_email || undefined,
      success_url: baseUrl + '/success?session_id={CHECKOUT_SESSION_ID}',
      cancel_url: baseUrl + '/cancel',
      allow_promotion_codes: true,
      billing_address_collection: 'required',
      metadata: metadata,
      subscription_data: subscriptionData,
    });
    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('[create-checkout-session]', err && err.message);
    return res.status(500).json({ error: 'stripe_error' });
  }
};
