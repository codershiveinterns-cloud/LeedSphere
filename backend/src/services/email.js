/**
 * Email delivery via Resend.
 *
 * Single entry point: `sendInviteEmail({ to, inviteUrl, loginUrl, ... })`.
 * Other email types can be added beside it.
 *
 * Config (via .env):
 *   RESEND_API_KEY  — required for actual sends
 *   FRONTEND_URL    — base URL used to build accept/login links
 *   MAIL_FROM       — optional override of the From address
 *
 * If RESEND_API_KEY is unset (e.g. local dev without keys), we fall back
 * to logging the email to the console instead of throwing — keeps the
 * invite flow testable without spinning up a mail provider.
 */
import { Resend } from 'resend';

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const FRONTEND_URL   = (process.env.FRONTEND_URL || 'https://www.leedsphere.com').replace(/\/+$/, '');
const MAIL_FROM      = process.env.MAIL_FROM || 'Leedsphere <noreply@leedsphere.com>';
// Single source of truth for the global support inbox. Override via env if
// the operations team ever moves to a different alias.
export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'admin@leedsphere.com';

let _client = null;
const client = () => {
  if (!RESEND_API_KEY) return null;
  if (!_client) _client = new Resend(RESEND_API_KEY);
  return _client;
};

const safeName = (s) => String(s || '').replace(/[<>]/g, '');

/**
 * Build the responsive HTML body. Tokens are URL-safe by construction, so
 * no extra encoding needed in href. Plain-text fallback included so spam
 * filters and text-only clients render the email correctly.
 */
const renderInviteHtml = ({ teamName, inviterName, role, inviteUrl, loginUrl, signupUrl }) => `
<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>You're invited</title></head>
<body style="margin:0;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:40px 16px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;box-shadow:0 8px 24px rgba(15,23,42,0.06);overflow:hidden;">
        <tr><td style="padding:32px 32px 8px 32px;">
          <div style="display:inline-flex;align-items:center;gap:8px;">
            <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;font-weight:700;font-size:18px;display:flex;align-items:center;justify-content:center;">L</div>
            <span style="font-weight:700;font-size:18px;letter-spacing:-0.01em;">Leedsphere</span>
          </div>
        </td></tr>
        <tr><td style="padding:8px 32px 0 32px;">
          <h1 style="margin:24px 0 8px;font-size:26px;line-height:1.2;letter-spacing:-0.02em;">You're invited</h1>
          <p style="margin:0 0 16px;color:#475569;line-height:1.6;font-size:15px;">
            ${safeName(inviterName) || 'Someone'} invited you to join
            <strong>${safeName(teamName) || 'their team'}</strong>${role ? ` as <strong>${safeName(role)}</strong>` : ''} on Leedsphere.
          </p>
          <p style="margin:0 0 24px;color:#64748b;line-height:1.6;font-size:14px;">
            This link expires in 24 hours and can only be used once.
          </p>
        </td></tr>
        <tr><td align="center" style="padding:0 32px 8px 32px;">
          <a href="${inviteUrl}" style="display:inline-block;background:linear-gradient(135deg,#4f46e5,#9333ea);color:#fff;text-decoration:none;font-weight:600;font-size:15px;padding:13px 28px;border-radius:12px;box-shadow:0 8px 16px rgba(99,102,241,0.25);">Accept invite</a>
        </td></tr>
        <tr><td style="padding:24px 32px 8px 32px;">
          <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">
            Already have an account?
            <a href="${loginUrl}" style="color:#4f46e5;text-decoration:none;font-weight:600;">Sign in</a> &mdash;
            we'll connect this invite to your existing account.
          </p>
          <p style="margin:8px 0 0;color:#64748b;font-size:13px;line-height:1.5;">
            New to Leedsphere? You can also
            <a href="${signupUrl}" style="color:#4f46e5;text-decoration:none;font-weight:600;">create an account</a>
            and use the same email to claim this invite.
          </p>
        </td></tr>
        <tr><td style="padding:16px 32px 32px 32px;">
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:0 0 16px;">
          <p style="margin:0;color:#94a3b8;font-size:12px;line-height:1.5;">
            If the button above doesn't work, copy this URL into your browser:<br>
            <span style="color:#475569;word-break:break-all;">${inviteUrl}</span>
          </p>
        </td></tr>
      </table>
      <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;">&copy; ${new Date().getFullYear()} Leedsphere</p>
    </td></tr>
  </table>
</body></html>`;

const renderInviteText = ({ teamName, inviterName, role, inviteUrl, loginUrl, signupUrl }) => `
You're invited to ${teamName || 'a team'} on Leedsphere

${inviterName || 'Someone'} invited you to join${role ? ` as ${role}` : ''}.

Accept the invite (expires in 24 hours, single-use):
${inviteUrl}

Already have an account? Sign in — we'll connect this invite automatically:
${loginUrl}

New to Leedsphere? Create an account with the same email:
${signupUrl}

— Leedsphere
`;

/**
 * Send the invite email. Returns the Resend response on success, or null
 * if RESEND_API_KEY is unset (logged + skipped — non-fatal so the invite
 * record still gets created in the DB).
 */
export const sendInviteEmail = async ({ to, token, teamName, inviterName, role }) => {
  // BASE_URL is the production frontend origin. FRONTEND_URL (env) is the
  // single source of truth; we alias to BASE_URL here to match the link spec.
  const BASE_URL = FRONTEND_URL || 'https://www.leedsphere.com';
  const inviteLink = `${BASE_URL}/accept-invite/${token}`;
  const inviteUrl  = inviteLink;
  const loginUrl   = `${BASE_URL}/login`;
  const signupUrl  = `${BASE_URL}/signup`;
  console.log('Invite link:', inviteLink);
  console.log('Login link:', loginUrl);
  console.log('Signup link:', signupUrl);

  const html = renderInviteHtml({ teamName, inviterName, role, inviteUrl, loginUrl, signupUrl });
  const text = renderInviteText({ teamName, inviterName, role, inviteUrl, loginUrl, signupUrl });
  const subject = `${inviterName || 'Someone'} invited you to ${teamName || 'a team'} on Leedsphere`;

  const c = client();
  if (!c) {
    console.warn('[email] RESEND_API_KEY not set — invite link not sent. URL:', inviteUrl);
    return null;
  }

  try {
    const result = await c.emails.send({
      from: MAIL_FROM,
      to: [to],
      subject,
      html,
      text,
    });
    console.info('[email] invite sent', { to, id: result?.data?.id || result?.id });
    return result;
  } catch (err) {
    console.error('[email] Resend send failed:', err?.message || err);
    return null;
  }
};

/* ============================================================
 * Contact form
 *   sendContactEmails({ name, email, company, message })
 *     1. Notification → admin@leedsphere.com (reply-to set to user)
 *     2. Auto-reply   → user with confirmation copy
 *
 *   Returns { admin, user } — each is the Resend response or null.
 * ============================================================ */

const escapeHtml = (s) => String(s || '')
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&#39;');

const renderContactNotificationHtml = ({ name, email, company, message, sentAt }) => `
<!doctype html>
<html><body style="margin:0;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:32px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:14px;box-shadow:0 6px 20px rgba(15,23,42,0.06);overflow:hidden;">
      <tr><td style="padding:24px 28px;border-bottom:1px solid #e2e8f0;">
        <div style="font-size:13px;color:#64748b;letter-spacing:0.04em;text-transform:uppercase;font-weight:600;">Leedsphere — New contact message</div>
      </td></tr>
      <tr><td style="padding:24px 28px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
          <tr><td style="padding:6px 0;color:#475569;font-size:13px;width:120px;">Name</td><td style="padding:6px 0;color:#0f172a;font-size:14px;font-weight:600;">${escapeHtml(name)}</td></tr>
          <tr><td style="padding:6px 0;color:#475569;font-size:13px;">Email</td><td style="padding:6px 0;font-size:14px;"><a href="mailto:${escapeHtml(email)}" style="color:#4f46e5;text-decoration:none;">${escapeHtml(email)}</a></td></tr>
          <tr><td style="padding:6px 0;color:#475569;font-size:13px;">Company</td><td style="padding:6px 0;color:#0f172a;font-size:14px;">${escapeHtml(company) || '<span style="color:#94a3b8;">—</span>'}</td></tr>
          <tr><td style="padding:6px 0;color:#475569;font-size:13px;vertical-align:top;">Sent at</td><td style="padding:6px 0;color:#0f172a;font-size:14px;">${escapeHtml(sentAt)}</td></tr>
        </table>
        <hr style="border:none;border-top:1px solid #e2e8f0;margin:18px 0;">
        <div style="font-size:13px;color:#475569;margin-bottom:8px;font-weight:600;">Message</div>
        <div style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;font-size:14px;line-height:1.6;color:#0f172a;">${escapeHtml(message)}</div>
      </td></tr>
    </table>
    <p style="margin:14px 0 0;color:#94a3b8;font-size:12px;">Reply to this email to respond directly.</p>
  </td></tr>
</table>
</body></html>`;

const renderContactNotificationText = ({ name, email, company, message, sentAt }) => `
New Contact Message — Leedsphere

Name: ${name}
Email: ${email}
Company: ${company || '—'}
Sent at: ${sentAt}

Message:
${message}
`;

const renderContactAutoReplyHtml = ({ name, message }) => `
<!doctype html>
<html><body style="margin:0;background:#f5f6f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;color:#0f172a;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:40px 16px;">
  <tr><td align="center">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;box-shadow:0 8px 24px rgba(15,23,42,0.06);overflow:hidden;">
      <tr><td style="padding:32px 32px 8px;">
        <div style="display:inline-flex;align-items:center;gap:8px;">
          <div style="width:36px;height:36px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#a855f7);color:#fff;font-weight:700;font-size:18px;display:flex;align-items:center;justify-content:center;">L</div>
          <span style="font-weight:700;font-size:18px;letter-spacing:-0.01em;">Leedsphere</span>
        </div>
      </td></tr>
      <tr><td style="padding:8px 32px 0;">
        <h1 style="margin:18px 0 8px;font-size:24px;line-height:1.2;letter-spacing:-0.02em;">We received your message</h1>
        <p style="margin:0 0 16px;color:#475569;line-height:1.6;font-size:15px;">
          Hi ${escapeHtml(name) || 'there'}, thank you for contacting Leedsphere. Our team will get back to you shortly.
        </p>
        <div style="margin:8px 0 4px;color:#64748b;font-size:13px;font-weight:600;">Your message</div>
        <div style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;font-size:14px;line-height:1.6;color:#0f172a;">${escapeHtml(message)}</div>
      </td></tr>
      <tr><td style="padding:24px 32px 32px;">
        <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">
          Need to add something? Just reply to this email — it lands in the same inbox.
        </p>
      </td></tr>
    </table>
    <p style="margin:16px 0 0;color:#94a3b8;font-size:12px;">&copy; ${new Date().getFullYear()} Leedsphere</p>
  </td></tr>
</table>
</body></html>`;

const renderContactAutoReplyText = ({ name, message }) => `
Hi ${name || 'there'},

Thank you for contacting Leedsphere.
We have received your message and our team will get back to you shortly.

Your Message:
"${message}"

Regards,
Leedsphere Team
`;

export const sendContactEmails = async ({ name, email, company, message }) => {
  const sentAt = new Date().toISOString().replace('T', ' ').replace(/\..+/, ' UTC');
  const c = client();

  const adminPayload = {
    name, email, company: company || '', message, sentAt,
  };

  if (!c) {
    console.warn('[email] RESEND_API_KEY not set — contact emails not sent.', { to: SUPPORT_EMAIL, from: email });
    return { admin: null, user: null };
  }

  // Notification to support inbox. reply_to lets the team hit "reply" and
  // respond directly to the user without copy-pasting addresses.
  let admin = null;
  try {
    admin = await c.emails.send({
      from: MAIL_FROM,
      to: [SUPPORT_EMAIL],
      reply_to: email,
      subject: `New contact message from ${name}`,
      html: renderContactNotificationHtml(adminPayload),
      text: renderContactNotificationText(adminPayload),
    });
    console.info('[email] contact notification sent', { id: admin?.data?.id || admin?.id });
  } catch (err) {
    console.error('[email] contact notification failed:', err?.message || err);
  }

  // Auto-reply to the user.
  let user = null;
  try {
    user = await c.emails.send({
      from: MAIL_FROM,
      to: [email],
      reply_to: SUPPORT_EMAIL,
      subject: 'We received your message - Leedsphere',
      html: renderContactAutoReplyHtml({ name, message }),
      text: renderContactAutoReplyText({ name, message }),
    });
    console.info('[email] contact auto-reply sent', { to: email, id: user?.data?.id || user?.id });
  } catch (err) {
    console.error('[email] contact auto-reply failed:', err?.message || err);
  }

  return { admin, user };
};
