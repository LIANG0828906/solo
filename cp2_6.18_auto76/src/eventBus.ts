type WebSocketEvents = {
  playerJoined: { playerId: string; nickname: string; avatarColor: string };
  questionReceived: { questionId: string; text: string; options: string[]; correctIndex: number; roundIndex: number };
  timerSync: { remaining: number; total: number };
  roundEnd: { roundIndex: number; correctIndex: number };
};

type GameManagerEvents = {
  scoreUpdate: { playerId: string; score: number; delta: number };
  rankUpdate: { rankings: Array<{ id: string; nickname: string; avatarColor: string; score: number; correctCount: number; isHost: boolean }> };
  roundUpdate: { roundIndex: number; totalRounds: number };
  gameStateChange: 'waiting' | 'playing' | 'roundEnd' | 'result';
};

type UIEvents = {
  answerSubmit: { playerId: string; questionId: string; selectedIndex: number };
  joinRoom: { nickname: string };
  startGame: {};
  resetGame: {};
};

type EventMap = WebSocketEvents & GameManagerEvents & UIEvents;

type EventKey = keyof EventMap;

type Listener<T> = (data: T) => void;

class EventBus {
  private listeners = new Map<EventKey, Set<Listener<unknown>>>();

  on<K extends EventKey>(event: K, listener: Listener<EventMap[K]>): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener as Listener<unknown>);
  }

  off<K extends EventKey>(event: K, listener: Listener<EventMap[K]>): void {
    this.listeners.get(event)?.delete(listener as Listener<unknown>);
  }

  emit<K extends EventKey>(event: K, data: EventMap[K]): void {
    this.listeners.get(event)?.forEach((listener) => listener(data));
  }
}

const eventBus = new EventBus();

export default eventBus;
