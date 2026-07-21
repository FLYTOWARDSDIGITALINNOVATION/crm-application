import { Request, Response } from 'express';
import WorkLog from '../models/WorkLog';

// @desc    Create a new work log entry (with image uploads)
// @route   POST /api/work-logs
// @access  Protected (employee/admin)
export const createWorkLog = async (req: Request, res: Response) => {
  try {
    const { taskId, projectId, description } = req.body;

    if (!taskId || !projectId || !description?.trim()) {
      return res.status(400).json({ message: 'taskId, projectId, and description are required' });
    }

    // Collect uploaded image paths (multer saves them to disk and sets req.files)
    const files = req.files as Express.Multer.File[];
    const imagePaths = files ? files.map((f) => `/uploads/${f.filename}`) : [];

    const workLog = await WorkLog.create({
      task: taskId,
      project: projectId,
      employeeId: req.user?.id,
      employeeName: req.user?.name || 'Unknown',
      description: description.trim(),
      images: imagePaths,
    });

    res.status(201).json(workLog);
  } catch (error) {
    res.status(500).json({ message: 'Server Error creating work log', error });
  }
};

// @desc    Get all work logs for a specific task
// @route   GET /api/work-logs/task/:taskId
// @access  Protected
export const getWorkLogsByTask = async (req: Request, res: Response) => {
  try {
    const logs = await WorkLog.find({ task: req.params.taskId }).sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching work logs', error });
  }
};

// @desc    Get all work logs for a specific project
// @route   GET /api/work-logs/project/:projectId
// @access  Protected
export const getWorkLogsByProject = async (req: Request, res: Response) => {
  try {
    const logs = await WorkLog.find({ project: req.params.projectId }).sort({ createdAt: -1 });
    res.status(200).json(logs);
  } catch (error) {
    res.status(500).json({ message: 'Server Error fetching project work logs', error });
  }
};

// @desc    Delete a work log
// @route   DELETE /api/work-logs/:id
// @access  Admin only
export const deleteWorkLog = async (req: Request, res: Response) => {
  try {
    const log = await WorkLog.findByIdAndDelete(req.params.id);
    if (!log) return res.status(404).json({ message: 'Work log not found' });
    res.status(200).json({ message: 'Work log deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error deleting work log', error });
  }
};
