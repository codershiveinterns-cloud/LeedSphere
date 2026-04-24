import Task from '../models/Task.js';

// POST /api/tasks
export const createTask = async (req, res) => {
  try {
    const { projectId, title, description, status, priority, assignedTo, assignee, dueDate } = req.body;
    if (!projectId || !title) return res.status(400).json({ message: 'projectId and title required' });

    const count = await Task.countDocuments({ projectId, status: status || 'Todo' });
    const task = await Task.create({
      projectId, title, description: description || '',
      status: status || 'Todo', priority: priority || 'medium',
      assignedTo: assignedTo || null, assignee: assignee || '',
      dueDate: dueDate || null, order: count,
    });

    const populated = await Task.findById(task._id).populate('assignedTo', 'name avatar email');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tasks/:projectId
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ projectId: req.params.projectId })
      .populate('assignedTo', 'name avatar email')
      .sort({ order: 1, createdAt: 1 });
    res.json(tasks);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/tasks/:taskId
export const updateTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const { title, description, status, priority, assignedTo, assignee, dueDate, order } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) {
      task.status = status;
      if (status === 'Done' && !task.completedAt) task.completedAt = new Date();
      if (status !== 'Done') task.completedAt = null;
    }
    if (priority !== undefined) task.priority = priority;
    if (assignedTo !== undefined) task.assignedTo = assignedTo || null;
    if (assignee !== undefined) task.assignee = assignee;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (order !== undefined) task.order = order;
    await task.save();

    const populated = await Task.findById(task._id).populate('assignedTo', 'name avatar email');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/tasks/:taskId
export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.taskId);
    if (!task) return res.status(404).json({ message: 'Task not found' });
    await Task.findByIdAndDelete(req.params.taskId);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
