import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import type {
  PlayerStats,
  GameResult,
  LeaderboardEntry,
  LeaderboardCategory,
  UnlockNotification,
} from '../src/types';
import {
  createInitialStats,
  applyGameResult,
  checkBadgeUnlocks,
  getBadgeById,
  generatePlayerName,
  generatePlayerId,
  generateGameResult,
} from './gameLogic';

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const players = new Map<string, PlayerStats>();
let lastBroadcast = 0;
const BROADCAST_THROTTLE_MS = 200;

function getLeaderboard(category: LeaderboardCategory, selfId?: string): LeaderboardEntry[] {
  const entries: LeaderboardEntry[] = [];

  for (const stats of players.values()) {
    let value = 0;
    switch (category) {
      case 'kills':
        value = stats.totalKills;
        break;
      case 'survival':
        value = stats.totalSurvivalTime;
        break;
      case 'winStreak':
        value = stats.maxWinStreak;
        break;
    }
    entries.push({
      playerId: stats.playerId,
      playerName: stats.playerName,
      value,
      rank: 0,
      isSelf: stats.playerId === selfId,
    });
  }

  entries.sort((a, b) => b.value - a.value);
  entries.forEach((e, i) => (e.rank = i + 1));

  return entries.slice(0, 20);
}

function broadcastLeaderboards() {
  const now = Date.now();
  if (now - lastBroadcast < BROADCAST_THROTTLE_MS) return;
  lastBroadcast = now;

  const kills = getLeaderboard('kills');
  const survival = getLeaderboard('survival');
  const winStreak = getLeaderboard('winStreak');

  io.emit('leaderboard:update', {
    kills,
    survival,
    winStreak,
  });
}

function broadcastPlayerUpdate(playerId: string) {
  const stats = players.get(playerId);
  if (!stats) return;
  io.emit('player:update', { playerId, stats });
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('player:register', (data: { playerName?: string }) => {
    const playerId = generatePlayerId();
    const playerName = data?.playerName || generatePlayerName();
    const stats = createInitialStats(playerId, playerName);
    players.set(playerId, stats);

    socket.data.playerId = playerId;

    socket.emit('player:registered', { playerId, playerName, stats });

    const kills = getLeaderboard('kills', playerId);
    const survival = getLeaderboard('survival', playerId);
    const winStreak = getLeaderboard('winStreak', playerId);

    socket.emit('leaderboard:update', { kills, survival, winStreak });
  });

  socket.on('game:submit', (result: GameResult) => {
    let stats = players.get(result.playerId);
    if (!stats) {
      stats = createInitialStats(result.playerId, result.playerName);
    }

    stats = applyGameResult(stats, result);

    const newBadges = checkBadgeUnlocks(stats);
    if (newBadges.length > 0) {
      stats.unlockedBadges = [...stats.unlockedBadges, ...newBadges];

      for (const badgeId of newBadges) {
        const badge = getBadgeById(badgeId);
        if (badge) {
          const notification: UnlockNotification = {
            playerId: stats.playerId,
            playerName: stats.playerName,
            badgeId,
            badgeName: badge.name,
            tier: badge.tier,
          };
          io.emit('badge:unlocked', notification);
        }
      }
    }

    players.set(result.playerId, stats);

    socket.emit('player:stats', stats);
    broadcastLeaderboards();
    broadcastPlayerUpdate(result.playerId);
  });

  socket.on('player:get', (playerId: string) => {
    const stats = players.get(playerId);
    if (stats) {
      socket.emit('player:stats', stats);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

setInterval(() => {
  if (players.size < 15) {
    const botId = generatePlayerId();
    const botName = generatePlayerName();
    const stats = createInitialStats(botId, botName);

    const gamesPlayed = Math.floor(Math.random() * 10) + 2;
    let currentStats = stats;
    for (let i = 0; i < gamesPlayed; i++) {
      const result = generateGameResult(botId, botName);
      currentStats = applyGameResult(currentStats, result);
    }
    currentStats.unlockedBadges = checkBadgeUnlocks(currentStats);
    players.set(botId, currentStats);
    broadcastLeaderboards();
  }
}, 5000);

setInterval(() => {
  const playerArray = Array.from(players.values());
  if (playerArray.length > 0) {
    const randomPlayer = playerArray[Math.floor(Math.random() * playerArray.length)];
    const result = generateGameResult(randomPlayer.playerId, randomPlayer.playerName);
    let stats = players.get(randomPlayer.playerId)!;
    stats = applyGameResult(stats, result);

    const newBadges = checkBadgeUnlocks(stats);
    if (newBadges.length > 0) {
      stats.unlockedBadges = [...stats.unlockedBadges, ...newBadges];
      for (const badgeId of newBadges) {
        const badge = getBadgeById(badgeId);
        if (badge) {
          io.emit('badge:unlocked', {
            playerId: stats.playerId,
            playerName: stats.playerName,
            badgeId,
            badgeName: badge.name,
            tier: badge.tier,
          });
        }
      }
    }

    players.set(randomPlayer.playerId, stats);
    broadcastLeaderboards();
    broadcastPlayerUpdate(randomPlayer.playerId);
  }
}, 3000);

const PORT = process.env.PORT || 3002;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export { app, server, io };
