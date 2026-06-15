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
  roundStartTime: number;
}

interface QueueEntry {
  id: string;
  nickname: string;
  socket: Socket;
  joinedAt: number;
}

const challenges: Challenge[] = [
  {
    description: '实现一个函数 solution(n)，返回第n个斐波那契数。规则：solution(0)=0, solution(1)=1。',
    template: 'function solution(n) {\n  // 返回第n个斐波那契数\n  // solution(0)=0, solution(1)=1\n  return 0;\n}',
    testCases: [
      { input: [0], expected: 0 },
      { input: [1], expected: 1 },
      { input: [5], expected: 5 },
      { input: [10], expected: 55 },
    ],
  },
  {
    description: '实现一个函数 solution(str)，判断字符串是否为回文（正反读一样）。',
    template: 'function solution(str) {\n  // 判断字符串是否为回文\n  return true;\n}',
    testCases: [
      { input: ['racecar'], expected: true },
      { input: ['hello'], expected: false },
      { input: ['madam'], expected: true },
      { input: [''], expected: true },
    ],
  },
  {
    description: '实现一个函数 solution(nums)，找出数组中连续子数组的最大和。',
    template: 'function solution(nums) {\n  // 返回连续子数组的最大和\n  return 0;\n}',
    testCases: [
      { input: [[-2, 1, -3, 4, -1, 2, 1, -5, 4]], expected: 6 },
      { input: [[1]], expected: 1 },
      { input: [[5, 4, -1, 7, 8]], expected: 23 },
    ],
  },
  {
    description: '实现一个函数 solution(str)，反转字符串并返回结果。',
    template: 'function solution(str) {\n  // 返回反转后的字符串\n  return "";\n}',
    testCases: [
      { input: ['hello'], expected: 'olleh' },
      { input: ['world'], expected: 'dlrow' },
      { input: [''], expected: '' },
      { input: ['a'], expected: 'a' },
    ],
  },
  {
    description: '实现一个函数 solution(n)，判断一个正整数是否为质数。',
    template: 'function solution(n) {\n  // 判断是否为质数\n  return false;\n}',
    testCases: [
      { input: [2], expected: true },
      { input: [3], expected: true },
      { input: [4], expected: false },
      { input: [1], expected: false },
      { input: [17], expected: true },
    ],
  },
  {
    description: '实现一个函数 solution(nums, target)，返回数组中和等于target的两个数的索引数组。',
    template: 'function solution(nums, target) {\n  // 返回两个索引的数组 [i, j]\n  // nums[i] + nums[j] = target\n  return [0, 0];\n}',
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
let perfCounter = { totalMatches: 0, totalSubmissions: 0, totalRoundTime: 0, totalCodeLatency: 0 };

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    rooms: rooms.size,
    queue: queue.length,
    matches: perfCounter.totalMatches,
    submissions: perfCounter.totalSubmissions,
    avgCodeLatencyMs: perfCounter.totalSubmissions > 0 ? Math.round(perfCounter.totalCodeLatency / perfCounter.totalSubmissions) : 0,
  });
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
    roundStartTime: Date.now(),
  };

  rooms.set(roomId, room);

  matched.forEach((entry) => {
    entry.socket.join(roomId);
    entry.socket.emit('matched', { roomId, players });
  });

  console.log(`[Match][${perfCounter.totalMatches}] ✅ Room ${roomId} created with ${matched.length} players: ${matched.map(e => e.nickname).join(', ')}`);

  room.status = 'countdown';
  let count = 15;

  const countdownInterval = setInterval(() => {
    if (count <= 0) {
      clearInterval(countdownInterval);
      room.status = 'coding';
      room.roundStartTime = Date.now();
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
    console.log(`[Match] 🎯 Instant match! Queue reached 4 players`);
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
      console.log(`[Match] ⏱ 5s timeout match with ${matched.length} players`);
      createAndStartRoom(matched);
    } else if (!matchmakingTimer) {
      console.log(`[Match] ⌛ Starting ${remaining}ms countdown timer for ${queue.length} players`);
      matchmakingTimer = setTimeout(() => {
        matchmakingTimer = null;
        if (queue.length >= 2) {
          const matched = queue.splice(0, queue.length);
          console.log(`[Match] ⏰ Timer fired, matching ${matched.length} players`);
          createAndStartRoom(matched);
        } else if (queue.length === 1) {
          console.log(`[Match] ⚠ Timer fired but only 1 player in queue, waiting...`);
          const entry = queue[0];
          entry.socket.emit('queue_status', { status: 'waiting', message: '等待更多玩家加入...', queueSize: 1 });
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

    const roundDuration = Date.now() - room.roundStartTime;
    perfCounter.totalRoundTime += roundDuration;

    const rankings = [...room.players]
      .sort((a, b) => b.score - a.score || b.hp - a.hp)
      .map((p, i) => ({
        playerId: p.id,
        nickname: p.nickname,
        score: p.score,
        hp: p.hp,
        rank: i + 1,
      }));

    console.log(`[Round] 🏁 Room ${room.id} ended after ${roundDuration}ms. Queue: ${queue.length}`);
    rankings.forEach((r) => {
      console.log(`  #${r.rank} ${r.nickname}: ${r.score}pts (HP:${r.hp})`);
    });

    perfCounter.totalMatches++;

    io.to(room.id).emit('round_end', { rankings });
  }
}

io.on('connection', (socket) => {
  const connectTime = Date.now();
  console.log(`[Socket] 🔌 Connected: ${socket.id} (${socket.handshake.address})`);

  socket.on('join_queue', ({ nickname }: { nickname: string }) => {
    if (!nickname || nickname.trim().length === 0) {
      socket.emit('error', { message: 'Nickname is required' });
      return;
    }

    const cleanName = nickname.trim().slice(0, 16);
    socketNicknames.set(socket.id, cleanName);
    queue.push({ id: socket.id, nickname: cleanName, socket, joinedAt: Date.now() });
    console.log(`[Queue] ➕ ${cleanName} joined queue. Size: ${queue.length}`);

    socket.emit('queue_status', { status: 'queued', queueSize: queue.length });

    if (queue.length === 1) {
      console.log(`[Queue] 👤 First player in queue, starting 5s countdown timer`);
    }

    tryMatch();
  });

  socket.on(
    'submit_code',
    ({ roomId, code }: { roomId: string; code: string }) => {
      perfCounter.totalSubmissions++;
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

      console.log(`[Submit] 📝 ${player.nickname} in room ${roomId} (${code.length} chars)`);

      const result = CodeRunner.run(code, room.challenge.testCases);
      const execLatency = Date.now() - submitStart;
      perfCounter.totalCodeLatency += execLatency;

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

      const statusEmoji = result.passed ? '✅' : '❌';
      const latencyFlag = execLatency > 2000 ? ' ⚠ SLOW!' : '';
      console.log(`[Result] ${statusEmoji} ${player.nickname}: passed=${result.passedCount}/${result.totalCount}, exec=${result.execTime}ms, total=${execLatency}ms, type=${damageType}, dmg=${damageAmount}${latencyFlag}`);

      if (execLatency > 2000) {
        console.warn(`[Perf] ⚠ submit->result=${execLatency}ms exceeds 2s SLA! Player: ${player.nickname}`);
      }

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
            console.log(`[Score] ⚔ ${player.nickname} DEFEATED ${opponent.nickname}! +10pts → ${player.score}`);
            io.to(room.id).emit('player_defeated', {
              playerId: opponent.id,
              killerId: socket.id,
            });
            io.to(room.id).emit('score_update', {
              playerId: player.id,
              score: player.score,
              delta: 10,
              defeated: opponent.nickname,
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
    console.log(`[Queue] 🔁 ${nickname} re-joined queue. Size: ${queue.length}`);
    socket.emit('queue_status', { status: 'queued', queueSize: queue.length });
    tryMatch();
  });

  socket.on('disconnect', () => {
    const sessionTime = Date.now() - connectTime;
    const queueIdx = queue.findIndex((p) => p.id === socket.id);
    if (queueIdx !== -1) {
      const removed = queue.splice(queueIdx, 1);
      console.log(`[Queue] ➖ ${removed[0].nickname} left queue (session: ${sessionTime}ms)`);
    }

    if (matchmakingTimer && queue.length < 2) {
      clearTimeout(matchmakingTimer);
      matchmakingTimer = null;
      console.log(`[Match] ⏸ Cancelled timer, only ${queue.length} players left in queue`);
    }

    for (const [, room] of rooms) {
      const player = room.players.find((p) => p.id === socket.id);
      if (player) {
        const prevHp = player.hp;
        player.hp = 0;
        player.status = 'done';
        console.log(`[Disconnect] 💀 ${player.nickname} left room ${room.id} after ${sessionTime}ms`);
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
    console.log(`[Socket] 👋 Disconnected: ${socket.id} (session: ${sessionTime}ms)`);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════════════════╗`);
  console.log(`║  🎮 CODE BATTLE ARENA SERVER                                ║`);
  console.log(`╠══════════════════════════════════════════════════════════════╣`);
  console.log(`║  📡 Port:       ${PORT}                                        ║`);
  console.log(`║  👥 Match:      4人立即匹配 / 5秒超时 ≥2人开始                 ║`);
  console.log(`║  ⏱ Sandbox:    3秒超时 / 严格白名单模式                        ║`);
  console.log(`║  🎯 SLA:       提交→结果 ≤2000ms                             ║`);
  console.log(`╚══════════════════════════════════════════════════════════════╝\n`);
});
