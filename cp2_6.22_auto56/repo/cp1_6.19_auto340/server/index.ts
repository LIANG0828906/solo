import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';
import {
  createFireworkParticles,
  updateParticle,
  type Particle,
  type FireworkConfig
} from '../src/utils/physicsEngine';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

let allParticles: Particle[] = [];
const canvasHeight = 1080;

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', particleCount: allParticles.length });
});

io.on('connection', (socket: Socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.emit('init', {
    clientId: socket.id,
    particles: allParticles
  });

  socket.on('createFirework', (data: { x: number; y: number; config: FireworkConfig }) => {
    const { x, y, config } = data;
    const newParticles = createFireworkParticles(x, y, config, socket.id, uuidv4);
    allParticles.push(...newParticles);
    io.emit('particlesAdded', newParticles);
  });

  socket.on('resetCanvas', () => {
    allParticles = [];
    io.emit('canvasReset');
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    allParticles = allParticles.filter((p) => p.clientId !== socket.id);
    io.emit('clientDisconnected', socket.id);
  });
});

setInterval(() => {
  if (allParticles.length === 0) return;

  const updatedParticles: Particle[] = [];
  const removedIds: string[] = [];

  for (const particle of allParticles) {
    const alive = updateParticle(particle, canvasHeight);
    if (alive) {
      updatedParticles.push(particle);
    } else {
      removedIds.push(particle.id);
    }
  }

  allParticles = updatedParticles;

  if (removedIds.length > 0) {
    io.emit('particlesRemoved', removedIds);
  }

  if (updatedParticles.length > 0) {
    const batchSize = 200;
    for (let i = 0; i < updatedParticles.length; i += batchSize) {
      const batch = updatedParticles.slice(i, i + batchSize);
      io.emit('particlesUpdated', batch);
    }
  }
}, 50);

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`Firework server running on http://localhost:${PORT}`);
});
