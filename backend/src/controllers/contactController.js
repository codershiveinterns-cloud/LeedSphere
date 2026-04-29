/**
 * POST /api/contact — public contact form receiver.
 *
 * Validates + sanitizes input, applies a simple in-memory rate limit, then
 * fires two Resend emails:
 *   1. Notification → admin@leedsphere.com (with reply-to = the sender)
 *   2. Auto-reply   → the sender
 *
 * Both emails are best-effort: if Resend is down we still return 200 so a
 * spike in errors doesn't surface to the user. The error is logged.
 */
import { sendContactEmails, SUPPORT_EMAIL } from '../services/email.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RATE_WINDOW_MS = 60 * 1000;
const RATE_MAX        = 3;
const rateBuckets = new Map(); // ip → [timestamp, ...]

const checkRate = (ip) => {
  const now = Date.now();
  const bucket = (rateBuckets.get(ip) || []).filter((t) => now - t < RATE_WINDOW_MS);
  if (bucket.length >= RATE_MAX) {
    rateBuckets.set(ip, bucket);
    return false;
  }
  bucket.push(now);
  rateBuckets.set(ip, bucket);
  return true;
};

const trim = (s, max) => String(s ?? '').trim().slice(0, max);

export const submitContact = async (req, res) => {
  try {
    // Trust proxy header if Express is configured for it; otherwise fall back
    // to the socket address. Either way it's a coarse rate-limit signal.
    const ip = (req.headers['x-forwarded-for']?.toString().split(',')[0].trim()) || req.ip || req.socket?.remoteAddress || 'unknown';

    if (!checkRate(ip)) {
      return res.status(429).json({ message: 'Too many messages. Please try again in a minute.' });
    }

    const name    = trim(req.body?.name, 120);
    const email   = trim(req.body?.email, 200).toLowerCase();
    const company = trim(req.body?.company, 200);
    const message = trim(req.body?.message, 5000);

    if (!name)    return res.status(400).json({ message: 'Name is required' });
    if (!email)   return res.status(400).json({ message: 'Email is required' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ message: 'Please enter a valid email address' });
    if (!message) return res.status(400).json({ message: 'Message is required' });
    if (message.length < 5) return res.status(400).json({ message: 'Message is too short' });

    // Fire-and-await so we can surface a 502 if Resend hard-fails on the
    // admin side. Auto-reply failures are non-fatal.
    const { admin } = await sendContactEmails({ name, email, company, message });
    console.log('[contact] received from', email, 'admin sent:', Boolean(admin));

    if (!admin) {
      return res.status(502).json({ message: 'We could not deliver your message right now. Please try again shortly.' });
    }
    res.json({
      ok: true,
      message: 'Message sent successfully',
      supportEmail: SUPPORT_EMAIL,
    });
  } catch (err) {
    console.error('submitContact:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
};
