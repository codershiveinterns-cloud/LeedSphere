import express from 'express';
import {
  createTeam, getTeams, getTeamsByWorkspace, getTeamById,
  updateTeam, deleteTeam, addMember, updateMember, removeMember, mergeTeams,
  getMyTeams, getTeamWithMyRole,
} from '../controllers/teamController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// IMPORTANT: specific paths must be declared BEFORE the generic /:workspaceId
// catch-all (kept for backward compatibility), otherwise Express will route
// "my" / "merge" into getTeamsByWorkspace and query with them as workspace ids.

router.post('/', protect, createTeam);
router.get('/', protect, getTeams);

// My memberships + refresh-safety verification
router.get('/my', protect, getMyTeams);
router.get('/:teamId/me', protect, getTeamWithMyRole);

router.post('/merge', protect, mergeTeams);
router.get('/detail/:id', protect, getTeamById);

router.put('/:id', protect, updateTeam);
router.delete('/:id', protect, deleteTeam);
router.post('/:id/members', protect, addMember);
router.put('/:id/members/:userId', protect, updateMember);
router.delete('/:id/members/:userId', protect, removeMember);

// Generic catch-all — MUST stay last.
router.get('/:workspaceId', protect, getTeamsByWorkspace);

export default router;
