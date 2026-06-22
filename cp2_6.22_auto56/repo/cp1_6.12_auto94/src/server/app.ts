import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import ideasRouter from './routes/ideas';
import voteRouter from './routes/vote';
import { addUser, removeUser, getTeamState } from './store/teamStore';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
  },
});

app.set('io', io);
app.use(cors());
app.use(express.json());

app.use('/api/ideas', ideasRouter);
app.use('/api/vote', voteRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-team', ({ teamName, nickname, color, userId }) => {
    socket.join(teamName);
    console.log(`User ${nickname} joined team ${teamName}`);

    const user = addUser(teamName, {
      id: userId,
      nickname,
      color,
      teamName,
    });

    const state = getTeamState(teamName);
    socket.emit('team-state', {
      cards: state.cards,
      groups: state.groups,
      users: state.users,
      votingActive: state.votingActive,
      votingRound: state.votingRound,
    });

    socket.to(teamName).emit('user:joined', user);
  });

  socket.on('leave-team', ({ teamName, userId }) => {
    socket.leave(teamName);
    removeUser(teamName, userId);
    socket.to(teamName).emit('user:left', userId);
    console.log(`User ${userId} left team ${teamName}`);
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
