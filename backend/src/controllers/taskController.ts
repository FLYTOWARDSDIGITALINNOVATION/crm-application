import { Request, Response } from 'express';
import Task from '../models/Task';

// @desc    Get all tasks
// @route   GET /api/tasks
// @access  Public
export const getTasks = async (req: Request, res: Response) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server Error retrieving tasks', error });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Public
export const createTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.create(req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server Error creating task', error });
  }
};

// @desc    Toggle task status (Pending <-> Completed)
// @route   PATCH /api/tasks/:id/toggle
// @access  Public
export const toggleTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    task.status = task.status === 'Completed' ? 'Pending' : 'Completed';
    await task.save();
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server Error toggling task', error });
  }
};

// @desc    Update task status
// @route   PATCH /api/tasks/:id
// @access  Public
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { status, assignedTo } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    
    if (status) {
      task.status = status;
    }
    if (assignedTo) {
      task.assignedTo = assignedTo;
    }
    
    await task.save();
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server Error updating task', error });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Public
export const deleteTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findByIdAndDelete(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }
    res.status(200).json({ message: 'Task removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server Error deleting task', error });
  }
};
