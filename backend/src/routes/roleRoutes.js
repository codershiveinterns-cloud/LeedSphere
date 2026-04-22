import express from 'express';
import { createRole, getRoles } from '../controllers/roleController.js';

const router = express.Router();
router.post('/', createRole);
router.get('/:workspaceId', getRoles);

export default router;
