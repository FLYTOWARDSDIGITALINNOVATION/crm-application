import { Request, Response } from 'express';
import Task from '../models/Task';

// @desc    Get all tasks (optionally filtered by projectId)
// @route   GET /api/tasks?projectId=xxx
// @access  Protected
export const getTasks = async (req: Request, res: Response) => {
  try {
    const filter: any = {};

    if (req.query.projectId) {
      filter.projectId = req.query.projectId;
    }

    // Employees only see their own tasks
    if (req.user?.role === 'employee') {
      filter.assignedTo = req.user.name;
    }

    const tasks = await Task.find(filter).sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: 'Server Error retrieving tasks', error });
  }
};

// @desc    Create a new task
// @route   POST /api/tasks
// @access  Admin only
export const createTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.create(req.body);
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server Error creating task', error });
  }
};

// @desc    Toggle task status (Pending <-> In Progress, admin can also set Completed)
// @route   PATCH /api/tasks/:id/toggle
// @access  Protected
export const toggleTask = async (req: Request, res: Response) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (task.status === 'Completed') {
      // Only admin can un-complete a task
      if (req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Only admin can change a completed task status' });
      }
      task.status = 'Pending';
      task.completedBy = '';
    } else {
      task.status = task.status === 'Pending' ? 'In Progress' : 'Completed';
      if (task.status === 'Completed') {
        // Only admin can mark as completed
        if (req.user?.role !== 'admin') {
          return res.status(403).json({ message: 'Only admin can mark a task as Completed' });
        }
        task.completedBy = req.user.name;
      }
    }

    await task.save();
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server Error toggling task', error });
  }
};

// @desc    Update task (status, assignedTo, etc.)
// @route   PATCH /api/tasks/:id
// @access  Protected
export const updateTask = async (req: Request, res: Response) => {
  try {
    const { status, assignedTo, dueDate, description } = req.body;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    // Only admin can mark task as Completed
    if (status === 'Completed' && req.user?.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can mark a task as Completed' });
    }

    if (status !== undefined) {
      task.status = status;
      if (status === 'Completed') {
        task.completedBy = req.user?.name || 'Admin';
      } else {
        task.completedBy = '';
      }
    }
    if (dueDate) {
      task.dueDate = dueDate;
    }
    if (description !== undefined) {
      task.description = description;
    }
    
    await task.save();
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: 'Server Error updating task', error });
  }
};

// @desc    Delete a task
// @route   DELETE /api/tasks/:id
// @access  Admin only
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
