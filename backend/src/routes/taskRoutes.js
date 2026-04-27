import express from 'express';
import { createTask, getTasks, updateTask, deleteTask } from '../controllers/taskController.js';
import { protect } from '../middleware/auth.js';
import { resolveTeamRole, requireTeamRole } from '../middleware/teamRole.js';

const router = express.Router();

const teamScoped = resolveTeamRole({ required: true });

// Tasks are work items every member participates in:
//   admin, manager, member → create, read, update (assignee progress)
//   admin, manager         → delete
// Per-task ownership (e.g. members can only edit their own assignments) is
// enforced inside the controller; this guard is only the team-membership
// boundary.
router.post('/', protect, teamScoped, createTask);
router.put('/:taskId', protect, teamScoped, updateTask);
router.delete('/:taskId', protect, teamScoped, requireTeamRole('admin', 'manager'), deleteTask);
router.get('/:projectId', protect, teamScoped, getTasks);

export default router;
