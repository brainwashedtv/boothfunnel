// POST /api/upload-logo?filename=<name>
// Body: raw file bytes (image/svg+xml | image/png | image/jpeg)
// Returns: { url: <public Vercel Blob URL> }
//
// Required env vars:
//   BLOB_READ_WRITE_TOKEN   (auto-injected when a Vercel Blob store is connected)

const { put } = require('@vercel/blob');

const ALLOWED_TYPES = new Set([
  'image/svg+xml',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
]);
const MAX_BYTES = 6 * 1024 * 1024; // 6 MB cap

function safeName(name) {
  // Strip path segments + most punctuation; keep extension.
  var n = String(name || 'logo').split(/[\\/]/).pop();
  return n.replace(/[^a-zA-Z0-9._-]+/g, '_').slice(0, 80) || 'logo';
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'method_not_allowed' });
  }
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return res.status(500).json({ error: 'blob_not_configured' });
  }

  const contentType = String(req.headers['content-type'] || '').toLowerCase();
  if (!ALLOWED_TYPES.has(contentType)) {
    return res.status(400).json({ error: 'unsupported_type', got: contentType });
  }
  const contentLength = Number(req.headers['content-length'] || 0);
  if (contentLength > MAX_BYTES) {
    return res.status(413).json({ error: 'too_large', max: MAX_BYTES });
  }

  // Build a unique key so re-uploads don't collide.
  const filename = safeName(req.query && req.query.filename);
  const key = 'logos/' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '-' + filename;

  try {
    const blob = await put(key, req, {
      access: 'public',
      contentType: contentType,
      addRandomSuffix: false,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return res.status(200).json({ url: blob.url, pathname: blob.pathname });
  } catch (err) {
    console.error('[upload-logo]', err && err.message);
    return res.status(500).json({ error: 'upload_failed' });
  }
};

// Vercel: don't try to JSON-parse the body — we want the raw stream.
module.exports.config = { api: { bodyParser: false } };
