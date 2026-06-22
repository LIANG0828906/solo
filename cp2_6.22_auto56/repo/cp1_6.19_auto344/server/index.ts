import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { HeatPoint } from '../src/types';

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;
const FLOOR_SIZE = 50;
const FLOOR_HALF = FLOOR_SIZE / 2;

function generateHeatPoints(): HeatPoint[] {
  const count = Math.floor(Math.random() * 6) + 5;
  const points: HeatPoint[] = [];

  for (let i = 0; i < count; i++) {
    const centerBias = Math.random();
    let x, z;

    if (centerBias < 0.6) {
      x = (Math.random() - 0.5) * FLOOR_SIZE * 0.6;
      z = (Math.random() - 0.5) * FLOOR_SIZE * 0.6;
    } else {
      x = (Math.random() - 0.5) * FLOOR_SIZE;
      z = (Math.random() - 0.5) * FLOOR_SIZE;
    }

    x = Math.max(-FLOOR_HALF + 2, Math.min(FLOOR_HALF - 2, x));
    z = Math.max(-FLOOR_HALF + 2, Math.min(FLOOR_HALF - 2, z));

    points.push({
      x,
      z,
      intensity: Math.random() * 0.8 + 0.2,
    });
  }

  return points;
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.emit('heatmap:update', generateHeatPoints());

  socket.on('client:connect', () => {
    console.log('Client acknowledged connection');
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

setInterval(() => {
  const points = generateHeatPoints();
  io.emit('heatmap:update', points);
  console.log('Broadcasted heatmap update with', points.length, 'points');
}, 2000);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', connectedClients: io.engine.clientsCount });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready for heatmap broadcasting`);
});
