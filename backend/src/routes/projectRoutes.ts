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

router.get('/test-all', async (req, res) => {
  const projects = await require('../models/Project').default.find();
  res.json({count: projects.length, projects});
});

// All project routes require authentication
router.use(protect);

router.route('/')
  .get(getProjects)
  .post(adminOnly, createProject);

router.route('/:id')
  .patch(adminOnly, updateProject)
  .delete(adminOnly, deleteProject);
router.get('/test-all', async (req, res) => {
  const projects = await require('../models/Project').default.find();
  res.json({count: projects.length, projects});
});

router.patch('/:id/assign', adminOnly, assignEmployees);
router.get('/:id/employees', getProjectEmployees);

export default router;
