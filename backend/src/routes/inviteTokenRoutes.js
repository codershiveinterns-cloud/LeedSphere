/**
 * Public token-based invite routes (singular /api/invite).
 *
 * Lives alongside the existing /api/invites (plural) routes which serve
 * the authenticated team-management UI. The two paths are intentionally
 * different so a route guard mistake on one can't expose the other.
 */
import express from 'express';
import {
  createTokenInvite,
  validateInviteToken,
  acceptInviteByToken,
} from '../controllers/inviteTokenController.js';
import { protect } from '../middleware/auth.js';
import { resolveTeamRole, requireTeamRole } from '../middleware/teamRole.js';

const router = express.Router();

// POST /api/invite — auth required; admins/managers of the target team.
router.post(
  '/',
  protect,
  resolveTeamRole({ required: true }),
  requireTeamRole('admin', 'manager'),
  createTokenInvite,
);

// GET  /api/invite/:token  — PUBLIC (the recipient isn't logged in yet).
router.get('/:token', validateInviteToken);

// POST /api/invite/accept  — PUBLIC; creates account or joins existing user.
router.post('/accept', acceptInviteByToken);

export default router;
