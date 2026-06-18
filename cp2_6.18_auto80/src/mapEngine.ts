import { eventBus, gameState } from './gameState';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Player {
  pos: Vec2;
  vel: Vec2;
  radius: number;
  speed: number;
  glowLength: number;
  hitCooldown: number;
}

export interface Fragment {
  pos: Vec2;
  size: number;
  rotation: number;
  collected: boolean;
  collectAnim: number;
  id: number;
}

export interface Enemy {
  pos: Vec2;
  vel: Vec2;
  radiusX: number;
  radiusY: number;
  speed: number;
  target: Vec2 | null;
  patrolTimer: number;
  state: 'patrol' | 'chase';
  id: number;
}

export interface ShadowZone {
  pos: Vec2;
  radius: number;
}

interface SpatialGrid<T> {
  cellSize: number;
  cells: Map<string, T[]>;
}

const FRAGMENT_COUNT = 80;
const ENEMY_COUNT = 8;
const MIN_FRAGMENT_DISTANCE = 30;
const PLAYER_SPEED = 280;
const PLAYER_RADIUS = 20;
const GLOW_LENGTH = 50;
const FRAGMENT_SIZE = 12;
const ENEMY_RADIUS_X = 25;
const ENEMY_RADIUS_Y = 20;
const ENEMY_SPEED_RATIO = 0.6;
const DETECTION_RADIUS = 180;
const CHASE_INTERVAL = 0.1;
const AVOIDANCE_RADIUS = 60;
const AVOIDANCE_STRENGTH = 0.6;

export class MapEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;

  private player!: Player;
  private fragments: Fragment[] = [];
  private enemies: Enemy[] = [];
  private shadowZones: ShadowZone[] = [];

  private keys: Set<string> = new Set();
  private fragmentGrid!: SpatialGrid<Fragment>;
  private enemyGrid!: SpatialGrid<Enemy>;
  private nextId: number = 0;
  private chaseTimer: number = 0;
  private hitFlashTimer: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;

    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.setupInput();
    this.setupEventListeners();
    this.reset();
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  private setupInput(): void {
    window.addEventListener('keydown', (e) => {
      this.keys.add(e.key.toLowerCase());
      if (e.key === 'Escape') {
        gameState.togglePause();
      }
    });
    window.addEventListener('keyup', (e) => {
      this.keys.delete(e.key.toLowerCase());
    });
  }

  private setupEventListeners(): void {
    eventBus.on('restart', () => this.reset());
    eventBus.on('pause', () => { });
    eventBus.on('resume', () => { });
  }

  reset(): void {
    this.nextId = 0;
    this.hitFlashTimer = 0;
    this.chaseTimer = 0;

    this.player = {
      pos: { x: this.width / 2, y: this.height / 2 },
      vel: { x: 0, y: 0 },
      radius: PLAYER_RADIUS,
      speed: PLAYER_SPEED,
      glowLength: GLOW_LENGTH,
      hitCooldown: 0,
    };

    this.fragmentGrid = {
      cellSize: 60,
      cells: new Map(),
    };
    this.enemyGrid = {
      cellSize: 100,
      cells: new Map(),
    };

    this.generateFragments();
    this.generateEnemies();
    this.generateShadowZones();
  }

  private generateFragments(): void {
    this.fragments = [];
    this.fragmentGrid.cells.clear();

    const margin = 60;
    let attempts = 0;
    const maxAttempts = FRAGMENT_COUNT * 50;

    while (this.fragments.length < FRAGMENT_COUNT && attempts < maxAttempts) {
      attempts++;
      const x = margin + Math.random() * (this.width - margin * 2);
      const y = margin + Math.random() * (this.height - margin * 2);

      let valid = true;
      for (const frag of this.fragments) {
        const dx = frag.pos.x - x;
        const dy = frag.pos.y - y;
        if (dx * dx + dy * dy < MIN_FRAGMENT_DISTANCE * MIN_FRAGMENT_DISTANCE) {
          valid = false;
          break;
        }
      }

      const pdx = this.player.pos.x - x;
      const pdy = this.player.pos.y - y;
      if (pdx * pdx + pdy * pdy < 150 * 150) {
        valid = false;
      }

      if (valid) {
        const frag: Fragment = {
          pos: { x, y },
          size: FRAGMENT_SIZE,
          rotation: Math.random() * Math.PI * 2,
          collected: false,
          collectAnim: 0,
          id: this.nextId++,
        };
        this.fragments.push(frag);
        this.addFragmentToGrid(frag);
      }
    }
  }

  private addFragmentToGrid(frag: Fragment): void {
    const gridX = Math.floor(frag.pos.x / this.fragmentGrid.cellSize);
    const gridY = Math.floor(frag.pos.y / this.fragmentGrid.cellSize);
    const key = `${gridX},${gridY}`;
    if (!this.fragmentGrid.cells.has(key)) {
      this.fragmentGrid.cells.set(key, []);
    }
    this.fragmentGrid.cells.get(key)!.push(frag);
  }

  private removeFragmentFromGrid(frag: Fragment): void {
    const gridX = Math.floor(frag.pos.x / this.fragmentGrid.cellSize);
    const gridY = Math.floor(frag.pos.y / this.fragmentGrid.cellSize);
    const key = `${gridX},${gridY}`;
    const cell = this.fragmentGrid.cells.get(key);
    if (cell) {
      const idx = cell.indexOf(frag);
      if (idx >= 0) cell.splice(idx, 1);
    }
  }

  private rebuildEnemyGrid(): void {
    this.enemyGrid.cells.clear();
    for (const enemy of this.enemies) {
      const gridX = Math.floor(enemy.pos.x / this.enemyGrid.cellSize);
      const gridY = Math.floor(enemy.pos.y / this.enemyGrid.cellSize);
      const key = `${gridX},${gridY}`;
      if (!this.enemyGrid.cells.has(key)) {
        this.enemyGrid.cells.set(key, []);
      }
      this.enemyGrid.cells.get(key)!.push(enemy);
    }
  }

  private queryGrid<T>(grid: SpatialGrid<T>, cx: number, cy: number, range: number): T[] {
    const result: T[] = [];
    const cellSize = grid.cellSize;
    const minGX = Math.floor((cx - range) / cellSize);
    const maxGX = Math.floor((cx + range) / cellSize);
    const minGY = Math.floor((cy - range) / cellSize);
    const maxGY = Math.floor((cy + range) / cellSize);
    for (let gx = minGX; gx <= maxGX; gx++) {
      for (let gy = minGY; gy <= maxGY; gy++) {
        const cell = grid.cells.get(`${gx},${gy}`);
        if (cell) result.push(...cell);
      }
    }
    return result;
  }

  private generateEnemies(): void {
    this.enemies = [];
    const margin = 100;
    let attempts = 0;
    const maxAttempts = ENEMY_COUNT * 30;

    while (this.enemies.length < ENEMY_COUNT && attempts < maxAttempts) {
      attempts++;
      const x = margin + Math.random() * (this.width - margin * 2);
      const y = margin + Math.random() * (this.height - margin * 2);

      let valid = true;

      const pdx = this.player.pos.x - x;
      const pdy = this.player.pos.y - y;
      if (pdx * pdx + pdy * pdy < 300 * 300) {
        valid = false;
      }

      for (const enemy of this.enemies) {
        const dx = enemy.pos.x - x;
        const dy = enemy.pos.y - y;
        const minDist = (ENEMY_RADIUS_X + enemy.radiusX) * 2;
        if (dx * dx + dy * dy < minDist * minDist) {
          valid = false;
          break;
        }
      }

      if (valid) {
        this.enemies.push({
          pos: { x, y },
          vel: { x: 0, y: 0 },
          radiusX: ENEMY_RADIUS_X,
          radiusY: ENEMY_RADIUS_Y,
          speed: PLAYER_SPEED * ENEMY_SPEED_RATIO,
          target: null,
          patrolTimer: 0,
          state: 'patrol',
          id: this.nextId++,
        });
      }
    }
  }

  private generateShadowZones(): void {
    this.shadowZones = [];
    const zoneCount = 5;
    for (let i = 0; i < zoneCount; i++) {
      this.shadowZones.push({
        pos: {
          x: 100 + Math.random() * (this.width - 200),
          y: 100 + Math.random() * (this.height - 200),
        },
        radius: 80 + Math.random() * 60,
      });
    }
  }

  update(dt: number): void {
    const phase = gameState.getPhase();
    if (phase === 'menu' || phase === 'paused' || phase === 'gameover' || phase === 'countdown') {
      return;
    }

    this.updatePlayer(dt);
    this.updateFragments(dt);
    this.rebuildEnemyGrid();
    this.updateEnemies(dt);
    this.checkCollisions(dt);

    if (this.player.hitCooldown > 0) {
      this.player.hitCooldown -= dt;
    }
    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }
  }

  private updatePlayer(dt: number): void {
    let dx = 0;
    let dy = 0;

    if (this.keys.has('w') || this.keys.has('arrowup')) dy -= 1;
    if (this.keys.has('s') || this.keys.has('arrowdown')) dy += 1;
    if (this.keys.has('a') || this.keys.has('arrowleft')) dx -= 1;
    if (this.keys.has('d') || this.keys.has('arrowright')) dx += 1;

    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
    }

    this.player.vel.x = dx * this.player.speed;
    this.player.vel.y = dy * this.player.speed;

    this.player.pos.x += this.player.vel.x * dt;
    this.player.pos.y += this.player.vel.y * dt;

    this.player.pos.x = Math.max(this.player.radius, Math.min(this.width - this.player.radius, this.player.pos.x));
    this.player.pos.y = Math.max(this.player.radius, Math.min(this.height - this.player.radius, this.player.pos.y));
  }

  private updateFragments(dt: number): void {
    for (const frag of this.fragments) {
      frag.rotation += dt * 2;

      if (frag.collectAnim > 0) {
        frag.collectAnim = Math.max(0, frag.collectAnim - dt * 3.33);
      }
    }
  }

  private updateEnemies(dt: number): void {
    this.chaseTimer -= dt;
    const updateTargets = this.chaseTimer <= 0;
    if (updateTargets) {
      this.chaseTimer = CHASE_INTERVAL;
    }

    for (const enemy of this.enemies) {
      if (updateTargets) {
        const dx = this.player.pos.x - enemy.pos.x;
        const dy = this.player.pos.y - enemy.pos.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < DETECTION_RADIUS) {
          enemy.state = 'chase';
          enemy.target = { x: this.player.pos.x, y: this.player.pos.y };
        } else {
          enemy.state = 'patrol';
          if (enemy.patrolTimer <= 0 || !enemy.target) {
            enemy.patrolTimer = 2 + Math.random() * 3;
            const angle = Math.random() * Math.PI * 2;
            const dist = 50 + Math.random() * 100;
            let tx = enemy.pos.x + Math.cos(angle) * dist;
            let ty = enemy.pos.y + Math.sin(angle) * dist;
            tx = Math.max(enemy.radiusX, Math.min(this.width - enemy.radiusX, tx));
            ty = Math.max(enemy.radiusY, Math.min(this.height - enemy.radiusY, ty));
            enemy.target = { x: tx, y: ty };
          }
        }
      }

      enemy.patrolTimer -= dt;

      if (enemy.target) {
        let dirX = enemy.target.x - enemy.pos.x;
        let dirY = enemy.target.y - enemy.pos.y;
        const dist = Math.sqrt(dirX * dirX + dirY * dirY);

        if (dist > 2) {
          dirX /= dist;
          dirY /= dist;

          const nearbyEnemies = this.queryGrid(
            this.enemyGrid,
            enemy.pos.x,
            enemy.pos.y,
            AVOIDANCE_RADIUS
          );

          let avoidX = 0;
          let avoidY = 0;
          let avoidCount = 0;
          for (const other of nearbyEnemies) {
            if (other.id === enemy.id) continue;
            const odx = enemy.pos.x - other.pos.x;
            const ody = enemy.pos.y - other.pos.y;
            const odist = Math.sqrt(odx * odx + ody * ody);
            if (odist < AVOIDANCE_RADIUS && odist > 0.1) {
              const strength = (AVOIDANCE_RADIUS - odist) / AVOIDANCE_RADIUS;
              avoidX += (odx / odist) * strength;
              avoidY += (ody / odist) * strength;
              avoidCount++;
            }
          }

          for (const zone of this.shadowZones) {
            const zdx = enemy.pos.x - zone.pos.x;
            const zdy = enemy.pos.y - zone.pos.y;
            const zdist = Math.sqrt(zdx * zdx + zdy * zdy);
            if (zdist < zone.radius * 1.1 && zdist > 0.1) {
              const strength = (zone.radius * 1.1 - zdist) / (zone.radius * 1.1);
              avoidX += (zdx / zdist) * strength * 1.5;
              avoidY += (zdy / zdist) * strength * 1.5;
              avoidCount++;
            }
          }

          if (avoidCount > 0) {
            const avoidLen = Math.sqrt(avoidX * avoidX + avoidY * avoidY);
            if (avoidLen > 0) {
              avoidX /= avoidLen;
              avoidY /= avoidLen;
              dirX = dirX * (1 - AVOIDANCE_STRENGTH) + avoidX * AVOIDANCE_STRENGTH;
              dirY = dirY * (1 - AVOIDANCE_STRENGTH) + avoidY * AVOIDANCE_STRENGTH;
              const dlen = Math.sqrt(dirX * dirX + dirY * dirY);
              if (dlen > 0) {
                dirX /= dlen;
                dirY /= dlen;
              }
            }
          }

          const speedMod = enemy.state === 'chase' ? 1 : 0.6;
          enemy.pos.x += dirX * enemy.speed * speedMod * dt;
          enemy.pos.y += dirY * enemy.speed * speedMod * dt;
        }
      }

      enemy.pos.x = Math.max(enemy.radiusX, Math.min(this.width - enemy.radiusX, enemy.pos.x));
      enemy.pos.y = Math.max(enemy.radiusY, Math.min(this.height - enemy.radiusY, enemy.pos.y));
    }
  }

  private checkCollisions(_dt: number): void {
    const collectRadius = this.player.radius + FRAGMENT_SIZE * 0.8;
    const nearbyFragments = this.queryGrid(
      this.fragmentGrid,
      this.player.pos.x,
      this.player.pos.y,
      collectRadius + this.fragmentGrid.cellSize
    );

    for (const frag of nearbyFragments) {
      if (frag.collected) continue;
      const dx = frag.pos.x - this.player.pos.x;
      const dy = frag.pos.y - this.player.pos.y;
      if (dx * dx + dy * dy < collectRadius * collectRadius) {
        frag.collected = true;
        frag.collectAnim = 1;
        this.removeFragmentFromGrid(frag);
        gameState.collectFragment();
      }
    }

    if (this.player.hitCooldown > 0) return;

    const hitRadius = this.player.radius + Math.max(ENEMY_RADIUS_X, ENEMY_RADIUS_Y);
    const nearbyEnemies = this.queryGrid(
      this.enemyGrid,
      this.player.pos.x,
      this.player.pos.y,
      hitRadius + this.enemyGrid.cellSize
    );

    for (const enemy of nearbyEnemies) {
      const dx = this.player.pos.x - enemy.pos.x;
      const dy = this.player.pos.y - enemy.pos.y;
      const rx = (this.player.radius + enemy.radiusX);
      const ry = (this.player.radius + enemy.radiusY);
      const normalized = (dx * dx) / (rx * rx) + (dy * dy) / (ry * ry);

      if (normalized < 1) {
        if (!gameState.isInvincible()) {
          this.player.hitCooldown = 0.8;
          this.hitFlashTimer = 0.3;
          gameState.enemyHit();
        }
        break;
      }
    }
  }

  render(): void {
    this.drawBackground();
    this.drawShadowZones();
    this.drawFragments();
    this.drawEnemies();
    this.drawPlayer();
    this.drawHitFlash();
  }

  private drawBackground(): void {
    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#0B0C2A');
    gradient.addColorStop(1, '#1B1C3E');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.fillStyle = 'rgba(255,255,255,0.15)';
    const starSeed = 12345;
    for (let i = 0; i < 80; i++) {
      const sx = ((starSeed * (i + 1) * 9301 + 49297) % 233280) / 233280 * this.width;
      const sy = ((starSeed * (i + 1) * 1237 + 24601) % 233280) / 233280 * this.height;
      const sr = ((starSeed * (i + 1) * 7919 + 1234) % 233280) / 233280 * 1.2 + 0.3;
      this.ctx.beginPath();
      this.ctx.arc(sx, sy, sr, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawShadowZones(): void {
    for (const zone of this.shadowZones) {
      const gradient = this.ctx.createRadialGradient(
        zone.pos.x, zone.pos.y, 0,
        zone.pos.x, zone.pos.y, zone.radius
      );
      gradient.addColorStop(0, 'rgba(20, 5, 40, 0.7)');
      gradient.addColorStop(0.6, 'rgba(20, 5, 40, 0.4)');
      gradient.addColorStop(1, 'rgba(20, 5, 40, 0)');
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(zone.pos.x, zone.pos.y, zone.radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.strokeStyle = 'rgba(100, 50, 150, 0.25)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.arc(zone.pos.x, zone.pos.y, zone.radius * 0.95, 0, Math.PI * 2);
      this.ctx.stroke();
    }
  }

  private drawFragments(): void {
    for (const frag of this.fragments) {
      if (frag.collected && frag.collectAnim <= 0) continue;

      const animScale = 1 + (frag.collectAnim > 0 ? Math.sin(frag.collectAnim * Math.PI) * 0.5 : 0);
      const alpha = frag.collected ? frag.collectAnim : 1;

      this.ctx.save();
      this.ctx.translate(frag.pos.x, frag.pos.y);
      this.ctx.rotate(frag.rotation);
      this.ctx.scale(animScale, animScale);
      this.ctx.globalAlpha = alpha;

      const glow = this.ctx.createRadialGradient(0, 0, 0, 0, 0, frag.size * 1.8);
      glow.addColorStop(0, 'rgba(255, 255, 255, 0.5)');
      glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, frag.size * 1.8, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.strokeStyle = 'rgba(200, 230, 255, 0.8)';
      this.ctx.lineWidth = 1;
      this.ctx.beginPath();
      this.ctx.moveTo(0, -frag.size);
      this.ctx.lineTo(frag.size * 0.7, 0);
      this.ctx.lineTo(0, frag.size);
      this.ctx.lineTo(-frag.size * 0.7, 0);
      this.ctx.closePath();
      this.ctx.fill();
      this.ctx.stroke();

      this.ctx.restore();
    }
  }

  private drawEnemies(): void {
    for (const enemy of this.enemies) {
      this.ctx.save();
      this.ctx.translate(enemy.pos.x, enemy.pos.y);

      const glow = this.ctx.createRadialGradient(0, 0, 0, 0, 0, enemy.radiusX * 1.8);
      glow.addColorStop(0, 'rgba(147, 51, 234, 0.35)');
      glow.addColorStop(1, 'rgba(147, 51, 234, 0)');
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, enemy.radiusX * 1.8, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.fillStyle = 'rgba(147, 51, 234, 0.55)';
      this.ctx.strokeStyle = 'rgba(192, 132, 252, 0.6)';
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.ellipse(0, 0, enemy.radiusX, enemy.radiusY, 0, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.stroke();

      const eyeOffsetX = enemy.radiusX * 0.35;
      const eyeOffsetY = -enemy.radiusY * 0.1;
      this.ctx.fillStyle = 'rgba(255, 100, 100, 0.85)';
      this.ctx.beginPath();
      this.ctx.arc(-eyeOffsetX, eyeOffsetY, 3, 0, Math.PI * 2);
      this.ctx.arc(eyeOffsetX, eyeOffsetY, 3, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  private drawPlayer(): void {
    const stats = gameState.getStats();
    const brightnessRatio = stats.brightness / 100;
    const invincible = gameState.isInvincible();

    this.ctx.save();
    this.ctx.translate(this.player.pos.x, this.player.pos.y);

    const glowAlpha = 0.3 + brightnessRatio * 0.5;
    const glow = this.ctx.createRadialGradient(
      0, 0, this.player.radius * 0.5,
      0, 0, this.player.glowLength + this.player.radius
    );
    glow.addColorStop(0, `rgba(96, 165, 250, ${glowAlpha})`);
    glow.addColorStop(0.5, `rgba(59, 130, 246, ${glowAlpha * 0.5})`);
    glow.addColorStop(1, 'rgba(59, 130, 246, 0)');
    this.ctx.fillStyle = glow;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.player.glowLength + this.player.radius, 0, Math.PI * 2);
    this.ctx.fill();

    const bodyGlow = this.ctx.createRadialGradient(0, 0, 0, 0, 0, this.player.radius);
    const intensity = Math.floor(180 + brightnessRatio * 75);
    bodyGlow.addColorStop(0, `rgba(${intensity}, ${intensity + 20}, 255, 1)`);
    bodyGlow.addColorStop(0.6, `rgba(96, 165, 250, 0.95)`);
    bodyGlow.addColorStop(1, 'rgba(59, 130, 246, 0.7)');
    this.ctx.fillStyle = bodyGlow;
    this.ctx.beginPath();
    this.ctx.arc(0, 0, this.player.radius, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.fillStyle = `rgba(255, 255, 255, ${0.7 + brightnessRatio * 0.3})`;
    this.ctx.beginPath();
    this.ctx.arc(-this.player.radius * 0.3, -this.player.radius * 0.3, this.player.radius * 0.25, 0, Math.PI * 2);
    this.ctx.fill();

    if (invincible) {
      const time = Date.now() / 1000;
      const flash = 0.5 + 0.5 * Math.sin(time * 5);
      this.ctx.strokeStyle = `rgba(251, 191, 36, ${0.6 + flash * 0.4})`;
      this.ctx.lineWidth = 3 + flash * 2;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.player.radius + 6, 0, Math.PI * 2);
      this.ctx.stroke();

      const outerGlow = this.ctx.createRadialGradient(0, 0, this.player.radius, 0, 0, this.player.radius + 30);
      outerGlow.addColorStop(0, `rgba(251, 191, 36, ${0.4 * flash})`);
      outerGlow.addColorStop(1, 'rgba(251, 191, 36, 0)');
      this.ctx.fillStyle = outerGlow;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.player.radius + 30, 0, Math.PI * 2);
      this.ctx.fill();
    }

    if (this.player.hitCooldown > 0 && !invincible) {
      const flash = 0.5 + 0.5 * Math.sin(this.player.hitCooldown * 30);
      this.ctx.strokeStyle = `rgba(239, 68, 68, ${flash})`;
      this.ctx.lineWidth = 4;
      this.ctx.beginPath();
      this.ctx.arc(0, 0, this.player.radius + 4, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private drawHitFlash(): void {
    if (this.hitFlashTimer > 0) {
      this.ctx.fillStyle = `rgba(239, 68, 68, ${this.hitFlashTimer * 0.3})`;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }
  }

  getWidth(): number {
    return this.width;
  }

  getHeight(): number {
    return this.height;
  }
}
