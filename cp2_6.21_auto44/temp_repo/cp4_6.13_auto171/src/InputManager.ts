export enum GameAction {
  MOVE_UP = 'move_up',
  MOVE_DOWN = 'move_down',
  MOVE_LEFT = 'move_left',
  MOVE_RIGHT = 'move_right',
  SHOOT = 'shoot',
  PAUSE = 'pause'
}

export interface InputState {
  actions: Set<GameAction>;
  shootPressed: boolean;
  shootTimestamp: number;
}

export interface BeatTimingResult {
  accuracy: 'perfect' | 'good' | 'miss';
  offset: number;
}

export class InputManager {
  private keyMap: Map<string, GameAction> = new Map();
  private pressedKeys: Set<string> = new Set();
  private inputState: InputState;
  private lastShootTime: number = 0;
  private beatTimes: number[] = [];
  private currentTime: number = 0;
  private bpm: number = 120;
  private beatCallback: ((result: BeatTimingResult) => void) | null = null;

  constructor() {
    this.inputState = {
      actions: new Set(),
      shootPressed: false,
      shootTimestamp: 0
    };

    this.keyMap.set('ArrowUp', GameAction.MOVE_UP);
    this.keyMap.set('KeyW', GameAction.MOVE_UP);
    this.keyMap.set('ArrowDown', GameAction.MOVE_DOWN);
    this.keyMap.set('KeyS', GameAction.MOVE_DOWN);
    this.keyMap.set('ArrowLeft', GameAction.MOVE_LEFT);
    this.keyMap.set('KeyA', GameAction.MOVE_LEFT);
    this.keyMap.set('ArrowRight', GameAction.MOVE_RIGHT);
    this.keyMap.set('KeyD', GameAction.MOVE_RIGHT);
    this.keyMap.set('Space', GameAction.SHOOT);
    this.keyMap.set('KeyJ', GameAction.SHOOT);
    this.keyMap.set('Escape', GameAction.PAUSE);
    this.keyMap.set('KeyP', GameAction.PAUSE);

    this.bindEvents();
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;
    
    const action = this.keyMap.get(e.code);
    if (action) {
      this.pressedKeys.add(e.code);
      this.inputState.actions.add(action);
      
      if (action === GameAction.SHOOT && !this.inputState.shootPressed) {
        this.inputState.shootPressed = true;
        this.inputState.shootTimestamp = performance.now();
        this.handleShootPress();
      }
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const action = this.keyMap.get(e.code);
    if (action) {
      this.pressedKeys.delete(e.code);
      
      let stillPressed = false;
      for (const [key, act] of this.keyMap) {
        if (act === action && this.pressedKeys.has(key)) {
          stillPressed = true;
          break;
        }
      }
      
      if (!stillPressed) {
        this.inputState.actions.delete(action);
      }
      
      if (action === GameAction.SHOOT && !stillPressed) {
        this.inputState.shootPressed = false;
      }
    }
  }

  private handleShootPress(): void {
    const result = this.calculateBeatTiming();
    if (this.beatCallback) {
      this.beatCallback(result);
    }
  }

  setBeatTimes(beatTimes: number[], bpm: number): void {
    this.beatTimes = beatTimes;
    this.bpm = bpm;
  }

  setCurrentTime(time: number): void {
    this.currentTime = time;
  }

  onShootBeat(callback: (result: BeatTimingResult) => void): void {
    this.beatCallback = callback;
  }

  calculateBeatTiming(): BeatTimingResult {
    if (this.beatTimes.length === 0) {
      return { accuracy: 'miss', offset: 0 };
    }

    const beatDuration = 60 / this.bpm;
    const beatPhase = (this.currentTime % beatDuration) / beatDuration;
    
    let offset: number;
    if (beatPhase <= 0.5) {
      offset = beatPhase * beatDuration;
    } else {
      offset = (1 - beatPhase) * beatDuration;
    }

    const offsetMs = offset * 1000;

    if (offsetMs <= 100) {
      return { accuracy: 'perfect', offset: offsetMs };
    } else if (offsetMs <= 250) {
      return { accuracy: 'good', offset: offsetMs };
    } else {
      return { accuracy: 'miss', offset: offsetMs };
    }
  }

  getInputState(): InputState {
    return {
      ...this.inputState,
      actions: new Set(this.inputState.actions)
    };
  }

  isActionPressed(action: GameAction): boolean {
    return this.inputState.actions.has(action);
  }

  isShootJustPressed(): boolean {
    return this.inputState.shootPressed && 
           (performance.now() - this.inputState.shootTimestamp < 50);
  }

  resetShootState(): void {
    this.inputState.shootPressed = false;
  }

  dispose(): void {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }
}
