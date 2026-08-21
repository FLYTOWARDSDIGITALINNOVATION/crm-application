require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./src/models/User').default;

const updateExistingEmployeeIds = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected.');

    // Fetch all employees sorted by createdAt to assign sequential IDs
    const employees = await User.find({ role: 'employee' }).sort({ createdAt: 1 });
    
    let counter = 1;
    for (const emp of employees) {
      const nextNumber = counter;
      const newId = `FTDI${nextNumber.toString().padStart(3, '0')}`;
      
      emp.employeeId = newId;
      await emp.save();
      console.log(`Updated ${emp.name} with ID: ${newId}`);
      counter++;
    }

    console.log('All employee IDs updated successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error updating employee IDs:', error);
    process.exit(1);
  }
};

updateExistingEmployeeIds();
