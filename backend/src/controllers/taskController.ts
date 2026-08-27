import { Request, Response } from 'express';
import Task from '../models/Task';
import Project from '../models/Project';

// @desc    Get all tasks (optionally filtered by projectId)
// @route   GET /api/tasks?projectId=xxx
// @access  Protected
export const getTasks = async (req: Request, res: Response) => {
  try {
    const filter: any = {};

    if (req.query.projectId) {
      filter.projectId = req.query.projectId;
    }

    // Employees see ONLY tasks assigned to them (by ID, name, email)
    if (req.user?.role === 'employee') {
      const userId = req.user?.id || req.user?._id;
      const userIdentifiers: any[] = [];
      if (userId) userIdentifiers.push(userId.toString());
      if (req.user?.name) {
        userIdentifiers.push(req.user.name);
        userIdentifiers.push(new RegExp(`^${req.user.name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i'));
      }
      if (req.user?.email) {
        userIdentifiers.push(req.user.email);
        userIdentifiers.push(new RegExp(`^${req.user.email.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')}$`, 'i'));
      }

      filter.assignedTo = { $in: userIdentifiers };
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
    // Normalize assignedTo to array of strings
    const body = { ...req.body } as any;
    if (body.assignedTo && !Array.isArray(body.assignedTo)) {
      body.assignedTo = [body.assignedTo];
    }
    const task = await Task.create(body);
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
      task.status = 'Pending';
      task.completedBy = '';
    } else {
      task.status = task.status === 'Pending' ? 'In Progress' : 'Completed';
      if (task.status === 'Completed') {
        task.completedBy = req.user?.name || '';
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
    const { title, status, priority, assignedTo, startDate, dueDate, progress, description, relatedTo, projectId } = req.body as any;
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ message: 'Task not found' });
    }

    if (title !== undefined) task.title = title;
    if (priority !== undefined) task.priority = priority;
    if (startDate !== undefined) task.startDate = startDate;
    if (dueDate !== undefined) task.dueDate = dueDate;
    if (progress !== undefined) task.progress = Number(progress);
    if (description !== undefined) task.description = description;
    if (relatedTo !== undefined) task.relatedTo = relatedTo;
    if (projectId !== undefined) task.projectId = projectId;

    if (status !== undefined) {
      task.status = status;
      if (status === 'Completed') {
        task.completedBy = req.user?.name || 'Admin';
        if (progress === undefined) task.progress = 100;
      } else {
        task.completedBy = '';
      }
    }

    if (assignedTo !== undefined) {
      task.assignedTo = Array.isArray(assignedTo) ? assignedTo : [assignedTo];
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
