import Invite from '../models/Invite.js';
import Team from '../models/Team.js';
import User from '../models/User.js';
import Activity from '../models/Activity.js';
import { ensureWorkspaceMember } from './workspaceController.js';

// POST /api/invites — create an invite (no email sent)
export const createInvite = async (req, res) => {
  try {
    const { email, teamId, role, designation } = req.body;
    if (!email || !teamId) {
      return res.status(400).json({ message: 'email and teamId are required' });
    }

    const team = await Team.findById(teamId);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    // Check if user is already a member
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      const alreadyMember = team.members.some(m => m.userId.toString() === existingUser._id.toString());
      if (alreadyMember) {
        return res.status(400).json({ message: 'This user is already a member of this team' });
      }
    }

    // Check for duplicate pending invite
    const existingInvite = await Invite.findOne({ email: email.toLowerCase(), teamId, status: 'pending' });
    if (existingInvite) {
      return res.status(400).json({ message: 'A pending invite already exists for this email' });
    }

    const invite = await Invite.create({
      email: email.toLowerCase(),
      teamId,
      role: role || 'member',
      designation: designation || '',
      invitedBy: req.user._id,
    });

    await Activity.create({
      userId: req.user._id,
      action: `Invited ${email} to "${team.name}" as ${role || 'member'}`,
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

// GET /api/invites/pending — get pending invites for the logged-in user's email
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

// GET /api/invites/team/:teamId — get all invites for a team
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

// POST /api/invites/:id/accept — accept an invite
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

    // Add user to team
    const team = await Team.findById(invite.teamId);
    if (!team) return res.status(404).json({ message: 'Team no longer exists' });

    const alreadyMember = team.members.some(m => m.userId.toString() === req.user._id.toString());
    if (!alreadyMember) {
      team.members.push({
        userId: req.user._id,
        role: invite.role,
        designation: invite.designation,
      });
      await team.save();
    }

    // Mirror membership at the workspace level so the invitee sees the
    // workspace in /api/workspaces. Idempotent — no-op if they were
    // already a workspace member from a previous invite.
    await ensureWorkspaceMember(team.workspaceId, req.user._id, 'member');

    invite.status = 'accepted';
    await invite.save();

    await Activity.create({
      userId: req.user._id,
      action: `Joined "${team.name}" as ${invite.role}${invite.designation ? ` (${invite.designation})` : ''}`,
      teamId: team._id,
    });

    const populated = await Team.findById(team._id).populate('members.userId', 'name email avatar');
    res.json({ invite, team: populated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/invites/:id/decline — decline an invite
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

// DELETE /api/invites/:id — revoke an invite (team admin)
export const revokeInvite = async (req, res) => {
  try {
    const invite = await Invite.findById(req.params.id);
    if (!invite) return res.status(404).json({ message: 'Invite not found' });
    await Invite.findByIdAndDelete(req.params.id);
    res.json({ message: 'Invite revoked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
