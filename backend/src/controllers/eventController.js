import Event from '../models/Event.js';
import Workspace from '../models/Workspace.js';

const resolveWorkspaceRole = async (workspaceId, userId) => {
  const workspace = await Workspace.findById(workspaceId).select('members');
  if (!workspace) return { status: 404, message: 'Workspace not found' };

  const member = (workspace.members || []).find((m) => String(m.userId) === String(userId));
  if (!member) return { status: 403, message: 'Access denied. Insufficient permissions.' };

  return { status: 200, role: member.role };
};

// POST /api/events
export const createEvent = async (req, res) => {
  try {
    const { title, description, type, workspaceId, teamId, assignedTo, startDate, endDate, allDay, location, meetingLink, priority, date } = req.body;
    if (!title || !workspaceId) return res.status(400).json({ message: 'title and workspaceId required' });

    const event = await Event.create({
      title, description: description || '', type: type || 'event',
      workspaceId, teamId: teamId || null, createdBy: req.user._id,
      assignedTo: assignedTo || [],
      startDate: startDate || date || new Date(), endDate: endDate || null,
      allDay: allDay || false, location: location || '', meetingLink: meetingLink || '',
      priority: priority || 'medium', date: date || startDate || new Date(),
    });

    const populated = await Event.findById(event._id)
      .populate('createdBy', 'name avatar')
      .populate('assignedTo', 'name avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/events/:workspaceId
export const getEvents = async (req, res) => {
  try {
    const events = await Event.find({ workspaceId: req.params.workspaceId })
      .populate('createdBy', 'name avatar')
      .populate('assignedTo', 'name avatar')
      .sort({ startDate: 1 });
    res.json(events);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/events/:id
export const updateEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const access = await resolveWorkspaceRole(event.workspaceId, req.user._id);
    if (access.status !== 200) return res.status(access.status).json({ message: access.message });
    req.userRole = access.role;

    const fields = ['title', 'description', 'type', 'teamId', 'assignedTo', 'startDate', 'endDate', 'allDay', 'location', 'meetingLink', 'priority'];
    for (const f of fields) {
      if (req.body[f] !== undefined) event[f] = req.body[f];
    }
    if (req.body.startDate) event.date = req.body.startDate;
    await event.save();

    const populated = await Event.findById(event._id)
      .populate('createdBy', 'name avatar')
      .populate('assignedTo', 'name avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/events/:id
export const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ message: 'Event not found' });
    const access = await resolveWorkspaceRole(event.workspaceId, req.user._id);
    if (access.status !== 200) return res.status(access.status).json({ message: access.message });
    req.userRole = access.role;
    await Event.findByIdAndDelete(req.params.id);
    res.json({ message: 'Event deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
