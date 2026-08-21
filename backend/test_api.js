const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const axios = require('axios');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');

async function test() {
  try {
    await mongoose.connect('mongodb+srv://flytowards:crm@crm.nyjzp1q.mongodb.net/?appName=crm');
    
    // Find an employee
    const User = mongoose.connection.collection('users');
    const employee = await User.findOne({ role: 'employee' });
    if (!employee) throw new Error('No employee found');
    
    // Generate token
    const token = jwt.sign(
      { id: employee._id.toString(), role: employee.role, name: employee.name, email: employee.email },
      'supersecretjwtkey_replace_me_in_production',
      { expiresIn: '30d' }
    );
    
    console.log('Employee:', employee.name);
    
    // Find a task
    const Task = mongoose.connection.collection('tasks');
    const task = await Task.findOne({});
    if (!task) throw new Error('No tasks');
    
    console.log('Task ID:', task._id.toString(), 'Current Status:', task.status);
    
    // Test the API directly
    const res = await axios.patch(`http://localhost:5000/api/tasks/${task._id.toString()}`, 
      { status: 'Completed' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    console.log('API Success! New Status:', res.data.status);
    mongoose.connection.close();
  } catch (err) {
    if (err.response) {
      console.log('API Error:', err.response.status, err.response.data);
    } else {
      console.log('Error:', err.message);
    }
    mongoose.connection.close();
  }
}
test();
