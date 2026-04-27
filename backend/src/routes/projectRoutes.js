import express from 'express';
import {
  createProject, getProjects, updateProject, deleteProject, mergeProjects,
  getProjectDocuments, addProjectDocument, removeProjectDocument,
} from '../controllers/projectController.js';
import { protect } from '../middleware/auth.js';
import { resolveTeamRole, requireTeamRole } from '../middleware/teamRole.js';

const router = express.Router();

// Project mutations require an active team (X-Team-Id header) so we can
// resolve the caller's per-team role. Reads stay open to any team member.
//   admin, manager → manage projects
//   member         → read-only

const teamScoped = resolveTeamRole({ required: true });

// Create / update / merge / delete need write access.
router.post('/', protect, teamScoped, requireTeamRole('admin', 'manager'), createProject);
router.post('/merge', protect, teamScoped, requireTeamRole('admin'), mergeProjects);

// Documents — declare BEFORE the catch-all GET '/:workspaceId'.
router.get('/:id/documents', protect, teamScoped, getProjectDocuments);
router.post('/:id/documents', protect, teamScoped, requireTeamRole('admin', 'manager'), addProjectDocument);
router.delete('/:id/documents/:docId', protect, teamScoped, requireTeamRole('admin', 'manager'), removeProjectDocument);

router.put('/:id', protect, teamScoped, requireTeamRole('admin', 'manager'), updateProject);
router.delete('/:id', protect, teamScoped, requireTeamRole('admin'), deleteProject);

// Reads — any team member.
router.get('/:workspaceId', protect, teamScoped, getProjects);

export default router;
