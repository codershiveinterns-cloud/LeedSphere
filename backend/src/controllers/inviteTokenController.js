/**
 * Token-based magic-link invite flow.
 *
 * The pre-existing controller in inviteController.js handles the
 * authenticated team-management UX (admin views pending invites, accepts
 * via :id while signed in, etc.). This file adds the public, email-driven
 * flow:
 *
 *   POST /api/invite          — create invite + email it (auth, admin/manager)
 *   GET  /api/invite/:token   — validate a token (public)
 *   POST /api/invite/accept   — accept by token + create user (public)
 *
 * Token shape: 48 hex chars from crypto.randomBytes(24). Expires in 24h.
 * Single-use: once accepted, the token is invalidated.
 */
import crypto from 'crypto';
import Invite from '../models/Invite.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { ensureWorkspaceMember } from './workspaceController.js';
import { sendInviteEmail } from '../services/email.js';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const generateToken = () => crypto.randomBytes(24).toString('hex');

const normalizeRole = (role) => (['admin', 'manager', 'member'].includes(role) ? role : 'member');

/**
 * POST /api/invite
 * Body: { email, teamId, role?, designation? }
 * Creates an invite (or refreshes an existing pending one with a new
 * token + 24h expiry) and emails it via Resend.
 */
export const createTokenInvite = async (req, res) => {
  try {
    const { email, teamId, role, designation } = req.body || {};
    if (!email || !teamId) {
      return res.status(400).json({ message: 'email and teamId are required' });
    }
    const cleanEmail = String(email).toLowerCase().trim();
    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const finalRole = normalizeRole(role);

    // If the user already exists AND is on the team, refuse to send a new invite.
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      const onTeam = team.members.some((m) => String(m.userId) === String(existingUser._id));
      if (onTeam) {
        return res.status(400).json({ message: 'This user is already a member of this team' });
      }
    }

    // De-dup pending invites for the same (email, team) — refresh the
    // token + expiry instead of stacking duplicates.
    let invite = await Invite.findOne({ email: cleanEmail, teamId, status: 'pending' });
    const token = generateToken();
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    if (invite) {
      invite.token = token;
      invite.expiresAt = expiresAt;
      invite.role = finalRole;
      invite.designation = designation || invite.designation || '';
      invite.invitedBy = req.user._id;
      await invite.save();
    } else {
      invite = await Invite.create({
        email: cleanEmail,
        teamId,
        role: finalRole,
        designation: designation || '',
        invitedBy: req.user._id,
        token,
        expiresAt,
        status: 'pending',
        accepted: false,
      });
    }

    // Activity log + email send (non-blocking against DB write order).
    await Activity.create({
      userId: req.user._id,
      action: `Invited ${cleanEmail} to "${team.name}" as ${finalRole}`,
      teamId,
    }).catch(() => { /* activity is best-effort */ });

    sendInviteEmail({
      to: cleanEmail,
      token,
      teamName: team.name,
      inviterName: req.user.name || 'Someone',
      role: finalRole,
    }).catch((err) => console.warn('[invite] email send failed:', err?.message));

    res.status(201).json({
      ok: true,
      inviteId: invite._id,
      email: cleanEmail,
      expiresAt,
      // Don't return the token in the response — it's emailed; surfacing
      // it here would let any admin elevate themselves into another user's invite.
    });
  } catch (err) {
    console.error('createTokenInvite:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/invite/:token  (public)
 * Returns: { valid, userExists, email, expiresAt, accepted, team }
 */
export const validateInviteToken = async (req, res) => {
  try {
    const { token } = req.params;
    if (!token) return res.json({ valid: false, reason: 'missing-token' });

    const invite = await Invite.findOne({ token }).populate('teamId', 'name');
    if (!invite) return res.json({ valid: false, reason: 'not-found' });

    if (invite.status === 'accepted' || invite.accepted) {
      return res.json({ valid: false, accepted: true, reason: 'already-accepted', email: invite.email });
    }
    if (invite.status === 'declined') {
      return res.json({ valid: false, reason: 'declined', email: invite.email });
    }
    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      return res.json({ valid: false, reason: 'expired', email: invite.email });
    }

    const userExists = Boolean(await User.exists({ email: invite.email }));
    res.json({
      valid: true,
      userExists,
      email: invite.email,
      role: invite.role,
      expiresAt: invite.expiresAt,
      team: invite.teamId ? { _id: invite.teamId._id, name: invite.teamId.name } : null,
    });
  } catch (err) {
    console.error('validateInviteToken:', err);
    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/invite/accept  (public)
 * Body: { token, name, password }   (name + password only required if user doesn't exist)
 *
 * - If the email already has an account → just join the team (no creds needed).
 * - Else → create the user with bcrypt-hashed password, then join the team.
 *
 * Returns 200 with { ok: true, userExists, teamId } so the frontend can
 * decide whether to show a "Sign in to continue" button or auto-redirect.
 */
export const acceptInviteByToken = async (req, res) => {
  try {
    const { token, name, password } = req.body || {};
    if (!token) return res.status(400).json({ message: 'token is required' });

    const invite = await Invite.findOne({ token });
    if (!invite) return res.status(404).json({ message: 'Invite not found' });
    if (invite.status === 'accepted' || invite.accepted) {
      return res.status(400).json({ message: 'This invite has already been used' });
    }
    if (invite.status === 'declined') {
      return res.status(400).json({ message: 'This invite was declined' });
    }
    if (invite.expiresAt && invite.expiresAt.getTime() < Date.now()) {
      return res.status(400).json({ message: 'This invite has expired' });
    }

    const team = await Team.findById(invite.teamId);
    if (!team) return res.status(404).json({ message: 'Team no longer exists' });

    let user = await User.findOne({ email: invite.email });
    const userExists = Boolean(user);

    // Brand-new user — needs name + password.
    if (!user) {
      if (!name || !password) {
        return res.status(400).json({ message: 'name and password are required for new accounts' });
      }
      if (String(password).length < 8) {
        return res.status(400).json({ message: 'Password must be at least 8 characters' });
      }
      // Pre-save hook on User hashes the password with bcrypt.
      user = await User.create({
        name: String(name).trim(),
        email: invite.email,
        password,
        role: 'member', // global User.role — invitee, not a workspace owner
      });
    }

    // Join the team if not already a member.
    const finalRole = normalizeRole(invite.role);
    const existing = team.members.find((m) => String(m.userId) === String(user._id));
    if (!existing) {
      team.members.push({ userId: user._id, role: finalRole, designation: invite.designation || '' });
      await team.save();
    }

    await ensureWorkspaceMember(team.workspaceId, user._id, finalRole);

    invite.status = 'accepted';
    invite.accepted = true;
    invite.token = undefined; // single-use: invalidate the token
    await invite.save();

    await Activity.create({
      userId: user._id,
      action: `Joined "${team.name}" as ${finalRole}`,
      teamId: team._id,
    }).catch(() => { /* best-effort */ });

    res.json({
      ok: true,
      userExists,
      email: user.email,
      teamId: String(team._id),
      teamName: team.name,
      role: finalRole,
      message: userExists
        ? 'Joined the team. Sign in to continue.'
        : 'Account created and joined the team. Sign in to continue.',
    });
  } catch (err) {
    console.error('acceptInviteByToken:', err);
    res.status(500).json({ message: err.message });
  }
};
