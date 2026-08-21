require('ts-node/register');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const employeeRoutes = require('./src/routes/employeeRoutes').default;
const path = require('path');
const fs = require('fs');

// Configure environment variables
dotenv.config();

const app = express();

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
// Simple request logger
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});
// Serve uploaded images statically
app.use('/uploads', express.static(uploadsDir));

// Routes
const leadRoutes = require('./src/routes/leadRoutes').default;
const authRoutes = require('./src/routes/authRoutes').default;
const customerRoutes = require('./src/routes/customerRoutes').default;
const taskRoutes = require('./src/routes/taskRoutes').default;
const userRoutes = require('./src/routes/userRoutes').default;
const supportRoutes = require('./src/routes/supportRoutes').default;
const projectRoutes = require('./src/routes/projectRoutes').default;
const workLogRoutes = require('./src/routes/workLogRoutes').default;
const leaveRoutes = require('./src/routes/leaveRoutes').default;
const superAdminRoutes = require('./src/routes/superAdminRoutes').default;
const notificationRoutes = require('./src/routes/notificationRoutes').default;
const { startCronJobs } = require('./src/utils/cronJobs');

// Start Background Cron Jobs
startCronJobs();

app.use('/api/leads', leadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/work-logs', workLogRoutes);
app.use('/api/leaves', leaveRoutes);
app.use('/api/super-admin', superAdminRoutes);
app.use('/api/notifications', notificationRoutes);

// Database Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

connectDB();

// Root route
app.get('/', (req, res) => {
  res.send('🚀 CRM Backend is running with server.js');
});

// Health check route
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'success', message: 'API is healthy' });
});

// Debug: list mounted routes (for server.js runtime)
app.get('/api/routes', (_req, res) => {
  const routes = [];
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        const route = handler.route;
        if (route) routes.push(`${Object.keys(route.methods).join(',').toUpperCase()} ${route.path}`);
      });
    }
  });
  res.json(routes.sort());
});

// Port configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`📡 Server running on http://localhost:${PORT}`);
});
