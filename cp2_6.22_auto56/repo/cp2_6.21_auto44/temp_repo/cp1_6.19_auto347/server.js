import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

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

const LEADERBOARD_FILE = join(__dirname, 'leaderboard.json');

function loadLeaderboard() {
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (e) {
    console.error('Error loading leaderboard:', e);
  }
  return [];
}

function saveLeaderboard(leaderboard) {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2), 'utf8');
  } catch (e) {
    console.error('Error saving leaderboard:', e);
  }
}

function getTopLeaderboard(leaderboard, count = 10) {
  return [...leaderboard]
    .sort((a, b) => b.score - a.score)
    .slice(0, count);
}

let leaderboard = loadLeaderboard();

io.on('connection', (socket) => {
  console.log('Player connected:', socket.id);

  socket.emit('leaderboard', getTopLeaderboard(leaderboard));

  socket.on('submitScore', (data) => {
    const { name, score } = data;

    if (!name || typeof score !== 'number' || score <= 0) {
      socket.emit('scoreSubmitted', { success: false, error: 'Invalid data' });
      return;
    }

    const entry = {
      name: name.substring(0, 20),
      score: Math.floor(score),
      date: new Date().toISOString().split('T')[0],
    };

    leaderboard.push(entry);
    leaderboard = getTopLeaderboard(leaderboard, 100);
    saveLeaderboard(leaderboard);

    const top10 = getTopLeaderboard(leaderboard);
    socket.emit('scoreSubmitted', { success: true, leaderboard: top10 });
    io.emit('leaderboard', top10);

    console.log(`Score submitted: ${name} - ${score}`);
  });

  socket.on('disconnect', () => {
    console.log('Player disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Leaderboard entries: ${leaderboard.length}`);
});
