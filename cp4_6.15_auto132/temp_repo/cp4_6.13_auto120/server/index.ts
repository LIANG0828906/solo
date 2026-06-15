import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface VoteOption {
  id: string;
  text: string;
  votes: number;
}

interface Vote {
  id: string;
  title: string;
  options: VoteOption[];
  createdAt: number;
  totalVotes: number;
  voters: Set<string>;
  voterOptions: Map<string, string>;
}

interface VoteHistoryItem {
  id: string;
  title: string;
  createdAt: number;
  totalVotes: number;
}

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

const votes = new Map<string, Vote>();
const clientRooms = new Map<WebSocket, string>();

app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', activeVotes: votes.size, connectedClients: wss.clients.size });
});

app.post('/api/votes', (req, res) => {
  const { title, options: optionTexts } = req.body;

  if (!title || typeof title !== 'string' || title.trim().length === 0) {
    return res.status(400).json({ message: '投票标题不能为空', code: 'INVALID_TITLE' });
  }

  if (!Array.isArray(optionTexts) || optionTexts.length < 2 || optionTexts.length > 8) {
    return res.status(400).json({ message: '选项数量必须在 2-8 个之间', code: 'INVALID_OPTIONS' });
  }

  const validOptions = optionTexts.filter((opt) => typeof opt === 'string' && opt.trim().length > 0);
  if (validOptions.length < 2) {
    return res.status(400).json({ message: '至少需要 2 个有效选项', code: 'INVALID_OPTIONS' });
  }

  const voteId = uuidv4();
  const options: VoteOption[] = validOptions.map((text) => ({
    id: uuidv4(),
    text: text.trim(),
    votes: 0,
  }));

  const vote: Vote = {
    id: voteId,
    title: title.trim(),
    options,
    createdAt: Date.now(),
    totalVotes: 0,
    voters: new Set(),
    voterOptions: new Map(),
  };

  votes.set(voteId, vote);

  res.status(201).json({ voteId });
});

app.get('/api/votes/:voteId', (req, res) => {
  const { voteId } = req.params;
  const vote = votes.get(voteId);

  if (!vote) {
    return res.status(404).json({ message: '投票不存在', code: 'NOT_FOUND' });
  }

  const { sessionId } = req.query;
  const hasVoted = typeof sessionId === 'string' && vote.voters.has(sessionId);
  const votedOptionId = typeof sessionId === 'string' ? vote.voterOptions.get(sessionId) || null : null;

  res.json({
    vote: {
      id: vote.id,
      title: vote.title,
      options: vote.options,
      createdAt: vote.createdAt,
      totalVotes: vote.totalVotes,
    },
    hasVoted,
    votedOptionId,
  });
});

app.get('/api/history', (req, res) => {
  const history: VoteHistoryItem[] = Array.from(votes.values())
    .sort((a, b) => b.createdAt - a.createdAt)
    .map((vote) => ({
      id: vote.id,
      title: vote.title,
      createdAt: vote.createdAt,
      totalVotes: vote.totalVotes,
    }));

  res.json({ history });
});

function getClientIdentifier(ws: WebSocket, sessionId?: string): string {
  if (sessionId) {
    return sessionId;
  }
  const remoteAddress = (ws as any)._socket?.remoteAddress || 'unknown';
  const userAgent = (ws as any).upgradeReq?.headers['user-agent'] || 'unknown';
  return `${remoteAddress}-${userAgent}`;
}

function broadcastVoteUpdate(vote: Vote) {
  const message = JSON.stringify({
    type: 'vote_update',
    voteId: vote.id,
    options: vote.options,
    totalVotes: vote.totalVotes,
  });

  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN && clientRooms.get(client) === vote.id) {
      client.send(message);
    }
  });
}

wss.on('connection', (ws: WebSocket, req) => {
  let currentRoom: string | null = null;
  let clientSessionId: string | null = null;

  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());

      switch (message.type) {
        case 'join': {
          const { voteId, sessionId } = message;
          const vote = votes.get(voteId);

          if (!vote) {
            ws.send(
              JSON.stringify({
                type: 'error',
                message: '投票不存在',
                code: 'NOT_FOUND',
              })
            );
            return;
          }

          if (currentRoom) {
            clientRooms.delete(ws);
          }

          currentRoom = voteId;
          clientSessionId = sessionId || null;
          clientRooms.set(ws, voteId);

          const identifier = getClientIdentifier(ws, sessionId);
          const hasVoted = vote.voters.has(identifier);
          const votedOptionId = vote.voterOptions.get(identifier) || null;

          ws.send(
            JSON.stringify({
              type: 'vote_state',
              vote: {
                id: vote.id,
                title: vote.title,
                options: vote.options,
                createdAt: vote.createdAt,
                totalVotes: vote.totalVotes,
              },
              hasVoted,
              votedOptionId,
            })
          );
          break;
        }

        case 'vote': {
          const { voteId, optionId, sessionId } = message;
          const vote = votes.get(voteId);

          if (!vote) {
            ws.send(
              JSON.stringify({
                type: 'error',
                message: '投票不存在',
                code: 'NOT_FOUND',
              })
            );
            return;
          }

          const identifier = getClientIdentifier(ws, sessionId);

          if (vote.voters.has(identifier)) {
            ws.send(
              JSON.stringify({
                type: 'error',
                message: '您已投过票',
                code: 'ALREADY_VOTED',
              })
            );
            return;
          }

          const option = vote.options.find((opt) => opt.id === optionId);
          if (!option) {
            ws.send(
              JSON.stringify({
                type: 'error',
                message: '选项不存在',
                code: 'INVALID_OPTION',
              })
            );
            return;
          }

          option.votes += 1;
          vote.totalVotes += 1;
          vote.voters.add(identifier);
          vote.voterOptions.set(identifier, optionId);

          broadcastVoteUpdate(vote);
          break;
        }

        default:
          break;
      }
    } catch (err) {
      console.error('WebSocket message error:', err);
    }
  });

  ws.on('close', () => {
    if (currentRoom) {
      clientRooms.delete(ws);
    }
  });

  ws.on('error', (err) => {
    console.error('WebSocket error:', err);
  });
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server ready on ws://localhost:${PORT}/ws`);
});
