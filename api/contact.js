// POST /api/contact
// Body: { name, email, venue, topic, message }
// Logs the submission. Wire to your real mailer (Resend, Postmark, etc.) later.
module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch (_) { body = {}; }
  }
  body = body || {};

  if (!body.email || !body.message) {
    return res.status(400).json({ error: 'missing_fields' });
  }

  // For now: log to Vercel function logs. Swap for a real email send.
  console.log('[contact]', JSON.stringify({
    name: body.name, email: body.email, venue: body.venue,
    topic: body.topic, message: String(body.message || '').slice(0, 2000),
    forwarded_to: process.env.CONTACT_FORWARD_EMAIL || '(unset)',
  }));

  return res.status(200).json({ ok: true });
};
