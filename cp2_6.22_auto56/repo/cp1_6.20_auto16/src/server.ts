import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as WebSocketServer, WebSocket } from 'ws';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import SimpleJsonDb from 'simple-json-db';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import {
  User,
  Player,
  Room,
  Problem,
  TestResult,
  FinalPlayerResult,
  WebSocketMessage,
  BUILT_IN_PROBLEMS
} from './types/index.js';
import { evaluateCode } from './utils/codeExecutor.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new SimpleJsonDb(path.join(dataDir, 'db.json'));

if (!db.get('users')) {
  db.set('users', []);
}
if (!db.get('rooms')) {
  db.set('rooms', []);
}

const JWT_SECRET = 'code-arena-secret-key';
const JWT_EXPIRES_IN = '7d';

const sockets = new Map<string, WebSocket>();
const activeRooms = new Map<string, Room>();
const socketToRoom = new Map<string, string>();
const socketToUser = new Map<string, { userId: string; username: string }>();

const DEFAULT_CODE = `// Write your solution here
function solution() {
  return null;
}
`;

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

interface AuthRequest extends Request {
  user?: { userId: string; username: string };
}

function authenticateToken(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ success: false, error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ success: false, error: 'Invalid or expired token' });
  }
}

app.post('/api/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, error: 'Username and password are required' });
      return;
    }

    const users = db.get('users') as User[];
    
    if (users.find(u => u.username === username)) {
      res.status(400).json({ success: false, error: 'Username already exists' });
      return;
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user: User = {
      id: uuidv4(),
      username,
      passwordHash,
      createdAt: new Date().toISOString(),
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    };

    users.push(user);
    db.set('users', users);

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ success: false, error: 'Username and password are required' });
      return;
    }

    const users = db.get('users') as User[];
    const user = users.find(u => u.username === username);

    if (!user || !await bcrypt.compare(password, user.passwordHash)) {
      res.status(401).json({ success: false, error: 'Invalid username or password' });
      return;
    }

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    res.status(200).json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.get('/api/user/info', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const users = db.get('users') as User[];
    const user = users.find(u => u.id === req.user?.userId);

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('Get user info error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.get('/api/rooms', (req: Request, res: Response): void => {
  try {
    const rooms = Array.from(activeRooms.values())
      .filter(room => room.status === 'waiting')
      .map(room => ({
        id: room.id,
        name: room.name,
        status: room.status,
        players: room.players.map(p => ({
          id: p.userId,
          username: p.username
        })),
        maxPlayers: 2
      }));

    res.status(200).json({ success: true, rooms });
  } catch (err) {
    console.error('Get rooms error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/rooms', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { name } = req.body;
    const userId = req.user?.userId;
    const username = req.user?.username;

    if (!name) {
      res.status(400).json({ success: false, error: 'Room name is required' });
      return;
    }

    if (!userId || !username) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const roomId = uuidv4();
    const room: Room = {
      id: roomId,
      name,
      status: 'waiting',
      players: [],
      problem: null,
      startTime: null,
      endTime: null,
      maxTime: 300,
      timerInterval: null,
      evaluationInterval: null
    };

    activeRooms.set(roomId, room);

    res.status(201).json({
      success: true,
      room: {
        id: room.id,
        name: room.name,
        status: room.status,
        players: room.players,
        maxPlayers: 2
      }
    });
  } catch (err) {
    console.error('Create room error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

app.post('/api/rooms/:roomId/join', authenticateToken, (req: AuthRequest, res: Response): void => {
  try {
    const { roomId } = req.params;
    const userId = req.user?.userId;
    const username = req.user?.username;

    if (!userId || !username) {
      res.status(401).json({ success: false, error: 'Unauthorized' });
      return;
    }

    const room = activeRooms.get(roomId);

    if (!room) {
      res.status(404).json({ success: false, error: 'Room not found' });
      return;
    }

    if (room.status !== 'waiting') {
      res.status(400).json({ success: false, error: 'Room is not available' });
      return;
    }

    if (room.players.length >= 2) {
      res.status(400).json({ success: false, error: 'Room is full' });
      return;
    }

    if (room.players.find(p => p.userId === userId)) {
      res.status(400).json({ success: false, error: 'You are already in this room' });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Ready to join via WebSocket',
      roomId: room.id
    });
  } catch (err) {
    console.error('Join room error:', err);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});

function broadcastToRoom(roomId: string, message: WebSocketMessage): void {
  const room = activeRooms.get(roomId);
  if (!room) return;

  const messageStr = JSON.stringify(message);
  room.players.forEach(player => {
    const ws = sockets.get(player.socketId);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
    }
  });
}

function broadcastScoreUpdate(roomId: string): void {
  const room = activeRooms.get(roomId);
  if (!room) return;

  broadcastToRoom(roomId, {
    type: 'score_update',
    payload: {
      players: room.players.map(p => ({
        userId: p.userId,
        username: p.username,
        score: p.score,
        linesOfCode: p.linesOfCode,
        testResults: p.testResults
      })),
      timeRemaining: room.endTime ? Math.max(0, room.endTime - Date.now()) : 0
    }
  });
}

async function evaluatePlayerCode(player: Player, problem: Problem): Promise<void> {
  try {
    const results = await evaluateCode(player.code, problem);
    player.testResults = results;
    player.score = results.filter(r => r.passed).length;
    player.lastEvaluated = Date.now();
  } catch (err) {
    console.error('Error evaluating code:', err);
    player.testResults = [];
    player.score = 0;
  }
}

function handleCodeUpdate(socketId: string, roomId: string, payload: any): void {
  const room = activeRooms.get(roomId);
  if (!room || room.status !== 'playing') return;

  const player = room.players.find(p => p.socketId === socketId);
  if (!player) return;

  const { code } = payload;
  if (typeof code !== 'string') return;

  player.code = code;
  player.linesOfCode = code.split('\n').length;
  player.lastCodeChange = Date.now();

  broadcastScoreUpdate(roomId);
}

function handleWebSocketMessage(socketId: string, message: WebSocketMessage): void {
  const roomId = socketToRoom.get(socketId);
  if (!roomId) return;

  const room = activeRooms.get(roomId);
  if (!room) return;

  const player = room.players.find(p => p.socketId === socketId);
  if (!player) return;

  switch (message.type) {
    case 'code_update':
      handleCodeUpdate(socketId, roomId, message.payload);
      break;
    default:
      console.log('Unknown message type:', message.type);
  }
}

function endGame(roomId: string): void {
  const room = activeRooms.get(roomId);
  if (!room || room.status === 'finished') return;

  if (room.timerInterval) {
    clearInterval(room.timerInterval);
    room.timerInterval = null;
  }
  if (room.evaluationInterval) {
    clearInterval(room.evaluationInterval);
    room.evaluationInterval = null;
  }

  room.status = 'finished';

  if (room.problem) {
    room.players.forEach(async player => {
      await evaluatePlayerCode(player, room.problem!);
    });
  }

  const sortedPlayers = [...room.players].sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.linesOfCode - b.linesOfCode;
  });

  const results: FinalPlayerResult[] = sortedPlayers.map((player, index) => ({
    userId: player.userId,
    username: player.username,
    score: player.score,
    linesOfCode: player.linesOfCode,
    testResults: player.testResults,
    rank: index + 1
  }));

  broadcastToRoom(roomId, {
    type: 'game_end',
    payload: {
      results,
      problem: room.problem
    }
  });

  setTimeout(() => {
    room.players.forEach(player => {
      const ws = sockets.get(player.socketId);
      if (ws) {
        ws.close();
        sockets.delete(player.socketId);
        socketToRoom.delete(player.socketId);
        socketToUser.delete(player.socketId);
      }
    });
    activeRooms.delete(roomId);
  }, 10000);
}

function startGame(roomId: string): void {
  const room = activeRooms.get(roomId);
  if (!room) return;

  const randomIndex = Math.floor(Math.random() * BUILT_IN_PROBLEMS.length);
  const problem = BUILT_IN_PROBLEMS[randomIndex];

  room.status = 'playing';
  room.problem = problem;
  room.startTime = Date.now();
  room.endTime = room.startTime + room.maxTime * 1000;

  const initialCode = `function ${problem.functionName}(/* parameters */) {
  // Write your solution here
  return null;
}
`;
  room.players.forEach(player => {
    player.code = initialCode;
    player.linesOfCode = initialCode.split('\n').length;
    player.testResults = [];
    player.score = 0;
    player.lastCodeChange = Date.now();
    player.lastEvaluated = 0;
  });

  broadcastToRoom(roomId, {
    type: 'game_start',
    payload: {
      problem: {
        id: problem.id,
        title: problem.title,
        description: problem.description,
        functionName: problem.functionName,
        testCases: problem.testCases.map(tc => ({
          input: tc.input,
          expected: tc.expected
        }))
      },
      startTime: room.startTime,
      endTime: room.endTime,
      maxTime: room.maxTime,
      players: room.players.map(p => ({
        userId: p.userId,
        username: p.username,
        score: p.score,
        linesOfCode: p.linesOfCode
      }))
    }
  });

  room.evaluationInterval = setInterval(async () => {
    if (room.status !== 'playing') return;

    let scoresChanged = false;

    for (const player of room.players) {
      if (player.lastCodeChange > player.lastEvaluated) {
        const previousScore = player.score;
        await evaluatePlayerCode(player, room.problem!);
        if (player.score !== previousScore) {
          scoresChanged = true;
        }
      }
    }

    if (scoresChanged) {
      broadcastScoreUpdate(roomId);
    }

    if (Date.now() >= room.endTime!) {
      endGame(roomId);
    }
  }, 5000);

  room.timerInterval = setInterval(() => {
    if (room.status !== 'playing') return;

    const timeRemaining = room.endTime ? Math.max(0, room.endTime - Date.now()) : 0;

    broadcastToRoom(roomId, {
      type: 'time_update',
      payload: { timeRemaining }
    });

    if (timeRemaining <= 0) {
      endGame(roomId);
    }
  }, 1000);
}

function handleSocketDisconnect(socketId: string): void {
  const roomId = socketToRoom.get(socketId);
  if (!roomId) return;

  const room = activeRooms.get(roomId);
  if (!room) return;

  room.players = room.players.filter(p => p.socketId !== socketId);

  sockets.delete(socketId);
  socketToRoom.delete(socketId);
  socketToUser.delete(socketId);

  if (room.status === 'waiting') {
    broadcastToRoom(roomId, {
      type: 'player_left',
      payload: {
        players: room.players.map(p => ({
          userId: p.userId,
          username: p.username
        }))
      }
    });
  }

  if (room.status === 'playing') {
    const remainingPlayer = room.players[0];
    if (remainingPlayer) {
      broadcastToRoom(roomId, {
        type: 'game_end',
        payload: {
          results: [{
            userId: remainingPlayer.userId,
            username: remainingPlayer.username,
            score: remainingPlayer.score,
            linesOfCode: remainingPlayer.linesOfCode,
            testResults: remainingPlayer.testResults,
            rank: 1
          }],
          reason: 'opponent_disconnected'
        }
      });
    }
    endGame(roomId);
  }

  if (room.players.length === 0) {
    if (room.timerInterval) clearInterval(room.timerInterval);
    if (room.evaluationInterval) clearInterval(room.evaluationInterval);
    activeRooms.delete(roomId);
  }
}

wss.on('connection', (ws: WebSocket, req: http.IncomingMessage): void => {
  try {
    const url = new URL(req.url || '', `http://${req.headers.host}`);
    const token = url.searchParams.get('token');
    const roomId = url.searchParams.get('roomId');

    if (!token || !roomId) {
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: 'Token and roomId are required' }
      }));
      ws.close();
      return;
    }

    let decoded: { userId: string; username: string };
    try {
      decoded = jwt.verify(token, JWT_SECRET) as { userId: string; username: string };
    } catch (err) {
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: 'Invalid or expired token' }
      }));
      ws.close();
      return;
    }

    const { userId, username } = decoded;

    const room = activeRooms.get(roomId);
    if (!room) {
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: 'Room not found' }
      }));
      ws.close();
      return;
    }

    if (room.status !== 'waiting') {
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: 'Room is not available' }
      }));
      ws.close();
      return;
    }

    if (room.players.length >= 2) {
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: 'Room is full' }
      }));
      ws.close();
      return;
    }

    if (room.players.find(p => p.userId === userId)) {
      ws.send(JSON.stringify({
        type: 'error',
        payload: { message: 'You are already in this room' }
      }));
      ws.close();
      return;
    }

    const socketId = uuidv4();

    const player: Player = {
      userId,
      username,
      socketId,
      code: DEFAULT_CODE,
      score: 0,
      linesOfCode: DEFAULT_CODE.split('\n').length,
      testResults: [],
      lastCodeChange: Date.now(),
      lastEvaluated: 0
    };

    room.players.push(player);

    socketToRoom.set(socketId, roomId);
    socketToUser.set(socketId, { userId, username });
    sockets.set(socketId, ws);

    broadcastToRoom(roomId, {
      type: 'player_joined',
      payload: {
        players: room.players.map(p => ({
          userId: p.userId,
          username: p.username,
          score: p.score,
          linesOfCode: p.linesOfCode
        }))
      }
    });

    ws.send(JSON.stringify({
      type: 'joined',
      payload: {
        roomId: room.id,
        playerId: socketId,
        players: room.players.map(p => ({
          userId: p.userId,
          username: p.username,
          score: p.score,
          linesOfCode: p.linesOfCode
        }))
      }
    }));

    if (room.players.length === 2) {
      startGame(roomId);
    }

    ws.on('message', (data: WebSocket.Data): void => {
      try {
        const message: WebSocketMessage = JSON.parse(data.toString());
        handleWebSocketMessage(socketId, message);
      } catch (err) {
        console.error('WebSocket message error:', err);
        ws.send(JSON.stringify({
          type: 'error',
          payload: { message: 'Invalid message format' }
        }));
      }
    });

    ws.on('close', (): void => {
      handleSocketDisconnect(socketId);
    });

  } catch (err) {
    console.error('WebSocket connection error:', err);
    ws.close();
  }
});

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`Code Arena server running on port ${PORT}`);
  console.log(`WebSocket server ready`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
