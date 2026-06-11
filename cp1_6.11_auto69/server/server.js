import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());

const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const rooms = new Map();

function generateShareCode() {
  let code;
  do {
    code = Math.floor(10000000 + Math.random() * 90000000).toString();
  } while (rooms.has(code));
  return code;
}

function createRecipe(recipeName) {
  return {
    id: uuidv4(),
    name: recipeName,
    servings: 4,
    baseServings: 4,
    ingredients: [],
    steps: [],
    shareCode: '',
  };
}

function createRoom(recipeName) {
  const shareCode = generateShareCode();
  const recipe = createRecipe(recipeName);
  recipe.shareCode = shareCode;

  const room = {
    shareCode,
    recipe,
    users: [],
    createdAt: Date.now(),
  };

  rooms.set(shareCode, room);
  console.log(`Room created: ${shareCode}`);
  return room;
}

function getRoom(shareCode) {
  return rooms.get(shareCode) || null;
}

function addUserToRoom(shareCode, user) {
  const room = rooms.get(shareCode);
  if (!room) return null;

  if (room.users.length >= 6) {
    return { error: '房间已满，最多6人' };
  }

  const existingUser = room.users.find((u) => u.id === user.id);
  if (!existingUser) {
    room.users.push(user);
  }

  return room;
}

function removeUserFromRoom(shareCode, userId) {
  const room = rooms.get(shareCode);
  if (!room) return;

  room.users = room.users.filter((u) => u.id !== userId);

  if (room.users.length === 0) {
    rooms.delete(shareCode);
    console.log(`Room destroyed: ${shareCode}`);
    return null;
  }

  return room;
}

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  let currentRoomCode = null;
  let currentUserId = null;

  socket.on('create-room', ({ userId, nickname, recipeName }) => {
    const room = createRoom(recipeName);
    const user = { id: userId, nickname };

    currentRoomCode = room.shareCode;
    currentUserId = userId;

    addUserToRoom(room.shareCode, user);
    socket.join(room.shareCode);

    socket.emit('room-state', {
      recipe: room.recipe,
      users: room.users,
    });

    socket.to(room.shareCode).emit('user-joined', user);

    console.log(`User ${nickname} created room ${room.shareCode}`);
  });

  socket.on('join-room', ({ userId, nickname, shareCode }) => {
    const room = getRoom(shareCode);

    if (!room) {
      socket.emit('error', '房间不存在');
      return;
    }

    if (room.users.length >= 6) {
      socket.emit('error', '房间已满，最多6人');
      return;
    }

    const user = { id: userId, nickname };

    currentRoomCode = shareCode;
    currentUserId = userId;

    addUserToRoom(shareCode, user);
    socket.join(shareCode);

    socket.emit('room-state', {
      recipe: room.recipe,
      users: room.users,
    });

    socket.to(shareCode).emit('user-joined', user);

    console.log(`User ${nickname} joined room ${shareCode}`);
  });

  socket.on('update-recipe', ({ shareCode, recipe }) => {
    const room = getRoom(shareCode);
    if (!room) return;

    room.recipe = recipe;
    socket.to(shareCode).emit('recipe-updated', recipe);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);

    if (currentRoomCode && currentUserId) {
      const room = removeUserFromRoom(currentRoomCode, currentUserId);

      if (room) {
        io.to(currentRoomCode).emit('user-left', currentUserId);
      }
    }
  });
});

const PORT = 3002;

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Rooms: ${rooms.size}`);
});
