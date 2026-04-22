import express from 'express';
import { createTeam, getTeams, mergeTeams } from '../controllers/teamController.js';

const router = express.Router();
router.post('/', createTeam);
router.get('/:workspaceId', getTeams);
router.post('/merge', mergeTeams);

export default router;
