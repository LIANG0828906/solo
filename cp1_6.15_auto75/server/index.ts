import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';
import { CodeRunner } from './CodeRunner.js';

interface TestCase {
  input: any[];
  expected: any;
}

interface Challenge {
  description: string;
  template: string;
  testCases: TestCase[];
}

interface Player {
  id: string;
  nickname: string;
  hp: number;
  maxHp: number;
  score: number;
  status: 'waiting' | 'coding' | 'running' | 'done';
}

interface Room {
  id: string;
  players: Player[];
  status: 'matching' | 'countdown' | 'coding' | 'judging' | 'finished';
  challenge: Challenge;
  submissions: Map<string, string>;
}

interface QueueEntry {
  id: string;
  nickname: string;
  socket: Socket;
  joinedAt: number;
}

const challenges: Challenge[] = [
  {
    description: 'Write a function that returns the nth Fibonacci number.',
    template: 'function fibonacci(n) {\n  \n}',
    testCases: [
      { input: [0], expected: 0 },
      { input: [1], expected: 1 },
      { input: [5], expected: 5 },
      { input: [10], expected: 55 },
    ],
  },
  {
    description: 'Write a function that checks if a string is a palindrome.',
    template: 'function isPalindrome(str) {\n  \n}',
    testCases: [
      { input: ['racecar'], expected: true },
      { input: ['hello'], expected: false },
      { input: ['madam'], expected: true },
      { input: [''], expected: true },
    ],
  },
  {
    description: 'Write a function that finds the maximum subarray sum.',
    template: 'function maxSubArray(nums) {\n  \n}',
    testCases: [
      { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { input: [[1]], expected: 1 },
      { input: [[5, 4, -1, 7, 8]], expected: 23 },
    ],
  },
  {
    description: 'Write a function that reverses a string.',
    template: 'function reverseString(str) {\n  \n}',
    testCases: [
      { input: ['hello'], expected: 'olleh' },
      { input: ['world'], expected: 'dlrow' },
      { input: [''], expected: '' },
      { input: ['a'], expected: 'a' },
    ],
  },
  {
    description: 'Write a function that returns true if a number is prime.',
    template: 'function isPrime(n) {\n  \n}',
    testCases: [
      { input: [2], expected: true },
      { input: [3], expected: true },
      { input: [4], expected: false },
      { input: [1], expected: false },
      { input: [17], expected: true },
    ],
  },
  {
    description: 'Write a function that finds two indices whose values add up to the target.',
    template: 'function twoSum(nums, target) {\n  \n}',
    testCases: [
      { input: [[2, 7, 11, 15], 9], expected: [0, 1] },
      { input: [[3, 2, 4], 6], expected: [1, 2] },
      { input: [[3, 3], 6], expected: [0, 1] },
    ],
  },
];

const rooms = new Map<string, Room>();
const queue: QueueEntry[] = [];
let matchmakingTimer: ReturnType<typeof setTimeout> | null = null;
const socketNicknames = new Map<string, string>();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

function generateRoomId(): string {
  return 'room-' + Math.random().toString(16).slice(2, 8);
}

function tryMatch(): void {
  if (queue.length < 2) return;
  if (queue.length < 4 && Date.now() - queue[0].joinedAt < 5000) return;

  if (matchmakingTimer) {
    clearTimeout(matchmakingTimer);
    matchmakingTimer = null;
  }

  const matched = queue.splice(0, queue.length);
  const roomId = generateRoomId();
  const players: Player[] = matched.map((entry) => ({
    id: entry.id,
    nickname: entry.nickname,
    hp: 100,
    maxHp: 100,
    score: 0,
    status: 'waiting' as const,
  }));

  const challenge = challenges[Math.floor(Math.random() * challenges.length)];
  const room: Room = {
    id: roomId,
    players,
    status: 'matching',
    challenge,
    submissions: new Map(),
  };

  rooms.set(roomId, room);

  matched.forEach((entry) => {
    entry.socket.join(roomId);
    entry.socket.emit('matched', { roomId, players });
  });

  room.status = 'countdown';
  let count = 15;

  const countdownInterval = setInterval(() => {
    if (count <= 0) {
      clearInterval(countdownInterval);
      room.status = 'coding';
      room.players.forEach((p) => {
        p.status = 'coding';
      });
      matched.forEach((entry) => {
        entry.socket.emit('round_start', { challenge: room.challenge });
      });
      return;
    }
    matched.forEach((entry) => {
      entry.socket.emit('countdown', count);
    });
    count--;
  }, 1000);
}

function scheduleMatchmaking(): void {
  if (queue.length >= 4) {
    tryMatch();
    return;
  }
  if (queue.length >= 2 && !matchmakingTimer) {
    const delay = Math.max(0, 5000 - (Date.now() - queue[0].joinedAt));
    matchmakingTimer = setTimeout(() => {
      matchmakingTimer = null;
      tryMatch();
    }, delay);
  }
}

function checkRoundEnd(room: Room): void {
  const alivePlayers = room.players.filter((p) => p.hp > 0);
  const allSubmitted = room.players.every(
    (p) => p.status === 'done' || p.hp <= 0,
  );

  if (alivePlayers.length <= 1 || allSubmitted) {
    room.status = 'finished';
    const rankings = [...room.players].sort(
      (a, b) => b.score - a.score || b.hp - a.hp,
    );
    io.to(room.id).emit('round_end', { rankings });
  }
}

io.on('connection', (socket) => {
  socket.on('join_queue', ({ nickname }: { nickname: string }) => {
    socketNicknames.set(socket.id, nickname);
    queue.push({ id: socket.id, nickname, socket, joinedAt: Date.now() });
    scheduleMatchmaking();
  });

  socket.on(
    'submit_code',
    async ({ roomId, code }: { roomId: string; code: string }) => {
      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.find((p) => p.id === socket.id);
      if (!player || player.status === 'done') return;

      player.status = 'running';
      room.submissions.set(socket.id, code);

      const result = await CodeRunner.run(code, room.challenge.testCases);

      let damageAmount = 0;
      let damageType: 'fast' | 'slow' | 'error';

      if (result.passed && result.execTime < 1500) {
        damageAmount = 25;
        damageType = 'fast';
      } else if (result.passed) {
        damageAmount = 10;
        damageType = 'slow';
      } else {
        damageAmount = 0;
        damageType = 'error';
      }

      player.status = 'done';

      if (damageType === 'error') {
        socket.emit('damage', {
          targetId: socket.id,
          amount: 0,
          type: 'error',
        });
      } else {
        const opponents = room.players.filter(
          (p) => p.id !== socket.id && p.hp > 0,
        );
        for (const opponent of opponents) {
          opponent.hp -= damageAmount;
          if (opponent.hp < 0) opponent.hp = 0;

          io.to(room.id).emit('damage', {
            targetId: opponent.id,
            amount: damageAmount,
            type: damageType,
            fromId: socket.id,
          });

          if (opponent.hp <= 0) {
            player.score += 10;
            io.to(room.id).emit('player_defeated', {
              playerId: opponent.id,
              killerId: socket.id,
            });
            io.to(room.id).emit('score_update', {
              playerId: socket.id,
              score: player.score,
            });
          }
        }
      }

      checkRoundEnd(room);
    },
  );

  socket.on('play_again', () => {
    const nickname = socketNicknames.get(socket.id);
    if (!nickname) return;
    queue.push({ id: socket.id, nickname, socket, joinedAt: Date.now() });
    scheduleMatchmaking();
  });

  socket.on('disconnect', () => {
    const queueIdx = queue.findIndex((p) => p.id === socket.id);
    if (queueIdx !== -1) {
      queue.splice(queueIdx, 1);
    }

    for (const [, room] of rooms) {
      const player = room.players.find((p) => p.id === socket.id);
      if (player) {
        player.hp = 0;
        player.status = 'done';
        io.to(room.id).emit('player_defeated', {
          playerId: socket.id,
          killerId: null,
        });
        checkRoundEnd(room);
      }
    }

    socketNicknames.delete(socket.id);
  });
});

httpServer.listen(3001, () => {
  console.log('Server running on port 3001');
});
