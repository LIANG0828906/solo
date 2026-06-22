import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import { readFile, writeFile } from "fs/promises";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { RoomManager } from "./roomManager.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const SCORES_PATH = join(__dirname, "..", "scores.json");

const app = express();
app.use(cors());
app.use(express.json());

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: "*" },
});

const roomManager = new RoomManager(io);

interface ScoreEntry {
  nickname: string;
  score: number;
}

async function readScores(): Promise<ScoreEntry[]> {
  try {
    const data = await readFile(SCORES_PATH, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

async function writeScores(scores: ScoreEntry[]): Promise<void> {
  await writeFile(SCORES_PATH, JSON.stringify(scores, null, 2));
}

app.get("/api/scores", async (_req, res) => {
  try {
    const scores = await readScores();
    const sorted = scores.sort((a, b) => b.score - a.score).slice(0, 10);
    res.json(sorted);
  } catch {
    res.json([]);
  }
});

app.post("/api/scores", async (req, res) => {
  try {
    const { nickname, score } = req.body;
    if (!nickname || typeof score !== "number") {
      res.status(400).json({ error: "Invalid data" });
      return;
    }

    const scores = await readScores();
    const existing = scores.find((s) => s.nickname === nickname);

    if (existing) {
      if (score > existing.score) {
        existing.score = score;
      }
    } else {
      scores.push({ nickname, score });
    }

    await writeScores(scores);
    const sorted = scores.sort((a, b) => b.score - a.score).slice(0, 10);
    res.json(sorted);
  } catch {
    res.status(500).json({ error: "Failed to update score" });
  }
});

io.on("connection", (socket) => {
  socket.on("create-room", ({ nickname, roomCode }: { nickname: string; roomCode: string }) => {
    if (!/^[A-Z]{6}$/.test(roomCode)) {
      socket.emit("error-msg", "房间码必须为6位大写字母");
      return;
    }
    const success = roomManager.createRoom(socket, nickname, roomCode);
    if (!success) {
      socket.emit("error-msg", "创建房间失败，房间码已存在");
    }
  });

  socket.on("join-room", ({ nickname, roomCode }: { nickname: string; roomCode: string }) => {
    const success = roomManager.joinRoom(socket, nickname, roomCode);
    if (!success) {
      socket.emit("error-msg", "加入房间失败，请检查房间码");
    }
  });

  socket.on("start-game", () => {
    roomManager.startGame(socket);
  });

  socket.on("player-click", ({ gridIndex }: { gridIndex: number }) => {
    roomManager.handlePlayerClick(socket, gridIndex);
  });

  socket.on("disconnect", () => {
    roomManager.leaveRoom(socket);
  });
});

const PORT = 3001;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
