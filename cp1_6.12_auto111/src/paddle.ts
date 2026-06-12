export class Paddle {
  x: number;
  y: number;
  width: number = 15;
  height: number = 80;
  speed: number = 6;
  side: 'left' | 'right';
  color: string = '#ffffff';

  private moveUp: boolean = false;
  private moveDown: boolean = false;

  private _canvasHeight: number;

  constructor(side: 'left' | 'right', canvasWidth: number, canvasHeight: number) {
    this.side = side;
    this._canvasHeight = canvasHeight;

    if (side === 'left') {
      this.x = 20;
    } else {
      this.x = canvasWidth - 20 - this.width;
    }

    this.y = (canvasHeight - this.height) / 2;
  }

  setUp(active: boolean): void {
    this.moveUp = active;
  }

  setDown(active: boolean): void {
    this.moveDown = active;
  }

  update(_deltaTime: number): void {
    if (this.moveUp) {
      this.y -= this.speed;
    }
    if (this.moveDown) {
      this.y += this.speed;
    }

    if (this.y < 0) {
      this.y = 0;
    }
    if (this.y + this.height > this._canvasHeight) {
      this.y = this._canvasHeight - this.height;
    }
  }

  setColor(color: string): void {
    this.color = color;
  }

  render(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 4;
    ctx.fillStyle = this.color;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }

  getRect(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
    };
  }
}
