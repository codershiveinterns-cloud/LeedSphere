import Workspace from '../models/Workspace.js';
import Team from '../models/Team.js';
import Channel from '../models/Channel.js';
import Project from '../models/Project.js';
import PDFDocument from 'pdfkit';

/**
 * Helper: ensure a user is in workspace.members. Idempotent. Used from:
 *   - workspace creation (creator → admin)
 *   - team creation in someone's workspace (creator → member)
 *   - invite acceptance (invitee → member)
 *
 * Exported so other controllers can call it without duplicating logic.
 */
export const ensureWorkspaceMember = async (workspaceId, userId, role = 'member') => {
  if (!workspaceId || !userId) return null;
  const ws = await Workspace.findById(workspaceId);
  if (!ws) return null;
  const uid = String(userId);
  const existing = (ws.members || []).find((m) => String(m.userId) === uid);
  if (existing) {
    // Promote silently if a higher role is requested.
    if (role === 'admin' && existing.role !== 'admin') {
      existing.role = 'admin';
      await ws.save();
    }
    return ws;
  }
  ws.members.push({ userId, role });
  await ws.save();
  return ws;
};

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
      // Seed members[] with the creator as admin so access checks work
      // without falling back to createdBy comparisons.
      members: [{ userId: req.user._id, role: 'admin' }],
    });
    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/workspaces
// Returns workspaces the caller has access to: where they're a member, OR
// (legacy) where they're the creator without a populated members array yet.
// Performs a one-time backfill: any legacy workspace owned by the caller
// gets its creator added to members[] on first read so future filters can
// rely on a single source of truth.
export const getWorkspaces = async (req, res) => {
  try {
    const me = req.user._id;

    // Legacy backfill — promote createdBy into members[] for this user's
    // own workspaces so future queries match by membership only.
    await Workspace.updateMany(
      { createdBy: me, 'members.userId': { $ne: me } },
      { $push: { members: { userId: me, role: 'admin' } } },
    );

    // Workspaces visible via team membership (covers users who joined
    // someone else's workspace through a team invite before we tracked
    // workspace.members directly).
    const teamWorkspaceIds = await Team.find({ 'members.userId': me }).distinct('workspaceId');
    // Backfill those too — opportunistic, idempotent.
    if (teamWorkspaceIds.length) {
      await Workspace.updateMany(
        { _id: { $in: teamWorkspaceIds }, 'members.userId': { $ne: me } },
        { $push: { members: { userId: me, role: 'member' } } },
      );
    }

    const workspaces = await Workspace.find({ 'members.userId': me }).sort({ createdAt: 1 });
    res.status(200).json(workspaces);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/workspaces/:workspaceId/export
export const exportWorkspace = async (req, res) => {
  try {
    const { format } = req.query;
    const workspaceId = req.params.workspaceId;

    const workspace = await Workspace.findById(workspaceId);
    if (!workspace) return res.status(404).json({ error: 'Workspace not found' });

    // Authorization: caller must be a member of the workspace.
    const isMember = (workspace.members || []).some(
      (m) => String(m.userId) === String(req.user._id),
    );
    if (!isMember) {
      return res.status(403).json({ error: 'Not authorized to export this workspace' });
    }

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
    } else {
      res.status(400).json({ error: 'Invalid format requested' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
