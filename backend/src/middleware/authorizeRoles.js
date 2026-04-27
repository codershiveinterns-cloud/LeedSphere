import mongoose from 'mongoose';
import Workspace from '../models/Workspace.js';
import { maxWorkspaceRole, normalizeWorkspaceRole } from '../services/workspaceMember.js';

const pickWorkspaceId = (req) => {
  const h = req.headers || {};
  return (
    req.params?.workspaceId ||
    req.body?.workspaceId ||
    req.query?.workspaceId ||
    h['x-workspace-id'] ||
    h.workspaceid ||
    h['workspace-id'] ||
    null
  );
};

const resolveWorkspaceMember = async (workspace, userId) => {
  const uid = String(userId);
  const mine = (workspace.members || []).filter((m) => String(m.userId) === uid);
  if (!mine.length) return null;

  const role = mine.reduce(
    (acc, m) => maxWorkspaceRole(acc, m.role),
    'member',
  );

  return {
    userId: userId,
    workspaceId: workspace._id,
    role: normalizeWorkspaceRole(role),
  };
};

export const authorizeRoles = (...allowedRoles) => {
  const normalizedAllowed = allowedRoles.map(normalizeWorkspaceRole);

  return async (req, res, next) => {
    try {
      if (!req.user?._id) {
        return res.status(401).json({ message: 'Not authorized' });
      }

      const workspaceId = pickWorkspaceId(req);
      if (!workspaceId || !mongoose.isValidObjectId(workspaceId)) {
        return res.status(404).json({ message: 'Workspace not found' });
      }

      const workspace = await Workspace.findById(workspaceId);
      if (!workspace) {
        return res.status(404).json({ message: 'Workspace not found' });
      }

      const member = await resolveWorkspaceMember(workspace, req.user._id);
      if (!member) {
        return res.status(403).json({
          message: 'Access denied. Insufficient permissions.',
        });
      }

      if (normalizedAllowed.length && !normalizedAllowed.includes(member.role)) {
        return res.status(403).json({
          message: 'Access denied. Insufficient permissions.',
        });
      }

      req.workspace = workspace;
      req.member = member;
      req.userRole = member.role;
      req.workspaceRole = member.role;
      next();
    } catch (error) {
      return res.status(500).json({ message: error.message });
    }
  };
};

