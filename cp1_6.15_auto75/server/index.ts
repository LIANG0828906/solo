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
  codingTimer?: ReturnType<typeof setInterval>;
}

interface QueueEntry {
  id: string;
  nickname: string;
  socket: Socket;
  joinedAt: number;
}

const challenges: Challenge[] = [
  {
    description: '实现一个函数 fibonacci(n)，返回第n个斐波那契数。fibonacci(0)=0, fibonacci(1)=1。',
    template: 'function fibonacci(n) {\n  // 你的代码\n}',
    testCases: [
      { input: [0], expected: 0 },
      { input: [1], expected: 1 },
      { input: [5], expected: 5 },
      { input: [10], expected: 55 },
    ],
  },
  {
    description: '实现一个函数 isPalindrome(str)，判断字符串是否为回文。',
    template: 'function isPalindrome(str) {\n  // 你的代码\n}',
    testCases: [
      { input: ['racecar'], expected: true },
      { input: ['hello'], expected: false },
      { input: ['madam'], expected: true },
      { input: [''], expected: true },
    ],
  },
  {
    description: '实现一个函数 maxSubArray(nums)，找出数组中连续子数组的最大和。',
    template: 'function maxSubArray(nums) {\n  // 你的代码\n}',
    testCases: [
      { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { input: [[1]], expected: 1 },
      { input: [[5, 4, -1, 7, 8]], expected: 23 },
    ],
  },
  {
    description: '实现一个函数 reverseString(str)，反转字符串。',
    template: 'function reverseString(str) {\n  // 你的代码\n}',
    testCases: [
      { input: ['hello'], expected: 'olleh' },
      { input: ['world'], expected: 'dlrow' },
      { input: [''], expected: '' },
      { input: ['a'], expected: 'a' },
    ],
  },
  {
    description: '实现一个函数 isPrime(n)，判断一个数是否为质数。',
    template: 'function isPrime(n) {\n  // 你的代码\n}',
    testCases: [
      { input: [2], expected: true },
      { input: [3], expected: true },
      { input: [4], expected: false },
      { input: [1], expected: false },
      { input: [17], expected: true },
    ],
  },
  {
    description: '实现一个函数 twoSum(nums, target)，找出数组中两个数的索引，使它们的和等于target。',
    template: 'function twoSum(nums, target) {\n  // 你的代码\n}',
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
const playerScores = new Map<string, number>();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', rooms: rooms.size, queue: queue.length });
});

function generateRoomId(): string {
  return 'room-' + Math.random().toString(16).slice(2, 8);
}

function createAndStartRoom(matched: QueueEntry[]): void {
  const roomId = generateRoomId();
  const players: Player[] = matched.map((entry) => ({
    id: entry.id,
    nickname: entry.nickname,
    hp: 100,
    maxHp: 100,
    score: playerScores.get(entry.id) || 0,
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

  console.log(`[Match] Room ${roomId} created with ${matched.length} players: ${matched.map(e => e.nickname).join(', ')}`);

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
        entry.socket.emit('round_start', {
          challenge: {
            description: room.challenge.description,
            template: room.challenge.template,
          },
        });
      });

      let codingTimeLeft = 30;
      const codingInterval = setInterval(() => {
        codingTimeLeft--;
        matched.forEach((entry) => {
          entry.socket.emit('coding_countdown', codingTimeLeft);
        });
        if (codingTimeLeft <= 0) {
          clearInterval(codingInterval);
          room.players.forEach((p) => {
            if (p.status === 'coding') {
              p.status = 'done';
            }
          });
          checkRoundEnd(room);
        }
      }, 1000);

      room.codingTimer = codingInterval;
      return;
    }
    matched.forEach((entry) => {
      entry.socket.emit('countdown', count);
    });
    count--;
  }, 1000);
}

function tryMatch(): void {
  if (queue.length >= 4) {
    if (matchmakingTimer) {
      clearTimeout(matchmakingTimer);
      matchmakingTimer = null;
    }
    const matched = queue.splice(0, 4);
    createAndStartRoom(matched);
    return;
  }

  if (queue.length >= 2) {
    const firstJoinedAt = queue[0].joinedAt;
    const elapsed = Date.now() - firstJoinedAt;
    const remaining = Math.max(0, 5000 - elapsed);

    if (remaining === 0) {
      if (matchmakingTimer) {
        clearTimeout(matchmakingTimer);
        matchmakingTimer = null;
      }
      const matched = queue.splice(0, queue.length);
      createAndStartRoom(matched);
    } else if (!matchmakingTimer) {
      matchmakingTimer = setTimeout(() => {
        matchmakingTimer = null;
        if (queue.length >= 2) {
          const matched = queue.splice(0, queue.length);
          createAndStartRoom(matched);
        }
      }, remaining);
    }
  }
}

function checkRoundEnd(room: Room): void {
  const alivePlayers = room.players.filter((p) => p.hp > 0);
  const allSubmitted = room.players.every(
    (p) => p.status === 'done' || p.hp <= 0,
  );

  if (alivePlayers.length <= 1 || allSubmitted) {
    room.status = 'finished';

    if (room.codingTimer) {
      clearInterval(room.codingTimer);
    }

    const rankings = [...room.players]
      .sort((a, b) => b.score - a.score || b.hp - a.hp)
      .map((p, i) => ({
        playerId: p.id,
        nickname: p.nickname,
        score: p.score,
        hp: p.hp,
        rank: i + 1,
      }));

    console.log(`[Round] Room ${room.id} ended. Rankings: ${rankings.map(r => `#${r.rank} ${r.nickname}(${r.score}pts)`).join(', ')}`);

    io.to(room.id).emit('round_end', { rankings });
  }
}

io.on('connection', (socket) => {
  console.log(`[Socket] Connected: ${socket.id}`);

  socket.on('join_queue', ({ nickname }: { nickname: string }) => {
    if (!nickname || nickname.trim().length === 0) {
      socket.emit('error', { message: 'Nickname is required' });
      return;
    }

    socketNicknames.set(socket.id, nickname.trim());
    queue.push({ id: socket.id, nickname: nickname.trim(), socket, joinedAt: Date.now() });
    console.log(`[Queue] ${nickname.trim()} joined queue. Queue size: ${queue.length}`);
    tryMatch();
  });

  socket.on(
    'submit_code',
    ({ roomId, code }: { roomId: string; code: string }) => {
      const submitStart = Date.now();
      const room = rooms.get(roomId);
      if (!room) return;

      const player = room.players.find((p) => p.id === socket.id);
      if (!player || player.status === 'done' || player.hp <= 0) return;

      player.status = 'running';
      room.submissions.set(socket.id, code);

      io.to(room.id).emit('player_status', {
        playerId: socket.id,
        status: 'running',
      });

      console.log(`[Submit] ${player.nickname} submitted code in room ${roomId}`);

      const result = CodeRunner.run(code, room.challenge.testCases);
      const execLatency = Date.now() - submitStart;

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

      socket.emit('code_result', {
        passed: result.passed,
        passedCount: result.passedCount,
        totalCount: result.totalCount,
        execTime: result.execTime,
        error: result.error,
        latency: execLatency,
      });

      io.to(room.id).emit('player_status', {
        playerId: socket.id,
        status: 'done',
      });

      console.log(`[Result] ${player.nickname}: passed=${result.passed}, execTime=${result.execTime}ms, totalLatency=${execLatency}ms, damageType=${damageType}`);

      if (damageType === 'error') {
        io.to(room.id).emit('damage', {
          fromId: socket.id,
          targetId: socket.id,
          amount: 0,
          type: 'error',
        });
      } else {
        const opponents = room.players.filter(
          (p) => p.id !== socket.id && p.hp > 0,
        );
        for (const opponent of opponents) {
          const prevHp = opponent.hp;
          opponent.hp = Math.max(0, opponent.hp - damageAmount);

          io.to(room.id).emit('damage', {
            fromId: socket.id,
            targetId: opponent.id,
            amount: damageAmount,
            type: damageType,
            prevHp,
            newHp: opponent.hp,
          });

          if (opponent.hp <= 0 && prevHp > 0) {
            player.score += 10;
            playerScores.set(player.id, player.score);
            console.log(`[Score] ${player.nickname} defeated ${opponent.nickname}. Score: ${player.score}`);
            io.to(room.id).emit('player_defeated', {
              playerId: opponent.id,
              killerId: socket.id,
            });
            io.to(room.id).emit('score_update', {
              playerId: player.id,
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

    for (const [, room] of rooms) {
      if (room.players.some((p) => p.id === socket.id)) {
        socket.leave(room.id);
      }
    }

    queue.push({ id: socket.id, nickname, socket, joinedAt: Date.now() });
    console.log(`[Queue] ${nickname} re-joined queue`);
    tryMatch();
  });

  socket.on('disconnect', () => {
    const queueIdx = queue.findIndex((p) => p.id === socket.id);
    if (queueIdx !== -1) {
      const removed = queue.splice(queueIdx, 1);
      console.log(`[Queue] ${removed[0].nickname} left queue`);
    }

    if (matchmakingTimer && queue.length < 2) {
      clearTimeout(matchmakingTimer);
      matchmakingTimer = null;
    }

    for (const [, room] of rooms) {
      const player = room.players.find((p) => p.id === socket.id);
      if (player) {
        const prevHp = player.hp;
        player.hp = 0;
        player.status = 'done';
        console.log(`[Disconnect] ${player.nickname} disconnected from room ${room.id}`);
        io.to(room.id).emit('player_defeated', {
          playerId: socket.id,
          killerId: null,
        });
        io.to(room.id).emit('damage', {
          fromId: socket.id,
          targetId: socket.id,
          amount: prevHp,
          type: 'error',
        });
        checkRoundEnd(room);
      }
    }

    socketNicknames.delete(socket.id);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`[Server] Code Battle Arena running on port ${PORT}`);
  console.log(`[Server] Matchmaking: 4 players instant match, 5s timeout for 2+ players`);
  console.log(`[Server] Sandbox: 3s execution timeout, blocked dangerous globals`);
});
