import express from 'express';
import {
  getEmployeeOverview,
  getAllWorkLogs,
  getAllLeavesForSuperAdmin,
  getAllProjectsOverview,
  forceLogoutEmployee,
} from '../controllers/superAdminController';
import { protect, superAdminOnly } from '../middleware/authMiddleware';

const router = express.Router();

// All super-admin routes require authentication + super admin role
router.use(protect, superAdminOnly);

router.get('/employees', getEmployeeOverview);
router.get('/work-logs', getAllWorkLogs);
router.get('/leaves', getAllLeavesForSuperAdmin);
router.get('/projects', getAllProjectsOverview);
router.post('/force-logout/:employeeId', forceLogoutEmployee);

export default router;
