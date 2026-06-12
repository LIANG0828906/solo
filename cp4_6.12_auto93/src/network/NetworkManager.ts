import {
  NetworkEventType,
  NetworkMessage,
  MatchRequestPayload,
  MatchFoundPayload,
  PlayerReadyPayload,
  AttackPayload,
  AttackResultPayload,
  EmotePayload,
  GameStateSyncPayload,
  TurnTimeoutPayload,
} from './NetworkEvents';
import { ConnectionStatus, Player, AttackResult, RECONNECT_TIMEOUT, MAX_RECONNECT_ATTEMPTS } from '../engine/types';

type MessageHandler = (message: NetworkMessage) => void;

interface PendingMessage {
  messageId: string;
  payload: AttackPayload;
  attempts: number;
  lastSent: number;
  resolve: (result: AttackResult) => void;
  reject: (error: Error) => void;
}

export class NetworkManager {
  private playerId: string;
  private playerName: string;
  private roomId: string | null = null;
  private channel: BroadcastChannel | null = null;
  private handlers: Map<NetworkEventType, MessageHandler[]> = new Map();
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private pendingMessages: Map<string, PendingMessage> = new Map();
  private reconnectAttempts = 0;
  private onConnectionStatusChange: ((status: ConnectionStatus) => void) | null = null;
  private matchTimeout: number | null = null;
  private pingInterval: number | null = null;
  private lastPongTime: number = 0;

  constructor(playerId: string, playerName: string) {
    this.playerId = playerId;
    this.playerName = playerName;
  }

  setConnectionStatusCallback(callback: (status: ConnectionStatus) => void) {
    this.onConnectionStatusChange = callback;
  }

  private setConnectionStatus(status: ConnectionStatus) {
    this.connectionStatus = status;
    if (this.onConnectionStatusChange) {
      this.onConnectionStatusChange(status);
    }
  }

  connect(): void {
    this.setConnectionStatus(ConnectionStatus.CONNECTING);
    this.channel = new BroadcastChannel('battleship-game');
    this.channel.onmessage = this.handleMessage.bind(this);
    this.setConnectionStatus(ConnectionStatus.CONNECTED);
    this.startPing();
  }

  disconnect(): void {
    this.stopPing();
    if (this.channel) {
      this.channel.close();
      this.channel = null;
    }
    this.pendingMessages.forEach((pending) => {
      pending.reject(new Error('Disconnected'));
    });
    this.pendingMessages.clear();
    this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
  }

  private startPing(): void {
    this.pingInterval = window.setInterval(() => {
      if (this.roomId && this.connectionStatus === ConnectionStatus.CONNECTED) {
        this.send(NetworkEventType.PING, { timestamp: Date.now() });
        if (Date.now() - this.lastPongTime > RECONNECT_TIMEOUT * 2) {
          this.handleConnectionLost();
        }
      }
    }, 3000);
  }

  private stopPing(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  private handleConnectionLost(): void {
    this.reconnectAttempts++;
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      this.setConnectionStatus(ConnectionStatus.DISCONNECTED);
    } else {
      this.setConnectionStatus(ConnectionStatus.RECONNECTING);
      this.send(NetworkEventType.RECONNECT, {
        playerId: this.playerId,
        attempt: this.reconnectAttempts,
      });
    }
  }

  reconnect(): void {
    this.reconnectAttempts = 0;
    this.setConnectionStatus(ConnectionStatus.CONNECTING);
    this.lastPongTime = Date.now();
    this.setConnectionStatus(ConnectionStatus.CONNECTED);
  }

  on<T>(eventType: NetworkEventType, handler: (message: NetworkMessage<T>) => void): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler as MessageHandler);
  }

  off<T>(eventType: NetworkEventType, handler: (message: NetworkMessage<T>) => void): void {
    const handlers = this.handlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler as MessageHandler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  private send<T>(type: NetworkEventType, payload: T, messageId?: string): void {
    if (!this.channel) {
      throw new Error('Not connected');
    }

    const message: NetworkMessage<T> = {
      type,
      senderId: this.playerId,
      roomId: this.roomId || '',
      timestamp: Date.now(),
      payload,
      messageId,
    };

    this.channel.postMessage(message);
  }

  private handleMessage(event: MessageEvent<NetworkMessage>): void {
    const message = event.data;

    if (message.senderId === this.playerId) {
      return;
    }

    if (message.type === NetworkEventType.PONG) {
      this.lastPongTime = Date.now();
      return;
    }

    if (message.type === NetworkEventType.PING) {
      this.send(NetworkEventType.PONG, { timestamp: Date.now() });
      return;
    }

    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
    }
  }

  findMatch(): Promise<MatchFoundPayload> {
    return new Promise((resolve, reject) => {
      this.connect();

      const matchHandler = (message: NetworkMessage<MatchFoundPayload>) => {
        if (message.payload.player1.id === this.playerId || message.payload.player2.id === this.playerId) {
          this.roomId = message.payload.roomId;
          this.off(NetworkEventType.MATCH_FOUND, matchHandler);
          if (this.matchTimeout) {
            clearTimeout(this.matchTimeout);
            this.matchTimeout = null;
          }
          this.lastPongTime = Date.now();
          resolve(message.payload);
        }
      };

      this.on(NetworkEventType.MATCH_FOUND, matchHandler);

      this.send<MatchRequestPayload>(NetworkEventType.MATCH_REQUEST, {
        playerId: this.playerId,
        playerName: this.playerName,
      });

      setTimeout(() => {
        if (!this.roomId) {
          this.createRoom();
        }
      }, 1000);

      this.matchTimeout = window.setTimeout(() => {
        this.off(NetworkEventType.MATCH_FOUND, matchHandler);
        reject(new Error('Match timeout'));
      }, 60000);
    });
  }

  private waitingPlayer: { id: string; name: string } | null = null;

  private createRoom(): void {
    this.waitingPlayer = { id: this.playerId, name: this.playerName };

    const requestHandler = (message: NetworkMessage<MatchRequestPayload>) => {
      if (this.waitingPlayer && this.waitingPlayer.id === this.playerId) {
        const roomId = `room-${Date.now()}`;
        this.roomId = roomId;

        const payload: MatchFoundPayload = {
          roomId,
          player1: this.waitingPlayer,
          player2: { id: message.payload.playerId, name: message.payload.playerName },
          yourTurn: true,
        };

        this.send(NetworkEventType.MATCH_FOUND, payload);
        this.off(NetworkEventType.MATCH_REQUEST, requestHandler);
        this.waitingPlayer = null;

        const handlers = this.handlers.get(NetworkEventType.MATCH_FOUND);
        if (handlers) {
          handlers.forEach((handler) =>
            handler({
              ...message,
              type: NetworkEventType.MATCH_FOUND,
              payload: { ...payload, yourTurn: false },
            })
          );
        }
      }
    };

    this.on(NetworkEventType.MATCH_REQUEST, requestHandler);
  }

  sendPlayerReady(player: Player): void {
    this.send<PlayerReadyPayload>(NetworkEventType.PLAYER_READY, {
      playerId: this.playerId,
      player,
    });
  }

  sendAttack(row: number, col: number): Promise<AttackResult> {
    return new Promise((resolve, reject) => {
      const messageId = `attack-${Date.now()}-${Math.random()}`;

      const pending: PendingMessage = {
        messageId,
        payload: { row, col, attackerId: this.playerId, messageId },
        attempts: 0,
        lastSent: Date.now(),
        resolve,
        reject,
      };

      this.pendingMessages.set(messageId, pending);
      this.send<AttackPayload>(NetworkEventType.ATTACK, pending.payload, messageId);

      const checkInterval = setInterval(() => {
        const currentPending = this.pendingMessages.get(messageId);
        if (!currentPending) {
          clearInterval(checkInterval);
          return;
        }

        if (Date.now() - currentPending.lastSent > RECONNECT_TIMEOUT) {
          currentPending.attempts++;
          if (currentPending.attempts >= MAX_RECONNECT_ATTEMPTS) {
            this.pendingMessages.delete(messageId);
            clearInterval(checkInterval);
            this.handleConnectionLost();
            reject(new Error('Connection timeout'));
          } else {
            currentPending.lastSent = Date.now();
            this.send<AttackPayload>(NetworkEventType.ATTACK, currentPending.payload, messageId);
          }
        }
      }, 1000);
    });
  }

  handleAttackResult(message: NetworkMessage<AttackResultPayload>): void {
    const pending = this.pendingMessages.get(message.payload.messageId);
    if (pending) {
      this.pendingMessages.delete(message.payload.messageId);
      pending.resolve(message.payload.result);
    }
  }

  sendAttackResult(
    result: AttackResult,
    attackerId: string,
    messageId: string,
    nextPlayerId: string
  ): void {
    this.send<AttackResultPayload>(
      NetworkEventType.ATTACK_RESULT,
      {
        result,
        attackerId,
        defenderId: this.playerId,
        messageId,
        nextPlayerId,
      },
      messageId
    );
  }

  sendEmote(emote: string, label: string): void {
    this.send<EmotePayload>(NetworkEventType.EMOTE, {
      emote,
      label,
      playerId: this.playerId,
    });
  }

  sendGameStateSync(player: Player, opponent: Player, currentPlayerId: string, phase: string): void {
    this.send<GameStateSyncPayload>(NetworkEventType.GAME_STATE_SYNC, {
      player,
      opponent,
      currentPlayerId,
      phase,
    });
  }

  sendTurnTimeout(timedOutPlayerId: string, nextPlayerId: string): void {
    this.send<TurnTimeoutPayload>(NetworkEventType.TURN_TIMEOUT, {
      timedOutPlayerId,
      nextPlayerId,
    });
  }

  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  getPlayerId(): string {
    return this.playerId;
  }

  getRoomId(): string | null {
    return this.roomId;
  }

  setRoomId(roomId: string): void {
    this.roomId = roomId;
  }

  reset(): void {
    this.roomId = null;
    this.waitingPlayer = null;
    this.reconnectAttempts = 0;
    this.pendingMessages.forEach((pending) => {
      pending.reject(new Error('Reset'));
    });
    this.pendingMessages.clear();
    this.handlers.clear();
  }
}
