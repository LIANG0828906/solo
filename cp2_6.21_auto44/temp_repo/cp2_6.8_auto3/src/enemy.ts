import { DamageType } from './tower';

export type EnemyType = 'normal' | 'fast' | 'heavy';

export interface EnemyConfig {
  type: EnemyType;
  name: string;
  maxHp: number;
  speed: number;
  color: string;
  glowColor: string;
  radius: number;
  reward: number;
}

export const ENEMY_CONFIGS: Record<EnemyType, EnemyConfig> = {
  normal: {
    type: 'normal',
    name: '普通',
    maxHp: 100,
    speed: 60,
    color: '#e0e0e0',
    glowColor: 'rgba(224, 224, 224, 0.4)',
    radius: 14,
    reward: 10
  },
  fast: {
    type: 'fast',
    name: '快速',
    maxHp: 60,
    speed: 120,
    color: '#66bb6a',
    glowColor: 'rgba(102, 187, 106, 0.4)',
    radius: 10,
    reward: 15
  },
  heavy: {
    type: 'heavy',
    name: '重型',
    maxHp: 300,
    speed: 35,
    color: '#ef5350',
    glowColor: 'rgba(239, 83, 80, 0.4)',
    radius: 20,
    reward: 30
  }
};

export interface PathPoint {
  x: number;
  y: number;
}

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = 50 + Math.random() * 150;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.maxLife = 0.4 + Math.random() * 0.4;
    this.life = this.maxLife;
    this.color = color;
    this.size = 2 + Math.random() * 4;
  }

  update(dt: number): boolean {
    this.life -= dt;
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.vx *= 0.95;
    this.vy *= 0.95;
    return this.life > 0;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size * alpha, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function getParticleColor(damageType: DamageType): string {
  switch (damageType) {
    case 'physical': return '#4fc3f7';
    case 'explosive': return '#ff7043';
    case 'magical': return '#ce93d8';
  }
}

export class Enemy {
  id: number;
  type: EnemyType;
  config: EnemyConfig;
  hp: number;
  maxHp: number;
  pathIndex: number;
  progress: number;
  path: PathPoint[];
  x: number;
  y: number;
  alive: boolean = true;
  reachedEnd: boolean = false;

  private static nextId: number = 0;

  constructor(type: EnemyType, path: PathPoint[], hpMultiplier: number = 1) {
    this.id = Enemy.nextId++;
    this.type = type;
    this.config = ENEMY_CONFIGS[type];
    this.maxHp = this.config.maxHp * hpMultiplier;
    this.hp = this.maxHp;
    this.path = path;
    this.pathIndex = 0;
    this.progress = 0;
    this.x = path[0].x;
    this.y = path[0].y;
  }

  update(dt: number): void {
    if (!this.alive) return;

    if (this.pathIndex >= this.path.length - 1) {
      this.reachedEnd = true;
      this.alive = false;
      return;
    }

    const current = this.path[this.pathIndex];
    const next = this.path[this.pathIndex + 1];
    const dx = next.x - current.x;
    const dy = next.y - current.y;
    const segmentLength = Math.sqrt(dx * dx + dy * dy);

    this.progress += (this.config.speed * dt) / segmentLength;

    while (this.progress >= 1 && this.pathIndex < this.path.length - 1) {
      this.progress -= 1;
      this.pathIndex++;
    }

    if (this.pathIndex < this.path.length - 1) {
      const c = this.path[this.pathIndex];
      const n = this.path[this.pathIndex + 1];
      this.x = c.x + (n.x - c.x) * this.progress;
      this.y = c.y + (n.y - c.y) * this.progress;
    } else {
      this.reachedEnd = true;
      this.alive = false;
    }
  }

  takeDamage(damage: number, damageType: DamageType): Particle[] {
    this.hp -= damage;
    const particles: Particle[] = [];
    const color = getParticleColor(damageType);
    for (let i = 0; i < 5; i++) {
      particles.push(new Particle(this.x, this.y, color));
    }
    if (this.hp <= 0) {
      this.alive = false;
      for (let i = 0; i < 15; i++) {
        particles.push(new Particle(this.x, this.y, this.config.color));
      }
    }
    return particles;
  }

  distanceTo(x: number, y: number): number {
    const dx = this.x - x;
    const dy = this.y - y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    ctx.save();
    ctx.shadowColor = this.config.glowColor;
    ctx.shadowBlur = 10;

    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = this.config.color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.config.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    if (this.type === 'fast') {
      ctx.fillStyle = this.config.color;
      ctx.beginPath();
      ctx.moveTo(this.x, this.y - 6);
      ctx.lineTo(this.x + 5, this.y + 4);
      ctx.lineTo(this.x - 5, this.y + 4);
      ctx.closePath();
      ctx.fill();
    } else if (this.type === 'heavy') {
      ctx.fillStyle = this.config.color;
      ctx.fillRect(this.x - 8, this.y - 6, 16, 12);
    } else {
      ctx.fillStyle = this.config.color;
      ctx.beginPath();
      ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();

    const barWidth = this.config.radius * 2.5;
    const barHeight = 4;
    const barX = this.x - barWidth / 2;
    const barY = this.y - this.config.radius - 10;
    const hpRatio = this.hp / this.maxHp;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    let hpColor = '#66bb6a';
    if (hpRatio < 0.3) hpColor = '#ef5350';
    else if (hpRatio < 0.6) hpColor = '#ffa726';
    ctx.fillStyle = hpColor;
    ctx.fillRect(barX, barY, barWidth * hpRatio, barHeight);
  }
}

export class WaveManager {
  currentWave: number = 0;
  enemiesToSpawn: { type: EnemyType; delay: number }[] = [];
  spawnTimer: number = 0;
  waveActive: boolean = false;
  waveDelay: number = 0;
  betweenWaves: boolean = true;

  constructor() {}

  startNextWave(): void {
    this.currentWave++;
    this.betweenWaves = false;
    this.waveActive = true;
    this.enemiesToSpawn = this.generateWave(this.currentWave);
    this.spawnTimer = 0;
  }

  private generateWave(wave: number): { type: EnemyType; delay: number }[] {
    const enemies: { type: EnemyType; delay: number }[] = [];
    const baseCount = 5 + wave * 3;
    let time = 0;

    for (let i = 0; i < baseCount; i++) {
      let type: EnemyType = 'normal';
      const rand = Math.random();
      if (wave >= 3 && rand < 0.2) type = 'heavy';
      else if (wave >= 2 && rand < 0.4) type = 'fast';
      else type = 'normal';

      enemies.push({ type, delay: time });
      time += 0.6 + Math.random() * 0.4;
    }

    if (wave % 5 === 0) {
      for (let i = 0; i < wave / 5; i++) {
        enemies.push({ type: 'heavy', delay: time });
        time += 1.5;
      }
    }

    return enemies;
  }

  update(dt: number, path: PathPoint[], enemies: Enemy[]): boolean {
    if (this.betweenWaves) {
      this.waveDelay -= dt;
      if (this.waveDelay <= 0) {
        this.startNextWave();
        return true;
      }
      return false;
    }

    this.spawnTimer += dt;

    while (this.enemiesToSpawn.length > 0 && this.spawnTimer >= this.enemiesToSpawn[0].delay) {
      const spawn = this.enemiesToSpawn.shift()!;
      const hpMult = 1 + (this.currentWave - 1) * 0.15;
      enemies.push(new Enemy(spawn.type, path, hpMult));
    }

    if (this.enemiesToSpawn.length === 0 && enemies.length === 0) {
      this.waveActive = false;
      this.betweenWaves = true;
      this.waveDelay = 5;
    }

    return false;
  }
}
