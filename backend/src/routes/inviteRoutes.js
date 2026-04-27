import express from 'express';
import { createInvite, getMyPendingInvites, getTeamInvites, acceptInvite, declineInvite, revokeInvite } from '../controllers/inviteController.js';
import { protect } from '../middleware/auth.js';
import { resolveTeamRole, requireTeamRole } from '../middleware/teamRole.js';

const router = express.Router();

// Invite matrix:
//   admin, manager → create / revoke / view team's invite list
//   any member     → see own pending invites, accept/decline (no role gate
//                    needed — the controller already verifies the invite
//                    belongs to the caller's email)
//
// createInvite reads teamId from the body, so resolveTeamRole picks it up
// from req.body.teamId. revokeInvite + getTeamInvites carry the team via
// :teamId/:id URL params, also handled by pickTeamId.
router.post('/', protect, resolveTeamRole({ required: true }), requireTeamRole('admin', 'manager'), createInvite);
router.get('/pending', protect, getMyPendingInvites);
router.get('/team/:teamId', protect, resolveTeamRole({ required: true }), requireTeamRole('admin', 'manager'), getTeamInvites);
router.post('/:id/accept', protect, acceptInvite);
router.post('/:id/decline', protect, declineInvite);
router.delete('/:id', protect, revokeInvite); // controller-level check; team can't be resolved without an extra Invite lookup

export default router;
