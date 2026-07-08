import { Request, Response } from 'express';
import User from '../models/User';

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

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      designation: user.designation,
      department: user.department,
      joiningDate: user.joiningDate
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error creating employee', error });
  }
};
