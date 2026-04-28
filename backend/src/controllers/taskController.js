import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { getIO } from '../sockets/io.js';
import { sendNotificationsToMany } from '../services/notificationService.js';

const taskRedirect = (projectId, taskId) =>
  `/dashboard/projects?project=${projectId}&task=${taskId}`;

/**
 * Notify assignees when a task is created or updated. Excludes the actor
 * (the user performing the action) so people don't get pinged for their
 * own work.
 */
const notifyAssignees = async ({ task, project, actorId, actorName, kind }) => {
  const io = getIO();
  if (!io) return;
  const recipients = (task.assignees || [])
    .map((id) => String(id))
    .filter((id) => id && id !== String(actorId));
  if (!recipients.length) return;

  const projectName = project?.title || project?.name || 'a project';
  let content;
  let type = 'task';
  if (kind === 'assigned') {
    content = `${actorName} assigned you a task in “${projectName}”`;
    type = 'task';
  } else if (kind === 'status') {
    content = `${actorName} moved “${task.title}” to ${task.status}`;
    type = 'task-status';
  } else {
    content = `“${task.title}” was updated in “${projectName}”`;
    type = 'task-status';
  }

  await sendNotificationsToMany(io, recipients, {
    type,
    content,
    projectId: task.projectId,
    entityId: task._id,
    redirectUrl: taskRedirect(task.projectId, task._id),
    meta: {
      taskTitle: task.title,
      taskStatus: task.status,
      fromUserId: String(actorId),
      fromName: actorName,
      projectName,
    },
  });
};

const normalizeAssignees = (body) => {
  if (Array.isArray(body.assignees)) return body.assignees.filter(Boolean).map(String);
  if (body.assignedTo) return [String(body.assignedTo)];
  return [];
};

// POST /api/tasks
export const createTask = async (req, res) => {
  try {
    const { projectId, title, description, status, priority, assignee, dueDate } = req.body;
    if (!projectId || !title) return res.status(400).json({ message: 'projectId and title required' });

    const assignees = normalizeAssignees(req.body);

    const count = await Task.countDocuments({ projectId, status: status || 'Todo' });
    const task = await Task.create({
      projectId,
      title,
      description: description || '',
      status: status || 'Todo',
      priority: priority || 'medium',
      assignees,
      // Mirror first assignee into the legacy single-user field for backward compat.
      assignedTo: assignees[0] || null,
      assignee: assignee || '',
      dueDate: dueDate || null,
      order: count,
    });

    const populated = await Task.findById(task._id)
      .populate('assignees', 'name avatar email')
      .populate('assignedTo', 'name avatar email');

    // Fire-and-forget: notify assignees that they were assigned to this task.
    try {
      const project = await Project.findById(projectId).select('title name');
      await notifyAssignees({
        task: populated,
        project,
        actorId: req.user._id,
        actorName: req.user.name || 'Someone',
        kind: 'assigned',
      });
    } catch (e) { console.warn('[notify] task-assigned failed:', e.message); }

    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/tasks/:projectId
export const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({ projectId: req.params.projectId })
      .populate('assignees', 'name avatar email')
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

    // Snapshot pre-update fields so we can detect what materially changed
    // and route notifications accordingly.
    const prevStatus    = task.status;
    const prevAssignees = (task.assignees || []).map((id) => String(id));

    const { title, description, status, priority, assignee, dueDate, order } = req.body;
    if (title !== undefined) task.title = title;
    if (description !== undefined) task.description = description;
    if (status !== undefined) {
      task.status = status;
      if (status === 'Done' && !task.completedAt) task.completedAt = new Date();
      if (status !== 'Done') task.completedAt = null;
    }
    if (priority !== undefined) task.priority = priority;
    if (Array.isArray(req.body.assignees) || req.body.assignedTo !== undefined) {
      const assignees = normalizeAssignees(req.body);
      task.assignees = assignees;
      task.assignedTo = assignees[0] || null;
    }
    if (assignee !== undefined) task.assignee = assignee;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (order !== undefined) task.order = order;
    await task.save();

    const populated = await Task.findById(task._id)
      .populate('assignees', 'name avatar email')
      .populate('assignedTo', 'name avatar email');

    // -------- Notifications --------
    try {
      const project = await Project.findById(task.projectId).select('title name');
      const actorId = req.user._id;
      const actorName = req.user.name || 'Someone';

      // 1. New assignees that weren't on the task before → 'assigned' notification.
      const newAssignees = (populated.assignees || [])
        .map((u) => String(u._id || u))
        .filter((id) => !prevAssignees.includes(id));
      if (newAssignees.length) {
        await notifyAssignees({
          task: { ...populated.toObject(), assignees: newAssignees },
          project, actorId, actorName, kind: 'assigned',
        });
      }

      // 2. Status changed → notify all current assignees.
      if (status !== undefined && status !== prevStatus) {
        await notifyAssignees({
          task: populated, project, actorId, actorName, kind: 'status',
        });
      }
    } catch (e) { console.warn('[notify] task-update failed:', e.message); }

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
