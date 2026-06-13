import http from 'http';

function makeRequest(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const postData = data ? JSON.stringify(data) : null;
    
    const options = {
      hostname: '127.0.0.1',
      port: 3001,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    if (postData) {
      options.headers['Content-Length'] = Buffer.byteLength(postData);
    }

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on('error', reject);

    if (postData) {
      req.write(postData);
    }
    req.end();
  });
}

async function runTests() {
  console.log('=== 测试1: 登录 ===');
  const loginResult = await makeRequest('POST', '/api/auth/login', {
    username: 'alice',
    password: 'password123'
  });
  console.log('状态:', loginResult.status);
  console.log('成功:', loginResult.data.success);
  console.log('Token:', loginResult.data.data?.token ? '已获取' : '未获取');
  const token = loginResult.data.data?.token;
  console.log();

  console.log('=== 测试2: 获取我的片段 ===');
  const mineResult = await makeRequest('GET', '/api/snippets/mine', null, token);
  console.log('状态:', mineResult.status);
  console.log('数量:', mineResult.data.data?.length);
  console.log();

  console.log('=== 测试3: 搜索片段 (search=JavaScript) ===');
  const searchResult = await makeRequest('GET', '/api/snippets?search=JavaScript');
  console.log('状态:', searchResult.status);
  console.log('数量:', searchResult.data.data?.length);
  console.log();

  console.log('=== 测试4: 按语言筛选 (language=python) ===');
  const langResult = await makeRequest('GET', '/api/snippets?language=python');
  console.log('状态:', langResult.status);
  console.log('数量:', langResult.data.data?.length);
  console.log('标题:', langResult.data.data?.[0]?.title);
  console.log();

  console.log('=== 测试5: 创建片段 ===');
  const createResult = await makeRequest('POST', '/api/snippets', {
    title: '测试片段',
    language: 'javascript',
    content: 'console.log("Hello World");',
    visibility: 'public',
    tags: ['测试']
  }, token);
  console.log('状态:', createResult.status);
  console.log('成功:', createResult.data.success);
  const snippetId = createResult.data.data?.id;
  console.log();

  console.log('=== 测试6: 添加收藏 ===');
  const favResult = await makeRequest('POST', `/api/favorites/${snippetId}`, null, token);
  console.log('状态:', favResult.status);
  console.log('成功:', favResult.data.success);
  console.log();

  console.log('=== 测试7: 获取收藏列表 ===');
  const favListResult = await makeRequest('GET', '/api/favorites', null, token);
  console.log('状态:', favListResult.status);
  console.log('收藏数量:', favListResult.data.data?.length);
  console.log();

  console.log('=== 测试8: 注册新用户 ===');
  const registerResult = await makeRequest('POST', '/api/auth/register', {
    username: 'testuser',
    password: 'testpass123'
  });
  console.log('状态:', registerResult.status);
  console.log('成功:', registerResult.data.success);
  console.log();

  console.log('=== 所有测试完成 ===');
}

runTests().catch(console.error);
