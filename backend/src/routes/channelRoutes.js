import express from 'express';
import {
  createChannel,
  getChannelsByTeam,
  getChannelsByWorkspace,
  getChannelMembers,
  joinChannel,
  leaveChannel,
  deleteChannel,
} from '../controllers/channelController.js';
import { protect } from '../middleware/auth.js';
import { resolveTeamRole, requireTeamRole } from '../middleware/teamRole.js';

const router = express.Router();

const teamScoped = resolveTeamRole({ required: true });

// Channel matrix:
//   admin, manager → create
//   admin          → delete
//   any member     → join / leave / read
router.post('/', protect, teamScoped, requireTeamRole('admin', 'manager'), createChannel);
router.post('/create', protect, teamScoped, requireTeamRole('admin', 'manager'), createChannel);

router.post('/join', protect, teamScoped, joinChannel);
router.post('/leave', protect, teamScoped, leaveChannel);

router.get('/team/:teamId', protect, teamScoped, getChannelsByTeam);
router.get('/:id/members', protect, teamScoped, getChannelMembers);

router.delete('/:id', protect, teamScoped, requireTeamRole('admin'), deleteChannel);

router.get('/:workspaceId', protect, getChannelsByWorkspace);

export default router;
