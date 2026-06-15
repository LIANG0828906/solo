import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { calculateWeightedScores, sortByRank, formatVoteResult, Vote, Option, VoteResult, Role } from '../src/utils/voteEngine.js';

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

interface Room {
  id: string;
  options: Option[];
  votes: Vote[];
  clients: Map<string, WebSocket>;
  countdown: number;
  isLocked: boolean;
  startTime: number;
}

const rooms = new Map<string, Room>();
const MAX_PARTICIPANTS = 20;

function generateShortCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function broadcast(room: Room) {
  const weightedScores = calculateWeightedScores(room.votes, room.options);
  const remainingMs = Math.max(0, room.countdown - (Date.now() - room.startTime));
  const result: VoteResult = {
    options: room.options,
    votes: room.votes,
    weightedScores,
    rankings: sortByRank(weightedScores),
    participantCount: room.votes.length,
    isLocked: room.isLocked,
    remainingTime: Math.floor(remainingMs / 1000),
  };

  const formatted = formatVoteResult(result);
  const data = JSON.stringify({ type: 'update', data: formatted });

  room.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(data);
    }
  });
}

wss.on('connection', (ws: WebSocket) => {
  let currentRoomId: string | null = null;
  let clientId: string | null = null;

  ws.on('message', (message: string) => {
    try {
      const parsed = JSON.parse(message);
      const { type, payload } = parsed;

      if (type === 'create-room') {
        const defaultOptions: Option[] = [
          { id: 'opt1', name: '选项一' },
          { id: 'opt2', name: '选项二' },
          { id: 'opt3', name: '选项三' },
          { id: 'opt4', name: '选项四' },
          { id: 'opt5', name: '选项五' },
        ];
        const roomId = generateShortCode();
        const room: Room = {
          id: roomId,
          options: defaultOptions,
          votes: [],
          clients: new Map(),
          countdown: 20 * 60 * 1000,
          isLocked: false,
          startTime: Date.now(),
        };
        rooms.set(roomId, room);
        ws.send(JSON.stringify({ type: 'room-created', data: { roomId } }));
        currentRoomId = roomId;
        clientId = `client-${Date.now()}-${Math.random()}`;
        room.clients.set(clientId, ws);
        broadcast(room);
      } else if (type === 'join-room') {
        const { roomId } = payload;
        const room = rooms.get(roomId);
        if (!room) {
          ws.send(JSON.stringify({ type: 'error', message: '房间不存在' }));
          return;
        }
        clientId = `client-${Date.now()}-${Math.random()}`;
        room.clients.set(clientId, ws);
        currentRoomId = roomId;
        broadcast(room);
      } else if (type === 'submit-vote') {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room || room.isLocked) return;
        if (room.votes.length >= MAX_PARTICIPANTS) return;

        const { name, role, scores } = payload as { name: string; role: Role; scores: Record<string, number> };
        if (!name || !role || !scores) return;

        const existingIndex = room.votes.findIndex((v) => v.name === name);
        const vote: Vote = {
          id: existingIndex >= 0 ? room.votes[existingIndex].id : `vote-${Date.now()}`,
          name,
          role,
          scores,
          timestamp: Date.now(),
        };

        if (existingIndex >= 0) {
          room.votes[existingIndex] = vote;
        } else {
          room.votes.push(vote);
        }

        broadcast(room);
      } else if (type === 'set-countdown') {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;
        const { minutes } = payload;
        room.countdown = Math.max(5, Math.min(60, minutes)) * 60 * 1000;
        room.startTime = Date.now();
        broadcast(room);
      } else if (type === 'lock-voting') {
        if (!currentRoomId) return;
        const room = rooms.get(currentRoomId);
        if (!room) return;
        room.isLocked = true;
        broadcast(room);
      }
    } catch (e) {
      console.error('Error parsing message:', e);
    }
  });

  ws.on('close', () => {
    if (currentRoomId && clientId) {
      const room = rooms.get(currentRoomId);
      if (room) {
        room.clients.delete(clientId);
      }
    }
  });
});

setInterval(() => {
  rooms.forEach((room) => {
    const elapsed = Date.now() - room.startTime;
    if (elapsed >= room.countdown && !room.isLocked) {
      room.isLocked = true;
      broadcast(room);
    } else {
      broadcast(room);
    }
  });
}, 1000);

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`WebSocket server running on port ${PORT}`);
});
