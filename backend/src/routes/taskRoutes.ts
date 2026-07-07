import express from 'express';
import { getTasks, createTask, toggleTask, deleteTask } from '../controllers/taskController';

const router = express.Router();

router.route('/')
  .get(getTasks)
  .post(createTask);

router.patch('/:id/toggle', toggleTask);

router.delete('/:id', deleteTask);

export default router;
