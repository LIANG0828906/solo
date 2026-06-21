import { io, Socket } from 'socket.io-client';
import type { GameState, Position } from '../types/game';

export interface ServerToClientEvents {
  room_joined: (data: { roomId: string; playerSide: 'player' | 'opponent' }) => void;
  state_update: (state: GameState) => void;
  game_over: (data: { winner: 'player' | 'opponent' }) => void;
  error: (message: string) => void;
  opponent_connected: () => void;
}

export interface ClientToServerEvents {
  join_room: (data: { roomId: string; playerId: string }) => void;
  play_card: (data: { cardId: string; targetId?: string }) => void;
  end_turn: () => void;
  deploy_unit: (data: { unitId: string; position: Position }) => void;
  state_sync: (state: GameState) => void;
}

export class SocketClient {
  private socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;
  private roomId: string = '';
  private playerId: string = '';
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();

  connect(url: string = 'http://localhost:3001') {
    if (this.socket?.connected) return;

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
    });

    this.socket.on('connect', () => {
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      this.emit('disconnected');
    });

    this.socket.on('room_joined', (data) => {
      this.roomId = data.roomId;
      this.emit('room_joined', data);
    });

    this.socket.on('state_update', (state) => {
      this.emit('state_update', state);
    });

    this.socket.on('game_over', (data) => {
      this.emit('game_over', data);
    });

    this.socket.on('error', (message) => {
      this.emit('error', message);
    });

    this.socket.on('opponent_connected', () => {
      this.emit('opponent_connected');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomId: string, playerId: string) {
    this.playerId = playerId;
    this.roomId = roomId;
    this.socket?.emit('join_room', { roomId, playerId });
  }

  playCard(cardId: string, targetId?: string) {
    this.socket?.emit('play_card', { cardId, targetId });
  }

  endTurn() {
    this.socket?.emit('end_turn');
  }

  deployUnit(unitId: string, position: Position) {
    this.socket?.emit('deploy_unit', { unitId, position });
  }

  syncState(state: GameState) {
    this.socket?.emit('state_sync', state);
  }

  on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: (...args: any[]) => void) {
    this.listeners.get(event)?.delete(callback);
  }

  private emit(event: string, ...args: any[]) {
    this.listeners.get(event)?.forEach((cb) => cb(...args));
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  get currentRoomId(): string {
    return this.roomId;
  }
}

export const socketClient = new SocketClient();
