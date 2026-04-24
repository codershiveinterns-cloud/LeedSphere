import Note from '../models/Note.js';

// POST /api/notes
export const createNote = async (req, res) => {
  try {
    const { title, content, teamId, parentId, icon } = req.body;
    if (!teamId) return res.status(400).json({ message: 'teamId is required' });

    const note = await Note.create({
      title: title || 'Untitled',
      content: content || null,
      teamId,
      parentId: parentId || null,
      icon: icon || '',
      createdBy: req.user._id,
    });

    const populated = await Note.findById(note._id).populate('createdBy', 'name avatar');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/notes/team/:teamId — all notes for a team (flat list, frontend builds tree)
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
    const { title, content, icon, parentId } = req.body;
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    if (title !== undefined) note.title = title;
    if (content !== undefined) note.content = content;
    if (icon !== undefined) note.icon = icon;
    if (parentId !== undefined) note.parentId = parentId;
    await note.save();

    const populated = await Note.findById(note._id).populate('createdBy', 'name avatar');
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/notes/:id — cascade delete children
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) return res.status(404).json({ message: 'Note not found' });

    // Recursively delete all descendants
    const deleteDescendants = async (parentId) => {
      const children = await Note.find({ parentId });
      for (const child of children) {
        await deleteDescendants(child._id);
        await Note.findByIdAndDelete(child._id);
      }
    };
    await deleteDescendants(req.params.id);
    await Note.findByIdAndDelete(req.params.id);

    res.json({ message: 'Note and sub-pages deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
