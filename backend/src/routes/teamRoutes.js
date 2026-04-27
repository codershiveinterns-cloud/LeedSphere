import express from 'express';
import {
  createTeam, getTeams, getTeamsByWorkspace, getTeamById,
  updateTeam, deleteTeam, addMember, updateMember, removeMember, mergeTeams,
  getMyTeams, getTeamWithMyRole,
} from '../controllers/teamController.js';
import { protect } from '../middleware/auth.js';
import { resolveTeamRole, requireTeamRole } from '../middleware/teamRole.js';
import { authorizeRoles } from '../middleware/authorizeRoles.js';

const router = express.Router();

router.post('/', protect, authorizeRoles('admin', 'manager'), createTeam);
router.get('/', protect, getTeams);

router.get('/my', protect, getMyTeams);
router.get('/:teamId/me', protect, getTeamWithMyRole);

router.post('/merge', protect, mergeTeams);
router.get('/detail/:id', protect, getTeamById);

const teamScopedById = resolveTeamRole({ required: true });

router.put('/:id', protect, teamScopedById, requireTeamRole('admin'), updateTeam);
router.delete('/:id', protect, teamScopedById, requireTeamRole('admin'), deleteTeam);
router.post('/:id/members', protect, teamScopedById, requireTeamRole('admin'), addMember);
router.put('/:id/members/:userId', protect, teamScopedById, requireTeamRole('admin'), updateMember);
router.delete('/:id/members/:userId', protect, teamScopedById, requireTeamRole('admin'), removeMember);

router.get('/:workspaceId', protect, authorizeRoles('admin', 'manager', 'member'), getTeamsByWorkspace);

export default router;
