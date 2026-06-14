export class Brick {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public color: string;
  public hp: number;
  public maxHp: number;
  public isDestroyed: boolean;
  public destroyStartTime: number | null;
  public destroyDuration: number;

  constructor(x: number, y: number, width: number, height: number, color: string, hp: number = 1) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.color = color;
    this.hp = hp;
    this.maxHp = hp;
    this.isDestroyed = false;
    this.destroyStartTime = null;
    this.destroyDuration = 200;
  }

  public hit(): boolean {
    this.hp--;
    if (this.hp <= 0) {
      this.isDestroyed = true;
      this.destroyStartTime = performance.now();
      return true;
    }
    return false;
  }

  public isAnimating(): boolean {
    return this.isDestroyed && this.destroyStartTime !== null;
  }

  public getScale(currentTime: number): number {
    if (!this.isDestroyed || this.destroyStartTime === null) return 1;
    const elapsed = currentTime - this.destroyStartTime;
    if (elapsed >= this.destroyDuration) return 0;
    const progress = elapsed / this.destroyDuration;
    return 1 - this.easeOut(progress);
  }

  private easeOut(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }

  public draw(ctx: CanvasRenderingContext2D, currentTime: number): void {
    if (this.isDestroyed && this.destroyStartTime !== null) {
      const elapsed = currentTime - this.destroyStartTime;
      if (elapsed >= this.destroyDuration) return;
    }

    const scale = this.getScale(currentTime);
    if (scale <= 0) return;

    const centerX = this.x + this.width / 2;
    const centerY = this.y + this.height / 2;
    const scaledWidth = this.width * scale;
    const scaledHeight = this.height * scale;
    const drawX = centerX - scaledWidth / 2;
    const drawY = centerY - scaledHeight / 2;

    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 4 * scale;
    ctx.beginPath();
    ctx.roundRect(drawX, drawY, scaledWidth, scaledHeight, 3);
    ctx.fill();
    ctx.closePath();
    ctx.restore();

    if (this.hp > 1 && !this.isDestroyed) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.hp.toString(), centerX, centerY);
    }
  }

  public getLeft(): number { return this.x; }
  public getRight(): number { return this.x + this.width; }
  public getTop(): number { return this.y; }
  public getBottom(): number { return this.y + this.height; }
  public getCenterX(): number { return this.x + this.width / 2; }
  public getCenterY(): number { return this.y + this.height / 2; }
}
