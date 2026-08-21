import User from '../models/User';
import EmployeeSession from '../models/EmployeeSession';
import { ensureEmployeeWorkLogCollection, getEmployeeWorkLogModel } from '../models/EmployeeWorkLog';

import { Request, Response } from 'express';

const buildEmployeeResponse = (user: any) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  designation: user.designation,
  department: user.department,
  joiningDate: user.joiningDate,
  employeeId: user.employeeId,
  profile: user.profile,
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
    const { name, email, password, phone, designation, department, joiningDate, photo } = req.body;

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
      joiningDate,
      profile: {
        ...(photo ? { photo } : {}),
        generatedPassword: password
      }
    });

    await ensureEmployeeWorkLogCollection((user._id as any).toString()).catch((error) => {
      console.warn('Employee work log collection could not be initialized:', error);
    });

    res.status(201).json(buildEmployeeResponse(user));
  } catch (error) {
    res.status(500).json({ message: 'Server Error creating employee', error });
  }
};

// @desc    Update employee payroll details (admin)
// @route   PUT /api/users/employees/:id/payroll
// @access  Private (Admin)
export const updateEmployeePayroll = async (req: Request, res: Response) => {
  try {
    const { salary, pfContribution, uan, pensionStatus } = req.body;
    const employee = await User.findById(req.params.id).select('-password');

    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({ message: 'Employee not found' });
    }

    employee.profile = employee.profile || {};
    employee.profile.salary = Number(salary) || 0;
    employee.profile.pfContribution = Number(pfContribution) || 0;
    employee.profile.uan = uan || '';
    employee.profile.pensionStatus = pensionStatus || '';

    await employee.save();

    res.status(200).json(employee);
  } catch (error) {
    res.status(550).json({ message: 'Server Error updating employee payroll', error });
  }
};

// @desc    Update employee basic details (admin)
// @route   PUT /api/users/employees/:id
// @access  Private (Admin)
export const updateEmployeeAdmin = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, designation, department, joiningDate, employeeId, profile } = req.body;
    const employee = await User.findById(req.params.id).select('-password');

    if (!employee || employee.role !== 'employee') {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (name) employee.name = name;
    if (email) employee.email = email;
    if (phone) employee.phone = phone;
    if (designation) employee.designation = designation;
    if (department) employee.department = department;
    if (joiningDate) employee.joiningDate = joiningDate;
    if (employeeId) employee.employeeId = employeeId;
    if (password) {
      employee.password = password;
      employee.profile = employee.profile || {};
      employee.profile.generatedPassword = password;
    }

    if (profile) {
      employee.profile = employee.profile || {};
      if (profile.dob) employee.profile.dob = profile.dob;
      if (profile.gender) employee.profile.gender = profile.gender;
      if (profile.address) employee.profile.address = profile.address;
      if (profile.aadhaar) employee.profile.aadhaar = profile.aadhaar;
      if (profile.pan) employee.profile.pan = profile.pan;
      
      if (profile.bank) {
        employee.profile.bank = employee.profile.bank || {};
        if (profile.bank.accountType) employee.profile.bank.accountType = profile.bank.accountType;
        if (profile.bank.accountNumber) employee.profile.bank.accountNumber = profile.bank.accountNumber;
        if (profile.bank.ifsc) employee.profile.bank.ifsc = profile.bank.ifsc;
      }
      
      if (profile.emergencyContact) {
        employee.profile.emergencyContact = employee.profile.emergencyContact || {};
        if (profile.emergencyContact.name) employee.profile.emergencyContact.name = profile.emergencyContact.name;
        if (profile.emergencyContact.relation) employee.profile.emergencyContact.relation = profile.emergencyContact.relation;
        if (profile.emergencyContact.phone) employee.profile.emergencyContact.phone = profile.emergencyContact.phone;
      }

      if (profile.photo !== undefined) employee.profile.photo = profile.photo;
    }

    await employee.save();

    res.status(200).json(buildEmployeeResponse(employee));
  } catch (error) {
    res.status(500).json({ message: 'Server Error updating employee details', error });
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

// @desc Submit or update employee profile (first-time submission)
// @route PUT /api/users/profile
// @access Protected (employee)
export const submitEmployeeProfile = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    console.log('[submitEmployeeProfile] incoming request for user:', userId);
    console.log('[submitEmployeeProfile] body keys:', Object.keys(req.body));
    console.log('[submitEmployeeProfile] hasFile:', !!(req.file));

    if (!userId) return res.status(401).json({ message: 'Not authorised' });

    const user = await User.findById(userId);
    if (!user || user.role !== 'employee') return res.status(404).json({ message: 'Employee not found' });

    // Accept fields from body; photo can be base64 or URL
    const {
      name,
      mobile,
      aadhaar,
      dob,
      gender,
      photo,
      address,
      pan,
      accountNumber,
      ifsc,
      accountType,
      emergencyName,
      emergencyRelation,
      emergencyPhone,
      designation,
      department,
      joiningDate,
    } = req.body;

    user.name = name || user.name;
    user.designation = designation || user.designation;
    user.department = department || user.department;
    user.joiningDate = joiningDate || user.joiningDate;
    user.profile = user.profile || {};
    user.profile.mobile = mobile || user.profile.mobile;
    user.profile.aadhaar = aadhaar || user.profile.aadhaar;
    user.profile.dob = dob || user.profile.dob;
    user.profile.gender = gender || user.profile.gender;
    user.profile.address = address || user.profile.address;
    user.profile.pan = pan || user.profile.pan;
    user.profile.bank = {
      accountNumber: accountNumber || user.profile.bank?.accountNumber,
      ifsc: ifsc || user.profile.bank?.ifsc,
      accountType: accountType || user.profile.bank?.accountType,
    };
    user.profile.emergencyContact = {
      name: emergencyName || user.profile.emergencyContact?.name,
      relation: emergencyRelation || user.profile.emergencyContact?.relation,
      phone: emergencyPhone || user.profile.emergencyContact?.phone,
    };
    if (photo) user.profile.photo = photo;

    // Accept multipart file upload (profilePhoto) as well
    const file = req.file as Express.Multer.File | undefined;
    if (file && file.buffer) {
      user.profile.photo = `data:${file.mimetype};base64,${file.buffer.toString('base64')}`;
    }
    user.profile.submittedAt = new Date();
    if (!user.employeeId) {
      const usersWithId = await User.find({ employeeId: { $regex: /^FTDI\d+$/ } }).select('employeeId').exec();
      if (usersWithId.length > 0) {
        const maxId = usersWithId.reduce((max, u) => {
          const num = parseInt(u.employeeId!.replace('FTDI', ''), 10);
          return num > max ? num : max;
        }, 0);
        const nextNumber = maxId + 1;
        user.employeeId = `FTDI${nextNumber.toString().padStart(3, '0')}`;
      } else {
        user.employeeId = 'FTDI001';
      }
    }

    user.profileCompleted = true;
    if (user.approvalStatus === 'Approved') {
      user.approvalStatus = 'Approved';
    } else {
      user.approvalStatus = 'Pending';
    }

    await user.save();

    // Send push notification to all superadmins
    try {
      const superAdmins = await User.find({ role: 'superadmin' });
      for (const sa of superAdmins) {
        const subscriptions = sa.pushSubscriptions || [];
        for (const sub of subscriptions) {
          try {
            const { sendPushNotification } = require('../utils/webpush');
            await sendPushNotification(sub, {
              title: 'Pending Employee Approval',
              body: `${user.name} is waiting for approval.`,
              url: '/employee-approvals'
            });
          } catch (err) {}
        }
      }
    } catch (e) {}

    return res.status(200).json({ message: 'Profile submitted successfully' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// @desc Get pending employee approvals (admin)
// @route GET /api/users/approvals
// @access Admin
export const getEmployeeApprovals = async (req: Request, res: Response) => {
  try {
    const approvals = await User.find({ role: 'employee', profileCompleted: true, approvalStatus: 'Pending' })
      .select('employeeId name email designation department joiningDate profile approvalStatus createdAt')
      .sort({ 'profile.submittedAt': -1 });
    return res.status(200).json(approvals);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// @desc Get single employee approval details (admin)
// @route GET /api/users/approvals/:id
// @access Admin
export const getEmployeeApprovalDetails = async (req: Request, res: Response) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user || user.role !== 'employee') return res.status(404).json({ message: 'Employee not found' });
    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// @desc Update approval status (approve/reject)
// @route PATCH /api/users/approvals/:id
// @access Admin
export const updateEmployeeApproval = async (req: Request, res: Response) => {
  try {
    const { status } = req.body; // 'Approved'|'Rejected'
    if (!['Approved', 'Rejected'].includes(status)) return res.status(400).json({ message: 'Invalid status' });

    const user = await User.findById(req.params.id);
    if (!user || user.role !== 'employee') return res.status(404).json({ message: 'Employee not found' });

    user.approvalStatus = status as any;
    await user.save();

    return res.status(200).json({ message: `Employee ${status.toLowerCase()} successfully` });
  } catch (error) {
    return res.status(500).json({ message: 'Server error', error });
  }
};

// @desc    Get all completed employee sessions with logout proofs (admin review)
// @route   GET /api/users/work-sessions
// @access  Private (Admin Only)
export const getAllEmployeeSessions = async (req: Request, res: Response) => {
  try {
    const sessions = await EmployeeSession.find({ status: 'completed' })
      .sort({ logoutAt: -1 })
      .lean();
      
    return res.status(200).json(sessions);
  } catch (error) {
    return res.status(500).json({ message: 'Server error fetching work sessions', error });
  }
};

