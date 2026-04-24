import express from 'express';
import { createWorkspace, getWorkspaces, exportWorkspace } from '../controllers/workspaceController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createWorkspace);
router.get('/', protect, getWorkspaces);
router.get('/:workspaceId/export', protect, exportWorkspace);

export default router;
