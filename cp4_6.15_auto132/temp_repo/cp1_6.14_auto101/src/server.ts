import express from "express";
import http from "http";
import cors from "cors";
import { Server } from "socket.io";
import { Low } from "lowdb";
import { JSONFile } from "lowdb/node";
import { v4 as uuidv4 } from "uuid";

interface Player {
  id: string;
  name: string;
  color: string;
  completedTasks: string[];
}

interface Room {
  code: string;
  name: string;
  maxPlayers: number;
  players: Player[];
  createdAt: string;
  puzzleState: Record<string, boolean>;
  gameStarted: boolean;
  gameWon: boolean;
}

interface DbData {
  rooms: Room[];
}

import path from "path";

const PLAYER_COLORS = [
  "#e74c3c",
  "#3498db",
  "#2ecc71",
  "#f39c12",
  "#9b59b6",
  "#1abc9c",
  "#e67e22",
  "#ecf0f1",
];

const PUZZLE_IDS = [
  "codebox1",
  "painting1",
  "book1",
  "coop_buttons",
];

const adapter = new JSONFile<DbData>(path.join(process.cwd(), "db.json"));
const db = new Low<DbData>(adapter, { rooms: [] });

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

app.post("/api/rooms", async (req, res) => {
  await db.read();
  const { name, maxPlayers } = req.body;

  if (!name || !maxPlayers) {
    res.status(400).json({ error: "name and maxPlayers are required" });
    return;
  }

  const code = uuidv4().replace(/[^a-zA-Z0-9]/g, "").substring(0, 6).toUpperCase();

  const puzzleState: Record<string, boolean> = {};
  for (const id of PUZZLE_IDS) {
    puzzleState[id] = false;
  }

  const room: Room = {
    code,
    name,
    maxPlayers: Number(maxPlayers),
    players: [],
    createdAt: new Date().toISOString(),
    puzzleState,
    gameStarted: false,
    gameWon: false,
  };

  db.data.rooms.push(room);
  await db.write();

  res.status(201).json(room);
});

app.get("/api/rooms", async (_req, res) => {
  await db.read();
  res.json(db.data.rooms);
});

app.post("/api/rooms/:code/join", async (req, res) => {
  await db.read();
  const { code } = req.params;
  const { playerName } = req.body;

  if (!playerName) {
    res.status(400).json({ error: "playerName is required" });
    return;
  }

  const room = db.data.rooms.find((r) => r.code === code);

  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  if (room.players.length >= room.maxPlayers) {
    res.status(400).json({ error: "Room is full" });
    return;
  }

  if (room.gameStarted) {
    res.status(400).json({ error: "Game already started" });
    return;
  }

  const playerId = uuidv4();
  const colorIndex = room.players.length % PLAYER_COLORS.length;
  const player: Player = {
    id: playerId,
    name: playerName,
    color: PLAYER_COLORS[colorIndex],
    completedTasks: [],
  };

  room.players.push(player);
  await db.write();

  res.json({ player, room });
});

const cooperativeProgress: Map<
  string,
  { actionId: string; players: Set<string> }
> = new Map();

io.on("connection", (socket) => {
  console.log(`Player connected: ${socket.id}`);

  socket.on("join-room", async (data: { roomCode: string; playerId: string; playerName: string }) => {
    await db.read();
    const room = db.data.rooms.find((r) => r.code === data.roomCode);

    if (!room) {
      socket.emit("error", { message: "Room not found" });
      return;
    }

    socket.join(data.roomCode);
    socket.data = { roomCode: data.roomCode, playerId: data.playerId, playerName: data.playerName };

    socket.to(data.roomCode).emit("player-joined", {
      id: data.playerId,
      name: data.playerName,
    });

    const refreshedRoom = db.data.rooms.find((r) => r.code === data.roomCode);
    io.to(data.roomCode).emit("room-updated", refreshedRoom);

    console.log(`Player ${data.playerName} joined room ${data.roomCode}`);
  });

  socket.on("player-move", (data: { roomCode: string; position: number[]; rotation: number[] }) => {
    socket.to(data.roomCode).emit("player-moved", {
      playerId: socket.data.playerId,
      position: data.position,
      rotation: data.rotation,
    });
  });

  socket.on("interact", (data: { roomCode: string; objectId: string; action: string }) => {
    io.to(data.roomCode).emit("object-interacted", {
      playerId: socket.data.playerId,
      objectId: data.objectId,
      action: data.action,
    });
  });

  socket.on("puzzle-solved", async (data: { roomCode: string; puzzleId: string; playerId: string }) => {
    await db.read();
    const room = db.data.rooms.find((r) => r.code === data.roomCode);

    if (!room) return;

    room.puzzleState[data.puzzleId] = true;

    const player = room.players.find((p) => p.id === data.playerId);
    if (player && !player.completedTasks.includes(data.puzzleId)) {
      player.completedTasks.push(data.puzzleId);
    }

    const allSolved = Object.values(room.puzzleState).every((v) => v === true);

    if (allSolved) {
      room.gameWon = true;
      await db.write();
      io.to(data.roomCode).emit("puzzle-solved", { puzzleId: data.puzzleId, puzzleState: room.puzzleState });
      io.to(data.roomCode).emit("game-won", { room });
    } else {
      await db.write();
      io.to(data.roomCode).emit("puzzle-solved", { puzzleId: data.puzzleId, puzzleState: room.puzzleState });
    }

    console.log(`Puzzle ${data.puzzleId} solved in room ${data.roomCode}`);
  });

  socket.on("cooperative-action", async (data: { roomCode: string; actionId: string; playerId: string; requiredPlayers: number }) => {
    await db.read();
    const room = db.data.rooms.find((r) => r.code === data.roomCode);

    if (!room) return;

    const key = `${data.roomCode}:${data.actionId}`;
    let progress = cooperativeProgress.get(key);

    if (!progress) {
      progress = { actionId: data.actionId, players: new Set<string>() };
      cooperativeProgress.set(key, progress);
    }

    progress.players.add(data.playerId);

    const currentCount = progress.players.size;
    const isComplete = currentCount >= data.requiredPlayers;

    io.to(data.roomCode).emit("cooperative-progress", {
      actionId: data.actionId,
      currentPlayers: currentCount,
      requiredPlayers: data.requiredPlayers,
      isComplete,
    });

    if (isComplete) {
      room.puzzleState[data.actionId] = true;

      const player = room.players.find((p) => p.id === data.playerId);
      if (player && !player.completedTasks.includes(data.actionId)) {
        player.completedTasks.push(data.actionId);
      }

      const allSolved = Object.values(room.puzzleState).every((v) => v === true);

      if (allSolved) {
        room.gameWon = true;
      }

      await db.write();
      io.to(data.roomCode).emit("cooperative-complete", { actionId: data.actionId });

      if (allSolved) {
        io.to(data.roomCode).emit("game-won", { room });
      }

      cooperativeProgress.delete(key);
    }

    console.log(`Cooperative action ${data.actionId}: ${currentCount}/${data.requiredPlayers} in room ${data.roomCode}`);
  });

  socket.on("start-game", async (data: { roomCode: string }) => {
    await db.read();
    const room = db.data.rooms.find((r) => r.code === data.roomCode);

    if (!room) return;

    room.gameStarted = true;
    await db.write();

    io.to(data.roomCode).emit("game-started", { room });
    console.log(`Game started in room ${data.roomCode}`);
  });

  socket.on("disconnect", async () => {
    const { roomCode, playerId, playerName } = socket.data || {};

    if (!roomCode || !playerId) {
      console.log(`Player disconnected: ${socket.id}`);
      return;
    }

    await db.read();
    const room = db.data.rooms.find((r) => r.code === roomCode);

    if (room) {
      room.players = room.players.filter((p) => p.id !== playerId);
      await db.write();

      socket.to(roomCode).emit("player-left", { id: playerId, name: playerName });

      const refreshedRoom = db.data.rooms.find((r) => r.code === roomCode);
      io.to(roomCode).emit("room-updated", refreshedRoom);
    }

    for (const [key, progress] of cooperativeProgress.entries()) {
      progress.players.delete(playerId);
      if (progress.players.size === 0) {
        cooperativeProgress.delete(key);
      }
    }

    console.log(`Player ${playerName} disconnected from room ${roomCode}`);
  });
});

const PORT = 3001;

const start = async () => {
  await db.read();
  server.listen(PORT, () => {
    console.log(`Escape room server running on port ${PORT}`);
  });
};

start();
