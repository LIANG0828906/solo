export class Paddle {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public color: string;
  public cornerRadius: number;
  public canvasWidth: number;

  private keysPressed: Set<string> = new Set();
  private moveSpeed: number = 8;
  private fastMoveSpeed: number = 12;
  private keyHoldTime: Map<string, number> = new Map();
  private bounceStartTime: number | null = null;
  private bounceDuration: number = 150;
  private bounceDirection: number = 0;
  private bounceStartX: number = 0;

  constructor(x: number, y: number, width: number, height: number, canvasWidth: number) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = '#06b6d4';
    this.cornerRadius = 4;
    this.canvasWidth = canvasWidth;
  }

  public handleKeyDown(key: string): void {
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      if (!this.keysPressed.has(key)) {
        this.keysPressed.add(key);
        this.keyHoldTime.set(key, performance.now());
      }
    }
  }

  public handleKeyUp(key: string): void {
    if (key === 'ArrowLeft' || key === 'ArrowRight') {
      this.keysPressed.delete(key);
      this.keyHoldTime.delete(key);
    }
  }

  public update(currentTime: number): void {
    if (this.bounceStartTime !== null) {
      const elapsed = currentTime - this.bounceStartTime;
      if (elapsed >= this.bounceDuration) {
        this.bounceStartTime = null;
        this.x = this.bounceDirection > 0 ? this.canvasWidth - this.width : 0;
      } else {
        const progress = elapsed / this.bounceDuration;
        const bounceOffset = this.easeOut(1 - progress) * 20;
        if (this.bounceDirection > 0) {
          this.x = this.canvasWidth - this.width - bounceOffset;
        } else {
          this.x = bounceOffset;
        }
      }
      return;
    }

    let moveAmount = 0;
    const holdThreshold = 100;

    if (this.keysPressed.has('ArrowLeft')) {
      const holdTime = currentTime - (this.keyHoldTime.get('ArrowLeft') || currentTime);
      const speed = holdTime > holdThreshold ? this.fastMoveSpeed : this.moveSpeed;
      moveAmount -= speed;
    }
    if (this.keysPressed.has('ArrowRight')) {
      const holdTime = currentTime - (this.keyHoldTime.get('ArrowRight') || currentTime);
      const speed = holdTime > holdThreshold ? this.fastMoveSpeed : this.moveSpeed;
      moveAmount += speed;
    }

    this.x += moveAmount;

    if (this.x < 0) {
      this.startBounce(-1);
    } else if (this.x + this.width > this.canvasWidth) {
      this.startBounce(1);
    }
  }

  private startBounce(direction: number): void {
    this.bounceStartTime = performance.now();
    this.bounceDirection = direction;
    this.bounceStartX = this.x;
  }

  private easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 2);
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.roundRect(this.x, this.y, this.width, this.height, this.cornerRadius);
    ctx.fill();
    ctx.closePath();
    ctx.restore();
  }

  public getLeft(): number { return this.x; }
  public getRight(): number { return this.x + this.width; }
  public getTop(): number { return this.y; }
  public getBottom(): number { return this.y + this.height; }
  public getCenterX(): number { return this.x + this.width / 2; }

  public setWidth(width: number): void {
    if (width < 80) width = 80;
    const centerX = this.getCenterX();
    this.width = width;
    this.x = centerX - width / 2;
    if (this.x < 0) this.x = 0;
    if (this.x + this.width > this.canvasWidth) {
      this.x = this.canvasWidth - this.width;
    }
  }

  public reset(x: number, width: number): void {
    this.width = width;
    this.x = x - width / 2;
    this.keysPressed.clear();
    this.keyHoldTime.clear();
    this.bounceStartTime = null;
  }
}
