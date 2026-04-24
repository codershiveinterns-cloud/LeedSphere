import express from 'express';
import { createTask, getTasks, updateTask, deleteTask } from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();
router.post('/', protect, createTask);
router.put('/:taskId', protect, updateTask);
router.delete('/:taskId', protect, deleteTask);
router.get('/:projectId', protect, getTasks);

export default router;
