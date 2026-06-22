export type JudgeResult = 'perfect' | 'good' | 'miss' | null;

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  color: string;
  size: number;
}

export interface Danmaku {
  x: number;
  y: number;
  text: string;
  alpha: number;
  life: number;
  color: string;
}

export class Note {
  public x: number;
  public y: number;
  public radius: number = 20;
  public track: number;
  public speed: number;
  public isDead: boolean = false;
  public isJudged: boolean = false;
  public judgeResult: JudgeResult = null;
  public particles: Particle[] = [];
  public particleLife: number = 0;
  public readonly particleDuration: number = 300;
  public flashAlpha: number = 0;
  public flashColor: string = '';

  constructor(trackIndex: number, startY: number, noteSpeed: number) {
    const trackXPositions = [80, 210, 340, 470];
    this.track = trackIndex;
    this.x = trackXPositions[trackIndex];
    this.y = startY;
    this.speed = noteSpeed;
  }

  public update(deltaTime: number): void {
    if (!this.isJudged) {
      this.y += this.speed * deltaTime / 1000;
    }

    if (this.isDead && this.particles.length > 0) {
      this.particleLife += deltaTime;
      const progress = this.particleLife / this.particleDuration;

      for (const particle of this.particles) {
        particle.x += particle.vx * deltaTime / 16;
        particle.y += particle.vy * deltaTime / 16;
        particle.alpha = Math.max(0, 1 - progress);
      }

      if (this.particleLife >= this.particleDuration) {
        this.particles = [];
      }
    }

    if (this.flashAlpha > 0) {
      this.flashAlpha -= deltaTime / 300;
      if (this.flashAlpha < 0) this.flashAlpha = 0;
    }
  }

  public judge(judgeLineY: number): JudgeResult {
    if (this.isJudged) return null;

    const distance = Math.abs(this.y - judgeLineY);

    if (distance <= 10) {
      this.judgeResult = 'perfect';
      this.isJudged = true;
      this.isDead = true;
      this.flashAlpha = 1;
      this.flashColor = '#ffd700';
      this.createParticles('#ffd700');
      return 'perfect';
    } else if (distance <= 30) {
      this.judgeResult = 'good';
      this.isJudged = true;
      this.isDead = true;
      this.flashAlpha = 1;
      this.flashColor = '#00ff88';
      this.createParticles('#00ff88');
      return 'good';
    }

    return null;
  }

  public miss(): void {
    if (this.isJudged) return;
    this.judgeResult = 'miss';
    this.isJudged = true;
    this.isDead = true;
    this.flashAlpha = 1;
    this.flashColor = '#ff4444';
    this.createParticles('#ff4444');
  }

  private createParticles(color: string): void {
    const count = 8 + Math.floor(Math.random() * 5);
    this.particles = [];

    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + Math.random() * 0.5;
      const speed = 2 + Math.random() * 3;
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        alpha: 1,
        color,
        size: 3 + Math.random() * 4
      });
    }

    this.particleLife = 0;
  }

  public isBelowJudge(judgeLineY: number): boolean {
    return this.y - this.radius > judgeLineY + 30;
  }

  public get isParticleDone(): boolean {
    return this.particles.length === 0 && this.isDead;
  }
}
