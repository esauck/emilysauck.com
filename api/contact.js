// POST /api/contact — Vercel serverless function for the guided booking form.
//
// On a valid submission it sends two emails through Resend (domain
// emilysauck.com is verified; sender hello@emilysauck.com):
//   1. the full submission to emilysauckconsulting@gmail.com, with the
//      track + option in the subject line, reply-to set to the submitter;
//   2. an auto-reply to the submitter. Its wording must stay word-for-word
//      in sync with the on-screen confirmation in js/form.js.
//
// Spam protection: a honeypot field ("company" — bots fill it, humans never
// see it; filled → pretend success, send nothing) and a light per-IP rate
// limit. The rate limit is in-memory per warm function instance, which is
// adequate for a personal site — not a hard guarantee across instances.
//
// Required environment variable: RESEND_API_KEY (never commit the key).

const RESEND_ENDPOINT = 'https://api.resend.com/emails';
const FROM = 'Emily Sauck <hello@emilysauck.com>';
const NOTIFY_TO = 'emilysauckconsulting@gmail.com';

const TRACK_LABELS = { cycle: 'Cycle 101', meno: 'Peri/Menopause 101' };
// Must mirror TRACKS in js/form.js — interests are validated against this
// list so the email subject can only ever contain known strings.
const TRACK_OPTIONS = {
  cycle: ['A 1:1 session for me', 'A 1:1 session for my child', 'A session for my team', 'A speaker for my panel or organization'],
  meno: ['A 1:1 session for myself', 'A group session for me and my friends', 'A speaker for my panel or organization'],
};

const RATE_LIMIT_MAX = 5;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const rateBuckets = new Map();

function isRateLimited(ip) {
  const now = Date.now();
  const hits = (rateBuckets.get(ip) || []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  if (hits.length >= RATE_LIMIT_MAX) return true;
  hits.push(now);
  rateBuckets.set(ip, hits);
  if (rateBuckets.size > 5000) rateBuckets.clear(); // unbounded-growth backstop
  return false;
}

function str(v, max) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

async function sendEmail(apiKey, message) {
  const res = await fetch(RESEND_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Resend ${res.status}: ${body.slice(0, 500)}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }

  const body = req.body || {};

  // Honeypot: a filled "company" field means a bot. Pretend success.
  if (str(body.company, 200)) {
    return res.status(200).json({ ok: true });
  }

  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  if (isRateLimited(ip)) {
    return res.status(429).json({ ok: false, error: 'Too many requests — please try again later.' });
  }

  const track = str(body.track, 20);
  const interest = str(body.interest, 200);
  const name = str(body.name, 200);
  const email = str(body.email, 320);
  const phone = str(body.phone, 50);
  const note = str(body.note, 5000);

  const trackLabel = TRACK_LABELS[track];
  if (!trackLabel || !TRACK_OPTIONS[track].includes(interest)) {
    return res.status(400).json({ ok: false, error: 'Invalid selection.' });
  }
  if (!name || !email || !/.+@.+\..+/.test(email) || /[\r\n]/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Please provide your name and a valid email.' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('RESEND_API_KEY is not set');
    return res.status(500).json({ ok: false, error: 'Email service not configured.' });
  }

  const notification = {
    from: FROM,
    to: [NOTIFY_TO],
    reply_to: email,
    subject: `New request — ${trackLabel} · ${interest}`,
    text: [
      `Track: ${trackLabel}`,
      `Interested in: ${interest}`,
      '',
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || '—'}`,
      '',
      'Note:',
      note || '—',
    ].join('\n'),
  };

  const firstName = name.split(' ')[0];
  const autoReply = {
    from: FROM,
    to: [email],
    subject: 'Thanks for reaching out!',
    text: `Thank you for reaching out, ${firstName}! We will review your request and get back to you within 2 business days. Look forward to talking, Emily`,
  };

  try {
    await sendEmail(apiKey, notification);
  } catch (err) {
    console.error('Notification email failed:', err);
    return res.status(502).json({ ok: false, error: 'Could not send your request.' });
  }

  try {
    await sendEmail(apiKey, autoReply);
  } catch (err) {
    // The request reached Emily's inbox; a failed auto-reply shouldn't
    // surface as an error to the submitter.
    console.error('Auto-reply email failed:', err);
  }

  return res.status(200).json({ ok: true });
}
