import type { Player, PlayerId, GameStatistics } from './entities';

export type EventName =
  | 'GAME_START'
  | 'PIECE_SELECT'
  | 'PIECE_ATTACK'
  | 'TURN_END'
  | 'ANIMATION_COMPLETE'
  | 'UNDO_REQUEST'
  | 'GAME_END'
  | 'RESTART_GAME'
  | 'SHARE_RESULT'
  | 'AI_ACTION'
  | 'COUNTDOWN_TICK';

export interface EventPayload {
  GAME_START: { player1: Player; player2: Player; useAI: boolean };
  PIECE_SELECT: { pieceId: string };
  PIECE_ATTACK: { attackerId: string; targetId: string };
  TURN_END: { nextPlayer: PlayerId };
  ANIMATION_COMPLETE: { animationType: string; attackerId?: string; targetId?: string };
  UNDO_REQUEST: { steps: number };
  GAME_END: { winner: PlayerId; statistics: GameStatistics };
  RESTART_GAME: Record<string, never>;
  SHARE_RESULT: { record: string };
  AI_ACTION: Record<string, never>;
  COUNTDOWN_TICK: { remaining: number };
}

type EventCallback<T extends EventName> = (payload: EventPayload[T]) => void;

class EventBusClass {
  private listeners: Map<EventName, Set<EventCallback<EventName>>> = new Map();

  on<T extends EventName>(event: T, callback: EventCallback<T>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    const set = this.listeners.get(event)!;
    set.add(callback as EventCallback<EventName>);

    return () => {
      set.delete(callback as EventCallback<EventName>);
      if (set.size === 0) {
        this.listeners.delete(event);
      }
    };
  }

  off<T extends EventName>(event: T, callback: EventCallback<T>): void {
    const set = this.listeners.get(event);
    if (set) {
      set.delete(callback as EventCallback<EventName>);
    }
  }

  emit<T extends EventName>(event: T, payload: EventPayload[T]): void {
    const set = this.listeners.get(event);
    if (set) {
      set.forEach((cb) => {
        try {
          cb(payload);
        } catch (e) {
          console.error(`[EventBus] Error in listener for ${event}:`, e);
        }
      });
    }
  }

  clear(): void {
    this.listeners.clear();
  }
}

export const EventBus = new EventBusClass();
