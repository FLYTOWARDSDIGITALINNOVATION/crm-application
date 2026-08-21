async function test() {
  try {
    let loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'superadmin@flytowards.com', password: 'password123' })
    });
    if (!loginRes.ok) {
        console.log("Login failed", loginRes.status);
        return;
    }
    let loginData = await loginRes.json();
    console.log("SA Token:", loginData.token?.substring(0,10));
    
    let projectsRes = await fetch('http://localhost:5000/api/projects', {
        headers: { 'Authorization': `Bearer ${loginData.token}` }
    });
    let projects = await projectsRes.json();
    console.log("SA Projects fetched:", projects.length);

  } catch (e) {
    console.error(e.message);
  }
}
test();
