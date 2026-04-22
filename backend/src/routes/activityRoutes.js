import express from 'express';
import { getActivityByTeam, getMyActivity, createActivity } from '../controllers/activityController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

router.post('/', protect, createActivity);
router.get('/me', protect, getMyActivity);
router.get('/:teamId', protect, getActivityByTeam);

export default router;
