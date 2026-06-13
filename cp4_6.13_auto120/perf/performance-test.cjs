const WebSocket = require('ws');
const crypto = require('crypto');

const BASE_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001/ws';
const NUM_CLIENTS = 50;

function generateSessionId() {
  return crypto.randomUUID();
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function createVote() {
  const response = await fetch(`${BASE_URL}/api/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: '性能测试投票',
      options: ['选项A', '选项B', '选项C', '选项D'],
    }),
  });
  const data = await response.json();
  return data.voteId;
}

function connectClient(voteId, sessionId) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(WS_URL);
    const metrics = {
      joinLatency: 0,
      messagesReceived: 0,
    };

    const joinStartTime = Date.now();

    ws.on('open', () => {
      ws.send(JSON.stringify({ type: 'join', voteId, sessionId }));
    });

    ws.on('message', (data) => {
      const message = JSON.parse(data.toString());
      metrics.messagesReceived++;

      if (message.type === 'vote_state') {
        metrics.joinLatency = Date.now() - joinStartTime;
        resolve({ ws, metrics });
      }
    });

    ws.on('error', reject);
    setTimeout(() => reject(new Error('Connection timeout')), 5000);
  });
}

async function runBroadcastLatencyTest(voteId, clients) {
  console.log('\n--- 广播延迟测试 ---');

  const optionId = clients.length > 0 ? 'placeholder' : null;

  const broadcasterClient = clients[0];
  const testVoters = clients.slice(1, Math.min(20, clients.length));

  let broadcastLatencies = [];
  let currentTestVote = 0;

  const setupListeners = (client, clientIndex) => {
    return new Promise((resolve) => {
      let voteSentTime = 0;

      const handleMessage = (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'vote_update' && voteSentTime > 0 && message.totalVotes > currentTestVote) {
          const latency = Date.now() - voteSentTime;
          broadcastLatencies.push(latency);
          client.ws.removeListener('message', handleMessage);
          resolve(latency);
        }
      };

      client.ws.on('message', handleMessage);

      setTimeout(() => {
        voteSentTime = Date.now();
        currentTestVote++;
        broadcasterClient.ws.send(
          JSON.stringify({
            type: 'vote',
            voteId,
            optionId: clients[0].ws.options?.[0]?.id || 'test',
            sessionId: generateSessionId(),
          })
        );
      }, 100 + clientIndex * 50);
    });
  };

  const latencyPromises = testVoters.map((client, idx) => setupListeners(client, idx));

  await sleep(1000);

  const latencies = await Promise.all(latencyPromises);

  if (latencies.length > 0) {
    const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const max = Math.max(...latencies);
    const min = Math.min(...latencies);

    console.log(`测试样本数: ${latencies.length}`);
    console.log(`平均广播延迟: ${avg.toFixed(1)}ms`);
    console.log(`最小延迟: ${min}ms`);
    console.log(`最大延迟: ${max}ms`);
    console.log(`性能目标 (<300ms): ${avg < 300 ? '✓ 达标' : '✗ 未达标'}`);
  }

  return broadcastLatencies;
}

async function runPerformanceTest() {
  console.log('='.repeat(60));
  console.log('LiveVote 性能测试');
  console.log('='.repeat(60));

  console.log('\n1. 创建测试投票...');
  let voteId;
  try {
    voteId = await createVote();
    console.log(`   ✓ 投票创建成功，ID: ${voteId}`);
  } catch (err) {
    console.log(`   ✗ 创建失败: ${err.message}`);
    console.log('\n请先启动服务器: npm run dev:server');
    return;
  }

  console.log(`\n2. 连接 ${NUM_CLIENTS} 个客户端...`);
  const clients = [];
  const connectStartTime = Date.now();

  for (let i = 0; i < NUM_CLIENTS; i++) {
    try {
      const sessionId = generateSessionId();
      const client = await connectClient(voteId, sessionId);
      clients.push(client);
      if ((i + 1) % 10 === 0) {
        console.log(`   已连接 ${i + 1}/${NUM_CLIENTS}`);
      }
    } catch (err) {
      console.log(`   客户端 ${i + 1} 连接失败: ${err.message}`);
    }
  }

  const connectDuration = Date.now() - connectStartTime;
  console.log(`   成功连接: ${clients.length}/${NUM_CLIENTS}`);
  console.log(`   连接耗时: ${connectDuration}ms`);

  if (clients.length === 0) {
    console.log('\n没有客户端连接成功，测试终止。');
    return;
  }

  const joinLatencies = clients.map((c) => c.metrics.joinLatency);
  const avgJoinLatency = joinLatencies.reduce((a, b) => a + b, 0) / joinLatencies.length;
  const maxJoinLatency = Math.max(...joinLatencies);
  const minJoinLatency = Math.min(...joinLatencies);

  console.log(`\n3. 加入房间延迟测试:`);
  console.log(`   平均延迟: ${avgJoinLatency.toFixed(1)}ms`);
  console.log(`   最小延迟: ${minJoinLatency}ms`);
  console.log(`   最大延迟: ${maxJoinLatency}ms`);

  await runBroadcastLatencyTest(voteId, clients);

  console.log(`\n4. 服务器状态:`);
  try {
    const healthResponse = await fetch(`${BASE_URL}/api/health`);
    const healthData = await healthResponse.json();
    console.log(`   活跃投票数: ${healthData.activeVotes}`);
    console.log(`   连接客户端数: ${healthData.connectedClients}`);
  } catch (err) {
    console.log(`   无法获取状态: ${err.message}`);
  }

  console.log(`\n5. 清理连接...`);
  clients.forEach((c) => c.ws.close());
  await sleep(500);
  console.log('   已清理');

  console.log('\n' + '='.repeat(60));
  console.log('测试总结');
  console.log('='.repeat(60));
  console.log(`并发连接数: ${clients.length}/${NUM_CLIENTS}`);
  console.log(`连接总耗时: ${connectDuration}ms`);
  console.log(`平均加入延迟: ${avgJoinLatency.toFixed(1)}ms`);
  console.log('\n前端性能监控提示:');
  console.log('  • 帧率监控: 浏览器 Performance 面板或使用 performance.now()');
  console.log('  • 内存监控: Chrome DevTools Memory 面板');
  console.log('  • 建议目标: 帧率 > 30fps, 内存 < 200MB');
  console.log('='.repeat(60));
}

runPerformanceTest().catch(console.error);
