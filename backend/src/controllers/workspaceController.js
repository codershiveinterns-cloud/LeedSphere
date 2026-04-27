import Workspace from '../models/Workspace.js';
import Team from '../models/Team.js';
import Channel from '../models/Channel.js';
import Project from '../models/Project.js';
import Event from '../models/Event.js';
import Note from '../models/Note.js';
import PDFDocument from 'pdfkit';
import {
  ensureWorkspaceMember as ensureWorkspaceMemberRecord,
  ensureDefaultWorkspaceForUser,
  maxWorkspaceRole,
  normalizeWorkspaceRole,
} from '../services/workspaceMember.js';

/**
 * Backward-compatible export used by other controllers.
 */
export const ensureWorkspaceMember = async (workspaceId, userId, role = 'member') => (
  ensureWorkspaceMemberRecord(workspaceId, userId, role)
);

// POST /api/workspaces
export const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }

    const existing = await Workspace.findOne({ name: name.trim(), createdBy: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You already have a workspace with this name' });
    }

    const workspace = await Workspace.create({
      name: name.trim(),
      createdBy: req.user._id,
      members: [{ userId: req.user._id, role: 'admin' }],
    });

    res.status(201).json({
      ...workspace.toObject(),
      myRole: 'admin',
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/workspaces OR /api/my-workspaces
export const getMyWorkspaces = async (req, res) => {
  try {
    const me = req.user._id;
    const roleRank = { member: 1, manager: 2, admin: 3 };

    // Legacy creator-only rows: ensure createdBy is also a membership row.
    const createdWorkspaceIds = await Workspace.find({ createdBy: me }).distinct('_id');
    await Promise.all(createdWorkspaceIds.map((id) => ensureWorkspaceMemberRecord(id, me, 'admin')));

    // Team memberships should always imply workspace membership.
    const teams = await Team.find({ 'members.userId': me }).select('workspaceId members');
    const impliedWorkspaceRoles = new Map();
    for (const team of teams) {
      const membership = (team.members || []).find((m) => String(m.userId) === String(me));
      if (!membership) continue;
      const wsid = String(team.workspaceId);
      const incoming = ['admin', 'manager', 'member'].includes(membership.role) ? membership.role : 'member';
      const current = impliedWorkspaceRoles.get(wsid) || 'member';
      impliedWorkspaceRoles.set(
        wsid,
        (roleRank[incoming] || 1) > (roleRank[current] || 1) ? incoming : current,
      );
    }
    await Promise.all(
      Array.from(impliedWorkspaceRoles.entries()).map(([workspaceId, role]) => (
        ensureWorkspaceMemberRecord(workspaceId, me, role)
      )),
    );

    // Guarantee there are no orphan users without a workspace membership.
    await ensureDefaultWorkspaceForUser(req.user);

    const workspaces = await Workspace.find({ 'members.userId': me }).sort({ createdAt: 1 }).lean();
    const withMyRole = workspaces.map((workspace) => {
      const mine = (workspace.members || []).filter((m) => String(m.userId) === String(me));
      const myRole = mine.reduce((acc, m) => maxWorkspaceRole(acc, m.role), 'member');
      return {
        ...workspace,
        myRole: normalizeWorkspaceRole(myRole),
      };
    });

    res.status(200).json(withMyRole);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getWorkspaces = getMyWorkspaces;

// DELETE /api/workspaces/:workspaceId
export const deleteWorkspace = async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ message: 'Workspace not found' });

    await Promise.all([
      Team.deleteMany({ workspaceId }),
      Channel.deleteMany({ workspaceId }),
      Project.deleteMany({ workspaceId }),
      Event.deleteMany({ workspaceId }),
      Note.deleteMany({ workspaceId }),
      Workspace.deleteOne({ _id: workspaceId }),
    ]);

    res.json({ message: 'Workspace deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/workspaces/:workspaceId/export
export const exportWorkspace = async (req, res) => {
  try {
    const { format } = req.query;
    const workspaceId = req.params.workspaceId;

    const workspace = req.workspace || await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    const channels = await Channel.find({ workspaceId });
    const projects = await Project.find({ workspaceId });

    if (format === 'json') {
      return res.status(200).json({ workspace, channels, projects });
    }

    if (format === 'pdf') {
      const doc = new PDFDocument();
      res.setHeader('Content-disposition', `attachment; filename="${workspace.name}-export.pdf"`);
      res.setHeader('Content-type', 'application/pdf');

      doc.pipe(res);
      doc.fontSize(25).text(`Workspace: ${workspace.name}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(18).text('Channels');
      channels.forEach((ch) => doc.fontSize(12).text(`- #${ch.name} (Private: ${ch.isPrivate})`));
      doc.moveDown();
      doc.fontSize(18).text('Projects');
      projects.forEach((p) => doc.fontSize(12).text(`- ${p.title} (Status: ${p.status})`));
      doc.end();
      return undefined;
    }

    return res.status(400).json({ error: 'Invalid format requested' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
