async function test() {
  try {
    const loginRes = await fetch('http://localhost:5000/api/users/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@flytowards.com', password: 'password123' })
    });
    if (!loginRes.ok) {
        console.log("Login failed");
        return;
    }
    const loginData = await loginRes.json();
    console.log("Token:", loginData.token);
    
    const projectsRes = await fetch('http://localhost:5000/api/projects', {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    const projects = await projectsRes.json();
    console.log("Projects:", projects.length);
  } catch (e) {
    console.error(e.message);
  }
}
test();
