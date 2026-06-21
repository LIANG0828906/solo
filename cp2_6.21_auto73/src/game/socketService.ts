import { io, Socket } from 'socket.io-client';
import type { GameEngine } from './gameEngine';
import type { Cell, Player, PlayerId, InitialGameData, MoveAction } from './types';

export interface SocketServiceOptions {
  url?: string;
  useMock?: boolean;
}

type EventCallback = (...args: unknown[]) => void;

export class SocketService {
  private socket: Socket | null = null;
  private useMock: boolean;
  private url: string;
  private mockTimer: ReturnType<typeof setTimeout> | null = null;
  private mockAiTimer: ReturnType<typeof setTimeout> | null = null;
  private listeners: Map<string, Set<EventCallback>> = new Map();
  private gameEngine: GameEngine | null = null;
  private yourPlayerId: PlayerId = '';
  private isConnected: boolean = false;

  constructor(options: SocketServiceOptions = {}) {
    this.url = options.url || 'http://localhost:3000';
    this.useMock = options.useMock !== false;
  }

  setGameEngine(engine: GameEngine): void {
    this.gameEngine = engine;
  }

  connect(): Promise<void> {
    if (this.useMock) {
      return this.mockConnect();
    }

    return new Promise((resolve, reject) => {
      this.socket = io(this.url, {
        transports: ['websocket', 'polling'],
      });

      this.socket.on('connect', () => {
        this.isConnected = true;
        resolve();
      });

      this.socket.on('connect_error', (error: Error) => {
        reject(error);
      });

      this.socket.on('disconnect', () => {
        this.isConnected = false;
      });

      this.registerSocketEvents();
    });
  }

  private mockConnect(): Promise<void> {
    return new Promise((resolve) => {
      this.mockTimer = setTimeout(() => {
        this.isConnected = true;
        resolve();
      }, 300);
    });
  }

  private registerSocketEvents(): void {
    if (!this.socket) return;

    this.socket.on('match_found', (data: { yourPlayerId: string }) => {
      this.yourPlayerId = data.yourPlayerId;
      this.emit('match_found', data);
    });

    this.socket.on('game_start', (data: InitialGameData) => {
      this.yourPlayerId = data.yourPlayerId;
      this.emit('game_start', data);
    });

    this.socket.on('move_result', (data: MoveAction) => {
      this.emit('move_result', data);
    });

    this.socket.on('turn_timeout', (data: { playerId: string }) => {
      this.emit('turn_timeout', data);
    });

    this.socket.on('game_end', (data: { winner: string | null }) => {
      this.emit('game_end', data);
    });
  }

  joinQueue(playerName?: string): void {
    if (this.useMock) {
      this.mockJoinQueue(playerName);
      return;
    }
    this.socket?.emit('join_queue', { playerName });
  }

  private mockJoinQueue(_playerName?: string): void {
    this.yourPlayerId = 'player1';

    setTimeout(() => {
      this.emit('match_found', { yourPlayerId: 'player1' });

      setTimeout(() => {
        if (!this.gameEngine) return;

        const board = this.gameEngine.generateRandomBoard();
        const players = this.gameEngine.createInitialPlayers();

        board[0][0].owner = 'player1';
        board[0][1].owner = 'player1';
        board[4][4].owner = 'player2';
        board[4][3].owner = 'player2';

        const initialData: InitialGameData = {
          board,
          players,
          currentPlayerId: 'player1',
          yourPlayerId: 'player1',
        };

        this.emit('game_start', initialData);
      }, 800);
    }, 1500 + Math.random() * 1000);
  }

  sendMove(pieceId: string, targetX: number, targetY: number): void {
    if (this.useMock) {
      this.mockSendMove(pieceId, targetX, targetY);
      return;
    }
    this.socket?.emit('move_piece', { pieceId, targetX, targetY });
  }

  private mockSendMove(pieceId: string, targetX: number, targetY: number): void {
    if (!this.gameEngine) return;

    const result = this.gameEngine.executeMove(pieceId, targetX, targetY);

    if (result) {
      setTimeout(() => {
        this.simulateAiTurn();
      }, 600 + Math.random() * 400);
    }
  }

  private simulateAiTurn(): void {
    if (!this.gameEngine) return;

    const state = this.gameEngine.getState();
    if (state.gameStatus !== 'playing') return;
    if (state.currentPlayerId === this.yourPlayerId) return;

    const aiPlayerId = state.currentPlayerId;
    const aiPieces = state.players[aiPlayerId].pieces;

    const validMoves: { pieceId: string; x: number; y: number; score: number }[] = [];

    for (const piece of aiPieces) {
      const directions = [
        { dx: 0, dy: -1 },
        { dx: 0, dy: 1 },
        { dx: -1, dy: 0 },
        { dx: 1, dy: 0 },
      ];

      for (const dir of directions) {
        const nx = piece.x + dir.dx;
        const ny = piece.y + dir.dy;

        if (this.gameEngine.validateMove(piece.id, nx, ny)) {
          let score = Math.random() * 2;
          const cell = state.board[ny]?.[nx];
          if (cell) {
            if (cell.owner !== aiPlayerId && cell.owner !== null) {
              score += 5;
            } else if (cell.owner === null) {
              score += 3;
            }
            if (cell.terrain === 'speed') {
              score += 4;
            }
            if (cell.terrain === 'trap') {
              score -= 2;
            }
          }
          validMoves.push({ pieceId: piece.id, x: nx, y: ny, score });
        }
      }
    }

    if (validMoves.length > 0) {
      validMoves.sort((a, b) => b.score - a.score);
      const topMoves = validMoves.slice(0, Math.min(3, validMoves.length));
      const chosenMove = topMoves[Math.floor(Math.random() * topMoves.length)];

      this.mockAiTimer = setTimeout(() => {
        if (!this.gameEngine) return;
        this.gameEngine.executeMove(chosenMove.pieceId, chosenMove.x, chosenMove.y);

        const newState = this.gameEngine.getState();
        if (
          newState.gameStatus === 'playing' &&
          newState.currentPlayerId !== this.yourPlayerId &&
          newState.players[newState.currentPlayerId].remainingMoves > 0
        ) {
          setTimeout(() => this.simulateAiTurn(), 500 + Math.random() * 300);
        }
      }, 700 + Math.random() * 500);
    } else {
      this.mockAiTimer = setTimeout(() => {
        this.gameEngine?.skipTurn();
        const newState = this.gameEngine?.getState();
        if (
          newState &&
          newState.gameStatus === 'playing' &&
          newState.currentPlayerId !== this.yourPlayerId
        ) {
          setTimeout(() => this.simulateAiTurn(), 500);
        }
      }, 1000);
    }
  }

  rematch(): void {
    if (this.useMock) {
      this.mockRematch();
      return;
    }
    this.socket?.emit('rematch');
  }

  private mockRematch(): void {
    this.mockJoinQueue();
  }

  getYourPlayerId(): PlayerId {
    return this.yourPlayerId;
  }

  isYourTurn(): boolean {
    if (!this.gameEngine) return false;
    return this.gameEngine.getState().currentPlayerId === this.yourPlayerId;
  }

  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, ...args: unknown[]): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;
    for (const listener of listeners) {
      listener(...args);
    }
  }

  disconnect(): void {
    if (this.mockTimer) {
      clearTimeout(this.mockTimer);
      this.mockTimer = null;
    }
    if (this.mockAiTimer) {
      clearTimeout(this.mockAiTimer);
      this.mockAiTimer = null;
    }
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnected = false;
    this.listeners.clear();
  }

  getIsConnected(): boolean {
    return this.isConnected;
  }
}

export function createSocketService(
  engine: GameEngine,
  options?: SocketServiceOptions,
): SocketService {
  const service = new SocketService(options);
  service.setGameEngine(engine);
  return service;
}

export type { Cell, Player };
