import { WebSocket } from 'ws';
import { PlayerState, Position, PlayerColor, GameStatus, MAZE_SIZE } from './types/game.js';
import { generateMaze } from './mazeGen.js';

export interface Player {
  id: string;
  name: string;
  ws: WebSocket;
  color: PlayerColor;
  state: PlayerState;
}

export interface Room {
  code: string;
  players: Map<string, Player>;
  gameStatus: GameStatus;
  maze: number[][] | null;
  startTime: number | null;
  countdownTimer: NodeJS.Timeout | null;
  gameLoopInterval: NodeJS.Timeout | null;
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private playerToRoom: Map<string, string> = new Map();

  public createRoom(playerName: string, ws: WebSocket): { roomCode: string; playerId: string; color: PlayerColor } {
    const roomCode = this.generateRoomCode();
    const playerId = this.generatePlayerId();

    const player: Player = {
      id: playerId,
      name: playerName,
      ws,
      color: 'blue',
      state: {
        id: playerId,
        name: playerName,
        position: { x: 0, y: 0 },
        direction: 'none',
        color: 'blue',
        steps: 0
      }
    };

    const room: Room = {
      code: roomCode,
      players: new Map([[playerId, player]]),
      gameStatus: 'waiting',
      maze: null,
      startTime: null,
      countdownTimer: null,
      gameLoopInterval: null
    };

    this.rooms.set(roomCode, room);
    this.playerToRoom.set(playerId, roomCode);

    return { roomCode, playerId, color: 'blue' };
  }

  public joinRoom(
    roomCode: string,
    playerName: string,
    ws: WebSocket
  ): { playerId: string; color: PlayerColor; opponentName: string } | null {
    const room = this.rooms.get(roomCode);

    if (!room) {
      return null;
    }

    if (room.players.size >= 2) {
      return null;
    }

    const playerId = this.generatePlayerId();
    const opponent = Array.from(room.players.values())[0];

    const player: Player = {
      id: playerId,
      name: playerName,
      ws,
      color: 'pink',
      state: {
        id: playerId,
        name: playerName,
        position: { x: MAZE_SIZE - 1, y: MAZE_SIZE - 1 },
        direction: 'none',
        color: 'pink',
        steps: 0
      }
    };

    room.players.set(playerId, player);
    this.playerToRoom.set(playerId, roomCode);

    return { playerId, color: 'pink', opponentName: opponent.name };
  }

  public getRoomByPlayerId(playerId: string): Room | null {
    const roomCode = this.playerToRoom.get(playerId);
    if (!roomCode) return null;
    return this.rooms.get(roomCode) || null;
  }

  public getPlayer(playerId: string): Player | null {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return null;
    return room.players.get(playerId) || null;
  }

  public getOpponent(playerId: string): Player | null {
    const room = this.getRoomByPlayerId(playerId);
    if (!room) return null;

    for (const [id, player] of room.players) {
      if (id !== playerId) {
        return player;
      }
    }
    return null;
  }

  public startGame(roomCode: string): { maze: number[][]; player1Pos: Position; player2Pos: Position } | null {
    const room = this.rooms.get(roomCode);
    if (!room || room.players.size !== 2) return null;

    const maze = generateMaze();
    room.maze = maze;
    room.gameStatus = 'countdown';

    const players = Array.from(room.players.values());
    players[0].state.position = { x: 0, y: 0 };
    players[0].state.steps = 0;
    players[1].state.position = { x: MAZE_SIZE - 1, y: MAZE_SIZE - 1 };
    players[1].state.steps = 0;

    return {
      maze,
      player1Pos: players[0].state.position,
      player2Pos: players[1].state.position
    };
  }

  public removePlayer(playerId: string): void {
    const roomCode = this.playerToRoom.get(playerId);
    if (!roomCode) return;

    const room = this.rooms.get(roomCode);
    if (room) {
      room.players.delete(playerId);

      if (room.countdownTimer) {
        clearTimeout(room.countdownTimer);
      }
      if (room.gameLoopInterval) {
        clearInterval(room.gameLoopInterval);
      }

      if (room.players.size === 0) {
        this.rooms.delete(roomCode);
      }
    }

    this.playerToRoom.delete(playerId);
  }

  public cleanupEmptyRooms(): void {
    for (const [code, room] of this.rooms) {
      if (room.players.size === 0) {
        this.rooms.delete(code);
      }
    }
  }

  private generateRoomCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    do {
      code = '';
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
    } while (this.rooms.has(code));
    return code;
  }

  private generatePlayerId(): string {
    return 'player_' + Math.random().toString(36).substr(2, 9);
  }

  public getRoomSize(): number {
    return this.rooms.size;
  }
}
