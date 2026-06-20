import type { CellColor } from '../maze/mazeGenerator';

export interface PlayerState {
  energy: number;
  combo: number;
  x: number;
  y: number;
  maxEnergy: number;
  speed: number;
}

export interface EventResult {
  energyDelta: number;
  comboDelta: number;
  teleport?: { x: number; y: number };
  message?: string;
  effect?: ParticleEffect;
}

export interface ParticleEffect {
  type: 'green_expand' | 'red_shatter' | 'blue_ring' | 'yellow_spark' | 'purple_twirl';
  duration: number;
  x: number;
  y: number;
}

export type EventHandler = (state: PlayerState) => EventResult;

export class EventSystem {
  private handlers: Map<CellColor, EventHandler>;

  constructor() {
    this.handlers = new Map();
    this.initHandlers();
  }

  private initHandlers(): void {
    this.handlers.set('green', this.handleGreen.bind(this));
    this.handlers.set('red', this.handleRed.bind(this));
    this.handlers.set('blue', this.handleBlue.bind(this));
    this.handlers.set('yellow', this.handleYellow.bind(this));
    this.handlers.set('purple', this.handlePurple.bind(this));
    this.handlers.set('gold', this.handleGold.bind(this));
    this.handlers.set('entrance', this.handleEntrance.bind(this));
  }

  private handleGreen(state: PlayerState): EventResult {
    return {
      energyDelta: Math.min(10, state.maxEnergy - state.energy),
      comboDelta: 1,
      effect: {
        type: 'green_expand',
        duration: 300,
        x: state.x,
        y: state.y
      },
      message: '+10 能量!'
    };
  }

  private handleRed(state: PlayerState): EventResult {
    return {
      energyDelta: -15,
      comboDelta: 0,
      effect: {
        type: 'red_shatter',
        duration: 500,
        x: state.x,
        y: state.y
      },
      message: '-15 能量!'
    };
  }

  private handleBlue(state: PlayerState): EventResult {
    return {
      energyDelta: Math.min(5, state.maxEnergy - state.energy),
      comboDelta: 1,
      effect: {
        type: 'blue_ring',
        duration: 400,
        x: state.x,
        y: state.y
      },
      message: '护盾充能!'
    };
  }

  private handleYellow(state: PlayerState): EventResult {
    return {
      energyDelta: Math.min(15, state.maxEnergy - state.energy),
      comboDelta: 2,
      effect: {
        type: 'yellow_spark',
        duration: 350,
        x: state.x,
        y: state.y
      },
      message: '连击加成!'
    };
  }

  private handlePurple(state: PlayerState): EventResult {
    const newX = Math.floor(Math.random() * 10);
    const newY = Math.floor(Math.random() * 10);
    return {
      energyDelta: 0,
      comboDelta: 1,
      teleport: { x: newX, y: newY },
      effect: {
        type: 'purple_twirl',
        duration: 500,
        x: state.x,
        y: state.y
      },
      message: '空间传送!'
    };
  }

  private handleGold(_state: PlayerState): EventResult {
    return {
      energyDelta: 100,
      comboDelta: 10,
      message: '恭喜通关!'
    };
  }

  private handleEntrance(_state: PlayerState): EventResult {
    return {
      energyDelta: 0,
      comboDelta: 0
    };
  }

  trigger(color: CellColor, state: PlayerState): EventResult {
    const handler = this.handlers.get(color);
    if (handler) {
      return handler(state);
    }
    return { energyDelta: 0, comboDelta: 0 };
  }
}
