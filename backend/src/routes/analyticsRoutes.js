import express from 'express';
import { getWorkspaceAnalytics } from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';

const router = express.Router();
router.get('/workspace/:workspaceId', protect, authorizeRoles('admin', 'manager', 'member'), getWorkspaceAnalytics);

export default router;
