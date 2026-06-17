import { v4 as uuidv4 } from 'uuid';

export interface PlayerState {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  health: number;
  maxHealth: number;
  fireRate: number;
  bulletWidth: number;
  bulletHeight: number;
  invincible: boolean;
  invincibleTimer: number;
  invincibleBlink: boolean;
  fireRateLevel: number;
  bulletSizeLevel: number;
  speedLevel: number;
}

export interface BulletState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AsteroidGroove {
  angle: number;
  depth: number;
}

export interface AsteroidState {
  id: string;
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  generation: number;
  grooves: AsteroidGroove[];
}

export interface EnemyState {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  baseY: number;
  sinAmplitude: number;
  sinFrequency: number;
  time: number;
  wingRotation: number;
}

export interface FragmentDropState {
  id: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
  floatTime: number;
}

export interface ParticleState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;
}

export interface StarState {
  x: number;
  y: number;
  size: number;
  opacity: number;
}

export interface UpgradeOption {
  name: string;
  description: string;
  fragmentCost: number;
  type: string;
  level: number;
}

export interface GameStateSnapshot {
  player: PlayerState;
  bullets: BulletState[];
  asteroids: AsteroidState[];
  enemies: EnemyState[];
  fragmentDrops: FragmentDropState[];
  particles: ParticleState[];
  stars: StarState[];
  wave: number;
  score: number;
  kills: number;
  fragmentCount: number;
  gameState: 'playing' | 'wave_end' | 'game_over';
  upgradeOptions: UpgradeOption[];
  canvasWidth: number;
  canvasHeight: number;
}

const UPGRADE_DEFS: { name: string; description: string; type: string; baseCost: number }[] = [
  { name: '射速提升', description: '射速+15%', type: 'fireRate', baseCost: 5 },
  { name: '子弹增幅', description: '子弹尺寸+20%', type: 'bulletSize', baseCost: 5 },
  { name: '引擎强化', description: '飞船速度+10%', type: 'speed', baseCost: 5 },
  { name: '护盾修复', description: '生命值+1', type: 'health', baseCost: 7 },
];

export class GameEngine {
  private player: PlayerState;
  private bullets: BulletState[] = [];
  private asteroids: AsteroidState[] = [];
  private enemies: EnemyState[] = [];
  private fragmentDrops: FragmentDropState[] = [];
  private particles: ParticleState[] = [];
  private stars: StarState[] = [];
  private wave = 0;
  private score = 0;
  private kills = 0;
  private fragmentCount = 0;
  private gameState: 'playing' | 'wave_end' | 'game_over' = 'playing';
  private upgradeOptions: UpgradeOption[] = [];
  private fireTimer = 0;
  private canvasWidth: number;
  private canvasHeight: number;
  private waveSpawned = false;
  private engineParticleTimer = 0;

  constructor(width: number, height: number) {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.player = this.createPlayer();
    this.stars = this.generateStars();
    this.startNextWave();
  }

  private createPlayer(): PlayerState {
    return {
      x: this.canvasWidth / 2 - 20,
      y: this.canvasHeight - 80,
      width: 40,
      height: 40,
      speed: 240,
      health: 3,
      maxHealth: 3,
      fireRate: 150,
      bulletWidth: 4,
      bulletHeight: 16,
      invincible: false,
      invincibleTimer: 0,
      invincibleBlink: false,
      fireRateLevel: 0,
      bulletSizeLevel: 0,
      speedLevel: 0,
    };
  }

  private generateStars(): StarState[] {
    const stars: StarState[] = [];
    for (let i = 0; i < 300; i++) {
      stars.push({
        x: Math.random() * this.canvasWidth,
        y: Math.random() * this.canvasHeight,
        size: 1 + Math.random(),
        opacity: 0.2 + Math.random() * 0.4,
      });
    }
    return stars;
  }

  private startNextWave(): void {
    this.wave++;
    this.waveSpawned = false;
    this.gameState = 'playing';
  }

  private spawnWave(): void {
    const count = 8 + (this.wave - 1) * 3;
    const asteroidCount = Math.ceil(count * 0.6);
    const enemyCount = count - asteroidCount;

    for (let i = 0; i < asteroidCount; i++) {
      this.asteroids.push(this.createAsteroid(0));
    }
    for (let i = 0; i < enemyCount; i++) {
      this.enemies.push(this.createEnemy());
    }
    this.waveSpawned = true;
  }

  private createAsteroid(generation: number): AsteroidState {
    const baseRadius = 15 + Math.random() * 20;
    const radius = generation === 0 ? baseRadius : baseRadius * 0.5;
    const edge = Math.floor(Math.random() * 4);
    let x: number, y: number, vx: number, vy: number;

    switch (edge) {
      case 0:
        x = Math.random() * this.canvasWidth;
        y = -radius * 2;
        vx = (Math.random() - 0.5) * 60;
        vy = 30 + Math.random() * 50;
        break;
      case 1:
        x = Math.random() * this.canvasWidth;
        y = this.canvasHeight + radius * 2;
        vx = (Math.random() - 0.5) * 60;
        vy = -(30 + Math.random() * 50);
        break;
      case 2:
        x = -radius * 2;
        y = Math.random() * this.canvasHeight;
        vx = 30 + Math.random() * 50;
        vy = (Math.random() - 0.5) * 60;
        break;
      default:
        x = this.canvasWidth + radius * 2;
        y = Math.random() * this.canvasHeight;
        vx = -(30 + Math.random() * 50);
        vy = (Math.random() - 0.5) * 60;
        break;
    }

    const grooveCount = 2 + Math.floor(Math.random() * 4);
    const grooves: AsteroidGroove[] = [];
    for (let i = 0; i < grooveCount; i++) {
      grooves.push({
        angle: Math.random() * Math.PI * 2,
        depth: 0.15 + Math.random() * 0.3,
      });
    }

    return {
      id: uuidv4(),
      x,
      y,
      radius,
      vx,
      vy,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: 0.02,
      generation,
      grooves,
    };
  }

  private createEnemy(): EnemyState {
    const edge = Math.floor(Math.random() * 3);
    let x: number, y: number, vx: number;

    switch (edge) {
      case 0:
        x = Math.random() * this.canvasWidth;
        y = -40;
        vx = (Math.random() - 0.5) * 80;
        break;
      case 1:
        x = -40;
        y = Math.random() * this.canvasHeight * 0.5;
        vx = 40 + Math.random() * 40;
        break;
      default:
        x = this.canvasWidth + 40;
        y = Math.random() * this.canvasHeight * 0.5;
        vx = -(40 + Math.random() * 40);
        break;
    }

    return {
      id: uuidv4(),
      x,
      y,
      width: 30,
      height: 30,
      vx,
      baseY: y,
      sinAmplitude: 30 + Math.random() * 50,
      sinFrequency: 1.5 + Math.random() * 2,
      time: 0,
      wingRotation: 0,
    };
  }

  resize(width: number, height: number): void {
    this.canvasWidth = width;
    this.canvasHeight = height;
    this.stars = this.generateStars();
  }

  restart(): void {
    this.player = this.createPlayer();
    this.bullets = [];
    this.asteroids = [];
    this.enemies = [];
    this.fragmentDrops = [];
    this.particles = [];
    this.wave = 0;
    this.score = 0;
    this.kills = 0;
    this.fragmentCount = 0;
    this.fireTimer = 0;
    this.gameState = 'playing';
    this.waveSpawned = false;
    this.startNextWave();
  }

  selectUpgrade(index: number): void {
    if (index < 0 || index >= this.upgradeOptions.length) return;
    const opt = this.upgradeOptions[index];
    if (this.fragmentCount < opt.fragmentCost) return;

    this.fragmentCount -= opt.fragmentCost;

    switch (opt.type) {
      case 'fireRate':
        this.player.fireRate *= 0.85;
        this.player.fireRateLevel++;
        break;
      case 'bulletSize':
        this.player.bulletWidth *= 1.2;
        this.player.bulletHeight *= 1.2;
        this.player.bulletSizeLevel++;
        break;
      case 'speed':
        this.player.speed *= 1.1;
        this.player.speedLevel++;
        break;
      case 'health':
        this.player.health = Math.min(this.player.health + 1, this.player.maxHealth + 1);
        this.player.maxHealth = Math.max(this.player.maxHealth, this.player.health);
        break;
    }

    this.startNextWave();
  }

  update(dt: number, keys: Set<string>): GameStateSnapshot {
    if (this.gameState === 'game_over') {
      return this.takeSnapshot();
    }

    if (this.gameState === 'wave_end') {
      return this.takeSnapshot();
    }

    if (!this.waveSpawned) {
      this.spawnWave();
    }

    this.updatePlayer(dt, keys);
    this.updateBullets(dt);
    this.updateAsteroids(dt);
    this.updateEnemies(dt);
    this.updateFragmentDrops(dt);
    this.updateParticles(dt);
    this.updateEngineParticles(dt, keys);
    this.checkCollisions();
    this.checkWaveEnd();
    this.cullOffscreen();

    return this.takeSnapshot();
  }

  private updatePlayer(dt: number, keys: Set<string>): void {
    const p = this.player;
    let dx = 0, dy = 0;
    if (keys.has('w') || keys.has('W')) dy -= 1;
    if (keys.has('s') || keys.has('S')) dy += 1;
    if (keys.has('a') || keys.has('A')) dx -= 1;
    if (keys.has('d') || keys.has('D')) dx += 1;

    if (dx !== 0 || dy !== 0) {
      const len = Math.sqrt(dx * dx + dy * dy);
      dx /= len;
      dy /= len;
    }

    p.x += dx * p.speed * dt;
    p.y += dy * p.speed * dt;

    p.x = Math.max(0, Math.min(this.canvasWidth - p.width, p.x));
    p.y = Math.max(0, Math.min(this.canvasHeight - p.height, p.y));

    if (p.invincible) {
      p.invincibleTimer -= dt;
      if (p.invincibleTimer <= 0) {
        p.invincible = false;
        p.invincibleBlink = false;
      } else {
        p.invincibleBlink = !p.invincibleBlink;
      }
    }

    this.fireTimer -= dt * 1000;
    if ((keys.has(' ') || keys.has('Space')) && this.fireTimer <= 0) {
      this.fireBullet();
      this.fireTimer = p.fireRate;
    }
  }

  private fireBullet(): void {
    const p = this.player;
    this.bullets.push({
      id: uuidv4(),
      x: p.x + p.width / 2 - p.bulletWidth / 2,
      y: p.y - p.bulletHeight,
      width: p.bulletWidth,
      height: p.bulletHeight,
    });
  }

  private updateBullets(dt: number): void {
    const speed = 600;
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.y -= speed * dt;
      if (b.y + b.height < 0) {
        this.bullets.splice(i, 1);
      }
    }
  }

  private updateAsteroids(dt: number): void {
    for (const a of this.asteroids) {
      a.x += a.vx * dt;
      a.y += a.vy * dt;
      a.rotation += a.rotationSpeed;
    }
  }

  private updateEnemies(dt: number): void {
    for (const e of this.enemies) {
      e.time += dt;
      e.x += e.vx * dt;
      e.y = e.baseY + Math.sin(e.time * e.sinFrequency) * e.sinAmplitude;
      e.wingRotation += dt * 2;
    }
  }

  private updateFragmentDrops(dt: number): void {
    for (const f of this.fragmentDrops) {
      f.rotation += dt * 1.5;
      f.floatTime += dt;
    }
  }

  private updateParticles(dt: number): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      p.size = (p.life / p.maxLife) * 6;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
    if (this.particles.length > 500) {
      this.particles.splice(0, this.particles.length - 500);
    }
  }

  private updateEngineParticles(dt: number, keys: Set<string>): void {
    const moving = keys.has('w') || keys.has('W') || keys.has('a') || keys.has('A') ||
      keys.has('s') || keys.has('S') || keys.has('d') || keys.has('D');

    this.engineParticleTimer -= dt;
    if (moving && this.engineParticleTimer <= 0) {
      const p = this.player;
      const cx = p.x + p.width / 2;
      const cy = p.y + p.height;
      for (let i = 0; i < 2; i++) {
        this.particles.push({
          x: cx + (Math.random() - 0.5) * 10,
          y: cy + Math.random() * 5,
          vx: (Math.random() - 0.5) * 30,
          vy: 50 + Math.random() * 80,
          size: 3 + Math.random() * 3,
          color: Math.random() > 0.5 ? '#FF4500' : '#FF8C00',
          life: 0.2 + Math.random() * 0.2,
          maxLife: 0.4,
        });
      }
      this.engineParticleTimer = 0.03;
    }
  }

  private checkCollisions(): void {
    this.checkBulletAsteroidCollisions();
    this.checkBulletEnemyCollisions();
    this.checkPlayerAsteroidCollisions();
    this.checkPlayerEnemyCollisions();
    this.checkPlayerFragmentCollisions();
  }

  private checkBulletAsteroidCollisions(): void {
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      const bCx = b.x + b.width / 2;
      const bCy = b.y + b.height / 2;

      for (let ai = this.asteroids.length - 1; ai >= 0; ai--) {
        const a = this.asteroids[ai];
        const dx = bCx - a.x;
        const dy = bCy - a.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < a.radius + Math.max(b.width, b.height) / 2) {
          this.spawnExplosion(a.x, a.y, '#555577', 10);
          this.bullets.splice(bi, 1);

          if (a.generation < 2) {
            const splitCount = 2 + Math.floor(Math.random() * 2);
            for (let s = 0; s < splitCount; s++) {
              const child = this.createAsteroid(a.generation + 1);
              child.x = a.x + (Math.random() - 0.5) * 20;
              child.y = a.y + (Math.random() - 0.5) * 20;
              child.vx = a.vx + (Math.random() - 0.5) * 60;
              child.vy = a.vy + (Math.random() - 0.5) * 60;
              this.asteroids.push(child);
            }
          }
          this.asteroids.splice(ai, 1);
          this.score += 10;
          this.kills++;
          break;
        }
      }
    }
  }

  private checkBulletEnemyCollisions(): void {
    for (let bi = this.bullets.length - 1; bi >= 0; bi--) {
      const b = this.bullets[bi];
      for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
        const e = this.enemies[ei];
        if (this.aabbCollision(b, e)) {
          this.spawnExplosion(e.x + e.width / 2, e.y + e.height / 2, '#FF4444', 10);
          this.bullets.splice(bi, 1);
          this.enemies.splice(ei, 1);
          this.fragmentDrops.push({
            id: uuidv4(),
            x: e.x + e.width / 2,
            y: e.y + e.height / 2,
            size: 10,
            rotation: 0,
            floatTime: 0,
          });
          this.score += 25;
          this.kills++;
          break;
        }
      }
    }
  }

  private checkPlayerAsteroidCollisions(): void {
    if (this.player.invincible) return;
    const p = this.player;
    const pCx = p.x + p.width / 2;
    const pCy = p.y + p.height / 2;
    const pR = p.width / 2;

    for (let ai = this.asteroids.length - 1; ai >= 0; ai--) {
      const a = this.asteroids[ai];
      const dx = pCx - a.x;
      const dy = pCy - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < pR + a.radius) {
        this.playerHit();
        break;
      }
    }
  }

  private checkPlayerEnemyCollisions(): void {
    if (this.player.invincible) return;
    const p = this.player;

    for (let ei = this.enemies.length - 1; ei >= 0; ei--) {
      const e = this.enemies[ei];
      if (this.aabbCollision(p, e)) {
        this.spawnExplosion(e.x + e.width / 2, e.y + e.height / 2, '#FF4444', 8);
        this.enemies.splice(ei, 1);
        this.playerHit();
        break;
      }
    }
  }

  private checkPlayerFragmentCollisions(): void {
    const p = this.player;
    const pCx = p.x + p.width / 2;
    const pCy = p.y + p.height / 2;
    const collectDist = 30;

    for (let i = this.fragmentDrops.length - 1; i >= 0; i--) {
      const f = this.fragmentDrops[i];
      const dx = pCx - f.x;
      const dy = pCy - f.y;
      if (Math.sqrt(dx * dx + dy * dy) < collectDist) {
        this.fragmentCount++;
        this.fragmentDrops.splice(i, 1);
      }
    }
  }

  private playerHit(): void {
    this.player.health--;
    this.player.invincible = true;
    this.player.invincibleTimer = 1;
    this.player.invincibleBlink = true;

    if (this.player.health <= 0) {
      this.gameState = 'game_over';
      this.spawnExplosion(this.player.x + this.player.width / 2, this.player.y + this.player.height / 2, '#4A90FF', 12);
    }
  }

  private aabbCollision(a: { x: number; y: number; width: number; height: number },
    b: { x: number; y: number; width: number; height: number }): boolean {
    return a.x < b.x + b.width &&
      a.x + a.width > b.x &&
      a.y < b.y + b.height &&
      a.y + a.height > b.y;
  }

  private spawnExplosion(x: number, y: number, color: string, count: number): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 6,
        color,
        life: 0.4,
        maxLife: 0.4,
      });
    }
  }

  private checkWaveEnd(): void {
    if (this.waveSpawned && this.asteroids.length === 0 && this.enemies.length === 0) {
      this.gameState = 'wave_end';
      this.generateUpgradeOptions();
    }
  }

  private generateUpgradeOptions(): void {
    const shuffled = [...UPGRADE_DEFS].sort(() => Math.random() - 0.5);
    this.upgradeOptions = shuffled.slice(0, 3).map(def => {
      let level = 0;
      switch (def.type) {
        case 'fireRate': level = this.player.fireRateLevel; break;
        case 'bulletSize': level = this.player.bulletSizeLevel; break;
        case 'speed': level = this.player.speedLevel; break;
        case 'health': level = 0; break;
      }
      return {
        name: def.name,
        description: def.description,
        fragmentCost: def.baseCost + level * 2,
        type: def.type,
        level,
      };
    });
  }

  private cullOffscreen(): void {
    const margin = 100;
    this.asteroids = this.asteroids.filter(a =>
      a.x > -margin - a.radius && a.x < this.canvasWidth + margin + a.radius &&
      a.y > -margin - a.radius && a.y < this.canvasHeight + margin + a.radius
    );
    this.enemies = this.enemies.filter(e =>
      e.x > -margin && e.x < this.canvasWidth + margin &&
      e.y > -margin && e.y < this.canvasHeight + margin
    );
  }

  private takeSnapshot(): GameStateSnapshot {
    return {
      player: { ...this.player },
      bullets: this.bullets.map(b => ({ ...b })),
      asteroids: this.asteroids.map(a => ({ ...a, grooves: [...a.grooves] })),
      enemies: this.enemies.map(e => ({ ...e })),
      fragmentDrops: this.fragmentDrops.map(f => ({ ...f })),
      particles: this.particles.map(p => ({ ...p })),
      stars: this.stars,
      wave: this.wave,
      score: this.score,
      kills: this.kills,
      fragmentCount: this.fragmentCount,
      gameState: this.gameState,
      upgradeOptions: [...this.upgradeOptions],
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
    };
  }
}
