import Note from '../models/Note.js';

// POST /api/notes
export const createNote = async (req, res) => {
  try {
    const { title, content, teamId } = req.body;
    if (!title || !teamId) return res.status(400).json({ message: 'title and teamId are required' });

    const note = await Note.create({
      title,
      content: content || '',
      teamId,
      createdBy: req.user._id,
    });

    const populated = await Note.findById(note._id).populate('createdBy', 'name avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/notes/:teamId
export const getNotesByTeam = async (req, res) => {
  try {
    const notes = await Note.find({ teamId: req.params.teamId })
      .populate('createdBy', 'name avatar')
      .sort({ updatedAt: -1 });
    res.json(notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/notes/detail/:id
export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate('createdBy', 'name avatar');
    if (!note) return res.status(404).json({ message: 'Note not found' });
    res.json(note);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/notes/:id
export const updateNote = async (req, res) => {
  try {
    const { title, content } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    await note.save();

    const populated = await Note.findById(note._id).populate('createdBy', 'name avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/notes/:id
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });
    await Note.findByIdAndDelete(req.params.id);
    res.json({ message: 'Note deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
