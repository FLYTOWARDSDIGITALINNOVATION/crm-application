require('ts-node/register');
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const mongoose = require('mongoose');
const employeeRoutes = require('./src/routes/employeeRoutes').default;

// Configure environment variables
dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const leadRoutes = require('./src/routes/leadRoutes').default;
const authRoutes = require('./src/routes/authRoutes').default;
const customerRoutes = require('./src/routes/customerRoutes').default;
const taskRoutes = require('./src/routes/taskRoutes').default;
const userRoutes = require('./src/routes/userRoutes').default;
const supportRoutes = require('./src/routes/supportRoutes').default;
app.use('/api/leads', leadRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/users', userRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/employees', employeeRoutes);

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

// Port configuration
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`📡 Server running on http://localhost:${PORT}`);
});
