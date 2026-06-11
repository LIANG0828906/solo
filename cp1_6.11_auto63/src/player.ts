export const GAME_CONFIG = {
  PLAYER_SPEED: 150,
  PLAYER_SIZE: 20,
  ENERGY_MAX: 100,
  ENERGY_DRAIN_RATE: 2,
  ENERGY_RESTORE: 10,
  ENERGY_DAMAGE: 20,
  HIT_FLASH_DURATION: 300,
} as const;

export class Player {
  x: number;
  y: number;
  energy: number;
  velocityX: number;
  velocityY: number;
  isHit: boolean;
  hitTimer: number;
  private size: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.energy = GAME_CONFIG.ENERGY_MAX;
    this.velocityX = 0;
    this.velocityY = 0;
    this.isHit = false;
    this.hitTimer = 0;
    this.size = GAME_CONFIG.PLAYER_SIZE;
  }

  update(keys: Set<string>, dt: number, canvasWidth: number, canvasHeight: number): void {
    let dx = 0;
    let dy = 0;

    if (keys.has('w') || keys.has('W') || keys.has('ArrowUp')) dy -= 1;
    if (keys.has('s') || keys.has('S') || keys.has('ArrowDown')) dy += 1;
    if (keys.has('a') || keys.has('A') || keys.has('ArrowLeft')) dx -= 1;
    if (keys.has('d') || keys.has('D') || keys.has('ArrowRight')) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const length = Math.sqrt(dx * dx + dy * dy);
      dx /= length;
      dy /= length;
      this.energy = Math.max(0, this.energy - GAME_CONFIG.ENERGY_DRAIN_RATE * dt);
    }

    this.velocityX = dx * GAME_CONFIG.PLAYER_SPEED;
    this.velocityY = dy * GAME_CONFIG.PLAYER_SPEED;

    this.x += this.velocityX * dt;
    this.y += this.velocityY * dt;

    const halfSize = this.size / 2;
    this.x = Math.max(halfSize, Math.min(canvasWidth - halfSize, this.x));
    this.y = Math.max(halfSize, Math.min(canvasHeight - halfSize, this.y));

    if (this.isHit) {
      this.hitTimer -= dt * 1000;
      if (this.hitTimer <= 0) {
        this.isHit = false;
        this.hitTimer = 0;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);

    const angle = Math.atan2(this.velocityY, this.velocityX);
    if (this.velocityX !== 0 || this.velocityY !== 0) {
      ctx.rotate(angle);
    }

    const size = this.size;
    const flashColor = this.isHit ? '#ff4444' : '#4a9eff';

    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(-size / 2, -size / 2);
    ctx.lineTo(-size / 3, 0);
    ctx.lineTo(-size / 2, size / 2);
    ctx.closePath();

    ctx.fillStyle = flashColor;
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.restore();
  }

  collectEnergy(): void {
    this.energy = Math.min(GAME_CONFIG.ENERGY_MAX, this.energy + GAME_CONFIG.ENERGY_RESTORE);
  }

  takeDamage(): void {
    this.energy = Math.max(0, this.energy - GAME_CONFIG.ENERGY_DAMAGE);
    this.isHit = true;
    this.hitTimer = GAME_CONFIG.HIT_FLASH_DURATION;
  }

  getRadius(): number {
    return this.size / 2;
  }
}
