import Phaser from 'phaser';

interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  color: number;
  layer: number;
}

interface FlameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
}

interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: number;
}

const MAX_PARTICLES = 500;

export class Particles {
  private scene: Phaser.Scene;
  private starGraphics: Phaser.GameObjects.Graphics;
  private flameGraphics: Phaser.GameObjects.Graphics;
  private explosionGraphics: Phaser.GameObjects.Graphics;
  private stars: Star[] = [];
  private flameParticles: FlameParticle[] = [];
  private explosionParticles: ExplosionParticle[] = [];
  private screenWidth: number;
  private screenHeight: number;
  private centerX: number;
  private centerY: number;

  constructor(scene: Phaser.Scene, width: number, height: number) {
    this.scene = scene;
    this.screenWidth = width;
    this.screenHeight = height;
    this.centerX = width / 2;
    this.centerY = height / 2;

    this.starGraphics = scene.add.graphics();
    this.flameGraphics = scene.add.graphics();
    this.explosionGraphics = scene.add.graphics();

    this.initStars();
  }

  private initStars(): void {
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Phaser.Math.Between(0, this.screenWidth),
        y: Phaser.Math.Between(0, this.screenHeight),
        speed: 0.2,
        size: 1,
        color: 0xffffff,
        layer: 0
      });
    }
    for (let i = 0; i < 50; i++) {
      this.stars.push({
        x: Phaser.Math.Between(0, this.screenWidth),
        y: Phaser.Math.Between(0, this.screenHeight),
        speed: 0.5,
        size: 2,
        color: 0xa8d8ea,
        layer: 1
      });
    }
    for (let i = 0; i < 30; i++) {
      this.stars.push({
        x: Phaser.Math.Between(0, this.screenWidth),
        y: Phaser.Math.Between(0, this.screenHeight),
        speed: 1.0,
        size: 3,
        color: 0xffffff,
        layer: 2
      });
    }
  }

  public resize(width: number, height: number): void {
    this.screenWidth = width;
    this.screenHeight = height;
    this.centerX = width / 2;
    this.centerY = height / 2;
  }

  public updateStars(): void {
    this.starGraphics.clear();
    for (const star of this.stars) {
      const dx = star.x - this.centerX;
      const dy = star.y - this.centerY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        star.x += (dx / dist) * star.speed;
        star.y += (dy / dist) * star.speed;
      }

      if (star.x < 0 || star.x > this.screenWidth || star.y < 0 || star.y > this.screenHeight) {
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const radius = Math.max(this.screenWidth, this.screenHeight) * 0.6;
        star.x = this.centerX + Math.cos(angle) * radius;
        star.y = this.centerY + Math.sin(angle) * radius;

        star.x = Phaser.Math.Clamp(star.x, 0, this.screenWidth);
        star.y = Phaser.Math.Clamp(star.y, 0, this.screenHeight);
      }

      this.starGraphics.fillStyle(star.color, 1);
      this.starGraphics.fillRect(star.x - star.size / 2, star.y - star.size / 2, star.size, star.size);
    }
  }

  public emitFlame(x: number, y: number, angle: number): void {
    const count = Phaser.Math.Between(3, 5);
    for (let i = 0; i < count; i++) {
      if (this.flameParticles.length >= MAX_PARTICLES) break;
      const spread = Phaser.Math.FloatBetween(-0.3, 0.3);
      const speed = Phaser.Math.FloatBetween(2, 4);
      const life = 0.5;
      const size = Phaser.Math.Between(2, 6);
      const isYellow = Math.random() > 0.5;

      this.flameParticles.push({
        x,
        y,
        vx: Math.cos(angle + Math.PI + spread) * speed,
        vy: Math.sin(angle + Math.PI + spread) * speed,
        life,
        maxLife: life,
        size,
        color: isYellow ? 0xffd93d : 0xff6b6b
      });
    }
  }

  public updateFlames(delta: number): void {
    this.flameGraphics.clear();
    for (let i = this.flameParticles.length - 1; i >= 0; i--) {
      const p = this.flameParticles[i];
      p.life -= delta / 1000;
      if (p.life <= 0) {
        this.flameParticles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      const alpha = p.life / p.maxLife;
      const currentSize = p.size * alpha;
      this.flameGraphics.fillStyle(p.color, alpha);
      this.flameGraphics.fillCircle(p.x, p.y, currentSize);
    }
  }

  public emitExplosion(x: number, y: number, color: number, count: number = 15): void {
    for (let i = 0; i < count; i++) {
      if (this.explosionParticles.length >= MAX_PARTICLES) break;
      const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
      const speed = Phaser.Math.FloatBetween(1, 4);
      const life = Phaser.Math.FloatBetween(0.3, 0.7);

      this.explosionParticles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life,
        maxLife: life,
        size: Phaser.Math.Between(2, 5),
        color
      });
    }
  }

  public updateExplosions(delta: number): void {
    this.explosionGraphics.clear();
    for (let i = this.explosionParticles.length - 1; i >= 0; i--) {
      const p = this.explosionParticles[i];
      p.life -= delta / 1000;
      if (p.life <= 0) {
        this.explosionParticles.splice(i, 1);
        continue;
      }
      p.x += p.vx;
      p.y += p.vy;
      const alpha = p.life / p.maxLife;
      this.explosionGraphics.fillStyle(p.color, alpha);
      this.explosionGraphics.fillCircle(p.x, p.y, p.size * alpha);
    }
  }

  public update(delta: number): void {
    this.updateStars();
    this.updateFlames(delta);
    this.updateExplosions(delta);
  }

  public setDepth(depth: number): void {
    this.starGraphics.setDepth(depth);
    this.flameGraphics.setDepth(depth + 1);
    this.explosionGraphics.setDepth(depth + 2);
  }

  public clearAll(): void {
    this.flameParticles.length = 0;
    this.explosionParticles.length = 0;
    this.flameGraphics.clear();
    this.explosionGraphics.clear();
  }
}
