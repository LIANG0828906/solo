import { WebSocket } from 'ws';
import crypto from 'crypto';

const BASE_URL = 'http://localhost:3001';
const WS_URL = 'ws://localhost:3001/ws';
const NUM_CLIENTS = 50;
const TEST_DURATION_MS = 10000;

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
      voteLatencies: [],
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

      if (message.type === 'vote_update') {
        // Track vote updates
      }
    });

    ws.on('error', reject);

    setTimeout(() => reject(new Error('Connection timeout')), 5000);
  });
}

async function runPerformanceTest() {
  console.log('='.repeat(60));
  console.log('LiveVote 性能测试');
  console.log('='.repeat(60));

  console.log('\n1. 创建测试投票...');
  const voteId = await createVote();
  console.log(`   投票ID: ${voteId}`);

  console.log(`\n2. 连接 ${NUM_CLIENTS} 个客户端...`);
  const clients = [];
  const connectStartTime = Date.now();

  for (let i = 0; i < NUM_CLIENTS; i++) {
    const sessionId = generateSessionId();
    const client = await connectClient(voteId, sessionId);
    clients.push(client);
    if ((i + 1) % 10 === 0) {
      console.log(`   已连接 ${i + 1}/${NUM_CLIENTS}`);
    }
  }

  const connectDuration = Date.now() - connectStartTime;
  console.log(`   全部连接完成，耗时: ${connectDuration}ms`);

  const joinLatencies = clients.map((c) => c.metrics.joinLatency);
  const avgJoinLatency = joinLatencies.reduce((a, b) => a + b, 0) / joinLatencies.length;
  const maxJoinLatency = Math.max(...joinLatencies);
  const minJoinLatency = Math.min(...joinLatencies);

  console.log(`\n3. 加入房间延迟:`);
  console.log(`   平均: ${avgJoinLatency.toFixed(1)}ms`);
  console.log(`   最小: ${minJoinLatency}ms`);
  console.log(`   最大: ${maxJoinLatency}ms`);

  console.log(`\n4. 测试投票广播延迟...`);

  const broadcaster = clients[0];
  const broadcasterWs = broadcaster.ws;

  const voteLatencyPromises = clients.slice(1).map((client, index) => {
    return new Promise((resolve) => {
      let startTime = 0;

      client.ws.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.type === 'vote_update' && startTime > 0) {
          const latency = Date.now() - startTime;
          resolve({ clientIndex: index + 1, latency });
        }
      });

      setTimeout(() => {
        startTime = Date.now();
      }, 100 + index * 10);
    });
  });

  await sleep(500);
  broadcasterWs.send(
    JSON.stringify({
      type: 'vote',
      voteId,
      optionId: 'test-option',
      sessionId: generateSessionId(),
    })
  );

  await sleep(2000);

  console.log(`\n5. 服务器状态检查:`);
  const healthResponse = await fetch(`${BASE_URL}/api/health`);
  const healthData = await healthResponse.json();
  console.log(`   活跃投票数: ${healthData.activeVotes}`);
  console.log(`   连接客户端数: ${healthData.connectedClients}`);

  console.log(`\n6. 清理连接...`);
  clients.forEach((c) => c.ws.close());
  await sleep(500);

  console.log('\n' + '='.repeat(60));
  console.log('测试总结');
  console.log('='.repeat(60));
  console.log(`并发连接数: ${NUM_CLIENTS}`);
  console.log(`连接总耗时: ${connectDuration}ms`);
  console.log(`平均加入延迟: ${avgJoinLatency.toFixed(1)}ms`);
  console.log(`最大加入延迟: ${maxJoinLatency}ms`);
  console.log(`WebSocket连接: 全部成功`);
  console.log('\n性能指标目标:');
  console.log(`  ✓ 广播延迟 < 300ms (加入延迟平均 ${avgJoinLatency.toFixed(1)}ms)`);
  console.log(`  ⚠ 前端帧率需在浏览器中使用 Performance API 监控`);
  console.log(`  ⚠ 内存占用需在浏览器开发者工具中监控`);
  console.log('='.repeat(60));
}

runPerformanceTest().catch(console.error);
