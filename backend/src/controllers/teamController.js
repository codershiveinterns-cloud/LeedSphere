import Team from '../models/Team.js';
import Activity from '../models/Activity.js';
import { findUserTeams, findUserTeamMembership } from '../services/teamMember.js';
import { ensureWorkspaceMember } from './workspaceController.js';

// POST /api/teams
export const createTeam = async (req, res) => {
  try {
    const { workspaceId, name, description } = req.body;
    if (!workspaceId || !name) {
      return res.status(400).json({ message: 'workspaceId and name are required' });
    }

    const team = await Team.create({
      workspaceId,
      name,
      description: description || '',
      createdBy: req.user._id,
      members: [{ userId: req.user._id, role: 'admin' }],
    });

    // Make sure the team creator is also tracked as a workspace member so
    // the workspace shows up in their /api/workspaces list.
    await ensureWorkspaceMember(workspaceId, req.user._id, 'member');

    await Activity.create({
      userId: req.user._id,
      action: `Created team "${name}"`,
      teamId: team._id,
    });

    const populated = await Team.findById(team._id).populate('members.userId', 'name email avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/teams (user's teams) or GET /api/teams?workspaceId=xxx
export const getTeams = async (req, res) => {
  try {
    const { workspaceId } = req.query;
    const filter = {};
    if (workspaceId) filter.workspaceId = workspaceId;
    // Only return teams the user is a member of
    filter['members.userId'] = req.user._id;

    const teams = await Team.find(filter).populate('members.userId', 'name email avatar');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/teams/:workspaceId
// Returns ONLY teams in this workspace where the caller is a team member.
// Previously this leaked every team in the workspace — fixed.
export const getTeamsByWorkspace = async (req, res) => {
  try {
    const teams = await Team.find({
      workspaceId: req.params.workspaceId,
      'members.userId': req.user._id,
    }).populate('members.userId', 'name email avatar');
    res.json(teams);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/teams/detail/:id
export const getTeamById = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id).populate('members.userId', 'name email avatar');
    if (!team) return res.status(404).json({ message: 'Team not found' });
    res.json(team);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/teams/my
// Returns the caller's TeamMember records with populated team + workspace.
// Used right after login to drive 0/1/N onboarding, and as the source for
// the team switcher.
export const getMyTeams = async (req, res) => {
  try {
    const memberships = await findUserTeams(req.user._id);
    res.json({ memberships });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/teams/:teamId/me
// Refresh-safety endpoint. Verifies the caller is still a member of the team
// in localStorage and returns { team, role }. 403 when the membership is gone
// so the frontend can drop the stale entry and route back to team selection.
export const getTeamWithMyRole = async (req, res) => {
  try {
    const membership = await findUserTeamMembership(req.user._id, req.params.teamId);
    if (!membership) {
      return res.status(403).json({ message: 'You are not a member of this team' });
    }
    const team = await Team.findById(req.params.teamId)
      .populate('workspaceId', 'name')
      .lean();
    if (!team) return res.status(404).json({ message: 'Team not found' });

    res.json({
      team: {
        _id: team._id,
        name: team.name,
        description: team.description,
        workspaceId: team.workspaceId?._id || team.workspaceId,
        workspace: team.workspaceId && typeof team.workspaceId === 'object'
          ? { _id: team.workspaceId._id, name: team.workspaceId.name }
          : null,
      },
      role: membership.role,
      designation: membership.designation || '',
      joinedAt: membership.joinedAt,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/teams/:id
export const updateTeam = async (req, res) => {
  try {
    const { name, description } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    if (name) team.name = name;
    if (description !== undefined) team.description = description;
    await team.save();

    const populated = await Team.findById(team._id).populate('members.userId', 'name email avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/teams/:id
export const deleteTeam = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });
    await Team.findByIdAndDelete(req.params.id);
    res.json({ message: 'Team deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/teams/:id/members
export const addMember = async (req, res) => {
  try {
    const { userId, role, designation } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const alreadyMember = team.members.some(m => m.userId.toString() === userId);
    if (alreadyMember) return res.status(400).json({ message: 'User is already a member' });

    team.members.push({ userId, role: role || 'member', designation: designation || '' });
    await team.save();

    await Activity.create({ userId: req.user._id, action: `Added a member to "${team.name}"`, teamId: team._id });

    const populated = await Team.findById(team._id).populate('members.userId', 'name email avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/teams/:id/members/:userId — update role or designation
export const updateMember = async (req, res) => {
  try {
    const { role, designation } = req.body;
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    const member = team.members.find(m => m.userId.toString() === req.params.userId);
    if (!member) return res.status(404).json({ message: 'Member not found' });

    if (role) member.role = role;
    if (designation !== undefined) member.designation = designation;
    await team.save();

    await Activity.create({
      userId: req.user._id,
      action: `Updated ${req.params.userId}'s role/designation in "${team.name}"`,
      teamId: team._id,
    });

    const populated = await Team.findById(team._id).populate('members.userId', 'name email avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/teams/:id/members/:userId
export const removeMember = async (req, res) => {
  try {
    const team = await Team.findById(req.params.id);
    if (!team) return res.status(404).json({ message: 'Team not found' });

    team.members = team.members.filter(m => m.userId.toString() !== req.params.userId);
    await team.save();

    await Activity.create({ userId: req.user._id, action: `Removed a member from "${team.name}"`, teamId: team._id });

    const populated = await Team.findById(team._id).populate('members.userId', 'name email avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/teams/merge
export const mergeTeams = async (req, res) => {
  try {
    const { targetTeamId, sourceTeamId } = req.body;
    const target = await Team.findById(targetTeamId);
    const source = await Team.findById(sourceTeamId);
    if (!target || !source) return res.status(404).json({ message: 'Team not found' });

    // Combine members, deduplicate by userId
    const existingIds = new Set(target.members.map(m => m.userId.toString()));
    for (const m of source.members) {
      if (!existingIds.has(m.userId.toString())) {
        target.members.push(m);
      }
    }
    await target.save();
    await Team.findByIdAndDelete(sourceTeamId);

    await Activity.create({ userId: req.user._id, action: `Merged "${source.name}" into "${target.name}"`, teamId: target._id });

    const populated = await Team.findById(target._id).populate('members.userId', 'name email avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
