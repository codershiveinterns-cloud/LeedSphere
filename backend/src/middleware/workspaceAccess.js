/**
 * Workspace-scoped authorization middleware.
 *
 * Reads the active workspace id (header preferred) and attaches:
 *   req.workspace      — the Mongoose Workspace doc
 *   req.workspaceRole  — 'admin' | 'member' (or null for legacy creator-only rows)
 *
 * Must run AFTER `protect`. Pair with `requireWorkspaceMember()` /
 * `requireWorkspaceRole(...roles)` to gate handlers strictly.
 *
 * Why this exists: previously, workspace-scoped endpoints relied on the
 * caller passing a valid workspaceId and trusted them implicitly. Combined
 * with team-list endpoints that didn't filter by membership, that meant
 * callers could probe other users' data with crafted requests.
 */
import Workspace from '../models/Workspace.js';

const pickWorkspaceId = (req) => {
  const h = req.headers || {};
  return (
    h['x-workspace-id'] ||
    h['workspaceid'] ||
    h['workspace-id'] ||
    req.params?.workspaceId ||
    req.query?.workspaceId ||
    req.body?.workspaceId ||
    null
  );
};

const isWorkspaceMember = (workspace, userId) => {
  if (!workspace || !userId) return false;
  const uid = String(userId);
  if ((workspace.members || []).some((m) => String(m.userId) === uid)) return true;
  // Backward-compat: legacy rows with no members[] but createdBy set.
  return String(workspace.createdBy) === uid;
};

const memberRole = (workspace, userId) => {
  const uid = String(userId);
  const m = (workspace.members || []).find((mem) => String(mem.userId) === uid);
  if (m) return m.role;
  if (String(workspace.createdBy) === uid) return 'admin';
  return null;
};

export const resolveWorkspaceAccess = ({ required = false } = {}) => async (req, res, next) => {
  try {
    const workspaceId = pickWorkspaceId(req);
    if (!workspaceId) {
      if (required) return res.status(400).json({ message: 'workspaceId required' });
      return next();
    }
    if (!req.user?._id) return res.status(401).json({ message: 'Not authenticated' });

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    if (!isWorkspaceMember(workspace, req.user._id)) {
      return res.status(403).json({ message: 'You are not a member of this workspace' });
    }

    req.workspace = workspace;
    req.workspaceRole = memberRole(workspace, req.user._id);
    next();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Convenience: gate an endpoint to workspace members. Use after
// resolveWorkspaceAccess({ required: true }).
export const requireWorkspaceMember = (req, res, next) => {
  if (!req.workspace) return res.status(403).json({ message: 'Workspace context missing' });
  next();
};

// Gate by workspace role (e.g. only workspace admins can delete).
export const requireWorkspaceRole = (...allowed) => (req, res, next) => {
  if (!req.workspaceRole) return res.status(403).json({ message: 'Workspace role not resolved' });
  if (allowed.length && !allowed.includes(req.workspaceRole)) {
    return res.status(403).json({
      message: `Requires workspace role: ${allowed.join(' or ')} (you are ${req.workspaceRole})`,
    });
  }
  next();
};
