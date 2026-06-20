import express from 'express';
import http from 'http';
import { Server, Socket } from 'socket.io';
import { roomManager } from './roomManager';
import { WhiteboardElement, Operation, User } from '../shared/types';
import { AddressInfo } from 'net';

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

app.use(express.json());

app.get('/api/room/:roomId/exists', (req, res) => {
  const { roomId } = req.params;
  res.json({ exists: roomManager.roomExists(roomId) });
});

function validateRoomId(roomId: string): boolean {
  return /^\d{6}$/.test(roomId);
}

io.on('connection', (socket: Socket) => {
  let currentRoom: string | null = null;
  let currentUserId: string | null = null;

  socket.on('room:create', (data: { roomId: string; userName: string }, cb: any) => {
    const { roomId, userName } = data;
    if (!validateRoomId(roomId)) {
      return cb({ success: false, error: '房间号必须是6位数字' });
    }
    if (!userName || userName.trim().length === 0) {
      return cb({ success: false, error: '昵称不能为空' });
    }
    if (roomManager.roomExists(roomId)) {
      return cb({ success: false, error: '房间已存在' });
    }
    roomManager.createRoom(roomId);
    currentRoom = roomId;
    currentUserId = socket.id;
    const user = roomManager.addUser(roomId, currentUserId, userName.trim());
    socket.join(roomId);

    cb({
      success: true,
      user,
      users: roomManager.getUsers(roomId),
    });
    socket.to(roomId).emit('user:joined', user);
  });

  socket.on('room:join', (data: { roomId: string; userName: string }, cb: any) => {
    const { roomId, userName } = data;
    if (!validateRoomId(roomId)) {
      return cb({ success: false, error: '房间号必须是6位数字' });
    }
    if (!userName || userName.trim().length === 0) {
      return cb({ success: false, error: '昵称不能为空' });
    }
    if (!roomManager.roomExists(roomId)) {
      return cb({ success: false, error: '房间不存在' });
    }
    currentRoom = roomId;
    currentUserId = socket.id;
    const user = roomManager.addUser(roomId, currentUserId, userName.trim());
    socket.join(roomId);

    cb({
      success: true,
      user,
      users: roomManager.getUsers(roomId),
    });
    socket.to(roomId).emit('user:joined', user);
  });

  socket.on('room:history', (cb: any) => {
    if (!currentRoom) return cb({ success: false, error: '未加入房间' });
    cb({
      success: true,
      operations: roomManager.getHistory(currentRoom),
      elements: roomManager.getElements(currentRoom),
    });
  });

  socket.on('element:add', (element: WhiteboardElement, cb: any) => {
    if (!currentRoom || !currentUserId) return;
    const el = { ...element, userId: currentUserId };
    const op = roomManager.addElement(currentRoom, el);
    if (op) {
      socket.to(currentRoom).emit('operation', op);
      cb?.({ success: true, seq: op.seq });
    }
  });

  socket.on('element:update', (data: { id: string; updates: Partial<WhiteboardElement> }, cb: any) => {
    if (!currentRoom || !currentUserId) return;
    const op = roomManager.updateElement(currentRoom, data.id, data.updates);
    if (op) {
      socket.to(currentRoom).emit('operation', op);
      cb?.({ success: true, seq: op.seq });
    }
  });

  socket.on('element:delete', (elementId: string, cb: any) => {
    if (!currentRoom || !currentUserId) return;
    const op = roomManager.deleteElement(currentRoom, elementId, currentUserId);
    if (op) {
      socket.to(currentRoom).emit('operation', op);
      cb?.({ success: true, seq: op.seq });
    }
  });

  socket.on('draw:points', (data: { elementId: string; points: Array<{ x: number; y: number }> }, cb: any) => {
    if (!currentRoom || !currentUserId) return;
    const op = roomManager.appendPathPoints(currentRoom, data.elementId, data.points, currentUserId);
    if (op) {
      socket.to(currentRoom).emit('operation', op);
      cb?.({ success: true, seq: op.seq });
    }
  });

  socket.on('canvas:clear', (_, cb: any) => {
    if (!currentRoom || !currentUserId) return;
    const op = roomManager.clearCanvas(currentRoom, currentUserId);
    if (op) {
      socket.to(currentRoom).emit('operation', op);
      cb?.({ success: true, seq: op.seq });
    }
  });

  socket.on('disconnect', () => {
    if (!currentRoom || !currentUserId) return;
    const user = roomManager.removeUser(currentRoom, currentUserId);
    if (user && roomManager.roomExists(currentRoom)) {
      socket.to(currentRoom).emit('user:left', user);
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`TeamBoard server running on port ${PORT}`);
});
