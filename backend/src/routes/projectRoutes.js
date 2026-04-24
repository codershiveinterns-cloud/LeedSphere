import express from 'express';
import { createProject, getProjects, updateProject, deleteProject, mergeProjects } from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.post('/', protect, createProject);
router.post('/merge', protect, mergeProjects);
router.put('/:id', protect, updateProject);
router.delete('/:id', protect, deleteProject);
router.get('/:workspaceId', protect, getProjects);

export default router;
