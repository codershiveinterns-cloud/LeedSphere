import express from 'express';
import { createProject, getProjects, mergeProjects } from '../controllers/projectController.js';

const router = express.Router();
router.post('/', createProject);
router.get('/:workspaceId', getProjects);
router.post('/merge', mergeProjects);

export default router;
