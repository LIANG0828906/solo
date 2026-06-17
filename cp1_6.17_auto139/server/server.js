import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

let routes = [
  {
    id: uuidv4(),
    name: '城市公园跑酷路线',
    date: '2024-01-15',
    points: [
      { x: 100, y: 200, timestamp: 1705305600000, speed: 5.2 },
      { x: 150, y: 250, timestamp: 1705305660000, speed: 6.1 },
      { x: 200, y: 300, timestamp: 1705305720000, speed: 4.8 },
      { x: 280, y: 280, timestamp: 1705305780000, speed: 7.3 },
      { x: 350, y: 350, timestamp: 1705305840000, speed: 5.9 },
      { x: 420, y: 320, timestamp: 1705305900000, speed: 6.5 },
      { x: 500, y: 400, timestamp: 1705305960000, speed: 5.7 }
    ],
    tags: [
      { id: uuidv4(), text: '起点', pointIndex: 0, x: 100, y: 200 },
      { id: uuidv4(), text: '高难度跳跃', pointIndex: 3, x: 280, y: 280 }
    ]
  },
  {
    id: uuidv4(),
    name: '老城区训练路线',
    date: '2024-02-20',
    points: [
      { x: 50, y: 450, timestamp: 1708406400000, speed: 4.5 },
      { x: 120, y: 380, timestamp: 1708406460000, speed: 5.8 },
      { x: 200, y: 350, timestamp: 1708406520000, speed: 6.2 },
      { x: 300, y: 420, timestamp: 1708406580000, speed: 5.1 },
      { x: 380, y: 360, timestamp: 1708406640000, speed: 7.0 },
      { x: 450, y: 300, timestamp: 1708406700000, speed: 6.8 }
    ],
    tags: [
      { id: uuidv4(), text: '终点', pointIndex: 5, x: 450, y: 300 }
    ]
  }
];

app.get('/api/routes', (req, res) => {
  res.json(routes);
});

app.get('/api/routes/:id', (req, res) => {
  const route = routes.find(r => r.id === req.params.id);
  if (!route) {
    return res.status(404).json({ error: '路线不存在' });
  }
  res.json(route);
});

app.post('/api/routes', (req, res) => {
  const { name, date, points = [], tags = [] } = req.body;
  if (!name) {
    return res.status(400).json({ error: '路线名称不能为空' });
  }
  const newRoute = {
    id: uuidv4(),
    name,
    date: date || new Date().toISOString().split('T')[0],
    points,
    tags
  };
  routes.push(newRoute);
  res.status(201).json(newRoute);
});

app.put('/api/routes/:id', (req, res) => {
  const routeIndex = routes.findIndex(r => r.id === req.params.id);
  if (routeIndex === -1) {
    return res.status(404).json({ error: '路线不存在' });
  }
  const { name, date, points, tags } = req.body;
  const existingRoute = routes[routeIndex];
  const updatedRoute = {
    ...existingRoute,
    name: name !== undefined ? name : existingRoute.name,
    date: date !== undefined ? date : existingRoute.date,
    points: points !== undefined ? points : existingRoute.points,
    tags: tags !== undefined ? tags : existingRoute.tags
  };
  routes[routeIndex] = updatedRoute;
  res.json(updatedRoute);
});

app.delete('/api/routes/:id', (req, res) => {
  const routeIndex = routes.findIndex(r => r.id === req.params.id);
  if (routeIndex === -1) {
    return res.status(404).json({ error: '路线不存在' });
  }
  const deletedRoute = routes.splice(routeIndex, 1)[0];
  res.json(deletedRoute);
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
