import { Request, Response } from 'express';
import User from '../models/User';
import EmployeeSession from '../models/EmployeeSession';
import { ensureEmployeeWorkLogCollection, getEmployeeWorkLogModel } from '../models/EmployeeWorkLog';

const buildEmployeeResponse = (user: any) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  designation: user.designation,
  department: user.department,
  joiningDate: user.joiningDate,
  lastLoginAt: user.lastLoginAt || null,
  lastLogoutAt: user.lastLogoutAt || null,
});

const normalizeWorkLog = (entry: any, source: 'shared' | 'private') => {
  const record = typeof entry?.toObject === 'function' ? entry.toObject() : entry;

  return {
    ...record,
    _id: record._id?.toString?.() || record._id,
    employeeId: record.employeeId?.toString?.() || record.employeeId,
    sharedSessionId: record.sharedSessionId?.toString?.() || record.sharedSessionId,
    source,
  };
};

const mergeWorkLogs = (sharedSessions: any[], privateLogs: any[]) => {
  const combined = new Map<string, any>();

  sharedSessions.forEach((session) => {
    combined.set(session._id.toString(), normalizeWorkLog(session, 'shared'));
  });

  privateLogs.forEach((log) => {
    const key = log.sharedSessionId?.toString?.() || log._id?.toString?.();
    combined.set(key, normalizeWorkLog(log, 'private'));
  });

  return Array.from(combined.values()).sort((left, right) => {
    const leftTime = new Date(left.loginAt).getTime();
    const rightTime = new Date(right.loginAt).getTime();
    return rightTime - leftTime;
  });
};

// @desc    Get all employees
// @route   GET /api/users/employees
// @access  Public
export const getEmployees = async (req: Request, res: Response) => {
  try {
    const employees = await User.find({ role: 'employee' }).select('-password');
    res.status(200).json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching employees', error });
  }
};

// @desc    Create a new employee
// @route   POST /api/users/employee
// @access  Public
export const createEmployee = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, designation, department, joiningDate } = req.body;

    const userExists = await User.findOne({ email });

    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: 'employee',
      phone,
      designation,
      department,
      joiningDate
    });

    await ensureEmployeeWorkLogCollection((user._id as any).toString()).catch((error) => {
      console.warn('Employee work log collection could not be initialized:', error);
    });

    res.status(201).json(buildEmployeeResponse(user));
  } catch (error) {
    res.status(500).json({ message: 'Server Error creating employee', error });
  }
};

// @desc    Get work log history for a specific employee
// @route   GET /api/users/employees/:id/work-logs
// @access  Public
export const getEmployeeWorkLogs = async (req: Request, res: Response) => {
  try {
    const employee = await User.findById(req.params.id).select('-password');

    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const privateLogModel = getEmployeeWorkLogModel(employee._id.toString());
    const [sharedSessions, privateLogs] = await Promise.all([
      EmployeeSession.find({ userId: employee._id }).sort({ loginAt: -1 }),
      privateLogModel.find().sort({ loginAt: -1 }),
    ]);

    const logs = mergeWorkLogs(sharedSessions, privateLogs);

    return res.status(200).json({
      employee: buildEmployeeResponse(employee),
      logs,
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching employee work logs', error });
  }
};
