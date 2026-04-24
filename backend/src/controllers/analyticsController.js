import Task from '../models/Task.js';
import Message from '../models/Message.js';
import Project from '../models/Project.js';
import Activity from '../models/Activity.js';
import Channel from '../models/Channel.js';
import Team from '../models/Team.js';

// GET /api/analytics/workspace/:workspaceId
export const getWorkspaceAnalytics = async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Get all projects in workspace
    const projects = await Project.find({ workspaceId });
    const projectIds = projects.map(p => p._id);

    // Get all channels in workspace
    const channels = await Channel.find({ workspaceId });
    const channelIds = channels.map(c => c._id);

    // Get all teams
    const teams = await Team.find({ workspaceId });
    const totalMembers = teams.reduce((acc, t) => acc + (t.members?.length || 0), 0);

    // Task stats
    const allTasks = await Task.find({ projectId: { $in: projectIds } });
    const totalTasks = allTasks.length;
    const completedTasks = allTasks.filter(t => t.status === 'Done').length;
    const inProgressTasks = allTasks.filter(t => t.status === 'In Progress').length;
    const todoTasks = allTasks.filter(t => t.status === 'Todo').length;

    // Message count
    const totalMessages = await Message.countDocuments({ channelId: { $in: channelIds } });

    // Task status distribution
    const taskStatusDist = [
      { name: 'Todo', value: todoTasks, color: '#3B82F6' },
      { name: 'In Progress', value: inProgressTasks, color: '#F59E0B' },
      { name: 'Done', value: completedTasks, color: '#10B981' },
    ];

    // Tasks per user (top 10)
    const tasksPerUser = await Task.aggregate([
      { $match: { projectId: { $in: projectIds }, assignedTo: { $ne: null } } },
      { $group: { _id: '$assignedTo', total: { $sum: 1 }, done: { $sum: { $cond: [{ $eq: ['$status', 'Done'] }, 1, 0] } } } },
      { $sort: { total: -1 } },
      { $limit: 10 },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
      { $project: { name: '$user.name', total: 1, done: 1 } },
    ]);

    // Daily activity (last 14 days)
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const dailyTasks = await Task.aggregate([
      { $match: { projectId: { $in: projectIds }, createdAt: { $gte: fourteenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const dailyMessages = await Message.aggregate([
      { $match: { channelId: { $in: channelIds }, createdAt: { $gte: fourteenDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    // Build daily chart data
    const dailyMap = {};
    for (let i = 13; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      dailyMap[key] = { date: key, label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), tasks: 0, messages: 0 };
    }
    dailyTasks.forEach(d => { if (dailyMap[d._id]) dailyMap[d._id].tasks = d.count; });
    dailyMessages.forEach(d => { if (dailyMap[d._id]) dailyMap[d._id].messages = d.count; });
    const dailyActivity = Object.values(dailyMap);

    // Project timeline
    const timeline = projects.map(p => ({
      _id: p._id,
      title: p.title,
      status: p.status,
      startDate: p.startDate || p.createdAt,
      endDate: p.endDate,
      createdAt: p.createdAt,
    }));

    // Priority distribution
    const priorityDist = [
      { name: 'High', value: allTasks.filter(t => t.priority === 'high').length, color: '#EF4444' },
      { name: 'Medium', value: allTasks.filter(t => t.priority === 'medium').length, color: '#F59E0B' },
      { name: 'Low', value: allTasks.filter(t => t.priority === 'low').length, color: '#6B7280' },
    ];

    res.json({
      overview: {
        totalProjects: projects.length,
        totalTasks,
        completedTasks,
        totalMessages,
        totalMembers,
        completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      },
      taskStatusDist,
      priorityDist,
      tasksPerUser,
      dailyActivity,
      timeline,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
