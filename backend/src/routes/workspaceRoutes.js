import express from 'express';
import { createWorkspace, getWorkspaces, exportWorkspace } from '../controllers/workspaceController.js';

const router = express.Router();
router.post('/', createWorkspace);
router.get('/', getWorkspaces);
router.get('/:workspaceId/export', exportWorkspace);

export default router;
