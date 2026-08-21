const mongoose = require('mongoose');

async function test() {
  try {
    await mongoose.connect('mongodb+srv://flytowards:crm@crm.nyjzp1q.mongodb.net/?appName=crm');
    
    const projects = await mongoose.connection.db.collection('projects').find().toArray();
    console.log("Projects in DB:", projects.length);
    console.log(projects);
    
    process.exit(0);
  } catch (e) {
    console.error(e.message);
  }
}
test();
