const http = require('http');

const BASE_URL = 'http://localhost:3001';

function makeRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, data });
        }
      });
    });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function logTest(name, result) {
  const status = result.status >= 200 && result.status < 300 ? '✓ PASS' : '✗ FAIL';
  console.log(`\n${status} [${result.status}] ${name}`);
  if (result.data && typeof result.data === 'object') {
    console.log('  Response:', JSON.stringify(result.data, null, 2).slice(0, 500));
  }
}

async function runTests() {
  let authToken = '';

  console.log('='.repeat(60));
  console.log('API 端点测试');
  console.log('='.repeat(60));

  // 1. 登录 - 成功
  const loginResult = await makeRequest({
    method: 'POST',
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'admin', password: '123456' }));
  logTest('POST /api/auth/login (admin登录)', loginResult);
  if (loginResult.data?.data?.token) {
    authToken = loginResult.data.data.token;
    console.log('  Token已获取');
  }

  // 2. 登录 - 失败
  const loginFailResult = await makeRequest({
    method: 'POST',
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/login',
    headers: { 'Content-Type': 'application/json' }
  }, JSON.stringify({ username: 'admin', password: 'wrong' }));
  logTest('POST /api/auth/login (错误密码)', loginFailResult);

  // 3. 获取当前用户
  const meResult = await makeRequest({
    method: 'GET',
    hostname: 'localhost',
    port: 3001,
    path: '/api/auth/me',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  logTest('GET /api/auth/me', meResult);

  // 4. 无Token访问受保护接口
  const noAuthResult = await makeRequest({
    method: 'GET',
    hostname: 'localhost',
    port: 3001,
    path: '/api/tasks'
  });
  logTest('GET /api/tasks (无Token)', noAuthResult);

  // 5. 获取所有任务
  const tasksResult = await makeRequest({
    method: 'GET',
    hostname: 'localhost',
    port: 3001,
    path: '/api/tasks',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  logTest('GET /api/tasks', tasksResult);
  if (tasksResult.data?.data) {
    console.log(`  任务数量: ${tasksResult.data.data.length}`);
    const statuses = tasksResult.data.data.reduce((acc, t) => {
      acc[t.status] = (acc[t.status] || 0) + 1;
      return acc;
    }, {});
    console.log('  状态分布:', statuses);
  }

  // 6. 创建任务
  const newTask = {
    title: '测试任务创建',
    description: '通过API创建的测试任务',
    assigneeId: '2',
    estimatedHours: 10,
    priority: 'high'
  };
  const createTaskResult = await makeRequest({
    method: 'POST',
    hostname: 'localhost',
    port: 3001,
    path: '/api/tasks',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }
  }, JSON.stringify(newTask));
  logTest('POST /api/tasks (创建任务)', createTaskResult);
  let createdTaskId = createTaskResult.data?.data?.id;

  // 7. 更新任务
  if (createdTaskId) {
    const updateTaskResult = await makeRequest({
      method: 'PUT',
      hostname: 'localhost',
      port: 3001,
      path: `/api/tasks/${createdTaskId}`,
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }
    }, JSON.stringify({ status: 'in-progress', title: '测试任务(已更新)' }));
    logTest(`PUT /api/tasks/${createdTaskId} (更新任务)`, updateTaskResult);
  }

  // 8. 获取工时记录（分页）
  const timeLogsResult = await makeRequest({
    method: 'GET',
    hostname: 'localhost',
    port: 3001,
    path: '/api/timelogs/task/t1?page=1&limit=5',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  logTest('GET /api/timelogs/task/t1 (分页查询)', timeLogsResult);

  // 9. 创建工时记录
  const newTimeLog = {
    taskId: 't7',
    userId: '5',
    date: new Date().toISOString().split('T')[0],
    hours: 3,
    note: '测试创建工时记录'
  };
  const createTimeLogResult = await makeRequest({
    method: 'POST',
    hostname: 'localhost',
    port: 3001,
    path: '/api/timelogs',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }
  }, JSON.stringify(newTimeLog));
  logTest('POST /api/timelogs (创建工时)', createTimeLogResult);

  // 10. 用户每周工时数据
  const weeklyResult = await makeRequest({
    method: 'GET',
    hostname: 'localhost',
    port: 3001,
    path: '/api/timelogs/user/2/weekly',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  logTest('GET /api/timelogs/user/2/weekly', weeklyResult);
  if (weeklyResult.data?.data) {
    const d = weeklyResult.data.data;
    console.log(`  日期数: ${d.dates?.length}, 任务数: ${d.tasks?.length}`);
    console.log(`  Matrix维度: ${d.matrix?.length}x${d.matrix?.[0]?.length || 0}`);
    console.log(`  taskTotals数量: ${d.taskTotals?.length}`);
  }

  // 11. 获取成员列表
  const membersResult = await makeRequest({
    method: 'GET',
    hostname: 'localhost',
    port: 3001,
    path: '/api/members',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  logTest('GET /api/members', membersResult);
  if (membersResult.data?.data) {
    console.log('  成员列表:');
    membersResult.data.data.forEach(m => {
      console.log(`    - ${m.name} (${m.role}): 本周${m.weeklyHours}h, 任务${m.doneTasks}/${m.totalTasks}`);
    });
  }

  // 12. 添加新成员
  const newMember = {
    username: 'zhouba',
    password: '123456',
    name: '周八',
    role: 'member'
  };
  const createMemberResult = await makeRequest({
    method: 'POST',
    hostname: 'localhost',
    port: 3001,
    path: '/api/members',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` }
  }, JSON.stringify(newMember));
  logTest('POST /api/members (添加成员)', createMemberResult);

  // 13. 燃尽图数据
  const burndownResult = await makeRequest({
    method: 'GET',
    hostname: 'localhost',
    port: 3001,
    path: '/api/burndown',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  logTest('GET /api/burndown', burndownResult);
  if (burndownResult.data?.data) {
    const d = burndownResult.data.data;
    console.log(`  总工时: ${d.totalHours}`);
    console.log(`  idealHours: [${d.idealHours?.join(', ')}]`);
    console.log(`  actualHours: [${d.actualHours?.join(', ')}]`);
  }

  // 14. 删除任务
  if (createdTaskId) {
    const deleteTaskResult = await makeRequest({
      method: 'DELETE',
      hostname: 'localhost',
      port: 3001,
      path: `/api/tasks/${createdTaskId}`,
      headers: { 'Authorization': `Bearer ${authToken}` }
    });
    logTest(`DELETE /api/tasks/${createdTaskId} (删除任务)`, deleteTaskResult);
  }

  // 15. 404测试
  const notFoundResult = await makeRequest({
    method: 'GET',
    hostname: 'localhost',
    port: 3001,
    path: '/api/nonexistent',
    headers: { 'Authorization': `Bearer ${authToken}` }
  });
  logTest('GET /api/nonexistent (404)', notFoundResult);

  console.log('\n' + '='.repeat(60));
  console.log('测试完成！');
  console.log('='.repeat(60));
}

runTests().catch(console.error);
