import express from 'express';
import { createEvent, getEvents, updateEvent, deleteEvent } from '../controllers/eventController.js';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';

const router = express.Router();
router.post('/', protect, authorizeRoles('admin', 'manager', 'member'), createEvent);
router.put('/:id', protect, updateEvent);
router.delete('/:id', protect, deleteEvent);
router.get('/:workspaceId', protect, authorizeRoles('admin', 'manager', 'member'), getEvents);

export default router;
