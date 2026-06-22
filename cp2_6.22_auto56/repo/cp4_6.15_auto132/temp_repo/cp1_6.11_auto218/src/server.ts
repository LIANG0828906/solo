import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

interface User {
  id: string;
  name: string;
  color: string;
}

interface DesignElement {
  id: string;
  type: 'text' | 'pattern';
  [key: string]: any;
}

interface RoomState {
  roomId: string;
  elements: DesignElement[];
  users: User[];
}

interface ElementOp {
  roomId: string;
  elementId: string;
  type: 'text' | 'pattern';
  action: 'add' | 'move' | 'scale' | 'rotate' | 'delete' | 'color' | 'opacity' | 'reorder';
  data: Record<string, any>;
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' },
});

const rooms = new Map<string, RoomState>();
const history = new Map<string, ElementOp[]>();

function getOrCreateRoom(roomId: string): RoomState {
  if (!rooms.has(roomId)) {
    rooms.set(roomId, { roomId, elements: [], users: [] });
    history.set(roomId, []);
  }
  return rooms.get(roomId)!;
}

function getRandomColor(): string {
  const colors = ['#8B4513', '#2F4F4F', '#800020', '#4B0082', '#006400', '#8B0000', '#4A4A2F', '#5B3A29'];
  return colors[Math.floor(Math.random() * colors.length)];
}

io.on('connection', (socket) => {
  let currentRoom: string | null = null;
  let currentUser: User | null = null;

  socket.on('join-room', (data: { roomId: string; userName: string }) => {
    currentRoom = data.roomId;
    currentUser = {
      id: socket.id,
      name: data.userName || `匠人${Math.floor(Math.random() * 1000)}`,
      color: getRandomColor(),
    };

    socket.join(currentRoom);
    const room = getOrCreateRoom(currentRoom);
    room.users.push(currentUser);

    socket.emit('room-state', room);

    socket.to(currentRoom).emit('user-joined', currentUser);
    io.to(currentRoom).emit('users-list', room.users);
  });

  const handleElementOp = (eventName: string) => {
    return (op: ElementOp) => {
      if (!currentRoom) return;
      const room = getOrCreateRoom(currentRoom);

      switch (op.action) {
        case 'add':
          room.elements.push(op.data.element);
          break;
        case 'delete':
          room.elements = room.elements.filter(e => e.id !== op.elementId);
          break;
        case 'move': {
          const el = room.elements.find(e => e.id === op.elementId);
          if (el) { el.x = op.data.x; el.y = op.data.y; }
          break;
        }
        case 'scale': {
          const el = room.elements.find(e => e.id === op.elementId);
          if (el) { el.scale = op.data.scale; }
          break;
        }
        case 'rotate': {
          const el = room.elements.find(e => e.id === op.elementId);
          if (el) { el.rotation = op.data.rotation; }
          break;
        }
        case 'color': {
          const el = room.elements.find(e => e.id === op.elementId);
          if (el) { el.color = op.data.color; }
          break;
        }
        case 'opacity': {
          const el = room.elements.find(e => e.id === op.elementId);
          if (el) { el.opacity = op.data.opacity; }
          break;
        }
        case 'reorder': {
          const el = room.elements.find(e => e.id === op.elementId);
          if (el) { el.zIndex = op.data.zIndex; }
          break;
        }
      }

      const roomHistory = history.get(currentRoom);
      if (roomHistory) {
        roomHistory.push(op);
      }

      socket.to(currentRoom!).emit('element-update', op);
    };
  };

  const events = [
    'element-add',
    'element-move',
    'element-scale',
    'element-rotate',
    'element-delete',
    'element-color',
    'element-opacity',
    'element-reorder',
  ];

  for (const event of events) {
    socket.on(event, handleElementOp(event));
  }

  socket.on('disconnect', () => {
    if (currentRoom && currentUser) {
      const room = rooms.get(currentRoom);
      if (room) {
        room.users = room.users.filter(u => u.id !== currentUser!.id);
        io.to(currentRoom).emit('user-left', { userId: currentUser.id });
        io.to(currentRoom).emit('users-list', room.users);

        if (room.users.length === 0) {
          rooms.delete(currentRoom);
          history.delete(currentRoom);
        }
      }
    }
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`拓印信令服务器运行于端口 ${PORT}`);
});
