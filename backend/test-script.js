const mongoose = require('mongoose');

async function test() {
  try {
    await mongoose.connect('mongodb+srv://flytowards:crm@crm.nyjzp1q.mongodb.net/?appName=crm');
    
    const superAdmins = await mongoose.connection.db.collection('users').find({role: 'superadmin'}).toArray();
    console.log("SuperAdmins:", superAdmins.map(u => ({ email: u.email, role: u.role })));
    
    process.exit(0);
  } catch (e) {
    console.error(e.message);
  }
}
test();
