import express from 'express';
import { createChannel, getChannelsByTeam, getChannelsByWorkspace, deleteChannel } from '../controllers/channelController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createChannel);
router.get('/team/:teamId', protect, getChannelsByTeam);
router.delete('/:id', protect, deleteChannel);
// Backward compat
router.get('/:workspaceId', protect, getChannelsByWorkspace);

export default router;
