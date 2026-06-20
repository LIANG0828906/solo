import { useGameStore } from '../store';

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
}

export class InputHandler {
  private state: InputState = {
    up: false,
    down: false,
    left: false,
    right: false,
    space: false,
  };

  private spaceWasPressed = false;

  constructor() {
    this.bindEvents();
  }

  private bindEvents(): void {
    window.addEventListener('keydown', this.onKeyDown.bind(this));
    window.addEventListener('keyup', this.onKeyUp.bind(this));
  }

  private onKeyDown(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    if (key === 'arrowup' || key === 'w') this.state.up = true;
    if (key === 'arrowdown' || key === 's') this.state.down = true;
    if (key === 'arrowleft' || key === 'a') this.state.left = true;
    if (key === 'arrowright' || key === 'd') this.state.right = true;
    if (key === ' ') {
      e.preventDefault();
      if (!this.spaceWasPressed) {
        this.state.space = true;
        this.spaceWasPressed = true;
      }
    }
  }

  private onKeyUp(e: KeyboardEvent): void {
    const key = e.key.toLowerCase();
    if (key === 'arrowup' || key === 'w') this.state.up = false;
    if (key === 'arrowdown' || key === 's') this.state.down = false;
    if (key === 'arrowleft' || key === 'a') this.state.left = false;
    if (key === 'arrowright' || key === 'd') this.state.right = false;
    if (key === ' ') {
      this.spaceWasPressed = false;
    }
  }

  public getState(): InputState {
    return { ...this.state };
  }

  public consumeSpace(): boolean {
    const val = this.state.space;
    this.state.space = false;
    return val;
  }

  public process(): void {
    const gameState = useGameStore.getState().gameState;
    if (gameState !== 'playing') return;
    if (this.consumeSpace()) {
      useGameStore.getState().usePowerUp();
    }
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown.bind(this));
    window.removeEventListener('keyup', this.onKeyUp.bind(this));
  }
}
