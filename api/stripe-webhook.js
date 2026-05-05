// POST /api/stripe-webhook
// Stripe POSTs subscription / payment events here. We verify the signature, then
// log the event so you have a paper trail before you wire up a real DB or CRM.
//
// Required env vars:
//   STRIPE_SECRET_KEY
//   STRIPE_WEBHOOK_SECRET   whsec_...

const Stripe = require('stripe');

// Vercel must hand us the raw body for signature verification.
module.exports.config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise(function (resolve, reject) {
    let chunks = [];
    req.on('data', function (c) { chunks.push(c); });
    req.on('end', function () { resolve(Buffer.concat(chunks)); });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ error: 'stripe_not_configured' });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = req.headers['stripe-signature'];

  let event;
  try {
    const raw = await readRawBody(req);
    event = stripe.webhooks.constructEvent(raw, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('[stripe-webhook] bad signature:', err.message);
    return res.status(400).json({ error: 'bad_signature' });
  }

  // Handle the events we care about. Add cases as you build out the back-end.
  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object;
      console.log('[stripe-webhook] checkout completed:', session.id, session.customer_email, session.metadata);
      // TODO: write to your DB / CRM / Slack here.
      break;
    }
    case 'invoice.paid':
    case 'invoice.payment_failed':
    case 'customer.subscription.deleted':
    case 'customer.subscription.updated':
      console.log('[stripe-webhook]', event.type, event.data.object.id);
      break;
    default:
      // Unhandled event type — Stripe is fine with us returning 200 anyway.
      break;
  }
  return res.status(200).json({ received: true });
};
