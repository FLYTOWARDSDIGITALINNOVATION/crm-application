import { Request, Response } from 'express';
import User from '../models/User';
import Project from '../models/Project';
import Task from '../models/Task';
import WorkLog from '../models/WorkLog';
import LeaveRequest from '../models/LeaveRequest';

// @desc    Get all employees with session tracking and project info
// @route   GET /api/super-admin/employees
// @access  Super Admin only
export const getEmployeeOverview = async (_req: Request, res: Response) => {
  try {
    const employees = await User.find({ role: { $in: ['employee', 'admin'] } })
      .select('-password')
      .lean();

    // For each employee, get their assigned projects and task count
    const employeesWithDetails = await Promise.all(
      employees.map(async (emp) => {
        const empId = (emp._id as any).toString();

        // Projects this employee is assigned to
        const projects = await Project.find({ assignedEmployees: emp._id })
          .select('name status')
          .lean();

        // Count of tasks assigned to this employee
        const taskCount = await Task.countDocuments({ assignedTo: emp.name });
        const completedTaskCount = await Task.countDocuments({
          assignedTo: emp.name,
          status: 'Completed',
        });

        // Total work logs submitted
        const workLogCount = await WorkLog.countDocuments({ employeeId: emp._id });

        return {
          ...emp,
          projects,
          taskCount,
          completedTaskCount,
          workLogCount,
        };
      })
    );

    res.status(200).json(employeesWithDetails);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching employee overview', error });
  }
};

// @desc    Get all work logs across all projects (super admin view)
// @route   GET /api/super-admin/work-logs
// @access  Super Admin only
export const getAllWorkLogs = async (_req: Request, res: Response) => {
  try {
    const logs = await WorkLog.find()
      .sort({ createdAt: -1 })
      .populate('task', 'title')
      .populate('project', 'name')
      .lean();
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching all work logs', error });
  }
};

// @desc    Get all leave requests (super admin view)
// @route   GET /api/super-admin/leaves
// @access  Super Admin only
export const getAllLeavesForSuperAdmin = async (_req: Request, res: Response) => {
  try {
    const leaves = await LeaveRequest.find().sort({ createdAt: -1 }).lean();
    res.status(200).json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching all leave requests', error });
  }
};

// @desc    Get all projects with assigned employees detail
// @route   GET /api/super-admin/projects
// @access  Super Admin only
export const getAllProjectsOverview = async (_req: Request, res: Response) => {
  try {
    const projects = await Project.find()
      .populate('assignedEmployees', 'name email designation department isOnline lastLoginAt')
      .lean();
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching project overview', error });
  }
};
