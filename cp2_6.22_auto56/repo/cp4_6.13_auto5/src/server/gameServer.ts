import { WebSocketServer, WebSocket } from 'ws';
import { RoomManager, Player, Room } from './roomManager.js';
import {
  ClientMessage,
  ServerMessage,
  Direction,
  Position,
  GameStatus,
  MAZE_SIZE,
  CELL_WALL,
  CELL_PATH,
  GameStats,
  PlayerState
} from './types/game.js';

const PORT = 8080;
const STATE_SYNC_INTERVAL = 1000 / 30;

const wss = new WebSocketServer({ port: PORT });
const roomManager = new RoomManager();

const playerConnections = new Map<string, WebSocket>();

console.log(`[Cyber Maze Server] WebSocket server starting on port ${PORT}...`);

wss.on('connection', (ws: WebSocket) => {
  let currentPlayerId: string | null = null;

  console.log('[Cyber Maze Server] New client connected');

  ws.on('message', (data: string) => {
    try {
      const message: ClientMessage = JSON.parse(data);
      handleMessage(message, ws);
    } catch (error) {
      console.error('[Cyber Maze Server] Failed to parse message:', error);
      sendError(ws, '无效的消息格式');
    }
  });

  ws.on('close', () => {
    console.log('[Cyber Maze Server] Client disconnected');
    if (currentPlayerId) {
      handlePlayerDisconnect(currentPlayerId);
    }
  });

  ws.on('error', (error) => {
    console.error('[Cyber Maze Server] WebSocket error:', error);
  });

  function handleMessage(message: ClientMessage, ws: WebSocket) {
    switch (message.type) {
      case 'CREATE_ROOM':
        handleCreateRoom(message.playerName, ws);
        break;
      case 'JOIN_ROOM':
        handleJoinRoom(message.roomCode, message.playerName, ws);
        break;
      case 'PLAYER_INPUT':
        if (currentPlayerId) {
          handlePlayerInput(currentPlayerId, message.direction, message.timestamp);
        }
        break;
      case 'RESTART_GAME':
        if (currentPlayerId) {
          handleRestartGame(currentPlayerId);
        }
        break;
      case 'LEAVE_ROOM':
        if (currentPlayerId) {
          handleLeaveRoom(currentPlayerId);
        }
        break;
      default:
        console.log('[Cyber Maze Server] Unknown message type:', message);
    }
  }

  function handleCreateRoom(playerName: string, ws: WebSocket) {
    const result = roomManager.createRoom(playerName, ws);
    currentPlayerId = result.playerId;
    playerConnections.set(result.playerId, ws);

    send(ws, {
      type: 'ROOM_CREATED',
      roomCode: result.roomCode,
      playerId: result.playerId,
      color: result.color
    });

    send(ws, { type: 'WAITING_FOR_OPPONENT' });

    console.log(`[Cyber Maze Server] Room created: ${result.roomCode} by ${playerName}`);
  }

  function handleJoinRoom(roomCode: string, playerName: string, ws: WebSocket) {
    const result = roomManager.joinRoom(roomCode.toUpperCase(), playerName, ws);

    if (!result) {
      sendError(ws, '房间不存在或已满');
      return;
    }

    currentPlayerId = result.playerId;
    playerConnections.set(result.playerId, ws);

    send(ws, {
      type: 'ROOM_JOINED',
      roomCode,
      playerId: result.playerId,
      color: result.color,
      opponentName: result.opponentName
    });

    const opponent = roomManager.getOpponent(result.playerId);
    if (opponent) {
      send(opponent.ws, {
        type: 'OPPONENT_JOINED',
        opponentName: playerName
      });
    }

    console.log(`[Cyber Maze Server] Player ${playerName} joined room: ${roomCode}`);

    setTimeout(() => startCountdown(roomCode), 500);
  }

  function startCountdown(roomCode: string) {
    const room = roomManager.getRoomByPlayerId(
      Array.from(roomManager['rooms'].get(roomCode)!.players.keys())[0]
    );
    if (!room) return;

    const gameData = roomManager.startGame(roomCode);
    if (!gameData) return;

    let count = 3;

    const sendCountdown = () => {
      broadcastToRoom(room, { type: 'COUNTDOWN', count });

      if (count > 0) {
        count--;
        room.countdownTimer = setTimeout(sendCountdown, 1000);
      } else {
        startGame(room, gameData);
      }
    };

    sendCountdown();
  }

  function startGame(room: Room, gameData: { maze: number[][]; player1Pos: Position; player2Pos: Position }) {
    room.gameStatus = 'playing';
    room.startTime = Date.now();

    broadcastToRoom(room, {
      type: 'GAME_START',
      maze: gameData.maze,
      player1Pos: gameData.player1Pos,
      player2Pos: gameData.player2Pos,
      countdown: 0
    });

    console.log(`[Cyber Maze Server] Game started in room: ${room.code}`);

    room.gameLoopInterval = setInterval(() => {
      syncGameState(room);
    }, STATE_SYNC_INTERVAL);
  }

  function handlePlayerInput(playerId: string, direction: Direction, timestamp: number) {
    const player = roomManager.getPlayer(playerId);
    const room = roomManager.getRoomByPlayerId(playerId);

    if (!player || !room || room.gameStatus !== 'playing' || !room.maze) {
      return;
    }

    const newPos = calculateNewPosition(player.state.position, direction);

    if (isValidMove(room.maze, newPos)) {
      player.state.position = newPos;
      player.state.direction = direction;
      player.state.steps++;

      broadcastToRoom(room, {
        type: 'PLAYER_MOVE',
        playerId,
        position: newPos,
        direction
      });

      if (checkWinCondition(player, room)) {
        endGame(room, player);
      }
    } else {
      send(player.ws, {
        type: 'COLLISION',
        playerId,
        position: player.state.position
      });
    }
  }

  function calculateNewPosition(current: Position, direction: Direction): Position {
    const delta: Record<Direction, Position> = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
      none: { x: 0, y: 0 }
    };
    return {
      x: current.x + delta[direction].x,
      y: current.y + delta[direction].y
    };
  }

  function isValidMove(maze: number[][], pos: Position): boolean {
    if (pos.x < 0 || pos.x >= MAZE_SIZE || pos.y < 0 || pos.y >= MAZE_SIZE) {
      return false;
    }
    return maze[pos.y][pos.x] === CELL_PATH;
  }

  function checkWinCondition(player: Player, room: Room): boolean {
    const targetPos = player.color === 'blue'
      ? { x: MAZE_SIZE - 1, y: MAZE_SIZE - 1 }
      : { x: 0, y: 0 };

    return player.state.position.x === targetPos.x &&
           player.state.position.y === targetPos.y;
  }

  function endGame(room: Room, winner: Player) {
    room.gameStatus = 'ended';

    if (room.gameLoopInterval) {
      clearInterval(room.gameLoopInterval);
      room.gameLoopInterval = null;
    }

    const duration = Date.now() - (room.startTime || Date.now());
    const players = Array.from(room.players.values());
    const loser = players.find(p => p.id !== winner.id)!;

    const stats: GameStats = {
      winnerName: winner.name,
      winnerColor: winner.color,
      duration,
      winnerSteps: winner.state.steps,
      loserSteps: loser.state.steps
    };

    broadcastToRoom(room, {
      type: 'GAME_END',
      winner: winner.id,
      stats
    });

    console.log(`[Cyber Maze Server] Game ended in room ${room.code}. Winner: ${winner.name}`);
  }

  function syncGameState(room: Room) {
    if (room.gameStatus !== 'playing') return;

    const players: PlayerState[] = Array.from(room.players.values()).map(p => ({
      id: p.id,
      name: p.name,
      position: { ...p.state.position },
      direction: p.state.direction,
      color: p.state.color,
      steps: p.state.steps
    }));

    broadcastToRoom(room, {
      type: 'GAME_STATE',
      players,
      gameStatus: room.gameStatus,
      timestamp: Date.now()
    });
  }

  function handleRestartGame(playerId: string) {
    const room = roomManager.getRoomByPlayerId(playerId);
    if (!room || room.gameStatus !== 'ended') return;

    const players = Array.from(room.players.values());
    const allReady = players.every(p => {
      // 简化：只要有一个玩家请求重开就开始
      return true;
    });

    if (allReady) {
      startCountdown(room.code);
    }
  }

  function handleLeaveRoom(playerId: string) {
    handlePlayerDisconnect(playerId);
  }

  function handlePlayerDisconnect(playerId: string) {
    const opponent = roomManager.getOpponent(playerId);
    if (opponent) {
      sendError(opponent.ws, '对手已断开连接');
    }

    roomManager.removePlayer(playerId);
    playerConnections.delete(playerId);
    currentPlayerId = null;

    roomManager.cleanupEmptyRooms();
  }
});

function send(ws: WebSocket, message: ServerMessage) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(message));
  }
}

function sendError(ws: WebSocket, message: string) {
  send(ws, { type: 'ERROR', message });
}

function broadcastToRoom(room: Room, message: ServerMessage) {
  for (const player of room.players.values()) {
    send(player.ws, message);
  }
}

wss.on('listening', () => {
  console.log(`[Cyber Maze Server] Server is listening on ws://localhost:${PORT}`);
  console.log(`[Cyber Maze Server] Ready for connections!`);
});

process.on('SIGINT', () => {
  console.log('\n[Cyber Maze Server] Shutting down...');
  wss.close();
  process.exit(0);
});
