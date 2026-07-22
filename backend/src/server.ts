import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/db';

dotenv.config();

const app = express();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json());
// Simple request logger for debugging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});
// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

import leadRoutes from './routes/leadRoutes';
import authRoutes from './routes/authRoutes';
import customerRoutes from './routes/customerRoutes';
import taskRoutes from './routes/taskRoutes';
import userRoutes from './routes/userRoutes';
import supportRoutes from './routes/supportRoutes';
import projectRoutes from './routes/projectRoutes';
import workLogRoutes from './routes/workLogRoutes';
import leaveRoutes from './routes/leaveRoutes';
import superAdminRoutes from './routes/superAdminRoutes';

// Database Connection
connectDB();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/work-logs', workLogRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/super-admin', superAdminRoutes);

// Basic Route for testing
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is running beautifully!' });
});

// Debug: list mounted routes
app.get('/api/routes', (_req, res) => {
  const routes: string[] = [];
  (app as any)._router.stack.forEach((middleware: any) => {
    if (middleware.route) {
      routes.push(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler: any) => {
        const route = handler.route;
        if (route) routes.push(`${Object.keys(route.methods).join(',').toUpperCase()} ${route.path}`);
      });
    }
  });
  res.json(routes.sort());
});

// Import Routes (to be created)

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
