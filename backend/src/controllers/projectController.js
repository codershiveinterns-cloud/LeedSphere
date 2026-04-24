import Project from '../models/Project.js';
import Task from '../models/Task.js';

// POST /api/projects
export const createProject = async (req, res) => {
  try {
    const { title, description, workspaceId, teamId, startDate, endDate } = req.body;
    if (!title || !workspaceId) return res.status(400).json({ message: 'title and workspaceId required' });

    const project = await Project.create({
      title, description: description || '', workspaceId,
      teamId: teamId || null, createdBy: req.user._id,
      startDate: startDate || new Date(), endDate: endDate || null,
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
      .populate('createdBy', 'name avatar')
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
