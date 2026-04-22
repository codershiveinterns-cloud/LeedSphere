import express from 'express';
import {
  createTeam, getTeams, getTeamsByWorkspace, getTeamById,
  updateTeam, deleteTeam, addMember, removeMember, mergeTeams,
} from '../controllers/teamController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createTeam);
router.get('/', protect, getTeams);
router.post('/merge', protect, mergeTeams);
router.get('/detail/:id', protect, getTeamById);
router.put('/:id', protect, updateTeam);
router.delete('/:id', protect, deleteTeam);
router.post('/:id/members', protect, addMember);
router.delete('/:id/members/:userId', protect, removeMember);
// Backward compat: GET /api/teams/:workspaceId
router.get('/:workspaceId', protect, getTeamsByWorkspace);

export default router;
