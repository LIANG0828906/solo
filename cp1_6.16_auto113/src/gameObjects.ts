export interface AABB {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
  active: boolean;
}

export interface Asteroid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  rotation: number;
  rotationSpeed: number;
  active: boolean;
  vertices: number[];
}

export interface EnemyShip {
  x: number;
  y: number;
  vx: number;
  size: number;
  active: boolean;
  trailTimer: number;
}

export interface TrailParticle {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  size: number;
  active: boolean;
}

export class ObjectPool<T> {
  private pool: T[];
  private factory: () => T;
  private resetFn: (obj: T) => void;

  constructor(factory: () => T, resetFn: (obj: T) => void, initialSize: number) {
    this.factory = factory;
    this.resetFn = resetFn;
    this.pool = [];
    for (let i = 0; i < initialSize; i++) {
      const obj = this.factory();
      this.resetFn(obj);
      this.pool.push(obj);
    }
  }

  acquire(): T | null {
    for (let i = 0; i < this.pool.length; i++) {
      const obj = this.pool[i] as any;
      if (!obj.active) {
        this.resetFn(obj);
        obj.active = true;
        return obj;
      }
    }
    const obj = this.factory();
    this.resetFn(obj);
    (obj as any).active = true;
    this.pool.push(obj);
    return obj;
  }

  release(obj: T): void {
    (obj as any).active = false;
  }

  getActive(): T[] {
    return this.pool.filter(o => (o as any).active);
  }

  getAll(): T[] {
    return this.pool;
  }
}

function createAsteroid(): Asteroid {
  return {
    x: 0, y: 0, vx: 0, vy: 0, size: 30,
    rotation: 0, rotationSpeed: 0, active: false,
    vertices: [],
  };
}

function resetAsteroid(a: Asteroid): void {
  a.active = false;
}

function createEnemyShip(): EnemyShip {
  return { x: 0, y: 0, vx: 0, size: 40, active: false, trailTimer: 0 };
}

function resetEnemyShip(e: EnemyShip): void {
  e.active = false;
}

function createParticle(): Particle {
  return { x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0.8, size: 3, color: '#FFA500', active: false };
}

function resetParticle(p: Particle): void {
  p.active = false;
}

function createTrailParticle(): TrailParticle {
  return { x: 0, y: 0, life: 0, maxLife: 0.4, size: 4, active: false };
}

function resetTrailParticle(t: TrailParticle): void {
  t.active = false;
}

export class GameObjectManager {
  asteroidPool: ObjectPool<Asteroid>;
  enemyPool: ObjectPool<EnemyShip>;
  particlePool: ObjectPool<Particle>;
  trailPool: ObjectPool<TrailParticle>;
  spawnTimer: number = 0;
  enemySpawnTimer: number = 0;
  difficulty: number = 1;
  score: number = 0;
  surviveTime: number = 0;
  playerX: number = 0;
  playerY: number = 0;
  playerTargetX: number = 0;
  playerSpeed: number = 200;
  baseSpeed: number = 200;
  shieldHit: boolean = false;
  shieldCooldown: number = 0;
  interceptTargets: { x: number; y: number; size: number; type: string }[] = [];

  constructor() {
    this.asteroidPool = new ObjectPool<Asteroid>(createAsteroid, resetAsteroid, 20);
    this.enemyPool = new ObjectPool<EnemyShip>(createEnemyShip, resetEnemyShip, 10);
    this.particlePool = new ObjectPool<Particle>(createParticle, resetParticle, 100);
    this.trailPool = new ObjectPool<TrailParticle>(createTrailParticle, resetTrailParticle, 50);
  }

  spawnAsteroid(canvasW: number): void {
    const a = this.asteroidPool.acquire();
    if (!a) return;
    a.size = 30 + Math.random() * 30;
    a.x = Math.random() * canvasW;
    a.y = -a.size;
    a.vx = (Math.random() - 0.5) * 60;
    a.vy = 40 + Math.random() * 60 * this.difficulty;
    a.rotation = 0;
    a.rotationSpeed = (0.5 + Math.random() * 1.5) * (Math.PI / 180);
    a.active = true;
    a.vertices = [];
    const numVerts = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numVerts; i++) {
      const angle = (i / numVerts) * Math.PI * 2;
      const r = 0.7 + Math.random() * 0.3;
      a.vertices.push(Math.cos(angle) * r, Math.sin(angle) * r);
    }
  }

  spawnEnemy(canvasW: number, canvasH: number): void {
    const e = this.enemyPool.acquire();
    if (!e) return;
    const fromLeft = Math.random() < 0.5;
    e.size = 40;
    e.x = fromLeft ? -e.size : canvasW + e.size;
    e.y = 80 + Math.random() * (canvasH * 0.4);
    e.vx = fromLeft ? (60 + Math.random() * 40 * this.difficulty) : -(60 + Math.random() * 40 * this.difficulty);
    e.active = true;
    e.trailTimer = 0;
  }

  spawnExplosion(x: number, y: number, count: number = 30): void {
    const colors = ['#FFD700', '#FFA500', '#FF4500', '#FF6347', '#FF8C00'];
    for (let i = 0; i < count; i++) {
      const p = this.particlePool.acquire();
      if (!p) continue;
      const angle = Math.random() * Math.PI * 2;
      const speed = 30 + Math.random() * 80;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = 0.8;
      p.maxLife = 0.8;
      p.size = 2 + Math.random() * 4;
      p.color = colors[Math.floor(Math.random() * colors.length)];
      p.active = true;
    }
  }

  spawnEnemyTrail(x: number, y: number, dir: number): void {
    const t = this.trailPool.acquire();
    if (!t) return;
    t.x = x + dir * 20;
    t.y = y + (Math.random() - 0.5) * 6;
    t.life = 0.4;
    t.maxLife = 0.4;
    t.size = 3 + Math.random() * 3;
    t.active = true;
  }

  checkAABB(a: AABB, b: AABB): boolean {
    return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  }

  getPlayerAABB(): AABB {
    const s = 24;
    return { x: this.playerX - s / 2, y: this.playerY - s / 2, w: s, h: s };
  }

  getAsteroidAABB(a: Asteroid): AABB {
    return { x: a.x - a.size / 2, y: a.y - a.size / 2, w: a.size, h: a.size };
  }

  getEnemyAABB(e: EnemyShip): AABB {
    return { x: e.x - e.size / 2, y: e.y - e.size / 2, w: e.size, h: e.size };
  }

  update(deltaTime: number, canvasW: number, canvasH: number, shieldActive: boolean, engineActive: boolean, weaponActive: boolean, weaponRatio: number): void {
    this.surviveTime += deltaTime;
    this.score = Math.floor(this.surviveTime);
    this.difficulty = 1 + this.surviveTime / 30;

    this.playerX += (this.playerTargetX - this.playerX) * deltaTime * (engineActive ? 6 : 3);
    this.playerX = Math.max(20, Math.min(canvasW - 20, this.playerX));

    if (this.shieldCooldown > 0) {
      this.shieldCooldown -= deltaTime;
      this.shieldHit = this.shieldCooldown > 0;
    }

    this.spawnTimer += deltaTime;
    const spawnInterval = Math.max(0.4, 1.5 / this.difficulty);
    if (this.spawnTimer >= spawnInterval) {
      this.spawnTimer -= spawnInterval;
      this.spawnAsteroid(canvasW);
    }

    this.enemySpawnTimer += deltaTime;
    const enemyInterval = Math.max(2, 6 / this.difficulty);
    if (this.enemySpawnTimer >= enemyInterval) {
      this.enemySpawnTimer -= enemyInterval;
      this.spawnEnemy(canvasW, canvasH);
    }

    const asteroids = this.asteroidPool.getActive();
    for (const a of asteroids) {
      a.x += a.vx * deltaTime;
      a.y += a.vy * deltaTime;
      a.rotation += a.rotationSpeed;
      if (a.y > canvasH + a.size || a.x < -a.size || a.x > canvasW + a.size) {
        this.asteroidPool.release(a);
      }
    }

    const enemies = this.enemyPool.getActive();
    for (const e of enemies) {
      e.x += e.vx * deltaTime;
      e.trailTimer += deltaTime;
      if (e.trailTimer >= 0.05) {
        e.trailTimer = 0;
        this.spawnEnemyTrail(e.x, e.y, e.vx > 0 ? -1 : 1);
      }
      if (e.x < -e.size * 2 || e.x > canvasW + e.size * 2) {
        this.enemyPool.release(e);
      }
    }

    const trails = this.trailPool.getActive();
    for (const t of trails) {
      t.life -= deltaTime;
      if (t.life <= 0) {
        this.trailPool.release(t);
      }
    }

    const particles = this.particlePool.getActive();
    for (const p of particles) {
      p.x += p.vx * deltaTime;
      p.y += p.vy * deltaTime;
      p.vx *= 0.98;
      p.vy *= 0.98;
      p.life -= deltaTime;
      if (p.life <= 0) {
        this.particlePool.release(p);
      }
    }

    this.interceptTargets = [];
    const playerBox = this.getPlayerAABB();
    for (const a of asteroids) {
      if (this.checkAABB(playerBox, this.getAsteroidAABB(a))) {
        if (shieldActive && !this.shieldHit) {
          this.shieldHit = true;
          this.shieldCooldown = 0.5;
          this.spawnExplosion(a.x, a.y, 15);
          this.asteroidPool.release(a);
        } else if (!this.shieldHit) {
          return 'hit' as any;
        }
      }
      if (a.size > 40 && weaponActive) {
        const dx = a.x - this.playerX;
        const dy = a.y - this.playerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 300) {
          this.interceptTargets.push({ x: a.x, y: a.y, size: a.size, type: 'asteroid' });
        }
      }
    }

    for (const e of enemies) {
      if (this.checkAABB(playerBox, this.getEnemyAABB(e))) {
        if (shieldActive && !this.shieldHit) {
          this.shieldHit = true;
          this.shieldCooldown = 0.5;
          this.spawnExplosion(e.x, e.y, 15);
          this.enemyPool.release(e);
        } else if (!this.shieldHit) {
          return 'hit' as any;
        }
      }
      const dx = e.x - this.playerX;
      const dy = e.y - this.playerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 350) {
        this.interceptTargets.push({ x: e.x, y: e.y, size: e.size, type: 'enemy' });
      }
    }

    if (weaponActive) {
      let nearest: any = null;
      let nearDist = Infinity;
      for (const e of enemies) {
        const dx = e.x - this.playerX;
        const dy = e.y - this.playerY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < nearDist) {
          nearDist = dist;
          nearest = e;
        }
      }
      if (nearest && nearDist < 250 && Math.random() < weaponRatio * deltaTime * 3) {
        this.spawnExplosion(nearest.x, nearest.y, 20);
        this.score += 10;
        this.enemyPool.release(nearest);
      }
    }

    return undefined as any;
  }

  intercept(x: number, y: number): boolean {
    for (const t of this.interceptTargets) {
      const dx = x - t.x;
      const dy = y - t.y;
      if (Math.sqrt(dx * dx + dy * dy) < t.size + 30) {
        this.spawnExplosion(t.x, t.y, 30);
        this.score += t.type === 'enemy' ? 10 : 5;
        if (t.type === 'enemy') {
          const enemies = this.enemyPool.getActive();
          for (const e of enemies) {
            if (Math.abs(e.x - t.x) < 5 && Math.abs(e.y - t.y) < 5) {
              this.enemyPool.release(e);
              break;
            }
          }
        } else {
          const asteroids = this.asteroidPool.getActive();
          for (const a of asteroids) {
            if (Math.abs(a.x - t.x) < 5 && Math.abs(a.y - t.y) < 5) {
              this.asteroidPool.release(a);
              break;
            }
          }
        }
        return true;
      }
    }
    return false;
  }

  reset(canvasW: number, canvasH: number): void {
    this.asteroidPool.getAll().forEach(a => { (a as any).active = false; });
    this.enemyPool.getAll().forEach(e => { (e as any).active = false; });
    this.particlePool.getAll().forEach(p => { (p as any).active = false; });
    this.trailPool.getAll().forEach(t => { (t as any).active = false; });
    this.spawnTimer = 0;
    this.enemySpawnTimer = 0;
    this.difficulty = 1;
    this.score = 0;
    this.surviveTime = 0;
    this.playerX = canvasW / 2;
    this.playerY = canvasH - 80;
    this.playerTargetX = canvasW / 2;
    this.shieldHit = false;
    this.shieldCooldown = 0;
    this.interceptTargets = [];
  }
}
