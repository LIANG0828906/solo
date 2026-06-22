type EventCallback = (...args: unknown[]) => void;

interface GameStateData {
  brightness: number;
  score: number;
  combo: number;
  maxCombo: number;
  fragmentsCollected: number;
  survivalTime: number;
  phase: 'countdown' | 'tutorial' | 'playing' | 'paused' | 'ended';
  countdownValue: number;
}

class EventBus {
  private listeners: Map<string, Set<EventCallback>> = new Map();

  on(event: string, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: EventCallback): void {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, ...args: unknown[]): void {
    this.listeners.get(event)?.forEach(cb => cb(...args));
  }
}

const eventBus = new EventBus();

const state: GameStateData = {
  brightness: 100,
  score: 0,
  combo: 0,
  maxCombo: 0,
  fragmentsCollected: 0,
  survivalTime: 0,
  phase: 'countdown',
  countdownValue: 3,
};

function getMultiplier(): number {
  return 0.5 + (state.brightness / 100) * 2.0;
}

function resetState(): void {
  state.brightness = 100;
  state.score = 0;
  state.combo = 0;
  state.maxCombo = 0;
  state.fragmentsCollected = 0;
  state.survivalTime = 0;
  state.phase = 'countdown';
  state.countdownValue = 3;
}

function addScore(base: number): void {
  state.score += Math.round(base * getMultiplier());
}

function incrementCombo(): void {
  if (state.combo < 20) {
    state.combo++;
  }
  if (state.combo > state.maxCombo) {
    state.maxCombo = state.combo;
  }
}

function resetCombo(): void {
  state.combo = 0;
}

function reduceBrightness(amount: number): void {
  state.brightness = Math.max(0, state.brightness - amount);
  if (state.brightness <= 0) {
    state.phase = 'ended';
    eventBus.emit('gameEnded');
  }
}

export {
  eventBus,
  state,
  getMultiplier,
  resetState,
  addScore,
  incrementCombo,
  resetCombo,
  reduceBrightness,
};

export type { GameStateData };
