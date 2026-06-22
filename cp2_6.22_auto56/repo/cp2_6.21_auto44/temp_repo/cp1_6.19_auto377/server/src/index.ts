import express from 'express';
import cors from 'cors';
import { deviceRouter } from './modules/deviceModule';
import { reservationRouter } from './modules/reservationModule';

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/devices', deviceRouter);
app.use('/api/reservations', reservationRouter);

app.listen(PORT, () => {
  console.log(`\n🚀 LabLend 后端服务已启动`);
  console.log(`📍 服务器地址: http://localhost:${PORT}`);
  console.log(`📡 API 健康检查: http://localhost:${PORT}/api/health`);
  console.log(`📦 设备API: http://localhost:${PORT}/api/devices`);
  console.log(`📅 预约API: http://localhost:${PORT}/api/reservations`);
  console.log(`\n⏰ 服务启动时间: ${new Date().toLocaleString('zh-CN')}\n`);
});
