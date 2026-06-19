import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = 5000;

const gridSize = 40;
const gridRange = 80;

const calculateHeatmapData = (pedestrians) => {
  const data = [];
  const cellSize = (gridRange * 2) / gridSize;
  
  for (let i = 0; i < gridSize; i++) {
    data[i] = [];
    for (let j = 0; j < gridSize; j++) {
      data[i][j] = 0;
    }
  }
  
  pedestrians.forEach((ped) => {
    const gridX = Math.floor((ped.x + gridRange) / cellSize);
    const gridY = Math.floor((ped.z + gridRange) / cellSize);
    
    const radius = 3;
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const nx = gridX + dx;
        const ny = gridY + dy;
        if (nx >= 0 && nx < gridSize && ny >= 0 && ny < gridSize) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist <= radius) {
            data[nx][ny] += (1 - dist / radius) * 0.5;
          }
        }
      }
    }
  });
  
  return data;
};

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.post('/api/export', (req, res) => {
  const config = req.body;
  config.exportId = uuidv4();
  config.serverProcessed = true;
  res.json({ success: true, config });
});

app.post('/api/import', (req, res) => {
  const config = req.body;
  if (!config || typeof config !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid config format' });
  }
  
  const validatedConfig = {
    ...config,
    serverValidated: true,
    validatedAt: new Date().toISOString(),
  };
  
  res.json({ success: true, config: validatedConfig });
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  
  socket.on('pedestriansUpdate', (data) => {
    const heatmapData = calculateHeatmapData(data.pedestrians || []);
    socket.broadcast.emit('heatmapUpdate', { 
      data: heatmapData,
      timestamp: Date.now(),
    });
  });
  
  socket.on('lightModeChange', (data) => {
    console.log('Light mode changed:', data.mode);
    socket.broadcast.emit('lightModeUpdate', data);
  });
  
  socket.on('attractorChange', (data) => {
    socket.broadcast.emit('attractorUpdate', data);
  });
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

setInterval(() => {
  const randomPedestrians = [];
  for (let i = 0; i < 30; i++) {
    randomPedestrians.push({
      id: `ped-${i}`,
      x: (Math.random() - 0.5) * 120,
      z: (Math.random() - 0.5) * 120,
      speed: 0.3,
    });
  }
  
  const heatmapData = calculateHeatmapData(randomPedestrians);
  io.emit('heatmapUpdate', {
    data: heatmapData,
    timestamp: Date.now(),
  });
}, 2000);

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready on ws://localhost:${PORT}`);
});
