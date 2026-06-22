
export interface Vector2 {
  x: number;
  y: number;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'crate' | 'barrel';
}

export interface DocumentFile {
  x: number;
  y: number;
  collected: boolean;
  collectAnim: number;
}

export interface Wall {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const LOGICAL_WIDTH = 1280;
export const LOGICAL_HEIGHT = 960;
export const TILE_SIZE = 64;
export const WALL_THICKNESS = 40;

export class GameMap {
  obstacles: Obstacle[] = [];
  walls: Wall[] = [];
  files: DocumentFile[] = [];

  constructor() {
    this.generateWalls();
    this.generateObstacles();
    this.generateFiles();
  }

  private generateWalls(): void {
    this.walls = [
      { x: 0, y: 0, width: LOGICAL_WIDTH, height: WALL_THICKNESS },
      { x: 0, y: LOGICAL_HEIGHT - WALL_THICKNESS, width: LOGICAL_WIDTH, height: WALL_THICKNESS },
      { x: 0, y: 0, width: WALL_THICKNESS, height: LOGICAL_HEIGHT },
      { x: LOGICAL_WIDTH - WALL_THICKNESS, y: 0, width: WALL_THICKNESS, height: LOGICAL_HEIGHT },
      { x: 280, y: 0, width: WALL_THICKNESS, height: 220 },
      { x: 560, y: WALL_THICKNESS, width: WALL_THICKNESS, height: 280 },
      { x: 860, y: 380, width: WALL_THICKNESS, height: 340 },
      { x: 180, y: 460, width: WALL_THICKNESS, height: 320 },
      { x: 460, y: 600, width: 340, height: WALL_THICKNESS },
    ];
  }

  private generateObstacles(): void {
    this.obstacles = [
      { x: 150, y: 150, width: 56, height: 56, type: 'crate' },
      { x: 240, y: 300, width: 44, height: 44, type: 'barrel' },
      { x: 420, y: 180, width: 56, height: 56, type: 'crate' },
      { x: 380, y: 380, width: 44, height: 44, type: 'barrel' },
      { x: 680, y: 150, width: 56, height: 56, type: 'crate' },
      { x: 760, y: 280, width: 44, height: 44, type: 'barrel' },
      { x: 1000, y: 200, width: 56, height: 56, type: 'crate' },
      { x: 1100, y: 420, width: 44, height: 44, type: 'barrel' },
      { x: 980, y: 560, width: 56, height: 56, type: 'crate' },
      { x: 800, y: 760, width: 44, height: 44, type: 'barrel' },
      { x: 500, y: 780, width: 56, height: 56, type: 'crate' },
      { x: 320, y: 700, width: 44, height: 44, type: 'barrel' },
      { x: 120, y: 800, width: 56, height: 56, type: 'crate' },
      { x: 660, y: 480, width: 44, height: 44, type: 'barrel' },
      { x: 1120, y: 800, width: 56, height: 56, type: 'crate' },
    ];
  }

  private generateFiles(): void {
    this.files = [
      { x: 110, y: 110, collected: false, collectAnim: 0 },
      { x: LOGICAL_WIDTH - 110, y: 110, collected: false, collectAnim: 0 },
      { x: 110, y: LOGICAL_HEIGHT - 110, collected: false, collectAnim: 0 },
      { x: LOGICAL_WIDTH - 110, y: LOGICAL_HEIGHT - 110, collected: false, collectAnim: 0 },
      { x: LOGICAL_WIDTH / 2, y: LOGICAL_HEIGHT / 2, collected: false, collectAnim: 0 },
    ];
  }

  getAllBlockingRects(): { x: number; y: number; width: number; height: number }[] {
    return [...this.walls, ...this.obstacles];
  }

  isPointBlocked(x: number, y: number, radius: number = 0): boolean {
    const rects = this.getAllBlockingRects();
    for (const r of rects) {
      const closestX = Math.max(r.x, Math.min(x, r.x + r.width));
      const closestY = Math.max(r.y, Math.min(y, r.y + r.height));
      const dx = x - closestX;
      const dy = y - closestY;
      if (dx * dx + dy * dy < radius * radius) return true;
    }
    return false;
  }

  generatePatrolPath(startX: number, startY: number, count: number = 3): Vector2[] {
    const path: Vector2[] = [{ x: startX, y: startY }];
    const attempts = 50;
    for (let i = 0; i < count - 1; i++) {
      let found = false;
      for (let a = 0; a < attempts && !found; a++) {
        const x = WALL_THICKNESS + 80 + Math.random() * (LOGICAL_WIDTH - 2 * WALL_THICKNESS - 160);
        const y = WALL_THICKNESS + 80 + Math.random() * (LOGICAL_HEIGHT - 2 * WALL_THICKNESS - 160);
        if (!this.isPointBlocked(x, y, 30)) {
          path.push({ x, y });
          found = true;
        }
      }
      if (!found) {
        path.push({
          x: WALL_THICKNESS + 100 + Math.random() * 200,
          y: WALL_THICKNESS + 100 + Math.random() * 200,
        });
      }
    }
    return path;
  }

  render(ctx: CanvasRenderingContext2D): void {
    this.renderFloor(ctx);
    this.renderWalls(ctx);
    this.renderObstacles(ctx);
    this.renderFiles(ctx);
  }

  private renderFloor(ctx: CanvasRenderingContext2D): void {
    const cols = Math.ceil(LOGICAL_WIDTH / TILE_SIZE);
    const rows = Math.ceil(LOGICAL_HEIGHT / TILE_SIZE);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const isAlt = (r + c) % 2 === 0;
        ctx.fillStyle = isAlt ? '#4a4a4a' : '#3f3f3f';
        ctx.fillRect(c * TILE_SIZE, r * TILE_SIZE, TILE_SIZE, TILE_SIZE);
        ctx.strokeStyle = 'rgba(0,0,0,0.15)';
        ctx.lineWidth = 1;
        ctx.strokeRect(c * TILE_SIZE + 0.5, r * TILE_SIZE + 0.5, TILE_SIZE - 1, TILE_SIZE - 1);
      }
    }
  }

  private renderWalls(ctx: CanvasRenderingContext2D): void {
    for (const w of this.walls) {
      ctx.fillStyle = '#1a1a1a';
      ctx.fillRect(w.x, w.y, w.width, w.height);
      const brickH = 20;
      const brickW = 40;
      ctx.strokeStyle = '#2d2d2d';
      ctx.lineWidth = 1;
      if (w.width >= w.height) {
        const rows = Math.ceil(w.height / brickH);
        for (let r = 0; r < rows; r++) {
          const offset = r % 2 === 0 ? 0 : brickW / 2;
          ctx.beginPath();
          ctx.moveTo(w.x, w.y + r * brickH);
          ctx.lineTo(w.x + w.width, w.y + r * brickH);
          ctx.stroke();
          for (let x = w.x - offset; x < w.x + w.width; x += brickW) {
            ctx.beginPath();
            ctx.moveTo(x, w.y + r * brickH);
            ctx.lineTo(x, w.y + Math.min((r + 1) * brickH, w.height));
            ctx.stroke();
          }
        }
      } else {
        const cols = Math.ceil(w.width / brickW);
        for (let c = 0; c < cols; c++) {
          const offset = c % 2 === 0 ? 0 : brickH / 2;
          ctx.beginPath();
          ctx.moveTo(w.x + c * brickW, w.y);
          ctx.lineTo(w.x + c * brickW, w.y + w.height);
          ctx.stroke();
          for (let y = w.y - offset; y < w.y + w.height; y += brickH) {
            ctx.beginPath();
            ctx.moveTo(w.x + c * brickW, y);
            ctx.lineTo(w.x + Math.min((c + 1) * brickW, w.width), y);
            ctx.stroke();
          }
        }
      }
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.strokeRect(w.x, w.y, w.width, w.height);
    }
  }

  private renderObstacles(ctx: CanvasRenderingContext2D): void {
    for (const o of this.obstacles) {
      if (o.type === 'crate') {
        const grad = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.height);
        grad.addColorStop(0, '#c89060');
        grad.addColorStop(1, '#8b5a2b');
        ctx.fillStyle = grad;
        ctx.fillRect(o.x, o.y, o.width, o.height);
        ctx.strokeStyle = '#5a3a1a';
        ctx.lineWidth = 3;
        ctx.strokeRect(o.x + 1.5, o.y + 1.5, o.width - 3, o.height - 3);
        ctx.beginPath();
        ctx.moveTo(o.x, o.y);
        ctx.lineTo(o.x + o.width, o.y + o.height);
        ctx.moveTo(o.x + o.width, o.y);
        ctx.lineTo(o.x, o.y + o.height);
        ctx.strokeStyle = 'rgba(90,58,26,0.6)';
        ctx.lineWidth = 2;
        ctx.stroke();
      } else {
        const cx = o.x + o.width / 2;
        const cy = o.y + o.height / 2;
        const rx = o.width / 2;
        const ry = o.height / 2;
        const grad = ctx.createRadialGradient(cx - rx * 0.3, cy - ry * 0.3, 2, cx, cy, rx);
        grad.addColorStop(0, '#a03030');
        grad.addColorStop(1, '#5c1a1a');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#2a0a0a';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.strokeStyle = 'rgba(255,200,200,0.15)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(cx - rx * 0.25, cy - ry * 0.25, rx * 0.4, ry * 0.25, -0.4, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }

  private renderFiles(ctx: CanvasRenderingContext2D): void {
    for (const f of this.files) {
      if (f.collected && f.collectAnim >= 1) continue;
      const size = 22;
      const pulse = 1 + Math.sin(Date.now() / 300) * 0.08;
      const scale = f.collected ? (1 - f.collectAnim) * 2 : pulse;
      const alpha = f.collected ? 1 - f.collectAnim : 1;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(f.x, f.y);
      ctx.scale(scale, scale);
      ctx.rotate(-0.3);
      ctx.fillStyle = '#f0f0e8';
      ctx.fillRect(-size / 2, -size / 2, size, size);
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(-size / 2, -size / 2, size, size);
      ctx.beginPath();
      ctx.moveTo(size / 2, -size / 2);
      ctx.lineTo(size / 2 - 7, -size / 2);
      ctx.lineTo(size / 2, -size / 2 + 7);
      ctx.closePath();
      ctx.fillStyle = '#d0d0c8';
      ctx.fill();
      ctx.strokeStyle = '#888';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.strokeStyle = '#aaa';
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(-size / 2 + 4, -size / 2 + 7 + i * 5);
        ctx.lineTo(size / 2 - 4, -size / 2 + 7 + i * 5);
        ctx.stroke();
      }
      ctx.restore();
    }
  }
}

export function rayRectIntersect(
  ox: number,
  oy: number,
  dx: number,
  dy: number,
  rx: number,
  ry: number,
  rw: number,
  rh: number
): number {
  let tmin = -Infinity;
  let tmax = Infinity;
  const invDx = dx !== 0 ? 1 / dx : 1e9;
  const invDy = dy !== 0 ? 1 / dy : 1e9;
  let t1 = (rx - ox) * invDx;
  let t2 = (rx + rw - ox) * invDx;
  if (t1 > t2) [t1, t2] = [t2, t1];
  tmin = Math.max(tmin, t1);
  tmax = Math.min(tmax, t2);
  t1 = (ry - oy) * invDy;
  t2 = (ry + rh - oy) * invDy;
  if (t1 > t2) [t1, t2] = [t2, t1];
  tmin = Math.max(tmin, t1);
  tmax = Math.min(tmax, t2);
  if (tmax < 0 || tmin > tmax) return Infinity;
  return tmin > 0 ? tmin : (tmax > 0 ? 0.0001 : Infinity);
}
