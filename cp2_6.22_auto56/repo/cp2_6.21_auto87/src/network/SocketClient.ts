import { io, Socket } from 'socket.io-client';
import type { GameState, Position, ConnectionStatus, RoomState } from '../types/game';

export interface ServerToClientEvents {
  room_created: (data: { roomId: string; playerSide: 'player' | 'opponent' }) => void;
  room_joined: (data: { roomId: string; playerSide: 'player' | 'opponent' }) => void;
  room_state: (roomState: RoomState) => void;
  match_found: (data: { roomId: string; playerSide: 'player' | 'opponent' }) => void;
  state_update: (state: GameState) => void;
  game_over: (data: { winner: 'player' | 'opponent' }) => void;
  error: (message: string) => void;
  opponent_connected: () => void;
  opponent_disconnected: () => void;
  reconnect_success: (data: { roomId: string; playerSide: 'player' | 'opponent' }) => void;
}

export interface ClientToServerEvents {
  create_room: (data: { playerId: string }) => void;
  join_room: (data: { roomId: string; playerId: string }) => void;
  join_matchmaking: (data: { playerId: string }) => void;
  leave_matchmaking: (data: { playerId: string }) => void;
  play_card: (data: { cardId: string; targetId?: string }) => void;
  end_turn: () => void;
  deploy_unit: (data: { unitId: string; position: Position }) => void;
  state_sync: (state: GameState) => void;
  request_state: () => void;
  reconnect: (data: { roomId: string; playerId: string; lastStateVersion: number }) => void;
}

export class SocketClient {
  private socket: Socket | null = null;
  private roomId: string = '';
  private playerId: string = '';
  private connectionStatus: ConnectionStatus = 'disconnected';
  private roomState: RoomState | null = null;
  private lastStateVersion: number = 0;
  private listeners: Map<string, Set<(...args: any[]) => void>> = new Map();
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private savedPlayerId: string = '';
  private savedRoomId: string = '';

  connect(url: string = 'http://localhost:3001') {
    if (this.socket?.connected) return;

    this.setConnectionStatus('connecting');

    this.socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    }) as Socket;

    this.socket.on('connect', () => {
      this.setConnectionStatus('connected');
      this.reconnectAttempts = 0;
      this.emit('connected');
    });

    this.socket.on('disconnect', () => {
      this.setConnectionStatus('disconnected');
      this.emit('disconnected');
    });

    this.socket.on('connect_error', () => {
      this.setConnectionStatus('disconnected');
    });

    this.socket.on('reconnect', (attemptNumber: number) => {
      this.setConnectionStatus('reconnecting');
      this.reconnectAttempts = attemptNumber;
      this.emit('reconnecting', attemptNumber);
      this.attemptRejoinRoom();
    });

    this.socket.on('reconnect_failed', () => {
      this.setConnectionStatus('disconnected');
      this.emit('reconnect_failed');
    });

    this.socket.on('room_created', (data: { roomId: string; playerSide: 'player' | 'opponent' }) => {
      this.roomId = data.roomId;
      this.savedRoomId = data.roomId;
      this.emit('room_created', data);
    });

    this.socket.on('room_joined', (data: { roomId: string; playerSide: 'player' | 'opponent' }) => {
      this.roomId = data.roomId;
      this.savedRoomId = data.roomId;
      this.emit('room_joined', data);
    });

    this.socket.on('room_state', (roomState: RoomState) => {
      this.roomState = roomState;
      this.emit('room_state', roomState);
    });

    this.socket.on('match_found', (data: { roomId: string; playerSide: 'player' | 'opponent' }) => {
      this.roomId = data.roomId;
      this.savedRoomId = data.roomId;
      this.emit('match_found', data);
    });

    this.socket.on('state_update', (state: GameState) => {
      if (this.shouldApplyState(state.stateVersion)) {
        this.lastStateVersion = state.stateVersion;
        this.emit('state_update', state);
      }
    });

    this.socket.on('game_over', (data: { winner: 'player' | 'opponent' }) => {
      this.emit('game_over', data);
    });

    this.socket.on('error', (message: string) => {
      this.emit('error', message);
    });

    this.socket.on('opponent_connected', () => {
      this.emit('opponent_connected');
    });

    this.socket.on('opponent_disconnected', () => {
      this.emit('opponent_disconnected');
    });

    this.socket.on('reconnect_success', (data: { roomId: string; playerSide: 'player' | 'opponent' }) => {
      this.roomId = data.roomId;
      this.setConnectionStatus('connected');
      this.emit('reconnect_success', data);
      this.requestState();
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.setConnectionStatus('disconnected');
    this.roomId = '';
    this.roomState = null;
    this.lastStateVersion = 0;
  }

  createRoom(playerId: string): Promise<{ roomId: string; playerSide: 'player' | 'opponent' }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.playerId = playerId;
      this.savedPlayerId = playerId;

      const onRoomCreated = (data: { roomId: string; playerSide: 'player' | 'opponent' }) => {
        this.off('room_created', onRoomCreated);
        this.off('error', onError);
        resolve(data);
      };

      const onError = (message: string) => {
        this.off('room_created', onRoomCreated);
        this.off('error', onError);
        reject(new Error(message));
      };

      this.on('room_created', onRoomCreated);
      this.on('error', onError);

      this.socket.emit('create_room', { playerId });
    });
  }

  joinRoom(roomId: string, playerId: string): Promise<{ roomId: string; playerSide: 'player' | 'opponent' }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.playerId = playerId;
      this.savedPlayerId = playerId;
      this.roomId = roomId;
      this.savedRoomId = roomId;

      const onRoomJoined = (data: { roomId: string; playerSide: 'player' | 'opponent' }) => {
        this.off('room_joined', onRoomJoined);
        this.off('error', onError);
        resolve(data);
      };

      const onError = (message: string) => {
        this.off('room_joined', onRoomJoined);
        this.off('error', onError);
        reject(new Error(message));
      };

      this.on('room_joined', onRoomJoined);
      this.on('error', onError);

      this.socket.emit('join_room', { roomId, playerId });
    });
  }

  joinMatchmaking(playerId: string): Promise<{ roomId: string; playerSide: 'player' | 'opponent' }> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('Socket not connected'));
        return;
      }

      this.playerId = playerId;
      this.savedPlayerId = playerId;

      const onMatchFound = (data: { roomId: string; playerSide: 'player' | 'opponent' }) => {
        this.off('match_found', onMatchFound);
        this.off('error', onError);
        resolve(data);
      };

      const onError = (message: string) => {
        this.off('match_found', onMatchFound);
        this.off('error', onError);
        reject(new Error(message));
      };

      this.on('match_found', onMatchFound);
      this.on('error', onError);

      this.socket.emit('join_matchmaking', { playerId });
    });
  }

  leaveMatchmaking() {
    if (this.socket?.connected && this.playerId) {
      this.socket.emit('leave_matchmaking', { playerId: this.playerId });
    }
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
    if (state.stateVersion > this.lastStateVersion) {
      this.lastStateVersion = state.stateVersion;
    }
    this.socket?.emit('state_sync', state);
  }

  requestState() {
    this.socket?.emit('request_state');
  }

  private attemptRejoinRoom() {
    if (this.savedRoomId && this.savedPlayerId) {
      this.socket?.emit('reconnect', {
        roomId: this.savedRoomId,
        playerId: this.savedPlayerId,
        lastStateVersion: this.lastStateVersion,
      });
    }
  }

  private shouldApplyState(incomingVersion: number): boolean {
    return incomingVersion > this.lastStateVersion;
  }

  private setConnectionStatus(status: ConnectionStatus) {
    this.connectionStatus = status;
    this.emit('connection_status_change', status);
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

  get status(): ConnectionStatus {
    return this.connectionStatus;
  }

  get currentRoomState(): RoomState | null {
    return this.roomState;
  }

  get currentPlayerId(): string {
    return this.playerId;
  }

  get currentStateVersion(): number {
    return this.lastStateVersion;
  }
}

export const socketClient = new SocketClient();
