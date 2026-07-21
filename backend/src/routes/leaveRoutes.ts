import express from 'express';
import { createLeaveRequest, getLeaveRequests, updateLeaveStatus } from '../controllers/leaveController';
import { protect, adminOnly } from '../middleware/authMiddleware';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.route('/')
  .post(createLeaveRequest)
  .get(getLeaveRequests);

router.patch('/:id/status', adminOnly, updateLeaveStatus);

export default router;
