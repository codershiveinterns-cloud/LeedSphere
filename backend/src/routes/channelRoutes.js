import express from 'express';
import { createChannel, getChannelsByWorkspace } from '../controllers/channelController.js';

const router = express.Router();

router.route('/').post(createChannel);
router.route('/:workspaceId').get(getChannelsByWorkspace);

export default router;
