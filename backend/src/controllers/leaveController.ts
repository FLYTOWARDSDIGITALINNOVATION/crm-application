import { Request, Response } from 'express';
import LeaveRequest from '../models/LeaveRequest';

// @desc    Submit a new leave request
// @route   POST /api/leaves
// @access  Protected
export const createLeaveRequest = async (req: Request, res: Response) => {
  try {
    const { startDate, endDate, type, reason } = req.body;

    if (!startDate || !endDate || !reason?.trim()) {
      return res.status(400).json({ message: 'Start date, end date, and reason are required' });
    }

    const leaveRequest = await LeaveRequest.create({
      employeeId: req.user?.id,
      employeeName: req.user?.name || 'Unknown',
      startDate,
      endDate,
      type: type || 'Casual',
      reason: reason.trim(),
      status: 'Pending',
    });

    res.status(201).json(leaveRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server Error submitting leave request', error });
  }
};

// @desc    Get leave requests (employees see only their own, admin sees all)
// @route   GET /api/leaves
// @access  Protected
export const getLeaveRequests = async (req: Request, res: Response) => {
  try {
    let requests;
    if (req.user?.role === 'admin') {
      requests = await LeaveRequest.find().sort({ createdAt: -1 });
    } else {
      requests = await LeaveRequest.find({ employeeId: req.user?.id }).sort({ createdAt: -1 });
    }
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: 'Server Error retrieving leave requests', error });
  }
};

// @desc    Update leave request status (Approve/Reject)
// @route   PATCH /api/leaves/:id/status
// @access  Admin only
export const updateLeaveStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be Approved or Rejected' });
    }

    const leaveRequest = await LeaveRequest.findById(req.params.id);
    if (!leaveRequest) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leaveRequest.status = status;
    leaveRequest.approvedOrRejectedBy = req.user?.name || 'Admin';

    await leaveRequest.save();
    res.status(200).json(leaveRequest);
  } catch (error) {
    res.status(500).json({ message: 'Server Error updating leave status', error });
  }
};
