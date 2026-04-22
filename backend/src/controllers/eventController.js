import Event from '../models/Event.js';

export const createEvent = async (req, res) => {
  try {
    const event = new Event(req.body);
    await event.save();
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getEvents = async (req, res) => {
  try {
    const events = await Event.find({ workspaceId: req.params.workspaceId });
    res.status(200).json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
