import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import inspectionsRouter from './routes/inspections.js';
import ordersRouter from './routes/orders.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

app.use('/api/inspections', inspectionsRouter);
app.use('/api/orders', ordersRouter);

app.get('/api/devices', (req, res) => {
  const { search } = req.query;
  let devices = [
    { id: 'DEV001', name: '1号车间数控机床A-001' },
    { id: 'DEV002', name: '2号车间注塑机B-002' },
    { id: 'DEV003', name: '3号车间空压机C-003' },
    { id: 'DEV004', name: '4号车间输送带D-004' },
    { id: 'DEV005', name: '5号车间冷却塔E-005' },
    { id: 'DEV006', name: '6号车间发电机F-006' },
    { id: 'DEV007', name: '7号车间锅炉G-007' },
    { id: 'DEV008', name: '8号车间液压机H-008' },
  ];
  if (search) {
    devices = devices.filter((d) =>
      d.name.toLowerCase().includes(String(search).toLowerCase())
    );
  }
  res.json(devices);
});

app.get('/api/users', (req, res) => {
  const users = [
    { id: 'U001', name: '张工程师', role: 'engineer' },
    { id: 'U002', name: '李技术员', role: 'engineer' },
    { id: 'U003', name: '王维修师', role: 'engineer' },
    { id: 'U004', name: '赵巡检员', role: 'inspector' },
    { id: 'U005', name: '孙管理', role: 'manager' },
  ];
  res.json(users);
});

app.listen(PORT, () => {
  console.log(`后端服务器运行在 http://localhost:${PORT}`);
});
