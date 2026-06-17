import express from 'express';
import http from 'http';
import cors from 'cors';
import { Server, Socket } from 'socket.io';

type ToolType = 'pen' | 'eraser' | 'text' | 'sticky' | 'none';

interface Point {
  x: number;
  y: number;
}

interface User {
  id: string;
  nickname: string;
  color: string;
  tool: ToolType;
  cursorPosition: Point;
}

interface DrawPath {
  id: string;
  userId: string;
  points: Point[];
  color: string;
  width: number;
  tool: ToolType;
}

interface TextItem {
  id: string;
  userId: string;
  x: number;
  y: number;
  text: string;
  color: string;
  fontSize: number;
}

interface StickyNote {
  id: string;
  userId: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  content: string;
}

interface Room {
  id: string;
  users: Map<string, User>;
  paths: DrawPath[];
  texts: TextItem[];
  stickies: StickyNote[];
  createdAt: number;
}

interface DrawingHistory {
  paths: DrawPath[];
  texts: TextItem[];
  stickies: StickyNote[];
}

class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private socketToRoom: Map<string, string> = new Map();

  getOrCreate(id: string): Room {
    if (!this.rooms.has(id)) {
      this.rooms.set(id, {
        id,
        users: new Map(),
        paths: [],
        texts: [],
        stickies: [],
        createdAt: Date.now(),
      });
    }
    return this.rooms.get(id)!;
  }

  addUser(roomId: string, socketId: string, user: User): void {
    const room = this.getOrCreate(roomId);
    room.users.set(socketId, user);
    this.socketToRoom.set(socketId, roomId);
  }

  removeUser(socketId: string): { roomId: string; userId: string } | null {
    const roomId = this.socketToRoom.get(socketId);
    if (!roomId) return null;

    const room = this.rooms.get(roomId);
    if (!room) return null;

    const user = room.users.get(socketId);
    const userId = user?.id;

    room.users.delete(socketId);
    this.socketToRoom.delete(socketId);

    if (room.users.size === 0) {
      this.rooms.delete(roomId);
    }

    return userId ? { roomId, userId } : null;
  }

  getRoomByUser(socketId: string): Room | undefined {
    const roomId = this.socketToRoom.get(socketId);
    return roomId ? this.rooms.get(roomId) : undefined;
  }

  get(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST'],
  },
});

app.use(cors({ origin: 'http://localhost:5173' }));

const roomManager = new RoomManager();

io.on('connection', (socket: Socket) => {
  socket.on(
    'join-room',
    ({ roomId, user }: { roomId: string; user: User }) => {
      const room = roomManager.getOrCreate(roomId);
      roomManager.addUser(roomId, socket.id, user);
      socket.join(roomId);

      const usersList = Array.from(room.users.values());
      const history: DrawingHistory = {
        paths: room.paths,
        texts: room.texts,
        stickies: room.stickies,
      };

      socket.emit('room-joined', { roomId, users: usersList, history });
      socket.to(roomId).emit('user-joined', { user });
    }
  );

  socket.on(
    'leave-room',
    ({ roomId, userId }: { roomId: string; userId: string }) => {
      const result = roomManager.removeUser(socket.id);
      if (result) {
        socket.to(result.roomId).emit('user-left', { userId: result.userId });
      }
      socket.leave(roomId);
    }
  );

  socket.on(
    'draw-start',
    ({ roomId, path }: { roomId: string; path: DrawPath }) => {
      const room = roomManager.get(roomId);
      if (!room) return;
      room.paths.push({ ...path, points: [...path.points] });
      io.to(roomId).emit('draw-start', path);
    }
  );

  socket.on(
    'draw-continue',
    ({
      roomId,
      pathId,
      point,
    }: {
      roomId: string;
      pathId: string;
      point: Point;
    }) => {
      const room = roomManager.get(roomId);
      if (!room) return;
      const path = room.paths.find((p) => p.id === pathId);
      if (path) {
        path.points.push(point);
      }
      io.to(roomId).emit('draw-continue', { pathId, point });
    }
  );

  socket.on(
    'draw-end',
    ({ roomId, pathId }: { roomId: string; pathId: string }) => {
      io.to(roomId).emit('draw-end', { pathId });
    }
  );

  socket.on(
    'add-text',
    ({ roomId, text }: { roomId: string; text: TextItem }) => {
      const room = roomManager.get(roomId);
      if (!room) return;
      room.texts.push(text);
      io.to(roomId).emit('text-added', text);
    }
  );

  socket.on(
    'add-sticky',
    ({ roomId, sticky }: { roomId: string; sticky: StickyNote }) => {
      const room = roomManager.get(roomId);
      if (!room) return;
      room.stickies.push(sticky);
      io.to(roomId).emit('sticky-added', sticky);
    }
  );

  socket.on(
    'update-sticky',
    ({
      roomId,
      id,
      updates,
    }: {
      roomId: string;
      id: string;
      updates: Partial<StickyNote>;
    }) => {
      const room = roomManager.get(roomId);
      if (!room) return;
      const sticky = room.stickies.find((s) => s.id === id);
      if (sticky) {
        Object.assign(sticky, updates);
      }
      io.to(roomId).emit('sticky-updated', { id, updates });
    }
  );

  socket.on(
    'update-cursor',
    ({
      roomId,
      userId,
      position,
    }: {
      roomId: string;
      userId: string;
      position: Point;
    }) => {
      const room = roomManager.get(roomId);
      if (room) {
        const user = room.users.get(socket.id);
        if (user) {
          user.cursorPosition = position;
        }
      }
      socket.to(roomId).emit('cursor-updated', { userId, position });
    }
  );

  socket.on(
    'update-tool',
    ({
      roomId,
      userId,
      tool,
    }: {
      roomId: string;
      userId: string;
      tool: ToolType;
    }) => {
      const room = roomManager.get(roomId);
      if (room) {
        const user = room.users.get(socket.id);
        if (user) {
          user.tool = tool;
        }
      }
      socket.to(roomId).emit('tool-updated', { userId, tool });
    }
  );

  socket.on(
    'clear-canvas',
    ({ roomId, userId }: { roomId: string; userId: string }) => {
      const room = roomManager.get(roomId);
      if (!room) return;
      room.paths = [];
      room.texts = [];
      room.stickies = [];
      io.to(roomId).emit('canvas-cleared', { userId });
    }
  );

  socket.on('disconnect', () => {
    const result = roomManager.removeUser(socket.id);
    if (result) {
      socket.to(result.roomId).emit('user-left', { userId: result.userId });
    }
  });
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log('Whiteboard server running on port 3001');
});
