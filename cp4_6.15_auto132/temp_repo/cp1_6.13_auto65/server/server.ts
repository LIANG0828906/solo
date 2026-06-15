import express, { Request, Response } from 'express';
import { createServer, Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface Room {
  roomId: string;
  players: Map<string, PlayerInfo>;
  gameStarted: boolean;
}

interface PlayerInfo {
  playerId: string;
  socketId: string;
  isReady: boolean;
  joinedAt: number;
}

const DEFAULT_PORT = 3002;

function findAvailablePort(startPort: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const testServer = createServer();
    testServer.listen(startPort, () => {
      const port = (testServer.address() as { port: number }).port;
      testServer.close(() => resolve(port));
    });
    testServer.on('error', () => {
      if (startPort < 65535) {
        resolve(findAvailablePort(startPort + 1));
      } else {
        reject(new Error('No available port found'));
      }
    });
  });
}

class GameServer {
  private app: express.Application;
  private httpServer: HTTPServer;
  private io: SocketIOServer;
  private rooms: Map<string, Room> = new Map();
  private playerToRoom: Map<string, string> = new Map();
  private PORT: number = DEFAULT_PORT;

  constructor() {
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new SocketIOServer(this.httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      },
      transports: ['websocket', 'polling']
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketHandlers();
  }

  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
  }

  private setupRoutes(): void {
    this.app.get('/health', (_req: Request, res: Response) => {
      res.json({
        status: 'ok',
        rooms: this.rooms.size,
        players: this.playerToRoom.size
      });
    });

    this.app.get('/api/rooms', (_req: Request, res: Response) => {
      const roomList: Array<{
        roomId: string;
        playerCount: number;
        gameStarted: boolean;
      }> = [];

      this.rooms.forEach((room, roomId) => {
        roomList.push({
          roomId,
          playerCount: room.players.size,
          gameStarted: room.gameStarted
        });
      });

      res.json({ rooms: roomList });
    });
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`[Socket] Client connected: ${socket.id}`);

      socket.on('room:create', () => {
        this.handleCreateRoom(socket);
      });

      socket.on('room:join', (data: { roomId: string }) => {
        this.handleJoinRoom(socket, data.roomId);
      });

      socket.on('player:ready', (data: { roomId: string; isReady: boolean }) => {
        this.handlePlayerReady(socket, data.roomId, data.isReady);
      });

      socket.on('game:start', (data: { roomId: string }) => {
        this.handleGameStart(socket, data.roomId);
      });

      socket.on('game:event', (data: {
        event: string;
        data: Record<string, unknown>;
        roomId: string;
        playerId: string;
      }) => {
        this.handleGameEvent(socket, data);
      });

      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private generateRoomId(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let roomId: string;
    do {
      roomId = '';
      for (let i = 0; i < 5; i++) {
        roomId += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(roomId));
    return roomId;
  }

  private handleCreateRoom(socket: Socket): void {
    const roomId = this.generateRoomId();
    const playerId = socket.id;

    const room: Room = {
      roomId,
      players: new Map(),
      gameStarted: false
    };

    const playerInfo: PlayerInfo = {
      playerId,
      socketId: socket.id,
      isReady: false,
      joinedAt: Date.now()
    };

    room.players.set(playerId, playerInfo);
    this.rooms.set(roomId, room);
    this.playerToRoom.set(playerId, roomId);

    socket.join(roomId);

    console.log(`[Room] Created: ${roomId} by ${playerId}`);

    socket.emit('room:created', {
      roomId,
      playerId
    });
  }

  private handleJoinRoom(socket: Socket, roomId: string): void {
    const room = this.rooms.get(roomId);
    const playerId = socket.id;

    if (!room) {
      socket.emit('error', { message: '房间不存在' });
      return;
    }

    if (room.players.size >= 2) {
      socket.emit('error', { message: '房间已满' });
      return;
    }

    if (room.gameStarted) {
      socket.emit('error', { message: '游戏已开始' });
      return;
    }

    const playerInfo: PlayerInfo = {
      playerId,
      socketId: socket.id,
      isReady: false,
      joinedAt: Date.now()
    };

    room.players.set(playerId, playerInfo);
    this.playerToRoom.set(playerId, roomId);

    socket.join(roomId);

    console.log(`[Room] ${playerId} joined ${roomId}`);

    socket.emit('room:joined', {
      roomId,
      playerId,
      opponentId: Array.from(room.players.keys()).find(id => id !== playerId) || null
    });

    socket.to(roomId).emit('player:joined', {
      playerId
    });

    const readyPlayers = Array.from(room.players.values()).filter(p => p.isReady);
    if (readyPlayers.length > 0) {
      socket.emit('opponent:ready', {
        playerIds: readyPlayers.map(p => p.playerId),
        isReady: true
      });
    }
  }

  private handlePlayerReady(socket: Socket, roomId: string, isReady: boolean): void {
    const room = this.rooms.get(roomId);
    const playerId = socket.id;

    if (!room) return;

    const player = room.players.get(playerId);
    if (!player) return;

    player.isReady = isReady;

    console.log(`[Player] ${playerId} ready state: ${isReady} in ${roomId}`);

    socket.to(roomId).emit('game:event', {
      event: 'player:ready',
      data: { isReady },
      fromPlayerId: playerId
    });

    socket.emit('game:event', {
      event: 'player:ready',
      data: { isReady },
      fromPlayerId: playerId
    });
  }

  private handleGameStart(socket: Socket, roomId: string): void {
    const room = this.rooms.get(roomId);
    const playerId = socket.id;

    if (!room) return;
    if (room.gameStarted) return;

    const readyPlayers = Array.from(room.players.values()).filter(p => p.isReady);
    if (readyPlayers.length < 2) {
      socket.emit('error', { message: '需要两位玩家都准备好' });
      return;
    }

    room.gameStarted = true;
    console.log(`[Game] Started in ${roomId}`);

    this.io.to(roomId).emit('game:start', {
      roomId,
      players: Array.from(room.players.keys())
    });
  }

  private handleGameEvent(socket: Socket, data: {
    event: string;
    data: Record<string, unknown>;
    roomId: string;
    playerId: string;
  }): void {
    const room = this.rooms.get(data.roomId);
    if (!room) return;

    if (!room.players.has(data.playerId)) return;

    socket.to(data.roomId).emit('game:event', {
      event: data.event,
      data: data.data,
      fromPlayerId: data.playerId
    });
  }

  private handleDisconnect(socket: Socket): void {
    const playerId = socket.id;
    const roomId = this.playerToRoom.get(playerId);

    if (roomId) {
      const room = this.rooms.get(roomId);
      if (room) {
        room.players.delete(playerId);
        console.log(`[Socket] Client disconnected: ${playerId} from room ${roomId}`);

        if (room.players.size === 0) {
          this.rooms.delete(roomId);
          console.log(`[Room] Deleted empty room: ${roomId}`);
        } else {
          socket.to(roomId).emit('player:left', {
            playerId
          });
        }
      }
      this.playerToRoom.delete(playerId);
    } else {
      console.log(`[Socket] Client disconnected: ${playerId}`);
    }
  }

  public async start(): Promise<void> {
    const port = await findAvailablePort(DEFAULT_PORT);
    this.PORT = port;

    this.httpServer.listen(this.PORT, () => {
      console.log(`🚀 Cooking Battle Server running on http://localhost:${this.PORT}`);
      console.log(`📊 Health check: http://localhost:${this.PORT}/health`);
    });
  }
}

const server = new GameServer();
server.start();

export default server;
