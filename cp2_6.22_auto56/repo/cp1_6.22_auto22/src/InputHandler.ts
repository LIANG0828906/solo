import { GAME_WIDTH } from './GameState';

export class InputHandler {
  private canvas: HTMLCanvasElement;
  private scaleX: number = 1;
  private offsetX: number = 0;
  private keys: Set<string> = new Set();
  private pointerDown: boolean = false;
  private pointerX: number = 0;
  private useKeyboard: boolean = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;

    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        this.useKeyboard = true;
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key);
    });

    canvas.addEventListener('mousedown', (e) => {
      this.pointerDown = true;
      this.useKeyboard = false;
      this.updatePointerPos(e.clientX);
    });
    window.addEventListener('mousemove', (e) => {
      if (this.pointerDown) {
        this.updatePointerPos(e.clientX);
      }
    });
    window.addEventListener('mouseup', () => {
      this.pointerDown = false;
    });

    canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      this.pointerDown = true;
      this.useKeyboard = false;
      if (e.touches.length > 0) {
        this.updatePointerPos(e.touches[0].clientX);
      }
    }, { passive: false });
    canvas.addEventListener('touchmove', (e) => {
      e.preventDefault();
      if (e.touches.length > 0) {
        this.updatePointerPos(e.touches[0].clientX);
      }
    }, { passive: false });
    canvas.addEventListener('touchend', (e) => {
      e.preventDefault();
      this.pointerDown = false;
    }, { passive: false });
  }

  updateTransform(scaleX: number, offsetX: number): void {
    this.scaleX = scaleX;
    this.offsetX = offsetX;
  }

  private updatePointerPos(clientX: number): void {
    const rect = this.canvas.getBoundingClientRect();
    const canvasX = (clientX - rect.left - this.offsetX) / this.scaleX;
    this.pointerX = canvasX;
  }

  getTargetPaddleX(paddleWidth: number): number | null {
    if (this.useKeyboard) {
      return null;
    }
    if (this.pointerDown) {
      return this.pointerX - paddleWidth / 2;
    }
    return null;
  }

  isLeftPressed(): boolean {
    return this.keys.has('ArrowLeft') || this.keys.has('a') || this.keys.has('A');
  }

  isRightPressed(): boolean {
    return this.keys.has('ArrowRight') || this.keys.has('d') || this.keys.has('D');
  }

  isActionPressed(): boolean {
    return this.keys.has(' ') || this.keys.has('Enter');
  }

  consumeAction(): boolean {
    if (this.keys.has(' ') || this.keys.has('Enter')) {
      this.keys.delete(' ');
      this.keys.delete('Enter');
      return true;
    }
    return false;
  }
}
