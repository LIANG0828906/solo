const http = require('http');

const postData = JSON.stringify({
  viewerId: '779d1c65-721d-4f13-b9aa-90501697fc40',
  targetCardId: 'a1b2c3d4-1111-2222-3333-444455556666'
});

const options = {
  hostname: '127.0.0.1',
  port: 3000,
  path: '/api/exchanges',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

const req = http.request(options, (res) => {
  console.log(`状态码: ${res.statusCode}`);
  let data = '';
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => { console.log(`响应: ${data}`); });
});

req.on('error', (e) => { console.error(`错误: ${e.message}`); });
req.write(postData);
req.end();
