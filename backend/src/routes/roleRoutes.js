import express from 'express';
import { createRole, getRoles } from '../controllers/roleController.js';
import { protect } from '../middleware/auth.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('admin'), createRole);
router.get('/:workspaceId', protect, authorizeRoles('admin', 'manager', 'member'), getRoles);

export default router;
