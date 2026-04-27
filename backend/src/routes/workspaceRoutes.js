import express from 'express';
import {
  createWorkspace,
  getMyWorkspaces,
  exportWorkspace,
  deleteWorkspace,
} from '../controllers/workspaceController.js';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';

const router = express.Router();

router.post('/', protect, createWorkspace);
router.get('/', protect, getMyWorkspaces);
router.get('/my-workspaces', protect, getMyWorkspaces);

router.delete('/:workspaceId', protect, authorizeRoles('admin'), deleteWorkspace);
router.get('/:workspaceId/export', protect, authorizeRoles('admin', 'manager', 'member'), exportWorkspace);

export default router;
