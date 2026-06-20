import { NetworkMessage, ActionType, PlayerType, AxialCoord } from '../types';

type MessageHandler = (message: NetworkMessage) => void;

export class NetworkService {
  private isConnected: boolean = false;
  private latency: number = 100;
  private messageHandlers: MessageHandler[] = [];
  private localPlayer: PlayerType = PlayerType.BLUE;
  private messageQueue: NetworkMessage[] = [];
  private enabled: boolean = true;

  constructor(enabled: boolean = true) {
    this.enabled = enabled;
    if (enabled) {
      this.simulateConnection();
    }
  }

  private simulateConnection(): void {
    setTimeout(() => {
      this.isConnected = true;
      this.notifyStatusChange();
    }, 200);
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  getLatency(): number {
    return this.latency;
  }

  getLocalPlayer(): PlayerType {
    return this.localPlayer;
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  private notifyStatusChange(): void {
    // Status change can be handled by UI polling
  }

  private dispatchMessage(message: NetworkMessage): void {
    this.messageHandlers.forEach(handler => handler(message));
  }

  sendMessage(message: Omit<NetworkMessage, 'timestamp'>): void {
    if (!this.enabled) {
      const localMessage: NetworkMessage = {
        ...message,
        timestamp: Date.now()
      };
      this.dispatchMessage(localMessage);
      return;
    }

    const fullMessage: NetworkMessage = {
      ...message,
      timestamp: Date.now()
    };

    this.messageQueue.push(fullMessage);

    const simulatedLatency = this.latency + Math.random() * 50;
    setTimeout(() => {
      const index = this.messageQueue.findIndex(m => m.timestamp === fullMessage.timestamp);
      if (index !== -1) {
        this.messageQueue.splice(index, 1);
      }
      this.dispatchMessage(fullMessage);
    }, simulatedLatency);
  }

  sendMoveAction(player: PlayerType, unitId: string, target: AxialCoord): void {
    this.sendMessage({
      type: ActionType.MOVE,
      player,
      unitId,
      target
    });
  }

  sendAttackAction(player: PlayerType, unitId: string, targetUnitId: string): void {
    this.sendMessage({
      type: ActionType.ATTACK,
      player,
      unitId,
      targetUnitId
    });
  }

  sendEndTurnAction(player: PlayerType): void {
    this.sendMessage({
      type: ActionType.END_TURN,
      player
    });
  }

  setLatency(latency: number): void {
    this.latency = latency;
  }

  getPendingMessages(): NetworkMessage[] {
    return [...this.messageQueue];
  }

  clearPendingMessages(): void {
    this.messageQueue = [];
  }

  disconnect(): void {
    this.isConnected = false;
    this.messageQueue = [];
    this.notifyStatusChange();
  }

  reconnect(): void {
    this.simulateConnection();
  }
}
