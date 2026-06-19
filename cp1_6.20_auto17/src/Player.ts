export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  vx: number;
  vy: number;
}

export interface Entity extends Position {
  width: number;
  height: number;
  active: boolean;
}

export interface Bullet extends Entity, Velocity {
  damage: number;
  trail: Position[];
}

export interface Crystal extends Entity {
  glowPhase: number;
  value: number;
}

export interface Particle extends Position, Velocity {
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export interface Debris extends Position, Velocity {
  life: number;
  maxLife: number;
  rotation: number;
  rotationSpeed: number;
  size: number;
  color: string;
}

export interface PlayerState extends Entity {
  speed: number;
  resources: number;
  score: number;
  shieldActive: boolean;
  shieldCooldown: number;
  shieldDuration: number;
  shieldMaxDuration: number;
  shieldMaxCooldown: number;
  survivalTime: number;
  resourcesCollected: number;
  engineFlamePhase: number;
}

const BULLET_POOL_SIZE = 50;
const PARTICLE_POOL_SIZE = 100;
const DEBRIS_POOL_SIZE = 30;

export class Player {
  state: PlayerState;
  bullets: Bullet[] = [];
  particles: Particle[] = [];
  debris: Debris[] = [];
  keys: Record<string, boolean> = {};
  mouseX: number = 0;
  mouseY: number = 0;
  shootCooldown: number = 0;
  readonly shootInterval: number = 0.15;
  readonly bulletSpeed: number = 600;
  canvasWidth: number;
  canvasHeight: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.state = {
      x: canvasWidth / 2,
      y: canvasHeight / 2,
      width: 32,
      height: 32,
      active: true,
      speed: 280,
      resources: 0,
      score: 0,
      shieldActive: false,
      shieldCooldown: 0,
      shieldDuration: 0,
      shieldMaxDuration: 5,
      shieldMaxCooldown: 15,
      survivalTime: 0,
      resourcesCollected: 0,
      engineFlamePhase: 0
    };
    this.initPools();
  }

  private initPools(): void {
    for (let i = 0; i < BULLET_POOL_SIZE; i++) {
      this.bullets.push({
        x: 0, y: 0, vx: 0, vy: 0,
        width: 6, height: 6,
        damage: 1, active: false,
        trail: []
      });
    }
    for (let i = 0; i < PARTICLE_POOL_SIZE; i++) {
      this.particles.push({
        x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 1,
        color: '#fff', size: 2
      });
    }
    for (let i = 0; i < DEBRIS_POOL_SIZE; i++) {
      this.debris.push({
        x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 1,
        rotation: 0, rotationSpeed: 0,
        size: 4, color: '#0ff'
      });
    }
  }

  update(dt: number, gameActive: boolean): void {
    if (!gameActive) return;

    this.state.survivalTime += dt;
    this.state.engineFlamePhase += dt * 15;

    let dx = 0, dy = 0;
    if (this.keys['w'] || this.keys['W'] || this.keys['ArrowUp']) dy -= 1;
    if (this.keys['s'] || this.keys['S'] || this.keys['ArrowDown']) dy += 1;
    if (this.keys['a'] || this.keys['A'] || this.keys['ArrowLeft']) dx -= 1;
    if (this.keys['d'] || this.keys['D'] || this.keys['ArrowRight']) dx += 1;

    const len = Math.sqrt(dx * dx + dy * dy);
    if (len > 0) {
      dx /= len;
      dy /= len;
      this.state.x += dx * this.state.speed * dt;
      this.state.y += dy * this.state.speed * dt;
    }

    const halfW = this.state.width / 2;
    const halfH = this.state.height / 2;
    this.state.x = Math.max(halfW, Math.min(this.canvasWidth - halfW, this.state.x));
    this.state.y = Math.max(halfH + 60, Math.min(this.canvasHeight - halfH, this.state.y));

    if (this.shootCooldown > 0) {
      this.shootCooldown -= dt;
    }

    if (this.state.shieldActive) {
      this.state.shieldDuration -= dt;
      if (this.state.shieldDuration <= 0) {
        this.state.shieldActive = false;
        this.state.shieldCooldown = this.state.shieldMaxCooldown;
      }
    } else if (this.state.shieldCooldown > 0) {
      this.state.shieldCooldown -= dt;
    }

    this.updateBullets(dt);
    this.updateParticles(dt);
    this.updateDebris(dt);
  }

  private updateBullets(dt: number): void {
    for (const bullet of this.bullets) {
      if (!bullet.active) continue;

      bullet.trail.push({ x: bullet.x, y: bullet.y });
      if (bullet.trail.length > 8) bullet.trail.shift();

      bullet.x += bullet.vx * dt;
      bullet.y += bullet.vy * dt;

      if (bullet.x < -50 || bullet.x > this.canvasWidth + 50 ||
          bullet.y < -50 || bullet.y > this.canvasHeight + 50) {
        bullet.active = false;
        bullet.trail = [];
      }
    }
  }

  private updateParticles(dt: number): void {
    for (const p of this.particles) {
      if (p.life <= 0) continue;
      p.life -= dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.98;
      p.vy *= 0.98;
    }
  }

  private updateDebris(dt: number): void {
    for (const d of this.debris) {
      if (d.life <= 0) continue;
      d.life -= dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vx *= 0.99;
      d.vy *= 0.99;
      d.rotation += d.rotationSpeed * dt;
    }
  }

  shoot(): void {
    if (this.shootCooldown > 0 || !this.state.active) return;

    const bullet = this.bullets.find(b => !b.active);
    if (!bullet) return;

    const dx = this.mouseX - this.state.x;
    const dy = this.mouseY - this.state.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return;

    bullet.active = true;
    bullet.x = this.state.x;
    bullet.y = this.state.y;
    bullet.vx = (dx / len) * this.bulletSpeed;
    bullet.vy = (dy / len) * this.bulletSpeed;
    bullet.trail = [];
    this.shootCooldown = this.shootInterval;
  }

  activateShield(): boolean {
    if (this.state.resources >= 100 && this.state.shieldCooldown <= 0 && !this.state.shieldActive && this.state.active) {
      this.state.resources -= 100;
      this.state.shieldActive = true;
      this.state.shieldDuration = this.state.shieldMaxDuration;
      return true;
    }
    return false;
  }

  spawnExplosion(x: number, y: number, count: number, color: string): void {
    for (let i = 0; i < count; i++) {
      const p = this.particles.find(p => p.life <= 0);
      if (!p) continue;
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = 0.3 + Math.random() * 0.4;
      p.maxLife = p.life;
      p.color = color;
      p.size = 2 + Math.random() * 4;
    }
  }

  spawnShipExplosion(x: number, y: number): void {
    const colors = ['#00ffff', '#8a2be2', '#ff6b6b', '#ffffff', '#ffd93d'];
    for (let i = 0; i < 25; i++) {
      const d = this.debris.find(d => d.life <= 0);
      if (!d) continue;
      const angle = Math.random() * Math.PI * 2;
      const speed = 80 + Math.random() * 200;
      d.x = x + (Math.random() - 0.5) * 20;
      d.y = y + (Math.random() - 0.5) * 20;
      d.vx = Math.cos(angle) * speed;
      d.vy = Math.sin(angle) * speed;
      d.life = 1.5 + Math.random() * 1;
      d.maxLife = d.life;
      d.rotation = Math.random() * Math.PI * 2;
      d.rotationSpeed = (Math.random() - 0.5) * 720;
      d.size = 4 + Math.random() * 8;
      d.color = colors[Math.floor(Math.random() * colors.length)];
    }
    this.spawnExplosion(x, y, 40, '#00ffff');
  }

  checkCrystalPickup(crystals: Crystal[]): void {
    const px = this.state.x;
    const py = this.state.y;
    const pickupRadius = 35;

    for (const crystal of crystals) {
      if (!crystal.active) continue;
      const dx = crystal.x - px;
      const dy = crystal.y - py;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < pickupRadius) {
        crystal.active = false;
        this.state.resources = Math.min(100, this.state.resources + crystal.value);
        this.state.resourcesCollected += crystal.value;
        this.state.score += 50;
        this.spawnExplosion(crystal.x, crystal.y, 12, '#a855f7');
      }
    }
  }

  canActivateShield(): boolean {
    return this.state.resources >= 100 && this.state.shieldCooldown <= 0 && !this.state.shieldActive;
  }

  resize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
  }

  reset(): void {
    this.state.x = this.canvasWidth / 2;
    this.state.y = this.canvasHeight / 2;
    this.state.active = true;
    this.state.resources = 0;
    this.state.score = 0;
    this.state.shieldActive = false;
    this.state.shieldCooldown = 0;
    this.state.shieldDuration = 0;
    this.state.survivalTime = 0;
    this.state.resourcesCollected = 0;
    this.bullets.forEach(b => { b.active = false; b.trail = []; });
    this.particles.forEach(p => p.life = 0);
    this.debris.forEach(d => d.life = 0);
    this.shootCooldown = 0;
  }
}
