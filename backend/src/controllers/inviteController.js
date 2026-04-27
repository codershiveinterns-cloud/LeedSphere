import Invite from '../models/Invite.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { ensureWorkspaceMember } from './workspaceController.js';

const normalizeInviteRole = (role) => (role === 'manager' ? 'manager' : 'member');
const TEAM_ROLE_RANK = { member: 1, manager: 2, admin: 3 };
const maxTeamRole = (a, b) => (
  (TEAM_ROLE_RANK[a] || 1) >= (TEAM_ROLE_RANK[b] || 1) ? a : b
);

// POST /api/invites — create an invite (no email sent)
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

    const invite = await Invite.create({
      email: email.toLowerCase(),
      teamId,
      role: normalizedRole,
      designation: designation || '',
      invitedBy: req.user._id,
    });

    await Activity.create({
      userId: req.user._id,
      action: `Invited ${email} to "${team.name}" as ${normalizedRole}`,
      teamId,
    });

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
      .populate('invitedBy', 'name avatar')
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

    const populated = await Team.findById(team._id).populate('members.userId', 'name email avatar');
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

    const team = await Team.findById(invite.teamId).select('members');
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const myRole = team.members.find((m) => String(m.userId) === String(req.user._id))?.role;
    if (!myRole || !['admin', 'manager'].includes(myRole)) {
      return res.status(403).json({ message: 'Access denied. Insufficient permissions.' });
    }

    await Invite.findByIdAndDelete(req.params.id);
    res.json({ message: 'Invite revoked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
