import Project from '../models/Project.js';
import Task from '../models/Task.js';

export const createProject = async (req, res) => {
  try {
    const project = new Project(req.body);
    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({ workspaceId: req.params.workspaceId });
    res.status(200).json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const mergeProjects = async (req, res) => {
  try {
    const { targetProjectId, sourceProjectId } = req.body;
    const target = await Project.findById(targetProjectId);
    const source = await Project.findById(sourceProjectId);
    
    if (!target || !source) return res.status(404).json({ error: 'Project not found' });

    // Migrate all tasks pointing to source to point to target
    await Task.updateMany({ projectId: sourceProjectId }, { projectId: targetProjectId });
    
    // Delete source project
    await Project.findByIdAndDelete(sourceProjectId);
    res.status(200).json(target);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
