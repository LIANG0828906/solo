import express from 'express';
import { createServer } from 'http';
import { Server, Socket } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = 3001;

type PixelData = {
  x: number;
  y: number;
  color: string | null;
};

type FillData = {
  startX: number;
  startY: number;
  targetColor: string | null;
  replaceColor: string | null;
};

type Frame = {
  id: string;
  pixels: (string | null)[][];
  duration: number;
};

type User = {
  id: string;
  name: string;
  color: string;
  room: string;
};

const rooms: Record<
  string,
  {
    users: User[];
    pixels: (string | null)[][];
    expressionId: string | null;
    frames: Frame[];
    currentFrameIndex: number;
  }
> = {};

function createEmptyPixels(): (string | null)[][] {
  return Array.from({ length: 32 }, () => Array(32).fill(null));
}

function clonePixels(pixels: (string | null)[][]): (string | null)[][] {
  return pixels.map((row) => [...row]);
}

io.on('connection', (socket: Socket) => {
  let currentRoom: string | null = null;
  let currentUser: User | null = null;

  socket.on('join_room', ({ room, name }: { room: string; name: string }) => {
    for (const r of socket.rooms) {
      if (r !== socket.id) {
        socket.leave(r);
      }
    }
    socket.join(room);
    currentRoom = room;

    const randomColor = '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    currentUser = { id: socket.id, name, color: randomColor, room };

    if (!rooms[room]) {
      rooms[room] = {
        users: [],
        pixels: createEmptyPixels(),
        expressionId: null,
        frames: [],
        currentFrameIndex: -1,
      };
    }

    rooms[room].users.push(currentUser);

    socket.emit('room_state', {
      pixels: clonePixels(rooms[room].pixels),
      expressionId: rooms[room].expressionId,
      frames: rooms[room].frames.map((f) => ({ ...f, pixels: clonePixels(f.pixels) })),
      currentFrameIndex: rooms[room].currentFrameIndex,
    });

    io.to(room).emit('users_update', rooms[room].users);
  });

  socket.on('pixel_draw', (data: PixelData) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const { x, y, color } = data;
    if (x >= 0 && x < 32 && y >= 0 && y < 32) {
      rooms[currentRoom].pixels[y][x] = color;
      socket.to(currentRoom).emit('pixel_draw', data);
    }
  });

  socket.on('fill_area', (data: FillData) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const { startX, startY, targetColor, replaceColor } = data;
    const pixels = rooms[currentRoom].pixels;
    const stack: [number, number][] = [[startX, startY]];
    const changes: PixelData[] = [];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const [cx, cy] = stack.pop()!;
      const key = `${cx},${cy}`;
      if (visited.has(key)) continue;
      visited.add(key);
      if (cx < 0 || cx >= 32 || cy < 0 || cy >= 32) continue;
      if (pixels[cy][cx] !== targetColor) continue;
      pixels[cy][cx] = replaceColor;
      changes.push({ x: cx, y: cy, color: replaceColor });
      stack.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
    }

    if (changes.length > 0) {
      socket.to(currentRoom).emit('bulk_pixels', changes);
    }
  });

  socket.on('set_pixels', (pixels: (string | null)[][]) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    rooms[currentRoom].pixels = clonePixels(pixels);
    socket.to(currentRoom).emit('set_pixels', clonePixels(pixels));
  });

  socket.on('expression_select', (expressionId: string) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    rooms[currentRoom].expressionId = expressionId;
    socket.to(currentRoom).emit('expression_select', expressionId);
  });

  socket.on('add_frame', (frame: Frame) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    if (rooms[currentRoom].frames.length >= 12) return;
    const newFrame = { ...frame, pixels: clonePixels(frame.pixels) };
    rooms[currentRoom].frames.push(newFrame);
    rooms[currentRoom].currentFrameIndex = rooms[currentRoom].frames.length - 1;
    io.to(currentRoom).emit('frames_update', {
      frames: rooms[currentRoom].frames.map((f) => ({ ...f, pixels: clonePixels(f.pixels) })),
      currentFrameIndex: rooms[currentRoom].currentFrameIndex,
    });
  });

  socket.on('delete_frame', (index: number) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    rooms[currentRoom].frames.splice(index, 1);
    if (rooms[currentRoom].currentFrameIndex >= rooms[currentRoom].frames.length) {
      rooms[currentRoom].currentFrameIndex = rooms[currentRoom].frames.length - 1;
    }
    io.to(currentRoom).emit('frames_update', {
      frames: rooms[currentRoom].frames.map((f) => ({ ...f, pixels: clonePixels(f.pixels) })),
      currentFrameIndex: rooms[currentRoom].currentFrameIndex,
    });
  });

  socket.on('reorder_frames', ({ from, to }: { from: number; to: number }) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    const frames = rooms[currentRoom].frames;
    const [moved] = frames.splice(from, 1);
    frames.splice(to, 0, moved);
    io.to(currentRoom).emit('frames_update', {
      frames: rooms[currentRoom].frames.map((f) => ({ ...f, pixels: clonePixels(f.pixels) })),
      currentFrameIndex: rooms[currentRoom].currentFrameIndex,
    });
  });

  socket.on('update_frame_duration', ({ index, duration }: { index: number; duration: number }) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    if (index >= 0 && index < rooms[currentRoom].frames.length) {
      rooms[currentRoom].frames[index].duration = duration;
      io.to(currentRoom).emit('frames_update', {
        frames: rooms[currentRoom].frames.map((f) => ({ ...f, pixels: clonePixels(f.pixels) })),
        currentFrameIndex: rooms[currentRoom].currentFrameIndex,
      });
    }
  });

  socket.on('select_frame', (index: number) => {
    if (!currentRoom || !rooms[currentRoom]) return;
    rooms[currentRoom].currentFrameIndex = index;
    socket.to(currentRoom).emit('select_frame', index);
  });

  socket.on('undo', () => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('undo');
  });

  socket.on('redo', () => {
    if (!currentRoom) return;
    socket.to(currentRoom).emit('redo');
  });

  socket.on('disconnect', () => {
    if (!currentRoom || !rooms[currentRoom] || !currentUser) return;
    rooms[currentRoom].users = rooms[currentRoom].users.filter((u) => u.id !== currentUser!.id);
    if (rooms[currentRoom].users.length === 0) {
      delete rooms[currentRoom];
    } else {
      io.to(currentRoom).emit('users_update', rooms[currentRoom].users);
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
