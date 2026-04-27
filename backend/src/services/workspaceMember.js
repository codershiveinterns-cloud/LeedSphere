import Workspace from '../models/Workspace.js';

const WORKSPACE_ROLE_RANK = { member: 1, manager: 2, admin: 3 };

export const normalizeWorkspaceRole = (role) => (
  ['admin', 'manager', 'member'].includes(role) ? role : 'member'
);

export const maxWorkspaceRole = (a, b) => {
  const ra = WORKSPACE_ROLE_RANK[normalizeWorkspaceRole(a)];
  const rb = WORKSPACE_ROLE_RANK[normalizeWorkspaceRole(b)];
  return ra >= rb ? normalizeWorkspaceRole(a) : normalizeWorkspaceRole(b);
};

export const ensureWorkspaceMember = async (workspaceId, userId, role = 'member') => {
  if (!workspaceId || !userId) return null;

  const workspace = await Workspace.findById(workspaceId);
  if (!workspace) return null;

  const uid = String(userId);
  const normalized = normalizeWorkspaceRole(role);
  const members = Array.isArray(workspace.members) ? workspace.members : [];
  const existing = members.filter((m) => String(m.userId) === uid);

  if (!existing.length) {
    workspace.members.push({ userId, role: normalized });
    await workspace.save();
    return workspace;
  }

  const resolvedRole = existing.reduce(
    (acc, m) => maxWorkspaceRole(acc, m.role),
    normalized,
  );

  if (existing.length > 1) {
    workspace.members = members.filter((m) => String(m.userId) !== uid);
    workspace.members.push({
      userId,
      role: resolvedRole,
      joinedAt: existing[0]?.joinedAt || new Date(),
    });
    await workspace.save();
    return workspace;
  }

  if (existing[0].role !== resolvedRole) {
    existing[0].role = resolvedRole;
    await workspace.save();
  }

  return workspace;
};

export const ensureDefaultWorkspaceForUser = async (user, options = {}) => {
  if (!user?._id) return null;

  // Source of truth: a user's own workspace is identified by createdBy.
  // Being a member in someone else's workspace should NOT block provisioning
  // a personal workspace where this user is admin.
  const createdWorkspace = await Workspace.findOne({ createdBy: user._id }).sort({ createdAt: 1 });
  if (createdWorkspace) {
    await ensureWorkspaceMember(createdWorkspace._id, user._id, 'admin');
    return Workspace.findById(createdWorkspace._id);
  }

  const baseName = options.workspaceName || `${user.name || 'My'} Workspace`;
  const name = String(baseName).trim() || 'My Workspace';
  return Workspace.create({
    name,
    createdBy: user._id,
    members: [{ userId: user._id, role: 'admin' }],
  });
};
