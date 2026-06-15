import express from 'express';
import http from 'http';
import cors from 'cors';
import routes from './routes';
import { createWebSocketServer, broadcast } from './wsHandler';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const server = http.createServer(app);
const wss = createWebSocketServer(server);

wss.broadcast = broadcast;

app.set('wss', wss);

server.listen(PORT, () => {
  console.log(`
  🚀 活动签到互动平台已启动
  
  后端服务: http://localhost:${PORT}
  前端服务: http://localhost:5173
  
  API 文档:
    POST /api/events          - 创建活动
    GET  /api/events/:id      - 获取活动信息
    POST /api/attendance      - 签到
    GET  /api/events/:id/attendance - 获取签到记录
    GET  /api/events/:id/stats      - 获取统计数据
  
  WebSocket: ws://localhost:${PORT}/ws?eventId=<eventId>
  `);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

export default app;
