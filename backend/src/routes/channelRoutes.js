import express from 'express';
import {
  createChannel,
  getChannelsByTeam,
  getChannelsByWorkspace,
  getChannelMembers,
  joinChannel,
  leaveChannel,
  deleteChannel,
} from '../controllers/channelController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Create
router.post('/', protect, createChannel);
router.post('/create', protect, createChannel); // alias per spec

// Membership actions
router.post('/join', protect, joinChannel);
router.post('/leave', protect, leaveChannel);

// Reads
router.get('/team/:teamId', protect, getChannelsByTeam);
router.get('/:id/members', protect, getChannelMembers);

// Delete
router.delete('/:id', protect, deleteChannel);

// Backward compat: fetch by workspace (kept for existing callers)
router.get('/:workspaceId', protect, getChannelsByWorkspace);

export default router;
