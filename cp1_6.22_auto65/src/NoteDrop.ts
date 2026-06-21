export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class NoteDrop {
  index: number;
  track: number;
  targetTime: number;
  color: string;
  x: number;
  y: number;
  radius: number;
  speed: number;
  active: boolean;
  hit: boolean;
  missed: boolean;
  hitType: 'perfect' | 'good' | 'miss' | null;
  particles: Particle[];
  explosionStart: number;

  constructor(
    index: number,
    track: number,
    targetTime: number,
    color: string,
    trackX: number,
    speed: number
  ) {
    this.index = index;
    this.track = track;
    this.targetTime = targetTime;
    this.color = color;
    this.x = trackX;
    this.y = -50;
    this.radius = 20;
    this.speed = speed;
    this.active = true;
    this.hit = false;
    this.missed = false;
    this.hitType = null;
    this.particles = [];
    this.explosionStart = 0;
  }

  update(currentTime: number, gameStartTime: number, judgeLineY: number, deltaTime: number): void {
    if (!this.active) {
      this.updateParticles(deltaTime);
      return;
    }

    const elapsed = currentTime - gameStartTime;
    const travelDuration = judgeLineY / this.speed * 1000;
    const startSpawnTime = this.targetTime - travelDuration;

    if (elapsed >= startSpawnTime && !this.hit && !this.missed) {
      const progress = (elapsed - startSpawnTime) / travelDuration;
      this.y = progress * judgeLineY;
    }

    if (!this.hit && !this.missed && elapsed > this.targetTime + 120) {
      this.missed = true;
      this.active = false;
      this.hitType = 'miss';
    }
  }

  checkHit(trackIndex: number, currentTime: number, gameStartTime: number, judgeLineY: number): 'perfect' | 'good' | 'miss' | null {
    if (!this.active || this.hit || this.missed) return null;
    if (this.track !== trackIndex) return null;

    const distance = Math.abs(this.y - judgeLineY);
    if (distance > 80) return null;

    const elapsed = currentTime - gameStartTime;
    const diff = Math.abs(elapsed - this.targetTime);

    let result: 'perfect' | 'good' | 'miss';
    if (diff <= 50) result = 'perfect';
    else if (diff <= 100) result = 'good';
    else result = 'miss';

    this.hit = true;
    this.active = false;
    this.hitType = result;

    if (result !== 'miss') {
      this.createExplosion();
    }

    return result;
  }

  createExplosion(): void {
    this.explosionStart = performance.now();
    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.5;
      const speed = 2 + Math.random() * 4;
      this.particles.push({
        x: this.x,
        y: this.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        color: this.color,
        size: 3 + Math.random() * 4,
      });
    }
  }

  updateParticles(deltaTime: number): void {
    const decay = deltaTime / 600;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.05;
      p.life -= decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, judgeLineY: number): void {
    if (this.active && !this.hit && !this.missed && this.y > -50) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      
      const gradient = ctx.createRadialGradient(
        this.x, this.y, 0,
        this.x, this.y, this.radius
      );
      gradient.addColorStop(0, '#ffffff');
      gradient.addColorStop(0.3, this.color);
      gradient.addColorStop(1, this.adjustColor(this.color, -30));
      ctx.fillStyle = gradient;
      ctx.fill();

      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(String(this.track + 1), this.x, this.y);

      ctx.restore();
    }

    if (this.missed && this.y > -50 && this.y < judgeLineY + 50) {
      ctx.save();
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#666666';
      ctx.fill();
      ctx.restore();
    }

    this.particles.forEach(p => {
      ctx.save();
      ctx.globalAlpha = p.life;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      ctx.restore();
    });
  }

  isDone(): boolean {
    return !this.active && this.particles.length === 0;
  }

  private adjustColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, Math.min(255, parseInt(hex.substring(0, 2), 16) + amount));
    const g = Math.max(0, Math.min(255, parseInt(hex.substring(2, 4), 16) + amount));
    const b = Math.max(0, Math.min(255, parseInt(hex.substring(4, 6), 16) + amount));
    return `rgb(${r},${g},${b})`;
  }
}
