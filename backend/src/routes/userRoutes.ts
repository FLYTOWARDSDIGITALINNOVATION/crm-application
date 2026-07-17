import express from 'express';
import { getEmployees, createEmployee, getEmployeeWorkLogs } from '../controllers/userController';

const router = express.Router();

router.get('/employees', getEmployees);
router.post('/employee', createEmployee);
router.get('/employees/:id/work-logs', getEmployeeWorkLogs);

export default router;
