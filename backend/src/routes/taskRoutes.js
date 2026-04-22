import express from 'express';
import { createTask, getTasks, updateTaskStatus } from '../controllers/taskController.js';

const router = express.Router();
router.post('/', createTask);
router.get('/:projectId', getTasks);
router.put('/:taskId', updateTaskStatus);

export default router;
