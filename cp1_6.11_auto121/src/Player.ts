import { Maze, TILE_SIZE } from './Maze';

export class Player {
  public x: number;
  public y: number;
  public radius: number = 12;
  public glowRadius: number = 120;
  public speed: number = 3;
  public targetX: number;
  public targetY: number;

  private keys: { [key: string]: boolean } = {};

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
    this.targetX = startX;
    this.targetY = startY;

    window.addEventListener('keydown', (e) => {
      this.keys[e.key.toLowerCase()] = true;
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.key.toLowerCase()] = false;
    });
  }

  public update(maze: Maze): void {
    let dx = 0;
    let dy = 0;

    if (this.keys['w'] || this.keys['arrowup']) dy -= 1;
    if (this.keys['s'] || this.keys['arrowdown']) dy += 1;
    if (this.keys['a'] || this.keys['arrowleft']) dx -= 1;
    if (this.keys['d'] || this.keys['arrowright']) dx += 1;

    if (dx !== 0 && dy !== 0) {
      const invLen = 1 / Math.sqrt(dx * dx + dy * dy);
      dx *= invLen;
      dy *= invLen;
    }

    const moveX = dx * this.speed;
    const moveY = dy * this.speed;

    if (moveX !== 0) {
      const nextX = this.x + moveX;
      if (!this.checkCollision(nextX, this.y, maze)) {
        this.x = nextX;
      }
    }

    if (moveY !== 0) {
      const nextY = this.y + moveY;
      if (!this.checkCollision(this.x, nextY, maze)) {
        this.y = nextY;
      }
    }

    this.targetX = this.x;
    this.targetY = this.y;
  }

  private checkCollision(px: number, py: number, maze: Maze): boolean {
    const r = this.radius - 2;
    const corners = [
      { x: px - r, y: py - r },
      { x: px + r, y: py - r },
      { x: px - r, y: py + r },
      { x: px + r, y: py + r }
    ];

    for (const corner of corners) {
      const gridX = Math.floor(corner.x / TILE_SIZE);
      const gridY = Math.floor(corner.y / TILE_SIZE);
      if (maze.isWall(gridX, gridY)) {
        return true;
      }
    }
    return false;
  }

  public renderGlow(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.glowRadius
    );
    gradient.addColorStop(0, 'rgba(255, 215, 0, 0.35)');
    gradient.addColorStop(0.4, 'rgba(255, 215, 0, 0.15)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.glowRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius
    );
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(0.6, 'rgba(255, 215, 0, 0.6)');
    gradient.addColorStop(1, 'rgba(255, 215, 0, 0)');

    ctx.save();
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FFF8DC';
    ctx.beginPath();
    ctx.arc(this.x - 2, this.y - 2, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  public getGridX(): number {
    return Math.floor(this.x / TILE_SIZE);
  }

  public getGridY(): number {
    return Math.floor(this.y / TILE_SIZE);
  }
}
