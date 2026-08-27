require('ts-node/register');

const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs');

const employeeRoutes = require('./src/routes/employeeRoutes').default;
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

dotenv.config();

const app = express();

const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl}`);
  next();
});
app.use('/uploads', express.static(uploadsDir));

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

app.get('/', (_req, res) => {
  res.send('CRM Backend is running with server-local.js');
});

app.get('/api/health', (_req, res) => {
  const readyState = mongoose.connection.readyState;
  res.status(200).json({
    status: 'success',
    message: 'API is healthy',
    database: readyState === 1 ? 'connected' : 'disconnected',
  });
});

app.get('/api/routes', (_req, res) => {
  const routes = [];
  const stack = app._router?.stack || app.router?.stack || [];
  stack.forEach((middleware) => {
    if (middleware.route) {
      routes.push(`${Object.keys(middleware.route.methods).join(',').toUpperCase()} ${middleware.route.path}`);
    } else if (middleware.name === 'router' && middleware.handle?.stack) {
      middleware.handle.stack.forEach((handler) => {
        const route = handler.route;
        if (route) {
          routes.push(`${Object.keys(route.methods).join(',').toUpperCase()} ${route.path}`);
        }
      });
    }
  });
  res.json(routes.sort());
});

const dns = require('dns');

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    throw new Error('MONGO_URI is not set in backend/.env');
  }

  try {
    dns.setDefaultResultOrder('ipv4first');
  } catch (e) {}

  let conn;
  try {
    conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      connectTimeoutMS: 10000,
    });
  } catch (err) {
    if (err.message && err.message.includes('ECONNREFUSED')) {
      try {
        dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
      } catch (e) {}
      conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000,
      });
    } else {
      throw err;
    }
  }

  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    startCronJobs();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

startServer();
