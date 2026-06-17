import {
  DEFLLECTION_PER_KEY,
  MAX_CUMULATIVE_DEFLECTION,
} from '../config/visualConfig';

export class InputHandler {
  private cumulativeDeflection: number;
  private onKeyDownCallback: ((deflection: number) => void) | null;
  private boundKeyDown: (e: KeyboardEvent) => void;

  constructor() {
    this.cumulativeDeflection = 0;
    this.onKeyDownCallback = null;
    this.boundKeyDown = this.handleKeyDown.bind(this);
    window.addEventListener('keydown', this.boundKeyDown);
  }

  setOnKeyDown(cb: (deflection: number) => void): void {
    this.onKeyDownCallback = cb;
  }

  private handleKeyDown(e: KeyboardEvent): void {
    let deflection = 0;

    switch (e.key) {
      case 'ArrowLeft':
        deflection = -DEFLLECTION_PER_KEY;
        break;
      case 'ArrowRight':
        deflection = DEFLLECTION_PER_KEY;
        break;
      case 'ArrowUp':
        deflection = -DEFLLECTION_PER_KEY;
        break;
      case 'ArrowDown':
        deflection = DEFLLECTION_PER_KEY;
        break;
      default:
        return;
    }

    e.preventDefault();

    this.cumulativeDeflection += deflection;

    if (Math.abs(this.cumulativeDeflection) > MAX_CUMULATIVE_DEFLECTION) {
      this.cumulativeDeflection = 0;
    }

    if (this.onKeyDownCallback) {
      this.onKeyDownCallback(deflection);
    }
  }

  getCumulativeDeflection(): number {
    return this.cumulativeDeflection;
  }

  resetDeflection(): void {
    this.cumulativeDeflection = 0;
  }

  destroy(): void {
    window.removeEventListener('keydown', this.boundKeyDown);
  }
}
