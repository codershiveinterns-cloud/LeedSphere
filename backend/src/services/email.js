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
const FRONTEND_URL   = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/+$/, '');
const MAIL_FROM      = process.env.MAIL_FROM || 'Leedsphere <noreply@leedsphere.app>';

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
const renderInviteHtml = ({ teamName, inviterName, role, inviteUrl, loginUrl }) => `
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
        <tr><td style="padding:24px 32px 32px 32px;">
          <p style="margin:0;color:#64748b;font-size:13px;line-height:1.5;">
            Already have an account?
            <a href="${loginUrl}" style="color:#4f46e5;text-decoration:none;font-weight:600;">Sign in</a> &mdash;
            we'll connect this invite to your existing account.
          </p>
          <hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;">
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

const renderInviteText = ({ teamName, inviterName, role, inviteUrl, loginUrl }) => `
You're invited to ${teamName || 'a team'} on Leedsphere

${inviterName || 'Someone'} invited you to join${role ? ` as ${role}` : ''}.

Accept the invite (expires in 24 hours, single-use):
${inviteUrl}

Already have an account? Sign in instead — we'll connect this invite automatically:
${loginUrl}

— Leedsphere
`;

/**
 * Send the invite email. Returns the Resend response on success, or null
 * if RESEND_API_KEY is unset (logged + skipped — non-fatal so the invite
 * record still gets created in the DB).
 */
export const sendInviteEmail = async ({ to, token, teamName, inviterName, role }) => {
  const inviteUrl = `${FRONTEND_URL}/accept-invite/${token}`;
  const loginUrl  = `${FRONTEND_URL}/login`;

  const html = renderInviteHtml({ teamName, inviterName, role, inviteUrl, loginUrl });
  const text = renderInviteText({ teamName, inviterName, role, inviteUrl, loginUrl });
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
