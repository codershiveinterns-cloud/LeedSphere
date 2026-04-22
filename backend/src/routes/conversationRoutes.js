import express from 'express';
import { createConversation, getConversations, sendDirectMessage, getDirectMessages } from '../controllers/conversationController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createConversation);
router.get('/', protect, getConversations);
router.post('/:id/messages', protect, sendDirectMessage);
router.get('/:id/messages', protect, getDirectMessages);

export default router;
