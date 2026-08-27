import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { connectDB } from './config/db';

dotenv.config();

const app = express();
let dbReady = false;

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
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
import notificationRoutes from './routes/notificationRoutes';
import { startCronJobs } from './utils/cronJobs';

// Database Connection
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
app.use('/api/notifications', notificationRoutes);

app.get('/', (_req, res) => {
  res.send(`
    <div style="font-family: sans-serif; text-align: center; padding: 50px;">
      <h2>🚀 FlyTowards CRM Backend API is running on Port 5000</h2>
      <p>To access the main Web Application Interface, please open:</p>
      <a href="http://localhost:5173" style="font-weight: bold; color: #4f46e5; text-decoration: underline; font-size: 18px;">http://localhost:5173</a>
    </div>
  `);
});

// Basic Route for testing
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'API is running beautifully!',
    database: 'connected',
  });
});

// Debug: list mounted routes
app.get('/api/routes', (_req, res) => {
  const routes: string[] = [];
  const stack: any[] = (app as any)._router?.stack || (app as any).router?.stack || [];
  stack.forEach((middleware: any) => {
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

const startServer = async () => {
  try {
    await connectDB();
    startCronJobs();

    app.listen(PORT, () => {
      console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${(error as Error).message}`);
    process.exit(1);
  }
};

startServer();
