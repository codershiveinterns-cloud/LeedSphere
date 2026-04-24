import express from 'express';
import { getWorkspaceAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.get('/workspace/:workspaceId', protect, getWorkspaceAnalytics);

export default router;
