const http = require('http');

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/cards',
  method: 'GET'
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  console.log(`响应头: ${JSON.stringify(res.headers)}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log(`响应体: ${data}`); });
});

req.on('error', (e) => {
  console.error(`请求错误: ${e.message}`);
});

req.end();
