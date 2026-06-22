import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import type { Idea, User, TimerState, RoomState, VoteType } from '../shared/types';

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(cors());
app.use(express.json());

const ideas: Map<string, Idea> = new Map();
const users: Map<string, User> = new Map();

const timerState: TimerState & { intervalId: NodeJS.Timeout | null } = {
  duration: 30 * 60,
  remaining: 30 * 60,
  isRunning: false,
  isLocked: false,
  startedBy: null,
  intervalId: null,
};

const CARD_WIDTH = 280;
const CARD_HEIGHT = 200;

function getRoomState(): RoomState {
  return {
    ideas: Array.from(ideas.values()),
    users: Array.from(users.values()),
    timer: {
      duration: timerState.duration,
      remaining: timerState.remaining,
      isRunning: timerState.isRunning,
      isLocked: timerState.isLocked,
      startedBy: timerState.startedBy,
    },
  };
}

function checkCollision(
  pos: { x: number; y: number },
  excludeId?: string
): { x: number; y: number } {
  let newPos = { ...pos };
  let hasCollision = true;
  let attempts = 0;

  while (hasCollision && attempts < 50) {
    hasCollision = false;
    for (const [id, idea] of ideas) {
      if (excludeId && id === excludeId) continue;
      const dx = Math.abs(newPos.x - idea.position.x);
      const dy = Math.abs(newPos.y - idea.position.y);
      if (dx < CARD_WIDTH + 10 && dy < CARD_HEIGHT + 10) {
        hasCollision = true;
        const overlapX = CARD_WIDTH + 10 - dx;
        const overlapY = CARD_HEIGHT + 10 - dy;
        if (overlapX < overlapY) {
          newPos.x += newPos.x >= idea.position.x ? overlapX : -overlapX;
        } else {
          newPos.y += newPos.y >= idea.position.y ? overlapY : -overlapY;
        }
        break;
      }
    }
    attempts++;
  }
  return newPos;
}

function startTimer(duration: number, startedBy: string) {
  if (timerState.intervalId) {
    clearInterval(timerState.intervalId);
  }
  timerState.duration = duration;
  timerState.remaining = duration;
  timerState.isRunning = true;
  timerState.isLocked = false;
  timerState.startedBy = startedBy;

  timerState.intervalId = setInterval(() => {
    timerState.remaining--;
    if (timerState.remaining <= 0) {
      timerState.remaining = 0;
      timerState.isRunning = false;
      timerState.isLocked = true;
      if (timerState.intervalId) {
        clearInterval(timerState.intervalId);
        timerState.intervalId = null;
      }
      io.emit('room-locked');
    }
    io.emit('timer-updated', {
      duration: timerState.duration,
      remaining: timerState.remaining,
      isRunning: timerState.isRunning,
      isLocked: timerState.isLocked,
    });
  }, 1000);
}

app.get('/api/ideas', (_req, res) => {
  res.json({ ideas: Array.from(ideas.values()) });
});

app.get('/api/state', (_req, res) => {
  res.json(getRoomState());
});

app.post('/api/ideas', (req, res) => {
  const { content, author, authorId } = req.body;
  if (!content || content.length < 10 || content.length > 200) {
    return res.status(400).json({ error: '内容长度需在10-200字之间' });
  }
  if (!author || author.length < 2 || author.length > 10) {
    return res.status(400).json({ error: '昵称长度需在2-10字符之间' });
  }

  const now = new Date();
  const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
    now.getMinutes()
  ).padStart(2, '0')}`;

  const basePosition = {
    x: 50 + Math.random() * 200,
    y: 50 + Math.random() * 200,
  };
  const position = checkCollision(basePosition);

  const idea: Idea = {
    id: uuidv4(),
    content,
    author,
    authorId,
    createdAt: timeStr,
    upvotes: 0,
    downvotes: 0,
    votes: {},
    position,
  };
  ideas.set(idea.id, idea);
  io.emit('idea-created', idea);
  res.json(idea);
});

app.delete('/api/ideas/:id', (req, res) => {
  const { id } = req.params;
  if (ideas.has(id)) {
    ideas.delete(id);
    io.emit('idea-deleted', { ideaId: id });
    res.json({ success: true });
  } else {
    res.status(404).json({ error: '想法不存在' });
  }
});

io.on('connection', (socket) => {
  socket.on('join-room', ({ nickname }: { nickname: string }) => {
    if (!nickname || nickname.length < 2 || nickname.length > 10) {
      socket.emit('error', { message: '昵称长度需在2-10字符之间' });
      return;
    }

    const isFirst = users.size === 0;
    const user: User = {
      id: uuidv4(),
      nickname,
      socketId: socket.id,
      isFirst,
    };
    users.set(user.id, user);

    socket.emit('state-sync', getRoomState());
    socket.emit('user-joined-self', { user });

    io.emit('user-joined', { user, users: Array.from(users.values()) });
  });

  socket.on('create-idea', ({ content, position }: { content: string; position: { x: number; y: number } }) => {
    if (timerState.isLocked) return;
    const user = Array.from(users.values()).find((u) => u.socketId === socket.id);
    if (!user) return;
    if (!content || content.length < 10 || content.length > 200) return;

    const now = new Date();
    const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;

    const safePosition = checkCollision(position);

    const idea: Idea = {
      id: uuidv4(),
      content,
      author: user.nickname,
      authorId: user.id,
      createdAt: timeStr,
      upvotes: 0,
      downvotes: 0,
      votes: {},
      position: safePosition,
    };
    ideas.set(idea.id, idea);
    io.emit('idea-created', idea);
  });

  socket.on('delete-idea', ({ ideaId }: { ideaId: string }) => {
    if (timerState.isLocked) return;
    const user = Array.from(users.values()).find((u) => u.socketId === socket.id);
    if (!user) return;
    const idea = ideas.get(ideaId);
    if (!idea) return;
    if (idea.authorId !== user.id) return;

    ideas.delete(ideaId);
    io.emit('idea-deleted', { ideaId });
  });

  socket.on(
    'vote',
    ({ ideaId, voteType }: { ideaId: string; voteType: VoteType }) => {
      if (timerState.isLocked) return;
      const user = Array.from(users.values()).find((u) => u.socketId === socket.id);
      if (!user) return;
      const idea = ideas.get(ideaId);
      if (!idea) return;

      const prevVote = idea.votes[user.id] || null;
      if (prevVote === voteType) return;

      if (prevVote === 'up') idea.upvotes = Math.max(0, idea.upvotes - 1);
      if (prevVote === 'down') idea.downvotes = Math.max(0, idea.downvotes - 1);

      if (voteType === 'up') idea.upvotes++;
      if (voteType === 'down') idea.downvotes++;

      idea.votes[user.id] = voteType;

      io.emit('vote-updated', {
        ideaId,
        upvotes: idea.upvotes,
        downvotes: idea.downvotes,
        votes: idea.votes,
      });
    }
  );

  socket.on(
    'drag-idea',
    ({ ideaId, position }: { ideaId: string; position: { x: number; y: number } }) => {
      if (timerState.isLocked) return;
      const idea = ideas.get(ideaId);
      if (!idea) return;

      const safePosition = checkCollision(position, ideaId);
      idea.position = safePosition;

      socket.broadcast.emit('idea-dragged', {
        ideaId,
        position: safePosition,
      });
    }
  );

  socket.on('start-timer', ({ duration }: { duration: number }) => {
    const user = Array.from(users.values()).find((u) => u.socketId === socket.id);
    if (!user || !user.isFirst) return;
    startTimer(duration, user.id);
    io.emit('timer-updated', {
      duration: timerState.duration,
      remaining: timerState.remaining,
      isRunning: timerState.isRunning,
      isLocked: timerState.isLocked,
    });
  });

  socket.on('stop-timer', () => {
    const user = Array.from(users.values()).find((u) => u.socketId === socket.id);
    if (!user || !user.isFirst) return;
    if (timerState.intervalId) {
      clearInterval(timerState.intervalId);
      timerState.intervalId = null;
    }
    timerState.isRunning = false;
    io.emit('timer-updated', {
      duration: timerState.duration,
      remaining: timerState.remaining,
      isRunning: timerState.isRunning,
      isLocked: timerState.isLocked,
    });
  });

  socket.on('reset-timer', () => {
    const user = Array.from(users.values()).find((u) => u.socketId === socket.id);
    if (!user || !user.isFirst) return;
    if (timerState.intervalId) {
      clearInterval(timerState.intervalId);
      timerState.intervalId = null;
    }
    timerState.remaining = timerState.duration;
    timerState.isRunning = false;
    timerState.isLocked = false;
    timerState.startedBy = null;
    io.emit('timer-updated', {
      duration: timerState.duration,
      remaining: timerState.remaining,
      isRunning: timerState.isRunning,
      isLocked: timerState.isLocked,
    });
  });

  socket.on('disconnect', () => {
    let disconnectedUser: User | undefined;
    for (const [id, user] of users) {
      if (user.socketId === socket.id) {
        disconnectedUser = user;
        users.delete(id);
        break;
      }
    }
    if (disconnectedUser) {
      io.emit('user-left', {
        userId: disconnectedUser.id,
        users: Array.from(users.values()),
      });
    }
  });
});

const PORT = process.env.PORT || 4000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
