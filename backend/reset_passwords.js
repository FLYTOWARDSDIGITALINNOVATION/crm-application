const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const dns = require('dns');

dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config();

const userSchema = new mongoose.Schema({
  email: String,
  password: { type: String, select: false },
  role: String,
  profile: {
    generatedPassword: { type: String }
  }
}, { strict: false });

const User = mongoose.model('User', userSchema);

const run = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected.');
    
    const employees = await User.find({ role: 'employee' }).select('+password');
    console.log(`Found ${employees.length} employees.`);
    
    const newPassword = 'Password@123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    
    let updatedCount = 0;
    for (const emp of employees) {
      if (!emp.profile) emp.profile = {};
      if (!emp.profile.generatedPassword) {
        emp.password = hashedPassword;
        emp.profile.generatedPassword = newPassword;
        await emp.save();
        updatedCount++;
        console.log(`Updated password for ${emp.email}`);
      }
    }
    
    console.log(`Done! Updated ${updatedCount} employees.`);
  } catch (error) {
    console.error(error);
  } finally {
    process.exit(0);
  }
};

run();
