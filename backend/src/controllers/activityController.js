import Activity from '../models/Activity.js';

// GET /api/activity/:teamId
export const getActivityByTeam = async (req, res) => {
  try {
    const activities = await Activity.find({ teamId: req.params.teamId })
      .populate('userId', 'name avatar profileImage')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/activity/user/me
export const getMyActivity = async (req, res) => {
  try {
    const activities = await Activity.find({ userId: req.user._id })
      .populate('userId', 'name avatar profileImage')
      .sort({ createdAt: -1 })
      .limit(50);
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/activity
export const createActivity = async (req, res) => {
  try {
    const { action, teamId, meta } = req.body;
    if (!action) return res.status(400).json({ message: 'action is required' });

    const activity = await Activity.create({
      userId: req.user._id,
      action,
      teamId: teamId || null,
      meta: meta || {},
    });

    const populated = await Activity.findById(activity._id).populate('userId', 'name avatar profileImage');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
