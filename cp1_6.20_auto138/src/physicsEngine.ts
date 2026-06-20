import type { TerrainBlock, AABB, CharacterState, CollisionInfo, Vec2, MovingPlatformConfig } from './types';
import { TILE_SIZE, GRAVITY } from './types';

const SUB_STEPS = 3;
const CCD_SPEED_THRESHOLD = 1000 / 60;

export class PhysicsEngine {
  private terrains: TerrainBlock[] = [];

  setTerrains(terrains: TerrainBlock[]): void {
    this.terrains = terrains;
  }

  updateMovingPlatforms(dt: number): void {
    for (const t of this.terrains) {
      if (t.type === 'moving' && t.movingConfig) {
        this.updateMovingPlatform(t, t.movingConfig, dt);
      }
    }
  }

  private updateMovingPlatform(t: TerrainBlock, cfg: MovingPlatformConfig, dt: number): void {
    const delta = cfg.speed * cfg.direction * dt;
    if (cfg.axis === 'horizontal') {
      t.x += delta;
      if (t.x > cfg.originX + cfg.distance) {
        t.x = cfg.originX + cfg.distance;
        cfg.direction = -1;
      } else if (t.x < cfg.originX) {
        t.x = cfg.originX;
        cfg.direction = 1;
      }
    } else {
      t.y += delta;
      if (t.y > cfg.originY + cfg.distance) {
        t.y = cfg.originY + cfg.distance;
        cfg.direction = -1;
      } else if (t.y < cfg.originY) {
        t.y = cfg.originY;
        cfg.direction = 1;
      }
    }
  }

  step(character: CharacterState, input: any, dt: number): { char: CharacterState; collisions: CollisionInfo[] } {
    const subDt = dt / SUB_STEPS;
    let char = { ...character };
    const allCollisions: CollisionInfo[] = [];

    for (let i = 0; i < SUB_STEPS; i++) {
      const result = this.singleStep(char, input, subDt);
      char = result.char;
      allCollisions.push(...result.collisions);
    }

    const topCollision = allCollisions.find(c => c.side === 'top' && c.terrain && c.terrain.type !== 'slope');
    if (topCollision && topCollision.terrain) {
      const frictionFactor = Math.pow(topCollision.terrain.friction, SUB_STEPS);
      char.vx *= frictionFactor;
    }

    const slopeCollision = allCollisions.find(c => c.side === 'slope' && c.terrain);
    if (slopeCollision && slopeCollision.terrain) {
      const slopeForce = GRAVITY * 0.35;
      const dir = slopeCollision.terrain.slopeDirection || 'right';
      char.vx += (dir === 'right' ? 1 : -1) * slopeForce * dt;
      char.vx *= Math.pow(slopeCollision.terrain.friction, SUB_STEPS);
    }

    return { char, collisions: allCollisions };
  }

  private singleStep(char: CharacterState, input: any, dt: number): { char: CharacterState; collisions: CollisionInfo[] } {
    char.wasOnGround = char.onGround;

    const speed = Math.sqrt(char.vx * char.vx + char.vy * char.vy);
    const useCCD = speed > CCD_SPEED_THRESHOLD;

    const collisions: CollisionInfo[] = [];

    if (useCCD) {
      collisions.push(...this.performCCD(char, dt));
    } else {
      char.x += char.vx * dt;
      char.y += char.vy * dt;
      collisions.push(...this.resolveCollisions(char));
    }

    char.onGround = false;
    char.onWall = null;

    for (const col of collisions) {
      if (col.side === 'top') {
        char.onGround = true;
      } else if (col.side === 'left') {
        char.onWall = 'left';
      } else if (col.side === 'right') {
        char.onWall = 'right';
      }
    }

    for (const col of collisions) {
      if (col.terrain && col.terrain.type === 'moving' && col.side === 'top') {
        this.applyPlatformMovement(char, col.terrain, dt);
      }
    }

    return { char, collisions };
  }

  private performCCD(char: CharacterState, dt: number): CollisionInfo[] {
    const steps = 8;
    const smallDt = dt / steps;
    const allCollisions: CollisionInfo[] = [];

    for (let i = 0; i < steps; i++) {
      char.x += char.vx * smallDt;
      char.y += char.vy * smallDt;
      const cols = this.resolveCollisions(char);
      allCollisions.push(...cols);
    }

    return allCollisions;
  }

  private resolveCollisions(char: CharacterState): CollisionInfo[] {
    const collisions: CollisionInfo[] = [];
    const charAABB: AABB = { x: char.x, y: char.y, width: char.width, height: char.height };

    const sortedTerrains = [...this.terrains].sort((a, b) => {
      const aDist = Math.abs(a.x - char.x) + Math.abs(a.y - char.y);
      const bDist = Math.abs(b.x - char.x) + Math.abs(b.y - char.y);
      return aDist - bDist;
    });

    for (const terrain of sortedTerrains) {
      if (terrain.type === 'oneway') {
        if (char.oneWayPassThrough) continue;
        if (char.vy < 0) continue;
        const col = this.checkOneWayCollision(charAABB, terrain);
        if (col.hit) {
          this.applyCollisionResponse(char, col);
          collisions.push(col);
          charAABB.x = char.x;
          charAABB.y = char.y;
        }
      } else if (terrain.type === 'slope') {
        const col = this.checkSlopeCollision(charAABB, terrain);
        if (col.hit) {
          this.applyCollisionResponse(char, col);
          collisions.push(col);
          charAABB.x = char.x;
          charAABB.y = char.y;
        }
      } else {
        const col = this.checkAABBCollision(charAABB, terrain);
        if (col.hit) {
          this.applyCollisionResponse(char, col);
          collisions.push(col);
          charAABB.x = char.x;
          charAABB.y = char.y;
        }
      }
    }

    return collisions;
  }

  private checkAABBCollision(char: AABB, terrain: TerrainBlock): CollisionInfo {
    const result: CollisionInfo = {
      hit: false,
      normal: { x: 0, y: 0 },
      penetration: 0,
      terrain,
      side: null
    };

    const overlapX = Math.min(char.x + char.width, terrain.x + terrain.width) - Math.max(char.x, terrain.x);
    const overlapY = Math.min(char.y + char.height, terrain.y + terrain.height) - Math.max(char.y, terrain.y);

    if (overlapX > 0 && overlapY > 0) {
      result.hit = true;
      if (overlapX < overlapY) {
        const charCenter = char.x + char.width / 2;
        const terrainCenter = terrain.x + terrain.width / 2;
        if (charCenter < terrainCenter) {
          result.normal.x = -1;
          result.side = 'right';
          result.penetration = overlapX;
        } else {
          result.normal.x = 1;
          result.side = 'left';
          result.penetration = overlapX;
        }
      } else {
        const charCenter = char.y + char.height / 2;
        const terrainCenter = terrain.y + terrain.height / 2;
        if (charCenter < terrainCenter) {
          result.normal.y = -1;
          result.side = 'top';
          result.penetration = overlapY;
        } else {
          result.normal.y = 1;
          result.side = 'bottom';
          result.penetration = overlapY;
        }
      }
    }

    return result;
  }

  private checkSlopeCollision(char: AABB, terrain: TerrainBlock): CollisionInfo {
    const result: CollisionInfo = {
      hit: false,
      normal: { x: 0, y: 0 },
      penetration: 0,
      terrain,
      side: 'slope'
    };

    const charBottom = char.y + char.height;
    const charRight = char.x + char.width;

    if (charRight < terrain.x || char.x > terrain.x + terrain.width) return result;
    if (charBottom < terrain.y || char.y > terrain.y + terrain.height) return result;

    const dir = terrain.slopeDirection || 'right';
    let slopeHeight: number;

    if (dir === 'right') {
      const relX = Math.max(0, Math.min(charRight - terrain.x, terrain.width));
      slopeHeight = terrain.y + terrain.height - (relX / terrain.width) * terrain.height;
    } else {
      const relX = Math.max(0, Math.min(char.x + char.width - terrain.x, terrain.width));
      slopeHeight = terrain.y + (relX / terrain.width) * terrain.height;
    }

    const footX = char.x + char.width / 2;
    const relFootX = footX - terrain.x;

    if (relFootX >= 0 && relFootX <= terrain.width) {
      let surfaceY: number;
      if (dir === 'right') {
        surfaceY = terrain.y + terrain.height - (relFootX / terrain.width) * terrain.height;
      } else {
        surfaceY = terrain.y + (relFootX / terrain.width) * terrain.height;
      }

      if (charBottom > surfaceY && char.y < surfaceY + 10) {
        result.hit = true;
        result.penetration = charBottom - surfaceY;
        result.normal.y = -1;
        result.normal.x = dir === 'right' ? 0.5 : -0.5;
        const len = Math.sqrt(result.normal.x * result.normal.x + result.normal.y * result.normal.y);
        result.normal.x /= len;
        result.normal.y /= len;
      }
    }

    return result;
  }

  private checkOneWayCollision(char: AABB, terrain: TerrainBlock): CollisionInfo {
    const result: CollisionInfo = {
      hit: false,
      normal: { x: 0, y: 0 },
      penetration: 0,
      terrain,
      side: null
    };

    const overlapX = Math.min(char.x + char.width, terrain.x + terrain.width) - Math.max(char.x, terrain.x);
    if (overlapX <= 0) return result;

    const charBottom = char.y + char.height;
    const terrainTop = terrain.y;

    if (charBottom >= terrainTop && charBottom <= terrainTop + 12) {
      result.hit = true;
      result.normal.y = -1;
      result.penetration = charBottom - terrainTop;
      result.side = 'top';
    }

    return result;
  }

  private applyCollisionResponse(char: CharacterState, col: CollisionInfo): void {
    if (col.normal.x !== 0) {
      char.x += col.normal.x * col.penetration;
      if ((col.normal.x > 0 && char.vx < 0) || (col.normal.x < 0 && char.vx > 0)) {
        char.vx = 0;
      }
    }
    if (col.normal.y !== 0) {
      char.y += col.normal.y * col.penetration;
      if (col.normal.y < 0 && char.vy > 0) {
        char.vy = 0;
      } else if (col.normal.y > 0 && char.vy < 0) {
        char.vy = 0;
      }
    }
  }

  private applyPlatformMovement(char: CharacterState, platform: TerrainBlock, dt: number): void {
    if (!platform.movingConfig) return;
    const cfg = platform.movingConfig;
    const delta = cfg.speed * cfg.direction * dt;
    if (cfg.axis === 'horizontal') {
      char.x += delta;
    } else {
      char.y += delta;
    }
  }
}
