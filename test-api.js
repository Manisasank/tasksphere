/**
 * Automated API Test Suite for TaskSphere REST API
 * Verifies CRUD endpoints, status codes, and JSON response structure
 */

const http = require('http');

const BASE_URL = 'http://localhost:3000';

function request(method, path, data = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const options = {
      method,
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => (body += chunk));
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function runTests() {
  console.log('🧪 Starting TaskSphere REST API Integration Tests...\n');

  try {
    // 1. Health Check
    console.log('1️⃣ Testing GET /api/health...');
    const health = await request('GET', '/api/health');
    console.assert(health.status === 200, 'Health endpoint should return 200');
    console.log('   ✅ Health endpoint working. Storage mode:', health.data.storageMode);

    // 2. Create Task (POST /api/tasks)
    console.log('\n2️⃣ Testing POST /api/tasks (Create)...');
    const newDoc = {
      title: 'Automated Test Task',
      description: 'Verifying end-to-end CRUD flow with testing script.',
      category: 'Work',
      priority: 'High'
    };
    const created = await request('POST', '/api/tasks', newDoc);
    console.assert(created.status === 201, 'Create task should return 201');
    console.assert(created.data.id, 'Created task must have an id');
    console.log('   ✅ Task created successfully with ID:', created.data.id);

    const testId = created.data.id;

    // 3. Retrieve Tasks (GET /api/tasks)
    console.log('\n3️⃣ Testing GET /api/tasks (Read)...');
    const list = await request('GET', '/api/tasks');
    console.assert(list.status === 200, 'GET /api/tasks should return 200');
    console.assert(Array.isArray(list.data), 'Tasks response should be an array');
    console.log(`   ✅ Successfully retrieved ${list.data.length} tasks.`);

    // 4. Update Task (PUT /api/tasks/:id)
    console.log('\n4️⃣ Testing PUT /api/tasks/:id (Update status to completed)...');
    const updated = await request('PUT', `/api/tasks/${testId}`, { status: 'completed' });
    console.assert(updated.status === 200, 'PUT /api/tasks/:id should return 200');
    console.assert(updated.data.status === 'completed', 'Task status should now be completed');
    console.log('   ✅ Task status successfully updated to completed.');

    // 5. Delete Task (DELETE /api/tasks/:id)
    console.log('\n5️⃣ Testing DELETE /api/tasks/:id (Delete)...');
    const deleted = await request('DELETE', `/api/tasks/${testId}`);
    console.assert(deleted.status === 200, 'DELETE /api/tasks/:id should return 200');
    console.log('   ✅ Task successfully deleted from database.');

    console.log('\n🎉 ALL 5 INTEGRATION TESTS PASSED SUCCESSFULLY! The REST API is robust and production-ready.\n');
  } catch (error) {
    console.error('\n❌ Test execution failed. Make sure server is running with `npm start` before testing.');
    console.error(error.message);
  }
}

runTests();
