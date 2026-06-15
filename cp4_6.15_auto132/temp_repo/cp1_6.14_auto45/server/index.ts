import express, { Request, Response } from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { Low } from 'lowdb/node';
import { JSONFile } from 'lowdb/node';

interface Participant {
  id: string;
  name: string;
  avatar?: string;
}

interface Vote {
  id: string;
  cardId: string;
  userId: string;
  value: 1 | -1;
  timestamp: number;
}

interface Card {
  id: string;
  roomId: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  sketchData?: string;
  position: number;
  createdAt: number;
  votes: Vote[];
}

interface Room {
  id: string;
  name: string;
  description: string;
  tags: string[];
  inviteCode: string;
  hostId: string;
  hostName: string;
  participants: Participant[];
  cards: Card[];
  isVoting: boolean;
  createdAt: number;
}

interface DatabaseData {
  rooms: Room[];
}

type WSMessageType =
  | 'CARD_CREATE'
  | 'CARD_MOVE'
  | 'VOTE_CAST'
  | 'VOTING_START'
  | 'VOTING_END'
  | 'SYNC_STATE';

interface WSMessage {
  type: WSMessageType;
  roomId: string;
  payload?: unknown;
  timestamp: number;
}

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

const PORT = 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const file = new JSONFile<DatabaseData>('db.json');
const db = new Low<DatabaseData>(file, { rooms: [] });

const roomConnections = new Map<string, Map<string, WebSocket>>();

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getRoomById(id: string): Room | undefined {
  return db.data.rooms.find((room) => room.id === id);
}

function broadcastToRoom(roomId: string, message: WSMessage): void {
  const connections = roomConnections.get(roomId);
  if (!connections) return;

  const messageStr = JSON.stringify(message);
  connections.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}

function createSyncMessage(roomId: string): WSMessage | null {
  const room = getRoomById(roomId);
  if (!room) return null;

  return {
    type: 'SYNC_STATE',
    roomId,
    payload: {
      ...room,
      cards: [...room.cards].sort((a, b) => {
        if (room.isVoting) {
          const scoreA = a.votes.reduce((sum, v) => sum + v.value, 0);
          const scoreB = b.votes.reduce((sum, v) => sum + v.value, 0);
          return scoreB - scoreA;
        }
        return a.position - b.position;
      }),
    },
    timestamp: Date.now(),
  };
}

app.post('/api/create-room', async (req: Request, res: Response) => {
  try {
    const { name, description, tags, hostId, hostName } = req.body;

    if (!name || !hostId || !hostName) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const roomId = `room_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const inviteCode = generateInviteCode();

    const newRoom: Room = {
      id: roomId,
      name,
      description: description || '',
      tags: tags || [],
      inviteCode,
      hostId,
      hostName,
      participants: [{ id: hostId, name: hostName }],
      cards: [],
      isVoting: false,
      createdAt: Date.now(),
    };

    db.data.rooms.push(newRoom);
    await db.write();

    res.json({ roomId, inviteCode });
  } catch (error) {
    res.status(500).json({ error: '创建房间失败' });
  }
});

app.get('/api/rooms', (_req: Request, res: Response) => {
  const rooms = db.data.rooms.map((room) => ({
    id: room.id,
    name: room.name,
    description: room.description,
    tags: room.tags,
    inviteCode: room.inviteCode,
    hostName: room.hostName,
    participantCount: room.participants.length,
    cardCount: room.cards.length,
    isVoting: room.isVoting,
    createdAt: room.createdAt,
  }));
  res.json(rooms);
});

app.get('/api/rooms/:id', (req: Request, res: Response) => {
  const room = getRoomById(req.params.id);
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }
  res.json(room);
});

app.post('/api/rooms/:id/join', async (req: Request, res: Response) => {
  try {
    const room = getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }

    const { userId, userName } = req.body;
    if (!userId || !userName) {
      return res.status(400).json({ error: '缺少必要参数' });
    }

    const existing = room.participants.find((p) => p.id === userId);
    if (!existing) {
      room.participants.push({ id: userId, name: userName });
      await db.write();

      const syncMsg = createSyncMessage(room.id);
      if (syncMsg) {
        broadcastToRoom(room.id, syncMsg);
      }
    }

    res.json({ success: true, room });
  } catch (error) {
    res.status(500).json({ error: '加入房间失败' });
  }
});

app.post('/api/rooms/:id/vote', async (req: Request, res: Response) => {
  try {
    const room = getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }

    if (!room.isVoting) {
      return res.status(400).json({ error: '投票未开始' });
    }

    const { cardId, userId, value } = req.body;
    if (!cardId || !userId || (value !== 1 && value !== -1)) {
      return res.status(400).json({ error: '参数错误' });
    }

    const card = room.cards.find((c) => c.id === cardId);
    if (!card) {
      return res.status(404).json({ error: '卡片不存在' });
    }

    const existingVote = card.votes.find((v) => v.userId === userId);
    if (existingVote) {
      return res.status(400).json({ error: '已投过票' });
    }

    const newVote: Vote = {
      id: `vote_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      cardId,
      userId,
      value,
      timestamp: Date.now(),
    };

    card.votes.push(newVote);
    await db.write();

    broadcastToRoom(room.id, {
      type: 'VOTE_CAST',
      roomId: room.id,
      payload: { cardId, vote: newVote },
      timestamp: Date.now(),
    });

    const syncMsg = createSyncMessage(room.id);
    if (syncMsg) {
      broadcastToRoom(room.id, syncMsg);
    }

    res.json({ success: true, vote: newVote });
  } catch (error) {
    res.status(500).json({ error: '投票失败' });
  }
});

app.post('/api/rooms/:id/start-voting', async (req: Request, res: Response) => {
  try {
    const room = getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }

    const { hostId } = req.body;
    if (hostId !== room.hostId) {
      return res.status(403).json({ error: '无权限' });
    }

    room.isVoting = true;
    await db.write();

    broadcastToRoom(room.id, {
      type: 'VOTING_START',
      roomId: room.id,
      timestamp: Date.now(),
    });

    const syncMsg = createSyncMessage(room.id);
    if (syncMsg) {
      broadcastToRoom(room.id, syncMsg);
    }

    res.json({ success: true, isVoting: true });
  } catch (error) {
    res.status(500).json({ error: '开始投票失败' });
  }
});

app.post('/api/rooms/:id/end-voting', async (req: Request, res: Response) => {
  try {
    const room = getRoomById(req.params.id);
    if (!room) {
      return res.status(404).json({ error: '房间不存在' });
    }

    const { hostId } = req.body;
    if (hostId !== room.hostId) {
      return res.status(403).json({ error: '无权限' });
    }

    room.isVoting = false;

    room.cards.sort((a, b) => {
      const scoreA = a.votes.reduce((sum, v) => sum + v.value, 0);
      const scoreB = b.votes.reduce((sum, v) => sum + v.value, 0);
      return scoreB - scoreA;
    });

    room.cards.forEach((card, index) => {
      card.position = index;
    });

    await db.write();

    broadcastToRoom(room.id, {
      type: 'VOTING_END',
      roomId: room.id,
      timestamp: Date.now(),
    });

    const syncMsg = createSyncMessage(room.id);
    if (syncMsg) {
      broadcastToRoom(room.id, syncMsg);
    }

    res.json({ success: true, isVoting: false, cards: room.cards });
  } catch (error) {
    res.status(500).json({ error: '结束投票失败' });
  }
});

app.get('/api/rooms/:id/export', (req: Request, res: Response) => {
  const room = getRoomById(req.params.id);
  if (!room) {
    return res.status(404).json({ error: '房间不存在' });
  }

  const cardsWithScores = [...room.cards]
    .map((card) => ({
      ...card,
      score: card.votes.reduce((sum, v) => sum + v.value, 0),
      upvotes: card.votes.filter((v) => v.value === 1).length,
      downvotes: card.votes.filter((v) => v.value === -1).length,
    }))
    .sort((a, b) => b.score - a.score);

  const exportData = {
    room: {
      id: room.id,
      name: room.name,
      description: room.description,
      tags: room.tags,
      hostName: room.hostName,
      participants: room.participants,
      createdAt: room.createdAt,
      exportedAt: Date.now(),
    },
    cards: cardsWithScores,
    summary: {
      totalCards: room.cards.length,
      totalVotes: room.cards.reduce((sum, c) => sum + c.votes.length, 0),
      topCard: cardsWithScores[0] || null,
    },
  };

  res.setHeader('Content-Type', 'application/json');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="room-${room.inviteCode}-export.json"`
  );
  res.json(exportData);
});

wss.on('connection', (ws: WebSocket, req) => {
  const url = req.url || '';
  const params = new URLSearchParams(url.split('?')[1] || '');
  const roomId = params.get('roomId');
  const userId = params.get('userId');

  if (!roomId || !userId) {
    ws.close();
    return;
  }

  const room = getRoomById(roomId);
  if (!room) {
    ws.close();
    return;
  }

  if (!roomConnections.has(roomId)) {
    roomConnections.set(roomId, new Map());
  }
  roomConnections.get(roomId)!.set(userId, ws);

  const syncMsg = createSyncMessage(roomId);
  if (syncMsg && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(syncMsg));
  }

  ws.on('message', async (data) => {
    try {
      const message: WSMessage = JSON.parse(data.toString());

      if (message.type === 'CARD_CREATE') {
        const cardData = message.payload as Omit<Card, 'id' | 'votes' | 'createdAt'>;
        const newCard: Card = {
          ...cardData,
          id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          votes: [],
          createdAt: Date.now(),
        };

        const targetRoom = getRoomById(message.roomId);
        if (targetRoom) {
          targetRoom.cards.push(newCard);
          await db.write();
          broadcastToRoom(message.roomId, {
            type: 'CARD_CREATE',
            roomId: message.roomId,
            payload: newCard,
            timestamp: Date.now(),
          });
          const sync = createSyncMessage(message.roomId);
          if (sync) broadcastToRoom(message.roomId, sync);
        }
      } else if (message.type === 'CARD_MOVE') {
        const { cardId, position } = message.payload as {
          cardId: string;
          position: number;
        };
        const targetRoom = getRoomById(message.roomId);
        if (targetRoom) {
          const card = targetRoom.cards.find((c) => c.id === cardId);
          if (card) {
            card.position = position;
            await db.write();
            broadcastToRoom(message.roomId, {
              type: 'CARD_MOVE',
              roomId: message.roomId,
              payload: { cardId, position },
              timestamp: Date.now(),
            });
            const sync = createSyncMessage(message.roomId);
            if (sync) broadcastToRoom(message.roomId, sync);
          }
        }
      }
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    const connections = roomConnections.get(roomId);
    if (connections) {
      connections.delete(userId);
      if (connections.size === 0) {
        roomConnections.delete(roomId);
      }
    }
  });
});

async function startServer() {
  await db.read();

  if (!db.data.rooms) {
    db.data = { rooms: [] };
    await db.write();
  }

  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`WebSocket server running on ws://localhost:${PORT}`);
  });
}

startServer();
