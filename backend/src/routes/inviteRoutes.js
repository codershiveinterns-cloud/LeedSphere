import express from 'express';
import { createInvite, getMyPendingInvites, getTeamInvites, acceptInvite, declineInvite, revokeInvite } from '../controllers/inviteController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createInvite);
router.get('/pending', protect, getMyPendingInvites);
router.get('/team/:teamId', protect, getTeamInvites);
router.post('/:id/accept', protect, acceptInvite);
router.post('/:id/decline', protect, declineInvite);
router.delete('/:id', protect, revokeInvite);

export default router;
