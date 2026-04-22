import express from 'express';
import { createNote, getNotesByTeam, getNoteById, updateNote, deleteNote } from '../controllers/noteController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createNote);
router.get('/detail/:id', protect, getNoteById);
router.put('/:id', protect, updateNote);
router.delete('/:id', protect, deleteNote);
router.get('/:teamId', protect, getNotesByTeam);

export default router;
