import express from 'express';
import { getTasks, createTask, toggleTask, deleteTask, updateTask } from '../controllers/taskController';

const router = express.Router();

router.route('/')
  .get(getTasks)
  .post(createTask);

router.patch('/:id/toggle', toggleTask);
router.patch('/:id', updateTask);

router.delete('/:id', deleteTask);

export default router;
