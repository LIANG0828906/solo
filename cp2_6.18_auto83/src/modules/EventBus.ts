type Listener<T = unknown> = (data: T) => void;

class EventBusClass {
  private listeners: Map<string, Set<Listener>> = new Map();

  on<T = unknown>(event: string, listener: Listener<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener);
    return () => this.off(event, listener);
  }

  off<T = unknown>(event: string, listener: Listener<T>): void {
    this.listeners.get(event)?.delete(listener as Listener);
  }

  emit<T = unknown>(event: string, data: T): void {
    this.listeners.get(event)?.forEach((listener) => {
      try {
        listener(data);
      } catch (e) {
        console.error(`EventBus error in "${event}":`, e);
      }
    });
  }

  removeAll(): void {
    this.listeners.clear();
  }
}

export const eventBus = new EventBusClass();

export type EventMap = {
  matchRequest: { playerId: string };
  playerJoined: { playerId: string; opponentId: string; firstTurn: 'player' | 'opponent' };
  attackEvent: { row: number; col: number; attacker: 'player' | 'opponent' };
  hitResult: AttackResult & { attacker: 'player' | 'opponent' };
  turnUpdate: { currentTurn: 'player' | 'opponent'; turnNumber: number };
  gameOver: { winner: 'player' | 'opponent' };
  timeoutEvent: { player: 'player' | 'opponent' };
  deployComplete: { playerId: string };
  opponentAttack: { row: number; col: number };
};

import { AttackResult } from '@/types';
