import express from 'express';
import multer from 'multer';
import {
	getEmployees,
	createEmployee,
	getEmployeeWorkLogs,
	submitEmployeeProfile,
	getEmployeeApprovals,
	getEmployeeApprovalDetails,
	updateEmployeeApproval,
	getAllEmployeeSessions,
	updateEmployeePayroll,
} from '../controllers/userController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.get('/employees', getEmployees);
router.post('/employee', createEmployee);
router.get('/employees/:id/work-logs', getEmployeeWorkLogs);
router.put('/employees/:id/payroll', protect, adminOnly, updateEmployeePayroll);
router.get('/work-sessions', protect, adminOnly, getAllEmployeeSessions);

// Employee profile submission (first-time)
// Support both PUT and POST for multipart compatibility
router.put('/profile', protect, upload.single('profilePhoto'), submitEmployeeProfile);
router.post('/profile', protect, upload.single('profilePhoto'), submitEmployeeProfile);

// Admin approvals
router.get('/approvals', protect, adminOnly, getEmployeeApprovals);
router.get('/approvals/:id', protect, adminOnly, getEmployeeApprovalDetails);
router.patch('/approvals/:id', protect, adminOnly, updateEmployeeApproval);

export default router;
