import type { ControlState } from '../types';

export class ControlPanel {
  private controlState: ControlState;
  private keyState: Set<string>;

  constructor() {
    this.controlState = {
      accelerate: false,
      decelerate: false,
      turnLeft: false,
      turnRight: false,
      activateGravityWell: false
    };
    this.keyState = new Set();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    window.addEventListener('keydown', this.handleKeyDown.bind(this));
    window.addEventListener('keyup', this.handleKeyUp.bind(this));
  }

  private handleKeyDown(e: KeyboardEvent): void {
    this.keyState.add(e.code);
    this.updateControlState();
  }

  private handleKeyUp(e: KeyboardEvent): void {
    this.keyState.delete(e.code);
    this.updateControlState();
  }

  private updateControlState(): void {
    this.controlState.accelerate = this.keyState.has('KeyW');
    this.controlState.decelerate = this.keyState.has('KeyS');
    this.controlState.turnLeft = this.keyState.has('KeyA');
    this.controlState.turnRight = this.keyState.has('KeyD');
    this.controlState.activateGravityWell = this.keyState.has('Space');
  }

  getControlState(): ControlState {
    return this.controlState;
  }

  reset(): void {
    this.keyState.clear();
    this.updateControlState();
  }

  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown.bind(this));
    window.removeEventListener('keyup', this.handleKeyUp.bind(this));
  }
}
