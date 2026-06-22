import express, { Express, Request, Response } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app: Express = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

interface TankState {
  tankId: string;
  state: any;
  lastUpdate: number;
}

const activeTanks = new Map<string, TankState>();

interface Subscription {
  tankId: string;
  socketId: string;
}

const subscriptions: Subscription[] = [];

app.get('/', (_req: Request, res: Response) => {
  res.json({
    message: 'MicroEcoTank Server',
    activeTanks: activeTanks.size,
    connectedClients: io.engine.clientsCount,
  });
});

app.get('/api/tanks', (_req: Request, res: Response) => {
  const tanks = Array.from(activeTanks.entries()).map(([tankId, data]) => ({
    tankId,
    lastUpdate: data.lastUpdate,
    creatureCount: data.state.creatures?.length || 0,
  }));
  res.json(tanks);
});

io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);

  socket.on('subscribe', ({ tankId }: { tankId: string }) => {
    subscriptions.push({ tankId, socketId: socket.id });
    socket.join(tankId);
    console.log(`Socket ${socket.id} subscribed to tank ${tankId}`);

    const tank = activeTanks.get(tankId);
    if (tank) {
      socket.emit('state-update', { tankId, state: tank.state });
    }
  });

  socket.on('unsubscribe', ({ tankId }: { tankId: string }) => {
    const idx = subscriptions.findIndex(
      (s) => s.tankId === tankId && s.socketId === socket.id
    );
    if (idx !== -1) {
      subscriptions.splice(idx, 1);
    }
    socket.leave(tankId);
    console.log(`Socket ${socket.id} unsubscribed from tank ${tankId}`);
  });

  socket.on('state-update', ({ tankId, state }: { tankId: string; state: any }) => {
    activeTanks.set(tankId, {
      tankId,
      state,
      lastUpdate: Date.now(),
    });
    socket.to(tankId).emit('state-update', { tankId, state });
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
    const toRemove = subscriptions.filter((s) => s.socketId === socket.id);
    toRemove.forEach((s) => socket.leave(s.tankId));
    for (let i = subscriptions.length - 1; i >= 0; i--) {
      if (subscriptions[i].socketId === socket.id) {
        subscriptions.splice(i, 1);
      }
    }
  });
});

const PORT = process.env.PORT || 3001;

setInterval(() => {
  const now = Date.now();
  for (const [tankId, tank] of activeTanks.entries()) {
    if (now - tank.lastUpdate > 30000) {
      activeTanks.delete(tankId);
      console.log(`Removed inactive tank: ${tankId}`);
    }
  }
}, 10000);

server.listen(PORT, () => {
  console.log(`⚡ MicroEcoTank Server running on port ${PORT}`);
  console.log(`   WebSocket ready for state synchronization`);
});
