import express, { type Request, type Response } from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import RoomManager from './roomManager.js';
import type { Stroke } from './roomManager.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

interface CanvasData {
  id: string;
  roomId: string;
  name: string;
  strokes: Stroke[];
  createdAt: number;
}

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const roomManager = new RoomManager(io);

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const getCanvasFilePath = (canvasId: string) => path.join(DATA_DIR, `${canvasId}.json`);

const getCanvasesByRoom = (roomId: string): { id: string; name: string; createdAt: number }[] => {
  if (!fs.existsSync(DATA_DIR)) return [];
  const files = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.json'));
  const canvases: { id: string; name: string; createdAt: number }[] = [];

  for (const file of files) {
    try {
      const filePath = path.join(DATA_DIR, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      const canvas: CanvasData = JSON.parse(content);
      if (canvas.roomId === roomId) {
        canvases.push({
          id: canvas.id,
          name: canvas.name,
          createdAt: canvas.createdAt,
        });
      }
    } catch {
      continue;
    }
  }

  return canvases.sort((a, b) => b.createdAt - a.createdAt);
};

app.get('/api/canvases', (req: Request, res: Response) => {
  try {
    const { roomId } = req.query;
    if (!roomId || typeof roomId !== 'string') {
      res.status(400).json({ success: false, error: 'roomId 参数必填' });
      return;
    }
    const canvases = getCanvasesByRoom(roomId);
    res.status(200).json({ success: true, data: canvases });
  } catch (error) {
    res.status(500).json({ success: false, error: '获取画布列表失败' });
  }
});

app.post('/api/canvases', (req: Request, res: Response) => {
  try {
    const { roomId, name, strokes } = req.body;
    if (!roomId || !name || !strokes) {
      res.status(400).json({ success: false, error: 'roomId, name, strokes 为必填字段' });
      return;
    }

    const canvasId = `canvas_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    const canvasData: CanvasData = {
      id: canvasId,
      roomId,
      name,
      strokes,
      createdAt: Date.now(),
    };

    const filePath = getCanvasFilePath(canvasId);
    fs.writeFileSync(filePath, JSON.stringify(canvasData, null, 2), 'utf-8');

    res.status(200).json({ success: true, data: { id: canvasId, ...canvasData } });
  } catch (error) {
    res.status(500).json({ success: false, error: '保存画布失败' });
  }
});

app.get('/api/canvases/:canvasId', (req: Request, res: Response) => {
  try {
    const { canvasId } = req.params;
    const filePath = getCanvasFilePath(canvasId);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ success: false, error: '画布不存在' });
      return;
    }

    const content = fs.readFileSync(filePath, 'utf-8');
    const canvas: CanvasData = JSON.parse(content);
    res.status(200).json({ success: true, data: canvas });
  } catch (error) {
    res.status(500).json({ success: false, error: '加载画布失败' });
  }
});

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({ success: true, message: 'ok' });
});

io.on('connection', (socket) => {
  roomManager.registerSocketHandlers(socket);
});

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  httpServer.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

export default app;
