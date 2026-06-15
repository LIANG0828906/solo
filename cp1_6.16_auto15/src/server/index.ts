import express from 'express';
import http from 'http';
import net from 'net';
import cors from 'cors';
import routes from './routes';
import { createWebSocketServer, broadcast } from './wsHandler';

const app = express();
const START_PORT = parseInt(process.env.PORT || '3001');
const MAX_PORT_TRIES = 20;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const findAvailablePort = (startPort: number, maxTries: number): Promise<number> => {
  return new Promise((resolve, reject) => {
    let port = startPort;
    let tries = 0;

    const checkPort = () => {
      const server = net.createServer();
      
      server.once('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE' && tries < maxTries) {
          tries++;
          port++;
          console.log(`端口 ${port - 1} 被占用，尝试端口 ${port}...`);
          checkPort();
        } else {
          reject(err);
        }
      });

      server.once('listening', () => {
        server.close();
        resolve(port);
      });

      server.listen(port);
    };

    checkPort();
  });
};

const startServer = async () => {
  try {
    const PORT = await findAvailablePort(START_PORT, MAX_PORT_TRIES);

    const server = http.createServer(app);
    const wss = createWebSocketServer(server);

    wss.broadcast = broadcast;

    app.set('wss', wss);

    server.listen(PORT, () => {
      console.log(`
  🚀 活动签到互动平台已启动
  
  后端服务: http://localhost:${PORT}
  前端服务: http://localhost:5173 (或自动分配端口)
  
  API 文档:
    POST /api/events          - 创建活动
    GET  /api/events/:id      - 获取活动信息
    POST /api/attendance      - 签到
    GET  /api/events/:id/attendance - 获取签到记录
    GET  /api/events/:id/stats      - 获取统计数据
  
  WebSocket: ws://localhost:${PORT}/ws?eventId=<eventId>

  ✅ 健康检查: http://localhost:${PORT}/health
      `);
    });

    let healthCheckTries = 0;
    const healthCheckInterval = setInterval(async () => {
      try {
        const res = await fetch(`http://localhost:${PORT}/health`);
        if (res.ok) {
          const data = await res.json();
          console.log(`✅ 健康检查通过: ${data.status}`);
          clearInterval(healthCheckInterval);
        }
      } catch (e) {
        healthCheckTries++;
        if (healthCheckTries >= 5) {
          console.warn('⚠️  健康检查多次失败，请检查服务状态');
          clearInterval(healthCheckInterval);
        }
      }
    }, 1000);

  } catch (error) {
    console.error('❌ 启动服务器失败:', error);
    process.exit(1);
  }
};

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

startServer();

export default app;
