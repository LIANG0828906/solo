import { createServer } from 'http';
import { Server } from 'socket.io';
import app from './app.js';
import { setIO, addOnlineUser, removeOnlineUser } from './socket.js';
import type { OnlineUser } from '../shared/types.js';

const PORT = 3001;

const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

setIO(io);

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('user:join', (data: { name: string }) => {
    const user: OnlineUser = {
      id: socket.id,
      name: data.name,
      connectedAt: new Date().toISOString(),
    };
    addOnlineUser(user);
    io.emit('user:joined', user);
    console.log(`User joined: ${data.name}`);
  });

  socket.on('disconnect', () => {
    const left = removeOnlineUser(socket.id);
    if (left) {
      io.emit('user:left', { id: left.id });
      console.log(`User left: ${left.name}`);
    }
    console.log('Client disconnected:', socket.id);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  io.close();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  io.close();
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
