import { GameState } from './types';

export type PlayerAction = 'MOVE_UP' | 'MOVE_DOWN' | 'MOVE_LEFT' | 'MOVE_RIGHT' | 'INTERACT' | 'USE_ITEM' | 'DUEL_ATTACK';

export interface InputEvent {
  playerId: number;
  action: PlayerAction;
  timestamp: number;
}

export interface InputState {
  player1: Record<PlayerAction, boolean>;
  player2: Record<PlayerAction, boolean>;
  pressedThisFrame: InputEvent[];
}

const PLAYER1_KEY_MAP: Record<string, PlayerAction> = {
  'KeyW': 'MOVE_UP',
  'KeyA': 'MOVE_LEFT',
  'KeyS': 'MOVE_DOWN',
  'KeyD': 'MOVE_RIGHT',
  'KeyE': 'INTERACT',
  'KeyQ': 'USE_ITEM'
};

const PLAYER2_KEY_MAP: Record<string, PlayerAction> = {
  'ArrowUp': 'MOVE_UP',
  'ArrowLeft': 'MOVE_LEFT',
  'ArrowDown': 'MOVE_DOWN',
  'ArrowRight': 'MOVE_RIGHT',
  'Enter': 'INTERACT',
  'ShiftLeft': 'USE_ITEM',
  'ShiftRight': 'USE_ITEM'
};

const DUEL_ATTACK_MAP: Record<string, { playerId: number; action: PlayerAction }> = {
  'KeyJ': { playerId: 1, action: 'DUEL_ATTACK' },
  'KeyK': { playerId: 2, action: 'DUEL_ATTACK' }
};

export class InputManager {
  private state: InputState;
  private pressedKeys: Set<string>;
  private listeners: ((event: InputEvent) => void)[];
  private currentGameState: GameState;

  constructor() {
    this.state = {
      player1: this.createEmptyActionState(),
      player2: this.createEmptyActionState(),
      pressedThisFrame: []
    };
    this.pressedKeys = new Set();
    this.listeners = [];
    this.currentGameState = 'MENU';
    this.setupEventListeners();
  }

  private createEmptyActionState(): Record<PlayerAction, boolean> {
    return {
      MOVE_UP: false,
      MOVE_DOWN: false,
      MOVE_LEFT: false,
      MOVE_RIGHT: false,
      INTERACT: false,
      USE_ITEM: false,
      DUEL_ATTACK: false
    };
  }

  setGameState(state: GameState): void {
    this.currentGameState = state;
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', (e) => this.handleKeyDown(e));
    window.addEventListener('keyup', (e) => this.handleKeyUp(e));
    window.addEventListener('blur', () => this.handleBlur());
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.repeat) return;

    const key = e.code;
    this.pressedKeys.add(key);

    const duelAttack = DUEL_ATTACK_MAP[key];
    if (duelAttack && this.currentGameState === 'BOSS_FIGHT') {
      e.preventDefault();
      this.processDuelAttack(duelAttack.playerId, duelAttack.action);
      return;
    }

    const player1Action = PLAYER1_KEY_MAP[key];
    if (player1Action) {
      e.preventDefault();
      this.processAction(1, player1Action, true);
      return;
    }

    const player2Action = PLAYER2_KEY_MAP[key];
    if (player2Action) {
      e.preventDefault();
      this.processAction(2, player2Action, true);
      return;
    }
  }

  private handleKeyUp(e: KeyboardEvent): void {
    const key = e.code;
    this.pressedKeys.delete(key);

    const player1Action = PLAYER1_KEY_MAP[key];
    if (player1Action) {
      e.preventDefault();
      this.processAction(1, player1Action, false);
      return;
    }

    const player2Action = PLAYER2_KEY_MAP[key];
    if (player2Action) {
      e.preventDefault();
      this.processAction(2, player2Action, false);
      return;
    }
  }

  private handleBlur(): void {
    this.pressedKeys.clear();
    this.state.player1 = this.createEmptyActionState();
    this.state.player2 = this.createEmptyActionState();
  }

  private processAction(playerId: number, action: PlayerAction, pressed: boolean): void {
    const playerState = playerId === 1 ? this.state.player1 : this.state.player2;

    if (this.isActionBlocked(playerId, action)) {
      playerState[action] = false;
      return;
    }

    playerState[action] = pressed;

    if (pressed) {
      const event: InputEvent = {
        playerId,
        action,
        timestamp: performance.now()
      };
      this.state.pressedThisFrame.push(event);
      this.notifyListeners(event);
    }
  }

  private processDuelAttack(playerId: number, action: PlayerAction): void {
    const event: InputEvent = {
      playerId,
      action,
      timestamp: performance.now()
    };
    this.state.pressedThisFrame.push(event);
    this.notifyListeners(event);
  }

  private isActionBlocked(playerId: number, action: PlayerAction): boolean {
    if (this.currentGameState === 'MENU' || this.currentGameState === 'GAME_OVER') {
      return true;
    }

    if (this.currentGameState === 'COMBAT') {
      return ['MOVE_UP', 'MOVE_DOWN', 'MOVE_LEFT', 'MOVE_RIGHT'].includes(action);
    }

    if (this.currentGameState === 'BOSS_FIGHT') {
      if (['INTERACT', 'USE_ITEM'].includes(action)) {
        return true;
      }
    }

    if (this.currentGameState === 'TRANSITION') {
      return true;
    }

    return false;
  }

  private notifyListeners(event: InputEvent): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  addListener(callback: (event: InputEvent) => void): void {
    this.listeners.push(callback);
  }

  removeListener(callback: (event: InputEvent) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  getState(): Readonly<InputState> {
    return this.state;
  }

  isActionPressed(playerId: number, action: PlayerAction): boolean {
    const playerState = playerId === 1 ? this.state.player1 : this.state.player2;
    return playerState[action];
  }

  getAndClearPressedThisFrame(): InputEvent[] {
    const events = [...this.state.pressedThisFrame];
    this.state.pressedThisFrame = [];
    return events;
  }

  getMoveDirection(playerId: number): { x: number; y: number } | null {
    const state = playerId === 1 ? this.state.player1 : this.state.player2;
    
    let dx = 0;
    let dy = 0;

    if (state.MOVE_UP) dy -= 1;
    if (state.MOVE_DOWN) dy += 1;
    if (state.MOVE_LEFT) dx -= 1;
    if (state.MOVE_RIGHT) dx += 1;

    if (dx === 0 && dy === 0) return null;

    const length = Math.sqrt(dx * dx + dy * dy);
    return {
      x: dx / length,
      y: dy / length
    };
  }

  reset(): void {
    this.state.player1 = this.createEmptyActionState();
    this.state.player2 = this.createEmptyActionState();
    this.state.pressedThisFrame = [];
    this.pressedKeys.clear();
  }
}
