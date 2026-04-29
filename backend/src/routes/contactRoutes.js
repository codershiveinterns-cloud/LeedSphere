import express from 'express';
import { submitContact } from '../controllers/contactController.js';

const router = express.Router();

// Public — no auth.
router.post('/', submitContact);

export default router;
