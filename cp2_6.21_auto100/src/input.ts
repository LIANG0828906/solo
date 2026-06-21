export class InputManager {
  private canvas: HTMLCanvasElement;
  private onClickCallbacks: Array<(x: number, y: number) => void> = [];

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.bindEvents();
  }

  private bindEvents(): void {
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.canvas.addEventListener('touchstart', this.handleTouch.bind(this), { passive: false });
  }

  private handleClick(e: MouseEvent): void {
    const { x, y } = this.getCanvasCoords(e.clientX, e.clientY);
    this.onClickCallbacks.forEach(cb => cb(x, y));
  }

  private handleTouch(e: TouchEvent): void {
    e.preventDefault();
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const { x, y } = this.getCanvasCoords(touch.clientX, touch.clientY);
      this.onClickCallbacks.forEach(cb => cb(x, y));
    }
  }

  private getCanvasCoords(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  }

  public onClick(callback: (x: number, y: number) => void): void {
    this.onClickCallbacks.push(callback);
  }

  public destroy(): void {
    this.canvas.removeEventListener('click', this.handleClick.bind(this));
    this.canvas.removeEventListener('touchstart', this.handleTouch.bind(this));
    this.onClickCallbacks = [];
  }
}
