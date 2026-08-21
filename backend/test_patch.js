const jwt = require('jsonwebtoken');

async function run() {
  try {
    const token = jwt.sign({ id: 'dummy', role: 'employee', name: 'Test' }, 'supersecretjwtkey_replace_me_in_production');
    
    const tasksRes = await fetch('http://localhost:5000/api/tasks', { headers: { Authorization: `Bearer ${token}` } });
    const tasks = await tasksRes.json();
    if (!tasks || tasks.length === 0) { console.log('No tasks'); return; }
    
    const taskId = tasks[0]._id;
    console.log('Task found:', taskId);
    
    const patchRes = await fetch(`http://localhost:5000/api/tasks/${taskId}`, {
      method: 'PATCH',
      headers: { 
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'Completed' })
    });
    const result = await patchRes.json();
    console.log('Patch success:', result.status, patchRes.status);
    console.log('CompletedBy:', result.completedBy);
  } catch (err) {
    console.log('Error:', err.message);
  }
}
run();
