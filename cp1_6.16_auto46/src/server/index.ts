import express, { Request, Response } from 'express';
import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import type { FamilySpace, SheetMusic, Annotation, Note } from '../types';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

const spaces = new Map<string, FamilySpace>();
const sheets = new Map<string, SheetMusic>();
const annotations = new Map<string, Annotation>();
const connections = new Map<string, { ws: WebSocket; spaceId: string; userId: string; userName: string; userColor: string; lastPing: number }>();

const generateSampleNotes = (): Note[] => {
  const notes: Note[] = [];
  const pitches = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;
  const durations = ['q', 'q', 'q', 'q', 'h', 'h', '8', '8', '8', '8'] as const;
  
  for (let measure = 0; measure < 4; measure++) {
    for (let i = 0; i < 4; i++) {
      const pitchIndex = Math.floor(Math.random() * pitches.length);
      const durationIndex = Math.floor(Math.random() * durations.length);
      notes.push({
        id: uuidv4(),
        pitch: pitches[pitchIndex] as string,
        duration: durations[durationIndex] as string,
        octave: 4,
        measure,
        position: i * 0.25
      });
    }
  }
  return notes;
};

const sampleSpaceId = uuidv4();
const sampleSheetId = uuidv4();
const sampleAnnotationId = uuidv4();

const sampleSpace: FamilySpace = {
  id: sampleSpaceId,
  name: '李氏家族乐谱库',
  ownerId: 'user-001',
  members: ['user-001', 'user-002', 'user-003'],
  sheets: []
};

const sampleNotes = generateSampleNotes();

const sampleSheet: SheetMusic = {
  id: sampleSheetId,
  name: '欢乐颂',
  spaceId: sampleSpaceId,
  notes: sampleNotes,
  annotations: [],
  createdAt: Date.now(),
  updatedAt: Date.now()
};

const sampleAnnotation: Annotation = {
  id: sampleAnnotationId,
  noteId: sampleNotes[0]!.id,
  userId: 'user-001',
  userName: '张三',
  userColor: '#3B82F6',
  content: '这里需要放慢速度',
  type: 'comment',
  timestamp: Date.now(),
  measure: 0
};

sampleSheet.annotations.push(sampleAnnotation);
sampleSpace.sheets.push(sampleSheet);

spaces.set(sampleSpaceId, sampleSpace);
sheets.set(sampleSheetId, sampleSheet);
annotations.set(sampleAnnotationId, sampleAnnotation);

app.get('/api/spaces', (_req: Request, res: Response): void => {
  const spacesList = Array.from(spaces.values());
  res.json(spacesList);
});

app.post('/api/spaces', (req: Request, res: Response): void => {
  const { name, ownerId } = req.body as { name: string; ownerId: string };
  
  if (!name || !ownerId) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }

  const newSpace: FamilySpace = {
    id: uuidv4(),
    name,
    ownerId,
    members: [ownerId],
    sheets: []
  };

  spaces.set(newSpace.id, newSpace);
  res.status(201).json(newSpace);
});

app.get('/api/spaces/:id/sheets', (req: Request, res: Response): void => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: '缺少空间ID' });
    return;
  }
  const space = spaces.get(id);
  
  if (!space) {
    res.status(404).json({ error: '空间不存在' });
    return;
  }

  res.json(space.sheets);
});

app.post('/api/spaces/:id/sheets', (req: Request, res: Response): void => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: '缺少空间ID' });
    return;
  }
  const { name } = req.body as { name: string };
  const space = spaces.get(id);
  
  if (!space) {
    res.status(404).json({ error: '空间不存在' });
    return;
  }

  if (!name) {
    res.status(400).json({ error: '缺少乐谱名称' });
    return;
  }

  const newSheet: SheetMusic = {
    id: uuidv4(),
    name,
    spaceId: id,
    notes: generateSampleNotes(),
    annotations: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  };

  sheets.set(newSheet.id, newSheet);
  space.sheets.push(newSheet);
  res.status(201).json(newSheet);
});

app.get('/api/sheets/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: '缺少乐谱ID' });
    return;
  }
  const sheet = sheets.get(id);
  
  if (!sheet) {
    res.status(404).json({ error: '乐谱不存在' });
    return;
  }

  res.json(sheet);
});

app.put('/api/sheets/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: '缺少乐谱ID' });
    return;
  }
  const { name, notes } = req.body as { name?: string; notes?: Note[] };
  const sheet = sheets.get(id);
  
  if (!sheet) {
    res.status(404).json({ error: '乐谱不存在' });
    return;
  }

  if (name !== undefined) {
    sheet.name = name;
  }
  if (notes !== undefined) {
    sheet.notes = notes;
  }
  sheet.updatedAt = Date.now();

  res.json(sheet);
});

app.get('/api/sheets/:id/annotations', (req: Request, res: Response): void => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: '缺少乐谱ID' });
    return;
  }
  const sheet = sheets.get(id);
  
  if (!sheet) {
    res.status(404).json({ error: '乐谱不存在' });
    return;
  }

  res.json(sheet.annotations);
});

app.post('/api/sheets/:id/annotations', (req: Request, res: Response): void => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: '缺少乐谱ID' });
    return;
  }
  const { noteId, userId, userName, userColor, content, type, measure } = req.body as {
    noteId: string;
    userId: string;
    userName: string;
    userColor: string;
    content: string;
    type: 'comment' | 'highlight' | 'dynamic' | 'error';
    measure: number;
  };
  
  const sheet = sheets.get(id);
  
  if (!sheet) {
    res.status(404).json({ error: '乐谱不存在' });
    return;
  }

  if (!noteId || !userId || !content || !type) {
    res.status(400).json({ error: '缺少必要参数' });
    return;
  }

  const newAnnotation: Annotation = {
    id: uuidv4(),
    noteId,
    userId,
    userName,
    userColor,
    content,
    type,
    timestamp: Date.now(),
    measure
  };

  annotations.set(newAnnotation.id, newAnnotation);
  sheet.annotations.push(newAnnotation);
  sheet.updatedAt = Date.now();

  res.status(201).json(newAnnotation);
});

app.delete('/api/annotations/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  if (!id) {
    res.status(400).json({ error: '缺少注释ID' });
    return;
  }
  const annotation = annotations.get(id);
  
  if (!annotation) {
    res.status(404).json({ error: '注释不存在' });
    return;
  }

  const sheet = sheets.get(annotation.noteId);
  if (sheet) {
    sheet.annotations = sheet.annotations.filter(a => a.id !== id);
    sheet.updatedAt = Date.now();
  }

  annotations.delete(id);
  res.status(204).send();
});

const server = app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});

const wss = new WebSocketServer({ server });

const broadcastToSpace = (spaceId: string, message: object, excludeUserId?: string): void => {
  connections.forEach((conn) => {
    if (conn.spaceId === spaceId && conn.ws.readyState === WebSocket.OPEN) {
      if (excludeUserId && conn.userId === excludeUserId) {
        return;
      }
      conn.ws.send(JSON.stringify(message));
    }
  });
};

const getOnlineUsers = (spaceId: string): Array<{ userId: string; userName: string; userColor: string }> => {
  const users: Array<{ userId: string; userName: string; userColor: string }> = [];
  connections.forEach((conn) => {
    if (conn.spaceId === spaceId) {
      users.push({
        userId: conn.userId,
        userName: conn.userName,
        userColor: conn.userColor
      });
    }
  });
  return users;
};

wss.on('connection', (ws: WebSocket): void => {
  const connectionId = uuidv4();
  let currentSpaceId = '';
  let currentUserId = '';

  ws.on('message', (data: Buffer): void => {
    try {
      const message = JSON.parse(data.toString()) as {
        type: string;
        spaceId?: string;
        userId?: string;
        userName?: string;
        userColor?: string;
        payload?: unknown;
        timestamp?: number;
      };

      switch (message.type) {
        case 'join': {
          const { spaceId, userId, userName, userColor } = message;
          if (!spaceId || !userId) {
            ws.send(JSON.stringify({ type: 'error', message: '缺少必要参数' }));
            return;
          }

          currentSpaceId = spaceId;
          currentUserId = userId;

          connections.set(connectionId, {
            ws,
            spaceId,
            userId,
            userName: userName || '匿名用户',
            userColor: userColor || '#3B82F6',
            lastPing: Date.now()
          });

          const onlineUsers = getOnlineUsers(spaceId);
          broadcastToSpace(spaceId, {
            type: 'join',
            userId,
            userName: userName || '匿名用户',
            userColor: userColor || '#3B82F6',
            onlineUsers,
            timestamp: Date.now()
          });
          break;
        }

        case 'leave': {
          connections.delete(connectionId);
          if (currentSpaceId) {
            const onlineUsers = getOnlineUsers(currentSpaceId);
            broadcastToSpace(currentSpaceId, {
              type: 'leave',
              userId: currentUserId,
              onlineUsers,
              timestamp: Date.now()
            });
          }
          break;
        }

        case 'note_update': {
          const { spaceId, payload, userId, userName, userColor } = message;
          if (!spaceId) return;

          broadcastToSpace(spaceId, {
            type: 'note_update',
            userId,
            userName,
            userColor,
            payload,
            timestamp: Date.now()
          }, userId);
          break;
        }

        case 'annotation_add': {
          const { spaceId, payload, userId, userName, userColor } = message;
          if (!spaceId) return;

          broadcastToSpace(spaceId, {
            type: 'annotation_add',
            userId,
            userName,
            userColor,
            payload,
            timestamp: Date.now()
          }, userId);
          break;
        }

        case 'annotation_delete': {
          const { spaceId, payload, userId, userName, userColor } = message;
          if (!spaceId) return;

          broadcastToSpace(spaceId, {
            type: 'annotation_delete',
            userId,
            userName,
            userColor,
            payload,
            timestamp: Date.now()
          }, userId);
          break;
        }

        case 'cursor_position': {
          const { spaceId, payload, userId, userName, userColor } = message;
          if (!spaceId) return;

          broadcastToSpace(spaceId, {
            type: 'cursor_position',
            userId,
            userName,
            userColor,
            payload,
            timestamp: Date.now()
          }, userId);
          break;
        }

        case 'ping': {
          const conn = connections.get(connectionId);
          if (conn) {
            conn.lastPing = Date.now();
            ws.send(JSON.stringify({ type: 'pong', timestamp: Date.now() }));
          }
          break;
        }

        default:
          ws.send(JSON.stringify({ type: 'error', message: '未知消息类型' }));
      }
    } catch (error) {
      ws.send(JSON.stringify({ type: 'error', message: '消息格式错误' }));
    }
  });

  ws.on('close', (): void => {
    connections.delete(connectionId);
    if (currentSpaceId) {
      const onlineUsers = getOnlineUsers(currentSpaceId);
      broadcastToSpace(currentSpaceId, {
        type: 'leave',
        userId: currentUserId,
        onlineUsers,
        timestamp: Date.now()
      });
    }
  });

  ws.on('error', (error): void => {
    console.error('WebSocket 错误:', error);
  });
});

const HEARTBEAT_INTERVAL = 30000;
const HEARTBEAT_TIMEOUT = 60000;

setInterval((): void => {
  const now = Date.now();
  connections.forEach((conn, connId) => {
    if (now - conn.lastPing > HEARTBEAT_TIMEOUT) {
      conn.ws.close();
      connections.delete(connId);
      const onlineUsers = getOnlineUsers(conn.spaceId);
      broadcastToSpace(conn.spaceId, {
        type: 'leave',
        userId: conn.userId,
        onlineUsers,
        timestamp: now
      });
    }
  });
}, HEARTBEAT_INTERVAL);
