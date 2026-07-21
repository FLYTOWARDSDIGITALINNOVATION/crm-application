import express from 'express';
import { getTasks, createTask, toggleTask, deleteTask, updateTask } from '../controllers/taskController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

// All task routes require authentication
router.use(protect);

router.route('/')
  .get(getTasks)
  .post(adminOnly, createTask);

router.patch('/:id/toggle', toggleTask);
router.patch('/:id', updateTask);
router.delete('/:id', adminOnly, deleteTask);

export default router;
