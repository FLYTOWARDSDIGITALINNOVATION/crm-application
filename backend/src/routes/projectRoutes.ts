import express from 'express';
import {
  getProjects,
  createProject,
  updateProject,
  deleteProject,
  assignEmployees,
  getProjectEmployees,
} from '../controllers/projectController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

// All project routes require authentication
router.use(protect);

router.route('/')
  .get(getProjects)
  .post(adminOnly, createProject);

router.route('/:id')
  .patch(adminOnly, updateProject)
  .delete(adminOnly, deleteProject);

router.patch('/:id/assign', adminOnly, assignEmployees);
router.get('/:id/employees', getProjectEmployees);

export default router;
