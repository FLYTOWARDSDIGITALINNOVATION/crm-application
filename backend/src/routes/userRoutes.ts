import express from 'express';
import { getEmployees, createEmployee } from '../controllers/userController';

const router = express.Router();

router.get('/employees', getEmployees);
router.post('/employee', createEmployee);

export default router;
