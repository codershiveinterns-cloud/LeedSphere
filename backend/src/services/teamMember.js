/**
 * TeamMember — query facade over Team.members subdocuments.
 *
 * The canonical TeamMember record (userId, teamId, role) is stored as a
 * subdocument inside Team.members, so all team+role data is co-located with
 * the team. This module surfaces it as the "TeamMember collection" shape
 * (one record per user/team pair) expected by the auth flow and role
 * middleware. Use these helpers instead of reaching into Team.members
 * directly so the storage layout can evolve later without rippling.
 */
import Team from '../models/Team.js';

const pluckMembership = (team, userId) => {
  if (!team?.members) return null;
  const uid = String(userId);
  const m = team.members.find((mem) => String(mem.userId) === uid);
  if (!m) return null;
  return {
    userId: m.userId,
    teamId: team._id,
    role: m.role,              // 'admin' | 'manager' | 'member'
    designation: m.designation || '',
    joinedAt: m.joinedAt || null,
  };
};

// Find all teams the user is a member of.
// Returns: [{ teamId, role, designation, joinedAt, team: {_id, name, description, workspaceId, workspace} }]
export const findUserTeams = async (userId) => {
  const teams = await Team.find({ 'members.userId': userId })
    .select('name description workspaceId members createdAt')
    .populate('workspaceId', 'name')
    .lean();

  return teams
    .map((team) => {
      const m = (team.members || []).find((mem) => String(mem.userId) === String(userId));
      if (!m) return null;
      return {
        teamId: team._id,
        role: m.role,
        designation: m.designation || '',
        joinedAt: m.joinedAt || null,
        team: {
          _id: team._id,
          name: team.name,
          description: team.description,
          workspaceId: team.workspaceId?._id || team.workspaceId,
          workspace: team.workspaceId && typeof team.workspaceId === 'object'
            ? { _id: team.workspaceId._id, name: team.workspaceId.name }
            : null,
        },
      };
    })
    .filter(Boolean);
};

// Look up one membership.
export const findUserTeamMembership = async (userId, teamId) => {
  if (!userId || !teamId) return null;
  const team = await Team.findById(teamId).select('members');
  return pluckMembership(team, userId);
};

// Convenience: "is user an admin/manager/member of this team?"
export const hasTeamRole = async (userId, teamId, roles = []) => {
  const m = await findUserTeamMembership(userId, teamId);
  if (!m) return false;
  if (!roles.length) return true;
  return roles.includes(m.role);
};
