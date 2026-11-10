import { createHash } from 'node:crypto';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const { SUPABASE_URL: url, SUPABASE_SECRET_KEY: secretKey } = process.env;
  if (!url || !secretKey) return res.status(503).json({ error: 'Signup is not configured yet. Please try again later.' });

  const { email, website } = req.body || {};
  if (website) return res.status(200).json({ ok: true }); // Honeypot: ignore bots.
  if (typeof email !== 'string' || email.length > 254 || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({ error: 'Please provide a valid email address.' });
  }

  // Optional origin check; rejects cross-site form submissions.
  const origin = req.headers.origin;
  const host = req.headers.host;
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return res.status(403).json({ error: 'Invalid request origin.' });
    } catch { return res.status(403).json({ error: 'Invalid request origin.' }); }
  }

  try {
    const normalizedEmail = email.trim().toLowerCase();
    const ip = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0].trim();
    const ipHash = createHash('sha256').update(`${process.env.RATE_LIMIT_SALT || secretKey}:${ip}`).digest('hex');
    const response = await fetch(`${url.replace(/\/$/, '')}/rest/v1/rpc/signup_to_waitlist`, {
      method: 'POST',
      headers: { apikey: secretKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ p_email: normalizedEmail, p_ip_hash: ipHash }),
    });
    if (!response.ok) throw new Error(`Supabase signup error: ${response.status} ${await response.text()}`);
    if (await response.json() === false) {
      return res.status(429).json({ error: 'Too many attempts. Please try again in an hour.' });
    }
    return res.status(200).json({ ok: true });
  } catch (err) {
    console.error('Subscription storage error:', err.message);
    return res.status(500).json({ error: 'We couldn’t save your email just now. Please try again.' });
  }
}
