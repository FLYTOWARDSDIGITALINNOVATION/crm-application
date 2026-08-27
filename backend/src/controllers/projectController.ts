import { Request, Response } from 'express';
import Project from '../models/Project';
import User from '../models/User';

// @desc    Get all projects (admin: all, employee: only assigned)
// @route   GET /api/projects
// @access  Protected
export const getProjects = async (req: Request, res: Response) => {
  try {
    let projects;
    if (req.user?.role === 'admin' || req.user?.role === 'superadmin') {
      projects = await Project.find()
        .sort({ createdAt: -1 })
        .populate('assignedEmployees', 'name email role designation')
        .populate('createdBy', 'name email role designation');
    } else {
      // Employee sees only their assigned projects
      projects = await Project.find({ assignedEmployees: req.user?.id })
        .sort({ createdAt: -1 })
        .populate('assignedEmployees', 'name email role designation')
        .populate('createdBy', 'name email role designation');
    }
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server Error retrieving projects', error });
  }
};

// @desc    Create a project
// @route   POST /api/projects
// @access  Admin only
export const createProject = async (req: Request, res: Response) => {
  try {
    const { name, description, status, requirements, projectUrl, files, assignedEmployees, startDate, dueDate } = req.body;
    if (!name) {
      return res.status(400).json({ message: 'Project name is required' });
    }
    const project = await Project.create({
      name,
      description: description || '',
      status: status || 'Active',
      requirements: requirements || '',
      projectUrl: projectUrl || '',
      startDate: startDate || undefined,
      dueDate: dueDate || undefined,
      files: files || [],
      createdBy: req.user?.id,
      assignedEmployees: assignedEmployees || [],
    });
    const populated = await project.populate([
      { path: 'assignedEmployees', select: 'name email role designation' },
      { path: 'createdBy', select: 'name email role designation' }
    ]);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server Error creating project', error });
  }
};

// @desc    Update a project
// @route   PATCH /api/projects/:id
// @access  Admin only
export const updateProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    const { name, description, status, requirements, projectUrl, files, assignedEmployees, startDate, dueDate } = req.body;
    if (name !== undefined) project.name = name;
    if (description !== undefined) project.description = description;
    if (status !== undefined) project.status = status;
    if (requirements !== undefined) project.requirements = requirements;
    if (projectUrl !== undefined) project.projectUrl = projectUrl;
    if (startDate !== undefined) project.startDate = startDate;
    if (dueDate !== undefined) project.dueDate = dueDate;
    if (files !== undefined) project.files = files;
    if (assignedEmployees !== undefined) project.assignedEmployees = assignedEmployees;
    await project.save();
    const populated = await project.populate([
      { path: 'assignedEmployees', select: 'name email role designation' },
      { path: 'createdBy', select: 'name email role designation' }
    ]);
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server Error updating project', error });
  }
};

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Admin only
export const deleteProject = async (req: Request, res: Response) => {
  try {
    const project = await Project.findByIdAndDelete(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(200).json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error deleting project', error });
  }
};

// @desc    Assign employees to a project (replaces the full list)
// @route   PATCH /api/projects/:id/assign
// @access  Admin only
export const assignEmployees = async (req: Request, res: Response) => {
  try {
    const { employeeIds } = req.body;
    if (!Array.isArray(employeeIds)) {
      return res.status(400).json({ message: 'employeeIds must be an array' });
    }
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    project.assignedEmployees = employeeIds;
    await project.save();
    const populated = await project.populate('assignedEmployees', 'name email role designation');
    res.status(200).json(populated);
  } catch (error) {
    res.status(500).json({ message: 'Server Error assigning employees', error });
  }
};

// @desc    Get employees assigned to a project
// @route   GET /api/projects/:id/employees
// @access  Protected
export const getProjectEmployees = async (req: Request, res: Response) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      'assignedEmployees',
      'name email role designation department'
    );
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }
    res.status(200).json(project.assignedEmployees);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching project employees', error });
  }
};
