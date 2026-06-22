import { TerrainBlock } from '../editor/terrainBlock';
import { Player, PlayerState } from './player';

const GRAVITY = 980;
const RESTITUTION = 0.35;
const FRICTION_GROUND = 0.86;
const AIR_DRAG = 0.998;
const MAX_SPEED = 900;

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

export class PhysicsEngine {
  private player: Player;
  private blocks: TerrainBlock[];
  private worldWidth: number;
  private worldHeight: number;

  constructor(worldWidth: number, worldHeight: number, startX = 100, startY = 100) {
    this.worldWidth = worldWidth;
    this.worldHeight = worldHeight;
    this.player = new Player(startX, startY, 14);
    this.blocks = [];
  }

  public setWorldSize(w: number, h: number): void {
    this.worldWidth = w;
    this.worldHeight = h;
  }

  public setTerrain(blocks: TerrainBlock[]): void {
    this.blocks = blocks;
  }

  public getPlayer(): Player {
    return this.player;
  }

  public reset(): void {
    this.player.reset();
  }

  public getPlayerState(): PlayerState {
    return this.player.getState();
  }

  public update(deltaTime: number): void {
    const dt = Math.min(deltaTime, 1 / 30);
    const p = this.player;

    p.ay = GRAVITY;
    p.ax = 0;

    p.vx += p.ax * dt;
    p.vy += p.ay * dt;

    p.vx = clamp(p.vx, -MAX_SPEED, MAX_SPEED);
    p.vy = clamp(p.vy, -MAX_SPEED, MAX_SPEED);

    p.vx *= AIR_DRAG;

    let onGround = false;
    let carriedDx = 0;
    let carriedDy = 0;
    let conveyorPush = 0;

    const stepX = p.vx * dt;
    const stepY = p.vy * dt;

    p.x += stepX;
    this.resolveAxis('x', stepX, p, onGround => { onGround = onGround; });

    p.y += stepY;
    const groundResult = this.resolveAxis('y', stepY, p, (_g) => {
      if (stepY >= 0) onGround = true;
    });

    for (const r of groundResult) {
      if (r.type === 'top-contact') {
        if (r.block.type === 'movingPlatform') {
          carriedDx += r.block.dx;
          carriedDy += r.block.dy;
        } else if (r.block.type === 'conveyor') {
          conveyorPush += r.block.conveyorDirection * r.block.conveyorSpeed * dt;
        }
        r.block.takeHit(Math.abs(p.vy));
      } else if (r.type === 'bottom-contact') {
        r.block.takeHit(Math.abs(p.vy));
      } else if (r.type === 'side-contact') {
        r.block.takeHit(Math.abs(p.vx));
      }
    }

    p.x += carriedDx + conveyorPush;
    p.y += carriedDy;

    if (onGround) {
      p.vx *= FRICTION_GROUND;
    }

    p.onGround = onGround;

    if (p.x - p.radius < 0) {
      p.x = p.radius;
      p.vx = -p.vx * RESTITUTION;
    }
    if (p.x + p.radius > this.worldWidth) {
      p.x = this.worldWidth - p.radius;
      p.vx = -p.vx * RESTITUTION;
    }
    if (p.y + p.radius > this.worldHeight) {
      p.y = this.worldHeight - p.radius;
      p.vy = -p.vy * RESTITUTION;
      if (Math.abs(p.vy) < 40) p.vy = 0;
      p.onGround = true;
    }
    if (p.y - p.radius < 0) {
      p.y = p.radius;
      p.vy = -p.vy * RESTITUTION;
    }

    p.addTrailPoint();
  }

  private resolveAxis(
    axis: 'x' | 'y',
    step: number,
    p: Player,
    _onFlag: (v: boolean) => void,
  ): { type: 'top-contact' | 'bottom-contact' | 'side-contact'; block: TerrainBlock }[] {
    const results: { type: 'top-contact' | 'bottom-contact' | 'side-contact'; block: TerrainBlock }[] = [];

    for (const block of this.blocks) {
      if (block.destroyed) continue;
      if (!this.circleRectOverlap(p, block)) continue;

      const closestX = clamp(p.x, block.x, block.x + block.width);
      const closestY = clamp(p.y, block.y, block.y + block.height);
      const dx = p.x - closestX;
      const dy = p.y - closestY;
      const distSq = dx * dx + dy * dy;

      if (axis === 'y') {
        if (step >= 0) {
          const penetration = (p.y + p.radius) - block.y;
          if (penetration > 0 && p.x + p.radius * 0.6 > block.x && p.x - p.radius * 0.6 < block.x + block.width) {
            if (p.y + p.radius - penetration / 2 < block.y + 4) {
              p.y -= penetration;
              if (p.vy > 0) {
                p.vy = -p.vy * RESTITUTION;
                if (Math.abs(p.vy) < 45) p.vy = 0;
              }
              results.push({ type: 'top-contact', block });
              continue;
            }
          }
        } else {
          const penetration = (block.y + block.height) - (p.y - p.radius);
          if (penetration > 0 && p.x + p.radius * 0.6 > block.x && p.x - p.radius * 0.6 < block.x + block.width) {
            p.y += penetration;
            if (p.vy < 0) p.vy = -p.vy * RESTITUTION;
            results.push({ type: 'bottom-contact', block });
            continue;
          }
        }

        if (distSq < p.radius * p.radius) {
          const dist = Math.sqrt(distSq) || 0.0001;
          const overlap = p.radius - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          p.x += nx * overlap;
          p.y += ny * overlap;
          const vn = p.vx * nx + p.vy * ny;
          if (vn < 0) {
            p.vx -= (1 + RESTITUTION) * vn * nx;
            p.vy -= (1 + RESTITUTION) * vn * ny;
          }
          if (ny < -0.5) results.push({ type: 'top-contact', block });
          else if (ny > 0.5) results.push({ type: 'bottom-contact', block });
          else results.push({ type: 'side-contact', block });
        }
      } else {
        if (step > 0) {
          const penetration = (p.x + p.radius) - block.x;
          if (penetration > 0 && p.y + p.radius * 0.6 > block.y && p.y - p.radius * 0.6 < block.y + block.height) {
            p.x -= penetration;
            if (p.vx > 0) p.vx = -p.vx * RESTITUTION;
            results.push({ type: 'side-contact', block });
            continue;
          }
        } else if (step < 0) {
          const penetration = (block.x + block.width) - (p.x - p.radius);
          if (penetration > 0 && p.y + p.radius * 0.6 > block.y && p.y - p.radius * 0.6 < block.y + block.height) {
            p.x += penetration;
            if (p.vx < 0) p.vx = -p.vx * RESTITUTION;
            results.push({ type: 'side-contact', block });
            continue;
          }
        }

        if (distSq < p.radius * p.radius) {
          const dist = Math.sqrt(distSq) || 0.0001;
          const overlap = p.radius - dist;
          const nx = dx / dist;
          const ny = dy / dist;
          p.x += nx * overlap;
          p.y += ny * overlap;
          const vn = p.vx * nx + p.vy * ny;
          if (vn < 0) {
            p.vx -= (1 + RESTITUTION) * vn * nx;
            p.vy -= (1 + RESTITUTION) * vn * ny;
          }
          results.push({ type: 'side-contact', block });
        }
      }
    }

    return results;
  }

  private circleRectOverlap(p: Player, b: TerrainBlock): boolean {
    const cx = clamp(p.x, b.x, b.x + b.width);
    const cy = clamp(p.y, b.y, b.y + b.height);
    const dx = p.x - cx;
    const dy = p.y - cy;
    return (dx * dx + dy * dy) <= p.radius * p.radius;
  }
}
