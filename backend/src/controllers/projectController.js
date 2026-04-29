import Project from '../models/Project.js';
import Task from '../models/Task.js';

const normalizeTeamIds = (body) => {
  if (Array.isArray(body.teamIds)) return body.teamIds.filter(Boolean).map(String);
  if (body.teamId) return [String(body.teamId)];
  return [];
};

// POST /api/projects
export const createProject = async (req, res) => {
  try {
    const { title, description, workspaceId, startDate, endDate, status } = req.body;
    if (!title || !workspaceId) return res.status(400).json({ message: 'title and workspaceId required' });

    const teamIds = normalizeTeamIds(req.body);

    const project = await Project.create({
      title,
      description: description || '',
      workspaceId,
      teamIds,
      // Mirror the first selected team into the legacy single-team field so
      // older queries that still read `teamId` keep working.
      teamId: teamIds[0] || null,
      createdBy: req.user._id,
      startDate: startDate || new Date(),
      endDate: endDate || null,
      status: status || 'active',
    });
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/projects/:workspaceId
export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ workspaceId: req.params.workspaceId })
      .populate('createdBy', 'name avatar profileImage')
      .populate('teamIds', 'name')
      // Avoid shipping doc payloads in the list response — they can be huge.
      .select('-documents')
      .sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/projects/:id
export const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const { title, description, status, startDate, endDate } = req.body;
    if (title !== undefined) project.title = title;
    if (description !== undefined) project.description = description;
    if (status) project.status = status;
    if (startDate !== undefined) project.startDate = startDate;
    if (endDate !== undefined) project.endDate = endDate;
    if (Array.isArray(req.body.teamIds) || req.body.teamId !== undefined) {
      const teamIds = normalizeTeamIds(req.body);
      project.teamIds = teamIds;
      project.teamId = teamIds[0] || null;
    }
    await project.save();
    res.json(project);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/projects/:id
export const deleteProject = async (req, res) => {
  try {
    await Task.deleteMany({ projectId: req.params.id });
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project and tasks deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/projects/merge
export const mergeProjects = async (req, res) => {
  try {
    const { targetProjectId, sourceProjectId } = req.body;
    const target = await Project.findById(targetProjectId);
    const source = await Project.findById(sourceProjectId);
    if (!target || !source) return res.status(404).json({ message: 'Project not found' });
    await Task.updateMany({ projectId: sourceProjectId }, { projectId: targetProjectId });
    await Project.findByIdAndDelete(sourceProjectId);
    res.json(target);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* ---------- Documents (persisted on the project so all members see them) ---------- */

// GET /api/projects/:id/documents
export const getProjectDocuments = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).select('documents');
    if (!project) return res.status(404).json({ message: 'Project not found' });
    res.json(project.documents || []);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/projects/:id/documents
// Body: { id, name, size, mime, dataUrl }
export const addProjectDocument = async (req, res) => {
  try {
    const { id, name, size, mime, dataUrl } = req.body;
    if (!name || !dataUrl) return res.status(400).json({ message: 'name and dataUrl required' });

    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    const doc = {
      id: id || `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      size: Number(size) || 0,
      mime: mime || '',
      dataUrl,
      uploadedBy: req.user._id,
      uploadedByName: req.user.name || '',
      uploadedAt: new Date(),
    };
    project.documents.push(doc);
    await project.save();
    res.status(201).json(doc);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/projects/:id/documents/:docId
export const removeProjectDocument = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });
    const before = project.documents.length;
    project.documents = project.documents.filter((d) => d.id !== req.params.docId);
    if (project.documents.length === before) {
      return res.status(404).json({ message: 'Document not found' });
    }
    await project.save();
    res.json({ message: 'Document removed', docId: req.params.docId });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
