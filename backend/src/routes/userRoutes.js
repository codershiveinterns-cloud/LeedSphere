import express from 'express';
import { protect } from '../middleware/auth.js';
import { updateProfileImage, removeProfileImage } from '../controllers/userController.js';

const router = express.Router();

router.patch('/profile-image', protect, updateProfileImage);
router.delete('/profile-image', protect, removeProfileImage);

export default router;
