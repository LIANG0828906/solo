import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import cors from 'cors';

type ToolType = 'pen' | 'rectangle' | 'circle' | 'text' | 'eraser';

interface Point {
  x: number;
  y: number;
}

interface BaseElement {
  id: string;
  type: ToolType;
  color: string;
  strokeWidth: number;
  createdAt: number;
  userId: string;
  userName: string;
  opacity?: number;
}

interface PenElement extends BaseElement {
  type: 'pen';
  points: Point[];
}

interface RectangleElement extends BaseElement {
  type: 'rectangle';
  x: number;
  y: number;
  width: number;
  height: number;
}

interface CircleElement extends BaseElement {
  type: 'circle';
  cx: number;
  cy: number;
  r: number;
}

interface TextElement extends BaseElement {
  type: 'text';
  x: number;
  y: number;
  text: string;
  fontSize: number;
}

type BoardElement = PenElement | RectangleElement | CircleElement | TextElement;

interface UserCursor {
  userId: string;
  userName: string;
  x: number;
  y: number;
  color: string;
}

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingInterval: 5000,
  pingTimeout: 10000,
  connectTimeout: 20000,
});

interface UserInfo {
  userId: string;
  userName: string;
  color: string;
}

const connectedUsers = new Map<string, UserInfo>();
let boardElements: BoardElement[] = [];

interface JoinData {
  userId: string;
  userName: string;
  color: string;
}

io.on('connection', (socket: Socket) => {
  console.log(`[服务器] 用户连接: ${socket.id}`);

  socket.on('join', (data: JoinData) => {
    connectedUsers.set(socket.id, data);
    console.log(`[服务器] 用户加入: ${data.userName} (${data.userId})`);
    socket.emit('init-elements', boardElements);
    io.emit('user-joined', data);
    console.log(`[服务器] 当前在线用户: ${connectedUsers.size}`);
  });

  socket.on('add-element', (element: BoardElement) => {
    if (!boardElements.find((e) => e.id === element.id)) {
      boardElements.push(element);
    }
    socket.broadcast.emit('element-added', element);
  });

  socket.on('remove-element', (elementId: string) => {
    boardElements = boardElements.filter((e) => e.id !== elementId);
    socket.broadcast.emit('element-removed', elementId);
  });

  socket.on('cursor-move', (cursor: UserCursor) => {
    socket.broadcast.emit('cursor-move', cursor);
  });

  socket.on('batch-load', (elements: BoardElement[]) => {
    boardElements = elements;
    socket.broadcast.emit('batch-load', elements);
  });

  socket.on('disconnect', () => {
    const user = connectedUsers.get(socket.id);
    if (user) {
      console.log(`[服务器] 用户断开: ${user.userName} (${user.userId})`);
      connectedUsers.delete(socket.id);
      io.emit('user-disconnect', user.userId);
    } else {
      console.log(`[服务器] 未知用户断开: ${socket.id}`);
    }
  });

  socket.on('error', (err) => {
    console.error(`[服务器] Socket错误 (${socket.id}):`, err);
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`[服务器] 协作白板后端已启动，端口: ${PORT}`);
  console.log(`[服务器] 心跳间隔: 5000ms, 超时: 10000ms`);
  console.log(`[服务器] 等待客户端连接...`);
});

process.on('SIGINT', () => {
  console.log('\n[服务器] 正在关闭服务器...');
  io.close(() => {
    server.close(() => {
      console.log('[服务器] 服务器已关闭');
      process.exit(0);
    });
  });
});
