import express from 'express';
import { sendMessage, getMessagesByChannel, getThreadReplies, editMessage, deleteMessage } from '../controllers/messageController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, sendMessage);
router.get('/thread/:messageId', protect, getThreadReplies);
router.put('/:id', protect, editMessage);
router.delete('/:id', protect, deleteMessage);
router.get('/:channelId', protect, getMessagesByChannel);

export default router;
