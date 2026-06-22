export interface Vector2 {
  x: number;
  y: number;
}

export interface Entity {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
  update(deltaTime: number): void;
  render(ctx: CanvasRenderingContext2D): void;
}

export const TRACK_COLORS: string[] = ['#ff4757', '#ffa502', '#ffd700', '#2ed573', '#00d4ff'];
export const TRACK_KEYS: string[] = ['q', 'w', 'e', 'r', 't'];

export class Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  brightness: number;
  twinkleSpeed: number;
  twinklePhase: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = Math.random() * canvasWidth;
    this.y = Math.random() * canvasHeight;
    this.size = Math.random() * 2 + 0.5;
    this.speed = Math.random() * 30 + 10;
    this.brightness = Math.random() * 0.5 + 0.5;
    this.twinkleSpeed = Math.random() * 2 + 1;
    this.twinklePhase = Math.random() * Math.PI * 2;
  }

  update(deltaTime: number, canvasHeight: number): void {
    this.y += this.speed * deltaTime;
    this.twinklePhase += this.twinkleSpeed * deltaTime;
    if (this.y > canvasHeight) {
      this.y = 0;
      this.x = Math.random() * 800;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const twinkle = (Math.sin(this.twinklePhase) + 1) / 2;
    const alpha = this.brightness * (0.5 + twinkle * 0.5);
    ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
  }
}

export class Player implements Entity {
  x: number;
  y: number;
  width: number = 60;
  height: number = 50;
  active: boolean = true;
  speed: number = 350;
  velocityX: number = 0;
  flameParticles: FlameParticle[] = [];
  targetX: number;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.spawnFlameParticles();
  }

  private spawnFlameParticles(): void {
    for (let i = 0; i < 15; i++) {
      this.flameParticles.push(new FlameParticle(this.x, this.y + this.height / 2));
    }
  }

  moveLeft(): void {
    this.velocityX = -this.speed;
  }

  moveRight(): void {
    this.velocityX = this.speed;
  }

  stop(): void {
    this.velocityX = 0;
  }

  update(deltaTime: number): void {
    this.x += this.velocityX * deltaTime;
    this.x = Math.max(50, Math.min(750, this.x));

    const targetTrack = Math.round((this.x - 100) / 150);
    this.targetX = 100 + targetTrack * 150;

    this.x += (this.targetX - this.x) * 10 * deltaTime;

    for (const particle of this.flameParticles) {
      particle.update(deltaTime, this.x, this.y + this.height / 2);
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    for (const particle of this.flameParticles) {
      particle.render(ctx);
    }

    ctx.save();
    ctx.translate(this.x, this.y);

    const gradient = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
    gradient.addColorStop(0, '#4a90d9');
    gradient.addColorStop(0.5, '#2d5a87');
    gradient.addColorStop(1, '#1a3a52');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, -this.height / 2);
    ctx.lineTo(-this.width / 2, this.height / 2);
    ctx.lineTo(0, this.height / 3);
    ctx.lineTo(this.width / 2, this.height / 2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#00d4ff';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00d4ff';
    ctx.shadowBlur = 10;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#00d4ff';
    ctx.beginPath();
    ctx.ellipse(0, -5, 8, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.beginPath();
    ctx.ellipse(-2, -8, 3, 5, -0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

class FlameParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  maxLife: number;
  color: string;

  constructor(baseX: number, baseY: number) {
    this.x = baseX + (Math.random() - 0.5) * 15;
    this.y = baseY;
    this.vx = (Math.random() - 0.5) * 50;
    this.vy = Math.random() * 100 + 50;
    this.size = Math.random() * 6 + 3;
    this.maxLife = Math.random() * 0.3 + 0.2;
    this.life = this.maxLife;
    this.color = Math.random() > 0.5 ? '#ff6b35' : '#ffd700';
  }

  update(deltaTime: number, baseX: number, baseY: number): void {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.life -= deltaTime;
    this.size *= 0.98;

    if (this.life <= 0) {
      this.x = baseX + (Math.random() - 0.5) * 15;
      this.y = baseY;
      this.vx = (Math.random() - 0.5) * 50;
      this.vy = Math.random() * 100 + 50;
      this.size = Math.random() * 6 + 3;
      this.maxLife = Math.random() * 0.3 + 0.2;
      this.life = this.maxLife;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class Note implements Entity {
  x: number;
  y: number;
  width: number = 40;
  height: number = 40;
  active: boolean = true;
  track: number;
  speed: number;
  color: string;
  targetY: number;
  hit: boolean = false;
  perfectTime: number;
  glowIntensity: number = 0;

  constructor(track: number, startY: number, targetY: number, bpm: number) {
    this.track = track;
    this.x = 100 + track * 150;
    this.y = startY;
    this.targetY = targetY;
    this.color = TRACK_COLORS[track];
    const beatDuration = 60 / bpm;
    const fallDuration = beatDuration * 4;
    this.speed = (targetY - startY) / fallDuration;
    this.perfectTime = (targetY - startY) / this.speed;
  }

  update(deltaTime: number): void {
    if (!this.active) return;
    this.y += this.speed * deltaTime;
    this.glowIntensity = (Math.sin(Date.now() * 0.01) + 1) / 2;

    if (this.y > this.targetY + 60) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();

    const glowRadius = this.width / 2 + 10 + this.glowIntensity * 5;
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, glowRadius
    );
    gradient.addColorStop(0, this.color + '80');
    gradient.addColorStop(0.5, this.color + '40');
    gradient.addColorStop(1, this.color + '00');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.width / 2, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    ctx.arc(this.x - 5, this.y - 5, this.width / 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff';
    ctx.font = 'bold 16px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(TRACK_KEYS[this.track].toUpperCase(), this.x, this.y);

    ctx.restore();
  }

  renderPerfect(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.strokeStyle = '#ffd700';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#ffd700';
    ctx.shadowBlur = 20;

    for (let i = 0; i < 3; i++) {
      ctx.globalAlpha = 1 - i * 0.3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.width / 2 + 5 + i * 8, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffd700';
    ctx.font = 'bold 24px Courier New';
    ctx.textAlign = 'center';
    ctx.fillText('PERFECT!', this.x, this.y - 40);

    ctx.restore();
  }
}

export class Enemy implements Entity {
  x: number;
  y: number;
  width: number = 45;
  height: number = 45;
  active: boolean = true;
  track: number;
  speed: number;
  color: string;
  targetY: number;
  note: Note | null = null;
  rotation: number = 0;

  constructor(track: number, startY: number, targetY: number, bpm: number) {
    this.track = track;
    this.x = 100 + track * 150;
    this.y = startY - 60;
    this.targetY = targetY;
    this.color = TRACK_COLORS[track];
    const beatDuration = 60 / bpm;
    const fallDuration = beatDuration * 4;
    this.speed = (targetY - startY + 60) / fallDuration;
  }

  linkNote(note: Note): void {
    this.note = note;
  }

  update(deltaTime: number): void {
    if (!this.active) return;
    this.y += this.speed * deltaTime;
    this.rotation += deltaTime * 2;

    if (this.y > this.targetY + 80) {
      this.active = false;
    }

    if (this.note && !this.note.active) {
      this.note = null;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.sin(this.rotation) * 0.1);

    const gradient = ctx.createLinearGradient(0, -this.height / 2, 0, this.height / 2);
    gradient.addColorStop(0, this.darkenColor(this.color, 0.3));
    gradient.addColorStop(1, this.darkenColor(this.color, 0.6));

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(0, this.height / 2);
    ctx.lineTo(-this.width / 2, -this.height / 3);
    ctx.lineTo(-this.width / 3, -this.height / 2);
    ctx.lineTo(this.width / 3, -this.height / 2);
    ctx.lineTo(this.width / 2, -this.height / 3);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 8;
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ff0000';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(-8, -5, 4, 0, Math.PI * 2);
    ctx.arc(8, -5, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  private darkenColor(color: string, amount: number): string {
    const hex = color.replace('#', '');
    const r = Math.max(0, parseInt(hex.substr(0, 2), 16) * (1 - amount));
    const g = Math.max(0, parseInt(hex.substr(2, 2), 16) * (1 - amount));
    const b = Math.max(0, parseInt(hex.substr(4, 2), 16) * (1 - amount));
    return `rgb(${Math.floor(r)}, ${Math.floor(g)}, ${Math.floor(b)})`;
  }
}

export class ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  life: number;
  maxLife: number;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 300 + 100;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = Math.random() * 8 + 4;
    this.color = color;
    this.maxLife = Math.random() * 0.5 + 0.3;
    this.life = this.maxLife;
  }

  update(deltaTime: number): boolean {
    this.x += this.vx * deltaTime;
    this.y += this.vy * deltaTime;
    this.vx *= 0.98;
    this.vy *= 0.98;
    this.vy += 200 * deltaTime;
    this.life -= deltaTime;
    this.size *= 0.97;
    return this.life > 0;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export class HitText {
  x: number;
  y: number;
  text: string;
  color: string;
  life: number;
  maxLife: number = 0.8;
  scale: number = 1;

  constructor(x: number, y: number, text: string, color: string) {
    this.x = x;
    this.y = y;
    this.text = text;
    this.color = color;
    this.life = this.maxLife;
  }

  update(deltaTime: number): boolean {
    this.life -= deltaTime;
    this.y -= 60 * deltaTime;
    this.scale = 1 + (1 - this.life / this.maxLife) * 0.5;
    return this.life > 0;
  }

  render(ctx: CanvasRenderingContext2D): void {
    const alpha = this.life / this.maxLife;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(this.x, this.y);
    ctx.scale(this.scale, this.scale);
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 15;
    ctx.font = 'bold 28px Courier New';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.text, 0, 0);
    ctx.restore();
  }
}

export class LaserEffect {
  active: boolean = false;
  duration: number = 0.5;
  elapsed: number = 0;
  alpha: number = 0;

  start(): void {
    this.active = true;
    this.elapsed = 0;
  }

  update(deltaTime: number): void {
    if (!this.active) return;
    this.elapsed += deltaTime;
    this.alpha = 1 - this.elapsed / this.duration;
    if (this.elapsed >= this.duration) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D, width: number, height: number): void {
    if (!this.active) return;

    ctx.save();
    ctx.globalAlpha = this.alpha * 0.8;

    for (let i = 0; i < 20; i++) {
      const x = (i / 19) * width;
      const gradient = ctx.createLinearGradient(x, 0, x, height);
      gradient.addColorStop(0, 'rgba(0, 212, 255, 0.8)');
      gradient.addColorStop(0.5, 'rgba(255, 255, 255, 1)');
      gradient.addColorStop(1, 'rgba(0, 212, 255, 0.8)');

      ctx.fillStyle = gradient;
      ctx.fillRect(x - 3, 0, 6, height);
    }

    ctx.globalAlpha = this.alpha * 0.3;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.restore();
  }
}
