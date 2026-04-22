import express from 'express';
import { getMessagesByChannel } from '../controllers/messageController.js';

const router = express.Router();

router.route('/:channelId').get(getMessagesByChannel);

export default router;
