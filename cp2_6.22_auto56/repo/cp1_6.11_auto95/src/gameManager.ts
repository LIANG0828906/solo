import {
  Ship,
  Bullet,
  BulletSource,
  Laser,
  Explosion,
  Star,
  BULLET_COLORS,
  BulletColor,
  BulletPattern,
  circleCircleCollision
} from './entities';

export interface GameState {
  ship: Ship;
  bullets: Bullet[];
  sources: BulletSource[];
  lasers: Laser[];
  explosions: Explosion[];
  stars: Star[];
  score: number;
  survivalTime: number;
  isGameOver: boolean;
  difficultyLevel: number;
  bulletsPerMinute: number;
  bulletSpeedMax: number;
  notification: { text: string; timer: number } | null;
  edgeFlash: { color: string; timer: number } | null;
  gameOverFlash: number;
  noHitTimer: number;
  canvasW: number;
  canvasH: number;
}

export interface InputState {
  w: boolean;
  a: boolean;
  s: boolean;
  d: boolean;
  shift: boolean;
  space: boolean;
}

const BASE_BULLETS_PER_MINUTE = 8;
const MAX_BULLETS_PER_MINUTE = 20;
const MIN_BULLETS_PER_MINUTE = 4;
const BASE_SPEED_MAX = 8;
const NO_HIT_COUNTERATTACK_TIME = 3;
const ADAPTATION_INTERVAL = 30;

export class GameManager {
  state: GameState;
  private input: InputState;
  private lastBulletSpawn: number = 0;
  private nextSourceId: number = 0;
  private adaptationTimer: number = 0;
  private adaptationWindowHits: number = 0;
  private adaptationWindowBullets: number = 0;
  private totalTime: number = 0;
  private scoreAccumulator: number = 0;
  private gameStarted: boolean = false;

  constructor(canvasW: number, canvasH: number) {
    this.canvasW = canvasW;
    this.canvasH = canvasH;
    this.input = { w: false, a: false, s: false, d: false, shift: false, space: false };

    const stars: Star[] = [];
    const starCount = Math.floor((canvasW * canvasH) / 3000);
    for (let i = 0; i < starCount; i++) {
      stars.push(new Star(Math.random() * canvasW, Math.random() * canvasH));
    }

    this.state = {
      ship: new Ship(canvasW / 2, canvasH / 2),
      bullets: [],
      sources: [],
      lasers: [],
      explosions: [],
      stars,
      score: 0,
      survivalTime: 0,
      isGameOver: false,
      difficultyLevel: 1,
      bulletsPerMinute: BASE_BULLETS_PER_MINUTE,
      bulletSpeedMax: BASE_SPEED_MAX,
      notification: null,
      edgeFlash: null,
      gameOverFlash: 0,
      noHitTimer: 0,
      canvasW,
      canvasH
    };
  }

  setInput(input: Partial<InputState>) {
    Object.assign(this.input, input);
  }

  resize(w: number, h: number) {
    this.canvasW = w;
    this.canvasH = h;
    this.state.canvasW = w;
    this.state.canvasH = h;
  }

  update(dt: number) {
    this.totalTime += dt;

    if (this.state.isGameOver) {
      if (this.state.gameOverFlash > 0) {
        this.state.gameOverFlash -= dt;
      }
      if (this.input.space) {
        this.restart();
      }
      return;
    }

    this.updateShip(dt);
    this.spawnBullets(dt);
    this.updateBullets(dt);
    this.updateLasers(dt);
    this.updateExplosions(dt);
    this.checkCollisions();
    this.checkCounterAttack(dt);
    this.updateDifficulty(dt);
    this.updateScore(dt);

    if (this.state.notification) {
      this.state.notification.timer -= dt;
      if (this.state.notification.timer <= 0) {
        this.state.notification = null;
      }
    }
    if (this.state.edgeFlash) {
      this.state.edgeFlash.timer -= dt;
      if (this.state.edgeFlash.timer <= 0) {
        this.state.edgeFlash = null;
      }
    }
  }

  private updateShip(dt: number) {
    const ship = this.state.ship;
    const baseSpeed = 5;
    const speed = this.input.shift ? baseSpeed * 2 : baseSpeed;

    let dx = 0, dy = 0;
    if (this.input.w) dy -= 1;
    if (this.input.s) dy += 1;
    if (this.input.a) dx -= 1;
    if (this.input.d) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx = (dx / len) * speed;
      dy = (dy / len) * speed;
    }

    ship.targetX = Math.max(ship.size, Math.min(this.canvasW - ship.size, ship.targetX + dx));
    ship.targetY = Math.max(ship.size, Math.min(this.canvasH - ship.size - 60, ship.targetY + dy));

    if (this.input.shift && (dx !== 0 || dy !== 0)) {
      ship.shield = Math.max(0, ship.shield - 3 * dt);
    }

    ship.update(dt);
  }

  private spawnBullets(dt: number) {
    if (!this.gameStarted && this.state.sources.length === 0 && this.totalTime > 0.5) {
      this.gameStarted = true;
    }

    this.lastBulletSpawn += dt;
    const spawnInterval = 60 / this.state.bulletsPerMinute;

    if (this.lastBulletSpawn >= spawnInterval) {
      this.lastBulletSpawn = 0;
      this.spawnBulletWave();
    }
  }

  private spawnBulletWave() {
    const patterns: BulletPattern[] = ['straight', 'fan', 'tracking'];
    const pattern = patterns[Math.floor(Math.random() * patterns.length)];
    const source = this.createSource();
    this.state.sources.push(source);

    const color = BULLET_COLORS[Math.floor(Math.random() * BULLET_COLORS.length)];
    const speedMin = 3;
    const speedMax = this.state.bulletSpeedMax;

    if (pattern === 'straight') {
      const count = 1 + Math.floor(Math.random() * 2);
      for (let i = 0; i < count; i++) {
        const angle = this.angleToTarget(source.x, source.y) + (Math.random() - 0.5) * 0.3;
        const speed = speedMin + Math.random() * (speedMax - speedMin);
        const radius = 6 + Math.random() * 6;
        this.state.bullets.push(new Bullet(
          source.x, source.y,
          Math.cos(angle) * speed, Math.sin(angle) * speed,
          radius, speed, color, 'straight', source.id
        ));
        this.adaptationWindowBullets++;
      }
    } else if (pattern === 'fan') {
      const count = 3 + Math.floor(Math.random() * 3);
      const baseAngle = this.angleToTarget(source.x, source.y);
      const spread = 0.4 + Math.random() * 0.4;
      const speed = speedMin + Math.random() * (speedMax - speedMin);
      const radius = 6 + Math.random() * 4;
      for (let i = 0; i < count; i++) {
        const t = count === 1 ? 0 : i / (count - 1) - 0.5;
        const angle = baseAngle + t * spread;
        this.state.bullets.push(new Bullet(
          source.x, source.y,
          Math.cos(angle) * speed, Math.sin(angle) * speed,
          radius, speed, color, 'fan', source.id
        ));
        this.adaptationWindowBullets++;
      }
    } else if (pattern === 'tracking') {
      const speed = speedMin + Math.random() * (speedMax - speedMin) * 0.6;
      const radius = 7 + Math.random() * 5;
      const angle = this.angleToTarget(source.x, source.y);
      this.state.bullets.push(new Bullet(
        source.x, source.y,
        Math.cos(angle) * speed, Math.sin(angle) * speed,
        radius, speed, color, 'tracking', source.id,
        { x: this.state.ship.x, y: this.state.ship.y }
      ));
      this.adaptationWindowBullets++;
    }
  }

  private createSource(): BulletSource {
    const id = this.nextSourceId++;
    const edge = Math.floor(Math.random() * 4);
    let x: number, y: number;
    const margin = 20;
    switch (edge) {
      case 0: x = Math.random() * this.canvasW; y = -margin; break;
      case 1: x = this.canvasW + margin; y = Math.random() * (this.canvasH - 60); break;
      case 2: x = Math.random() * this.canvasW; y = this.canvasH - 60 + margin; break;
      default: x = -margin; y = Math.random() * (this.canvasH - 60); break;
    }
    return new BulletSource(id, x, y);
  }

  private angleToTarget(x: number, y: number): number {
    return Math.atan2(this.state.ship.y - y, this.state.ship.x - x);
  }

  private updateBullets(dt: number) {
    for (let i = this.state.bullets.length - 1; i >= 0; i--) {
      const bullet = this.state.bullets[i];
      bullet.update(dt, this.canvasW, this.canvasH);
      if (bullet.isOutOfBounds(this.canvasW, this.canvasH)) {
        this.state.bullets.splice(i, 1);
      }
    }

    for (let i = this.state.sources.length - 1; i >= 0; i--) {
      const src = this.state.sources[i];
      const hasBullets = this.state.bullets.some(b => b.sourceId === src.id);
      if (!hasBullets && !src.active) {
        this.state.sources.splice(i, 1);
      }
    }
  }

  private updateLasers(dt: number) {
    for (let i = this.state.lasers.length - 1; i >= 0; i--) {
      if (!this.state.lasers[i].update(dt)) {
        this.state.lasers.splice(i, 1);
      }
    }
  }

  private updateExplosions(dt: number) {
    for (let i = this.state.explosions.length - 1; i >= 0; i--) {
      if (!this.state.explosions[i].update(dt)) {
        this.state.explosions.splice(i, 1);
      }
    }
  }

  private checkCollisions() {
    const ship = this.state.ship;
    if (ship.invincibleTimer > 0) return;

    const shipR = ship.getRadius();
    for (let i = this.state.bullets.length - 1; i >= 0; i--) {
      const bullet = this.state.bullets[i];
      if (circleCircleCollision(ship.x, ship.y, shipR, bullet.x, bullet.y, bullet.radius)) {
        this.state.bullets.splice(i, 1);
        this.onShipHit();
        break;
      }
    }
  }

  private onShipHit() {
    const ship = this.state.ship;
    ship.shield -= 20;
    ship.triggerHit();
    this.adaptationWindowHits++;
    this.state.noHitTimer = 0;

    if (ship.shield <= 0) {
      ship.shield = 0;
      this.state.isGameOver = true;
      this.state.gameOverFlash = 0.5;
    }
  }

  private checkCounterAttack(dt: number) {
    this.state.noHitTimer += dt;

    if (this.state.noHitTimer >= NO_HIT_COUNTERATTACK_TIME && this.state.sources.length > 0) {
      this.state.noHitTimer = 0;

      const ship = this.state.ship;
      let nearest: BulletSource | null = null;
      let nearestDist = Infinity;
      for (const src of this.state.sources) {
        if (!src.active) continue;
        const dx = src.x - ship.x;
        const dy = src.y - ship.y;
        const dist = dx * dx + dy * dy;
        if (dist < nearestDist) {
          nearestDist = dist;
          nearest = src;
        }
      }

      if (nearest) {
        const edgePoint = this.getEdgeIntersection(ship.x, ship.y, nearest.x, nearest.y);
        this.state.lasers.push(new Laser(ship.x, ship.y, edgePoint.x, edgePoint.y, nearest.id));
        this.state.edgeFlash = { color: '#3399FF', timer: 0.2 };

        if (circleCircleCollision(
          ship.x, ship.y, 9999,
          nearest.x, nearest.y, nearest.getRadius()
        )) {
          nearest.active = false;
          this.state.explosions.push(new Explosion(nearest.x, nearest.y));
          this.state.score += 50;
          for (let i = this.state.bullets.length - 1; i >= 0; i--) {
            if (this.state.bullets[i].sourceId === nearest.id) {
              this.state.bullets.splice(i, 1);
            }
          }
        }
      }
    }
  }

  private getEdgeIntersection(x1: number, y1: number, x2: number, y2: number): { x: number; y: number } {
    const dx = x2 - x1;
    const dy = y2 - y1;
    let t = 1;
    const margin = 10;

    if (dx > 0) t = Math.min(t, (this.canvasW + margin - x1) / dx);
    else if (dx < 0) t = Math.min(t, (-margin - x1) / dx);
    if (dy > 0) t = Math.min(t, (this.canvasH + margin - y1) / dy);
    else if (dy < 0) t = Math.min(t, (-margin - y1) / dy);

    return { x: x1 + dx * t * 2, y: y1 + dy * t * 2 };
  }

  private updateDifficulty(dt: number) {
    this.adaptationTimer += dt;
    if (this.adaptationTimer >= ADAPTATION_INTERVAL) {
      this.adaptationTimer = 0;
      const evadeRate = this.adaptationWindowBullets > 0
        ? 1 - this.adaptationWindowHits / this.adaptationWindowBullets
        : 1;

      if (evadeRate > 0.8 && this.adaptationWindowHits < 2) {
        this.state.bulletsPerMinute = Math.min(MAX_BULLETS_PER_MINUTE, this.state.bulletsPerMinute * 1.2);
        this.state.bulletSpeedMax = Math.min(15, this.state.bulletSpeedMax + 1);
        this.state.difficultyLevel = Math.min(5, this.state.difficultyLevel + 1);
        this.state.notification = { text: '警戒提升', timer: 2 };
      } else if (evadeRate < 0.4 || this.adaptationWindowHits > 5) {
        this.state.bulletsPerMinute = Math.max(MIN_BULLETS_PER_MINUTE, this.state.bulletsPerMinute * 0.9);
        this.state.difficultyLevel = Math.max(1, this.state.difficultyLevel - 1);
        this.state.notification = { text: '压制减弱', timer: 2 };
      }

      this.adaptationWindowHits = 0;
      this.adaptationWindowBullets = 0;
    }
  }

  private updateScore(dt: number) {
    if (this.gameStarted) {
      this.state.survivalTime += dt;
      this.scoreAccumulator += dt * 10;
      if (this.scoreAccumulator >= 1) {
        const add = Math.floor(this.scoreAccumulator);
        this.state.score += add;
        this.scoreAccumulator -= add;
      }
    }
  }

  private restart() {
    this.state = {
      ship: new Ship(this.canvasW / 2, this.canvasH / 2),
      bullets: [],
      sources: [],
      lasers: [],
      explosions: [],
      stars: this.state.stars,
      score: 0,
      survivalTime: 0,
      isGameOver: false,
      difficultyLevel: 1,
      bulletsPerMinute: BASE_BULLETS_PER_MINUTE,
      bulletSpeedMax: BASE_SPEED_MAX,
      notification: null,
      edgeFlash: null,
      gameOverFlash: 0,
      noHitTimer: 0,
      canvasW: this.canvasW,
      canvasH: this.canvasH
    };
    this.lastBulletSpawn = 0;
    this.nextSourceId = 0;
    this.adaptationTimer = 0;
    this.adaptationWindowHits = 0;
    this.adaptationWindowBullets = 0;
    this.scoreAccumulator = 0;
    this.gameStarted = false;
    this.totalTime = 0;
  }

  getTime(): number {
    return this.totalTime;
  }
}
