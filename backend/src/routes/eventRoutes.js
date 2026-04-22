import express from 'express';
import { createEvent, getEvents } from '../controllers/eventController.js';

const router = express.Router();
router.post('/', createEvent);
router.get('/:workspaceId', getEvents);

export default router;
