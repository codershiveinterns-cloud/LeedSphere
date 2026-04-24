import express from 'express';
import { createEvent, getEvents, updateEvent, deleteEvent } from '../controllers/eventController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.post('/', protect, createEvent);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);
router.get('/:workspaceId', protect, getEvents);

export default router;
