import { WebSocketServer, WebSocket } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import type { User, Danmaku, ClientMessage, ServerMessage } from './types';

interface Room {
  id: string;
  users: Map<string, User>;
  hostId: string | null;
}

interface ClientConnection {
  ws: WebSocket;
  userId: string | null;
  roomId: string | null;
}

const wss = new WebSocketServer({ port: 3001 });
const rooms = new Map<string, Room>();
const connections = new Map<WebSocket, ClientConnection>();

const WARM_COLORS = [
  '#FF6B6B', '#FF8E53', '#FFC93C', '#FF9F43',
  '#EE5A6F', '#F8B500', '#FF7F50', '#E74C3C'
];

const DEFAULT_COLORS = [
  '#FF3366', '#33FF66', '#3366FF', '#FFCC00',
  '#FF66CC', '#00FFFF', '#FF9933', '#9966FF',
  '#66FFCC', '#FF6666', '#66CCFF', '#CCFF66'
];

function getRandomColor(): string {
  return WARM_COLORS[Math.floor(Math.random() * WARM_COLORS.length)];
}

function getRandomDefaultColor(): string {
  return DEFAULT_COLORS[Math.floor(Math.random() * DEFAULT_COLORS.length)];
}

function sendMessage(ws: WebSocket, message: ServerMessage): void {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function broadcastToRoom(roomId: string, message: ServerMessage, excludeUserId?: string): void {
  const room = rooms.get(roomId);
  if (!room) return;

  for (const [ws, conn] of connections) {
    if (conn.roomId === roomId && conn.userId && conn.userId !== excludeUserId) {
      sendMessage(ws, message);
    }
  }
}

function getOrCreateRoom(roomId: string): Room {
  let room = rooms.get(roomId);
  if (!room) {
    room = {
      id: roomId,
      users: new Map(),
      hostId: null
    };
    rooms.set(roomId, room);
  }
  return room;
}

function handleJoin(ws: WebSocket, nickname: string, roomId: string): void {
  const conn = connections.get(ws);
  if (!conn) return;

  nickname = nickname.trim().slice(0, 12) || '匿名用户';
  roomId = roomId.trim().slice(0, 20);

  if (!roomId) {
    sendMessage(ws, { type: 'error', message: '房间号不能为空' });
    return;
  }

  const room = getOrCreateRoom(roomId);
  const userId = uuidv4();
  const isHost = room.users.size === 0;

  const user: User = {
    id: userId,
    nickname,
    roomId,
    color: getRandomDefaultColor(),
    avatarColor: getRandomColor(),
    isHost,
    danmakuCount: 0
  };

  if (isHost) {
    room.hostId = userId;
  }

  room.users.set(userId, user);
  conn.userId = userId;
  conn.roomId = roomId;

  const usersList = Array.from(room.users.values());
  sendMessage(ws, {
    type: 'init',
    selfId: userId,
    users: usersList,
    isHost
  });

  broadcastToRoom(roomId, { type: 'userJoin', user }, userId);
}

function handleDanmaku(ws: WebSocket, danmakuData: Omit<Danmaku, 'trail'>): void {
  const conn = connections.get(ws);
  if (!conn || !conn.userId || !conn.roomId) return;

  const room = rooms.get(conn.roomId);
  if (!room) return;

  const user = room.users.get(conn.userId);
  if (user) {
    user.danmakuCount++;
    broadcastToRoom(conn.roomId, { type: 'userUpdate', user });
  }

  const danmaku: Omit<Danmaku, 'trail'> = {
    ...danmakuData,
    userId: conn.userId,
    color: user?.color || danmakuData.color
  };

  broadcastToRoom(conn.roomId, { type: 'danmaku', danmaku });
}

function handleSetColor(ws: WebSocket, color: string): void {
  const conn = connections.get(ws);
  if (!conn || !conn.userId || !conn.roomId) return;

  const room = rooms.get(conn.roomId);
  if (!room) return;

  const user = room.users.get(conn.userId);
  if (user) {
    user.color = color;
    broadcastToRoom(conn.roomId, { type: 'userUpdate', user });
  }
}

function handleClearCanvas(ws: WebSocket): void {
  const conn = connections.get(ws);
  if (!conn || !conn.userId || !conn.roomId) return;

  const room = rooms.get(conn.roomId);
  if (!room) return;

  if (room.hostId !== conn.userId) return;

  for (const user of room.users.values()) {
    user.danmakuCount = 0;
  }

  broadcastToRoom(conn.roomId, { type: 'clearCanvas' });

  for (const user of room.users.values()) {
    broadcastToRoom(conn.roomId, { type: 'userUpdate', user });
  }
}

function handleDisconnect(ws: WebSocket): void {
  const conn = connections.get(ws);
  if (!conn) return;

  if (conn.roomId && conn.userId) {
    const room = rooms.get(conn.roomId);
    if (room) {
      room.users.delete(conn.userId);

      if (room.hostId === conn.userId) {
        const nextHost = room.users.values().next().value as User | undefined;
        if (nextHost) {
          nextHost.isHost = true;
          room.hostId = nextHost.id;
          broadcastToRoom(conn.roomId, { type: 'userUpdate', user: nextHost });
        } else {
          room.hostId = null;
        }
      }

      broadcastToRoom(conn.roomId, { type: 'userLeave', userId: conn.userId });

      if (room.users.size === 0) {
        rooms.delete(conn.roomId);
      }
    }
  }

  connections.delete(ws);
}

wss.on('connection', (ws: WebSocket) => {
  connections.set(ws, {
    ws,
    userId: null,
    roomId: null
  });

  ws.on('message', (data: string) => {
    try {
      const message: ClientMessage = JSON.parse(data);

      switch (message.type) {
        case 'join':
          handleJoin(ws, message.nickname, message.roomId);
          break;
        case 'danmaku':
          handleDanmaku(ws, message.danmaku);
          break;
        case 'setColor':
          handleSetColor(ws, message.color);
          break;
        case 'clearCanvas':
          handleClearCanvas(ws);
          break;
      }
    } catch (e) {
      console.error('Failed to parse message:', e);
    }
  });

  ws.on('close', () => {
    handleDisconnect(ws);
  });

  ws.on('error', () => {
    handleDisconnect(ws);
  });
});

console.log('WebSocket server running on ws://localhost:3001');
