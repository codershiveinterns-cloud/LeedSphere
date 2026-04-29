import crypto from 'crypto';
import Invite from '../models/Invite.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { ensureWorkspaceMember } from './workspaceController.js';
import { sendInviteEmail } from '../services/email.js';

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;
const generateInviteToken = () => crypto.randomBytes(24).toString('hex');

const normalizeInviteRole = (role) => (role === 'manager' ? 'manager' : 'member');
const TEAM_ROLE_RANK = { member: 1, manager: 2, admin: 3 };
const maxTeamRole = (a, b) => (
  (TEAM_ROLE_RANK[a] || 1) >= (TEAM_ROLE_RANK[b] || 1) ? a : b
);

// POST /api/invites � create an invite (no email sent)
export const createInvite = async (req, res) => {
  try {
    const { email, teamId, role, designation } = req.body;
    if (!email || !teamId) {
      return res.status(400).json({ message: 'email and teamId are required' });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const normalizedRole = normalizeInviteRole(role);

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const alreadyMember = team.members.some((m) => m.userId.toString() === existingUser._id.toString());
      if (alreadyMember) {
        return res.status(400).json({ message: 'This user is already a member of this team' });
      }
    }

    const existingInvite = await Invite.findOne({ email: email.toLowerCase(), teamId, status: 'pending' });
    if (existingInvite) {
      return res.status(400).json({ message: 'A pending invite already exists for this email' });
    }

    // Generate magic-link token + 24h expiry alongside the in-app invite so
    // the same record powers both: dashboard list (in-app) AND emailed link.
    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

    const invite = await Invite.create({
      email: email.toLowerCase(),
      teamId,
      role: normalizedRole,
      designation: designation || '',
      invitedBy: req.user._id,
      token,
      expiresAt,
    });

    console.log('Invite created for:', email.toLowerCase());

    await Activity.create({
      userId: req.user._id,
      action: `Invited ${email} to "${team.name}" as ${normalizedRole}`,
      teamId,
    });

    // Email send is best-effort: a Resend outage must not roll back the
    // in-app invite the admin just created.
    try {
      console.log('Sending email invite...');
      await sendInviteEmail({
        to: email.toLowerCase(),
        token,
        teamName: team.name,
        inviterName: req.user.name || 'Someone',
        role: normalizedRole,
      });
      console.log('Email sent successfully');
    } catch (err) {
      console.error('Email failed but invite created:', err?.message || err);
    }

    const populated = await Invite.findById(invite._id)
      .populate('teamId', 'name')
      .populate('invitedBy', 'name');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/invites/pending
export const getMyPendingInvites = async (req, res) => {
  try {
    const invites = await Invite.find({ email: req.user.email, status: 'pending' })
      .populate('teamId', 'name description')
      .populate('invitedBy', 'name avatar profileImage')
      .sort({ createdAt: -1 });
    res.json(invites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/invites/team/:teamId
export const getTeamInvites = async (req, res) => {
  try {
    const invites = await Invite.find({ teamId: req.params.teamId })
      .populate('invitedBy', 'name')
      .sort({ createdAt: -1 });
    res.json(invites);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/invites/:id/accept
export const acceptInvite = async (req, res) => {
  try {
    const invite = await Invite.findById(req.params.id);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });

    if (invite.email !== req.user.email) {
      return res.status(403).json({ message: 'This invite is not for you' });
    }

    if (invite.status !== 'pending') {
      return res.status(400).json({ message: `Invite already ${invite.status}` });
    }

    const team = await Team.findById(invite.teamId);
    if (!team) return res.status(404).json({ message: 'Team no longer exists' });

    const acceptedRole = normalizeInviteRole(invite.role);
    const existingMember = team.members.find((m) => m.userId.toString() === req.user._id.toString());

    if (!existingMember) {
      team.members.push({
        userId: req.user._id,
        role: acceptedRole,
        designation: invite.designation,
      });
      await team.save();
    } else {
      const nextRole = maxTeamRole(existingMember.role, acceptedRole);
      let changed = false;
      if (nextRole !== existingMember.role) {
        existingMember.role = nextRole;
        changed = true;
      }
      if (!existingMember.designation && invite.designation) {
        existingMember.designation = invite.designation;
        changed = true;
      }
      if (changed) await team.save();
    }

    await ensureWorkspaceMember(team.workspaceId, req.user._id, acceptedRole);

    invite.status = 'accepted';
    invite.role = acceptedRole;
    await invite.save();

    await Activity.create({
      userId: req.user._id,
      action: `Joined "${team.name}" as ${acceptedRole}${invite.designation ? ` (${invite.designation})` : ''}`,
      teamId: team._id,
    });

    const populated = await Team.findById(team._id).populate('members.userId', 'name email avatar profileImage');
    res.json({ invite, team: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/invites/:id/decline
export const declineInvite = async (req, res) => {
  try {
    const invite = await Invite.findById(req.params.id);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });

    if (invite.email !== req.user.email) {
      return res.status(403).json({ message: 'This invite is not for you' });
    }

    invite.status = 'declined';
    await invite.save();
    res.json({ message: 'Invite declined' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/invites/:id
export const revokeInvite = async (req, res) => {
  try {
    const invite = await Invite.findById(req.params.id);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });

    // Refuse to delete an already-accepted invite — the user is on the team now,
    // and removing the audit record could surprise admins. Use member-removal instead.
    if (invite.status === 'accepted' || invite.accepted) {
      return res.status(400).json({ message: 'Cannot delete an invite that has already been accepted' });
    }

    const team = await Team.findById(invite.teamId).select('members');
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const myRole = team.members.find((m) => String(m.userId) === String(req.user._id))?.role;
    if (!myRole || !['admin', 'manager'].includes(myRole)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    await Invite.findByIdAndDelete(req.params.id);
    console.log('Invite deleted:', invite.email);
    res.json({ message: 'Invite revoked', _id: invite._id });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/invites/:id/resend
// Generates a fresh token + 24h expiry, invalidating any previously-emailed
// link for the same invite, and re-sends the email via Resend.
export const resendInvite = async (req, res) => {
  try {
    const invite = await Invite.findById(req.params.id);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });
    if (invite.status === 'accepted' || invite.accepted) {
      return res.status(400).json({ message: 'This invite has already been accepted' });
    }

    const team = await Team.findById(invite.teamId).select('members name');
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const myRole = team.members.find((m) => String(m.userId) === String(req.user._id))?.role;
    if (!myRole || !['admin', 'manager'].includes(myRole)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    // Rotate the token + reset expiry. The old link in the previous email
    // becomes a 404 the moment this runs — that is the desired behavior.
    const token = generateInviteToken();
    const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);
    invite.token = token;
    invite.expiresAt = expiresAt;
    invite.status = 'pending';
    invite.accepted = false;
    await invite.save();

    try {
      await sendInviteEmail({
        to: invite.email,
        token,
        teamName: team.name,
        inviterName: req.user.name || 'Someone',
        role: invite.role,
      });
      console.log('Invite resent:', invite.email);
    } catch (err) {
      console.error('Resend email failed:', err?.message || err);
      // DB has the new token regardless; surface a soft error so the admin
      // knows to retry rather than assuming success.
      return res.status(502).json({ message: 'Token refreshed but email failed to send. Try again.' });
    }

    res.json({
      ok: true,
      message: 'Invite resent',
      _id: invite._id,
      email: invite.email,
      expiresAt,
    });
  } catch (err) {
    console.error('resendInvite:', err);
    res.status(500).json({ message: err.message });
  }
};
