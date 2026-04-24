import Workspace from '../models/Workspace.js';
import Channel from '../models/Channel.js';
import Project from '../models/Project.js';
import PDFDocument from 'pdfkit';

// POST /api/workspaces
export const createWorkspace = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ message: 'Workspace name is required' });
    }

    // Prevent duplicate names for this user
    const existing = await Workspace.findOne({ name: name.trim(), createdBy: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You already have a workspace with this name' });
    }

    const workspace = await Workspace.create({
      name: name.trim(),
      createdBy: req.user._id,
    });
    res.status(201).json(workspace);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET /api/workspaces — only return user's workspaces
export const getWorkspaces = async (req, res) => {
  try {
    const workspaces = await Workspace.find({ createdBy: req.user._id }).sort({ createdAt: 1 });
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
      channels.forEach(ch => doc.fontSize(12).text(`- #${ch.name} (Private: ${ch.isPrivate})`));
      doc.moveDown();
      doc.fontSize(18).text('Projects');
      projects.forEach(p => doc.fontSize(12).text(`- ${p.title} (Status: ${p.status})`));
      doc.end();
    } else {
      res.status(400).json({ error: 'Invalid format requested' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
