import express from 'express';
import cors from 'cors';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  nickname: string;
  lastSeen: number;
}

interface VoteOption {
  id: string;
  text: string;
  order: number;
}

interface VoteRecord {
  userId: string;
  nickname: string;
  optionId: string;
  timestamp: number;
}

interface Vote {
  id: string;
  title: string;
  description: string;
  options: VoteOption[];
  createdBy: string;
  creatorNickname: string;
  createdAt: number;
  ended: boolean;
  records: VoteRecord[];
}

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

const users = new Map<string, User>();
const votes = new Map<string, Vote>();
const clients = new Map<string, WebSocket>();

function broadcast(data: any, exclude?: string) {
  const msg = JSON.stringify(data);
  clients.forEach((ws, id) => {
    if (id !== exclude && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  });
}

function getVotesArray(): Vote[] {
  return Array.from(votes.values()).sort((a, b) => b.createdAt - a.createdAt);
}

function getUsersArray(): User[] {
  return Array.from(users.values());
}

wss.on('connection', (ws) => {
  let userId = '';

  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data.toString());

      switch (msg.type) {
        case 'join': {
          userId = msg.userId || uuidv4();
          const user: User = {
            id: userId,
            nickname: msg.nickname,
            lastSeen: Date.now(),
          };
          users.set(userId, user);
          clients.set(userId, ws);

          ws.send(
            JSON.stringify({
              type: 'init',
              users: getUsersArray(),
              votes: getVotesArray(),
              userId,
            })
          );

          broadcast({ type: 'user_joined', user }, userId);
          break;
        }

        case 'heartbeat': {
          if (userId && users.has(userId)) {
            const user = users.get(userId)!;
            user.lastSeen = Date.now();
            users.set(userId, user);
          }
          break;
        }

        case 'create_vote': {
          const vote: Vote = {
            id: uuidv4(),
            title: msg.title,
            description: msg.description,
            options: msg.options.map((text: string, index: number) => ({
              id: uuidv4(),
              text,
              order: index,
            })),
            createdBy: userId,
            creatorNickname: users.get(userId)?.nickname || '',
            createdAt: Date.now(),
            ended: false,
            records: [],
          };
          votes.set(vote.id, vote);
          broadcast({ type: 'vote_created', vote });
          break;
        }

        case 'cast_vote': {
          const vote = votes.get(msg.voteId);
          if (!vote || vote.ended) return;

          const existingIndex = vote.records.findIndex(
            (r) => r.userId === userId
          );
          if (existingIndex >= 0) {
            vote.records[existingIndex].optionId = msg.optionId;
            vote.records[existingIndex].timestamp = Date.now();
          } else {
            vote.records.push({
              userId,
              nickname: users.get(userId)?.nickname || '',
              optionId: msg.optionId,
              timestamp: Date.now(),
            });
          }

          votes.set(vote.id, vote);
          broadcast({ type: 'vote_updated', vote });
          ws.send(JSON.stringify({ type: 'toast', message: '操作成功' }));
          break;
        }

        case 'end_vote': {
          const vote = votes.get(msg.voteId);
          if (!vote || vote.ended) return;
          if (vote.createdBy !== userId) return;

          vote.ended = true;
          votes.set(vote.id, vote);
          broadcast({ type: 'vote_ended', voteId: vote.id, vote });
          break;
        }
      }
    } catch (e) {
      console.error('Message parse error:', e);
    }
  });

  ws.on('close', () => {
    if (userId) {
      users.delete(userId);
      clients.delete(userId);
      broadcast({ type: 'user_left', userId });
    }
  });
});

setInterval(() => {
  const now = Date.now();
  const stale: string[] = [];
  users.forEach((user, id) => {
    if (now - user.lastSeen > 10000) {
      stale.push(id);
    }
  });
  stale.forEach((id) => {
    users.delete(id);
    clients.delete(id);
    broadcast({ type: 'user_left', userId: id });
  });
}, 5000);

server.listen(3001, () => {
  console.log('Server running on port 3001');
});
