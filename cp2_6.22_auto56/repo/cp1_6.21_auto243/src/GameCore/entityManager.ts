export interface Vector2 {
  x: number;
  y: number;
}

export interface PlayerState {
  pos: Vector2;
  radius: number;
  hp: number;
  maxHp: number;
  speed: number;
  evolutionPoints: number;
  spinAttackUnlocked: boolean;
  spinAttackCooldown: number;
  invincibleTimer: number;
  orbsEaten: number;
  enemiesKilled: number;
}

export interface OrbEntity {
  id: number;
  pos: Vector2;
  radius: number;
  active: boolean;
  absorbing: boolean;
  absorbTimer: number;
  colorPhase: number;
  spawnTime: number;
}

export interface EnemyEntity {
  id: number;
  pos: Vector2;
  radius: number;
  active: boolean;
  speed: number;
  zigzagPhase: number;
  zigzagAmplitude: number;
  pulsatePhase: number;
  dying: boolean;
  deathTimer: number;
  baseAngle: number;
}

export interface ParticleEffect {
  id: number;
  pos: Vector2;
  type: 'orb_absorb' | 'enemy_death' | 'spin_attack';
  timer: number;
  duration: number;
  radius: number;
  color: string;
  active: boolean;
  fragments?: Array<{ x: number; y: number; vx: number; vy: number; radius: number }>;
}

export interface InputState {
  up: boolean;
  down: boolean;
  left: boolean;
  right: boolean;
  space: boolean;
}

export interface CollisionResult {
  type: 'orb' | 'enemy';
  entityId: number;
  entityPos: Vector2;
}

class SpatialHash {
  private cellSize: number;
  private grid: Map<string, number[]>;

  constructor(cellSize: number) {
    this.cellSize = cellSize;
    this.grid = new Map();
  }

  clear(): void {
    this.grid.clear();
  }

  private key(cx: number, cy: number): string {
    return `${cx},${cy}`;
  }

  insert(id: number, x: number, y: number, radius: number): void {
    const minCX = Math.floor((x - radius) / this.cellSize);
    const maxCX = Math.floor((x + radius) / this.cellSize);
    const minCY = Math.floor((y - radius) / this.cellSize);
    const maxCY = Math.floor((y + radius) / this.cellSize);
    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const k = this.key(cx, cy);
        if (!this.grid.has(k)) this.grid.set(k, []);
        this.grid.get(k)!.push(id);
      }
    }
  }

  query(x: number, y: number, radius: number): Set<number> {
    const result = new Set<number>();
    const minCX = Math.floor((x - radius) / this.cellSize);
    const maxCX = Math.floor((x + radius) / this.cellSize);
    const minCY = Math.floor((y - radius) / this.cellSize);
    const maxCY = Math.floor((y + radius) / this.cellSize);
    for (let cx = minCX; cx <= maxCX; cx++) {
      for (let cy = minCY; cy <= maxCY; cy++) {
        const k = this.key(cx, cy);
        const ids = this.grid.get(k);
        if (ids) {
          for (const id of ids) result.add(id);
        }
      }
    }
    return result;
  }
}

const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;
const ORB_COLORS = ['#F56565', '#48BB78', '#4299E1'];
const ORB_COLOR_CYCLE = 0.5;
const ORB_ABSORB_DURATION = 0.3;
const ENEMY_DEATH_DURATION = 0.4;
const PLAYER_DAMAGE_INVINCIBLE = 1.0;
const ENEMY_BASE_SPEED = 50;
const ENEMY_ZIGZAG_AMPLITUDE = 30;
const ENEMY_ZIGZAG_FREQUENCY = 3;

let nextId = 1;

export class EntityManager {
  player: PlayerState;
  orbs: Map<number, OrbEntity> = new Map();
  enemies: Map<number, EnemyEntity> = new Map();
  particles: Map<number, ParticleEffect> = new Map();
  private spatialHash: SpatialHash;

  constructor() {
    this.player = this.createDefaultPlayer();
    this.spatialHash = new SpatialHash(50);
  }

  private createDefaultPlayer(): PlayerState {
    return {
      pos: { x: WORLD_WIDTH / 2, y: WORLD_HEIGHT / 2 },
      radius: 15,
      hp: 5,
      maxHp: 5,
      speed: 200,
      evolutionPoints: 0,
      spinAttackUnlocked: false,
      spinAttackCooldown: 0,
      invincibleTimer: 0,
      orbsEaten: 0,
      enemiesKilled: 0,
    };
  }

  reset(): void {
    this.player = this.createDefaultPlayer();
    this.orbs.clear();
    this.enemies.clear();
    this.particles.clear();
    nextId = 1;
  }

  spawnOrb(): void {
    const padding = 50;
    const orb: OrbEntity = {
      id: nextId++,
      pos: {
        x: padding + Math.random() * (WORLD_WIDTH - padding * 2),
        y: padding + Math.random() * (WORLD_HEIGHT - padding * 2),
      },
      radius: 8,
      active: true,
      absorbing: false,
      absorbTimer: 0,
      colorPhase: 0,
      spawnTime: performance.now() / 1000,
    };
    this.orbs.set(orb.id, orb);
  }

  spawnEnemy(): void {
    const side = Math.floor(Math.random() * 4);
    let x: number, y: number;
    switch (side) {
      case 0: x = Math.random() * WORLD_WIDTH; y = 0; break;
      case 1: x = WORLD_WIDTH; y = Math.random() * WORLD_HEIGHT; break;
      case 2: x = Math.random() * WORLD_WIDTH; y = WORLD_HEIGHT; break;
      default: x = 0; y = Math.random() * WORLD_HEIGHT; break;
    }
    const enemy: EnemyEntity = {
      id: nextId++,
      pos: { x, y },
      radius: 18,
      active: true,
      speed: ENEMY_BASE_SPEED,
      zigzagPhase: Math.random() * Math.PI * 2,
      zigzagAmplitude: ENEMY_ZIGZAG_AMPLITUDE,
      pulsatePhase: Math.random() * Math.PI * 2,
      dying: false,
      deathTimer: 0,
      baseAngle: 0,
    };
    this.enemies.set(enemy.id, enemy);
  }

  spawnOrbAbsorbParticle(pos: Vector2, colorPhase: number): void {
    const p: ParticleEffect = {
      id: nextId++,
      pos: { ...pos },
      type: 'orb_absorb',
      timer: 0,
      duration: ORB_ABSORB_DURATION,
      radius: 8,
      color: ORB_COLORS[Math.floor(colorPhase) % 3],
      active: true,
    };
    this.particles.set(p.id, p);
  }

  spawnEnemyDeathParticle(pos: Vector2): void {
    const fragments: ParticleEffect['fragments'] = [];
    for (let i = 0; i < 8; i++) {
      const angle = (Math.PI * 2 * i) / 8 + Math.random() * 0.3;
      const speed = 60 + Math.random() * 40;
      fragments.push({
        x: pos.x,
        y: pos.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: 3 + Math.random() * 3,
      });
    }
    const p: ParticleEffect = {
      id: nextId++,
      pos: { ...pos },
      type: 'enemy_death',
      timer: 0,
      duration: ENEMY_DEATH_DURATION,
      radius: 18,
      color: '#E53E3E',
      active: true,
      fragments,
    };
    this.particles.set(p.id, p);
  }

  spawnSpinAttackParticle(pos: Vector2, radius: number): void {
    const p: ParticleEffect = {
      id: nextId++,
      pos: { ...pos },
      type: 'spin_attack',
      timer: 0,
      duration: 0.5,
      radius,
      color: '#4FD1C5',
      active: true,
    };
    this.particles.set(p.id, p);
  }

  updatePlayer(input: InputState, dt: number): void {
    const p = this.player;
    let dx = 0;
    let dy = 0;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
      p.pos.x += dx * p.speed * dt;
      p.pos.y += dy * p.speed * dt;
    }

    p.pos.x = Math.max(p.radius, Math.min(WORLD_WIDTH - p.radius, p.pos.x));
    p.pos.y = Math.max(p.radius, Math.min(WORLD_HEIGHT - p.radius, p.pos.y));

    if (p.invincibleTimer > 0) {
      p.invincibleTimer -= dt;
    }
    if (p.spinAttackCooldown > 0) {
      p.spinAttackCooldown -= dt;
    }
  }

  updateEnemies(dt: number): void {
    const playerPos = this.player.pos;
    for (const enemy of this.enemies.values()) {
      if (!enemy.active) continue;

      if (enemy.dying) {
        enemy.deathTimer += dt;
        if (enemy.deathTimer >= ENEMY_DEATH_DURATION) {
          enemy.active = false;
        }
        continue;
      }

      const dx = playerPos.x - enemy.pos.x;
      const dy = playerPos.y - enemy.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 0.01) continue;

      const baseAngle = Math.atan2(dy, dx);
      enemy.baseAngle = baseAngle;

      enemy.zigzagPhase += dt * ENEMY_ZIGZAG_FREQUENCY * Math.PI * 2;
      const zigzagOffset = Math.sin(enemy.zigzagPhase) * enemy.zigzagAmplitude;
      const perpAngle = baseAngle + Math.PI / 2;
      const moveX = Math.cos(baseAngle) * enemy.speed * dt + Math.cos(perpAngle) * zigzagOffset * dt * 2;
      const moveY = Math.sin(baseAngle) * enemy.speed * dt + Math.sin(perpAngle) * zigzagOffset * dt * 2;

      enemy.pos.x += moveX;
      enemy.pos.y += moveY;
      enemy.pos.x = Math.max(enemy.radius, Math.min(WORLD_WIDTH - enemy.radius, enemy.pos.x));
      enemy.pos.y = Math.max(enemy.radius, Math.min(WORLD_HEIGHT - enemy.radius, enemy.pos.y));

      enemy.pulsatePhase += dt * 4;
    }
  }

  updateOrbs(time: number): void {
    for (const orb of this.orbs.values()) {
      if (!orb.active) continue;
      if (orb.absorbing) {
        orb.absorbTimer += 1 / 60;
        if (orb.absorbTimer >= ORB_ABSORB_DURATION) {
          orb.active = false;
        }
      }
      orb.colorPhase = ((time - orb.spawnTime) / ORB_COLOR_CYCLE) % 3;
    }
  }

  updateParticles(dt: number): void {
    for (const p of this.particles.values()) {
      if (!p.active) continue;
      p.timer += dt;
      if (p.timer >= p.duration) {
        p.active = false;
        continue;
      }
      if (p.type === 'enemy_death' && p.fragments) {
        for (const f of p.fragments) {
          f.x += f.vx * dt;
          f.y += f.vy * dt;
          f.vx *= 0.95;
          f.vy *= 0.95;
        }
      }
    }
  }

  checkCollisions(): CollisionResult[] {
    const results: CollisionResult[] = [];
    const p = this.player;
    if (p.invincibleTimer > 0) {
      const orbResults = this.checkOrbCollisions(p);
      results.push(...orbResults);
      return results;
    }

    results.push(...this.checkOrbCollisions(p));
    results.push(...this.checkEnemyCollisions(p));
    return results;
  }

  private checkOrbCollisions(p: PlayerState): CollisionResult[] {
    const results: CollisionResult[] = [];
    this.spatialHash.clear();
    for (const orb of this.orbs.values()) {
      if (!orb.active || orb.absorbing) continue;
      this.spatialHash.insert(orb.id, orb.pos.x, orb.pos.y, orb.radius);
    }

    const nearby = this.spatialHash.query(p.pos.x, p.pos.y, p.radius + 30);
    for (const id of nearby) {
      const orb = this.orbs.get(id);
      if (!orb || !orb.active || orb.absorbing) continue;
      const dx = p.pos.x - orb.pos.x;
      const dy = p.pos.y - orb.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < p.radius + orb.radius) {
        results.push({ type: 'orb', entityId: orb.id, entityPos: { ...orb.pos } });
      }
    }
    return results;
  }

  private checkEnemyCollisions(p: PlayerState): CollisionResult[] {
    const results: CollisionResult[] = [];
    this.spatialHash.clear();
    for (const enemy of this.enemies.values()) {
      if (!enemy.active || enemy.dying) continue;
      this.spatialHash.insert(enemy.id, enemy.pos.x, enemy.pos.y, enemy.radius);
    }

    const nearby = this.spatialHash.query(p.pos.x, p.pos.y, p.radius + 40);
    for (const id of nearby) {
      const enemy = this.enemies.get(id);
      if (!enemy || !enemy.active || enemy.dying) continue;
      const dx = p.pos.x - enemy.pos.x;
      const dy = p.pos.y - enemy.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 25) {
        results.push({ type: 'enemy', entityId: enemy.id, entityPos: { ...enemy.pos } });
      }
    }
    return results;
  }

  checkSpinAttackHits(): number[] {
    if (!this.player.spinAttackUnlocked || this.player.spinAttackCooldown > 0) return [];
    const hitIds: number[] = [];
    const attackRadius = 80;
    for (const enemy of this.enemies.values()) {
      if (!enemy.active || enemy.dying) continue;
      const dx = this.player.pos.x - enemy.pos.x;
      const dy = this.player.pos.y - enemy.pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < attackRadius + enemy.radius) {
        hitIds.push(enemy.id);
      }
    }
    return hitIds;
  }

  removeInactiveEntities(): void {
    for (const [id, orb] of this.orbs) {
      if (!orb.active) this.orbs.delete(id);
    }
    for (const [id, enemy] of this.enemies) {
      if (!enemy.active) this.enemies.delete(id);
    }
    for (const [id, particle] of this.particles) {
      if (!particle.active) this.particles.delete(id);
    }
  }

  getOrbColor(phase: number): string {
    const idx = Math.floor(phase) % 3;
    const nextIdx = (idx + 1) % 3;
    const t = phase - Math.floor(phase);
    return ORB_COLORS[idx];
  }

  static readonly WORLD_WIDTH = WORLD_WIDTH;
  static readonly WORLD_HEIGHT = WORLD_HEIGHT;
  static readonly ORB_COLORS = ORB_COLORS;
}
