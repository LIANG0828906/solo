export enum AsteroidSize {
  LARGE,
  MEDIUM,
  SMALL
}

export enum AsteroidType {
  NORMAL,
  EXPLOSIVE
}

export interface GameConfig {
  canvasWidth: number;
  canvasHeight: number;
}

const CONFIG: GameConfig = {
  canvasWidth: 800,
  canvasHeight: 600
};

export class Player {
  x: number;
  y: number;
  width: number = 40;
  height: number = 30;
  lives: number = 3;
  isInvincible: boolean = false;
  invincibleTimer: number = 0;
  targetX: number;
  targetY: number;
  flickerTimer: number = 0;
  visible: boolean = true;

  constructor() {
    this.x = CONFIG.canvasWidth * 0.3;
    this.y = CONFIG.canvasHeight * 0.5;
    this.targetX = this.x;
    this.targetY = this.y;
  }

  update(deltaTime: number): void {
    const lerpFactor = 0.15;
    this.x += (this.targetX - this.x) * lerpFactor;
    this.y += (this.targetY - this.y) * lerpFactor;

    const halfWidth = this.width / 2;
    const halfHeight = this.height / 2;
    this.x = Math.max(halfWidth, Math.min(CONFIG.canvasWidth - halfWidth, this.x));
    this.y = Math.max(halfHeight, Math.min(CONFIG.canvasHeight - halfHeight, this.y));

    if (this.isInvincible) {
      this.invincibleTimer -= deltaTime;
      this.flickerTimer += deltaTime;
      if (this.flickerTimer > 100) {
        this.visible = !this.visible;
        this.flickerTimer = 0;
      }
      if (this.invincibleTimer <= 0) {
        this.isInvincible = false;
        this.visible = true;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.visible) return;

    ctx.save();
    ctx.translate(this.x, this.y);

    const gradient = ctx.createLinearGradient(-this.width / 2, 0, this.width / 2, 0);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(0.5, '#4a4a6a');
    gradient.addColorStop(1, '#1a1a2e');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 0);
    ctx.lineTo(-this.width / 2, -this.height / 2);
    ctx.lineTo(-this.width / 3, 0);
    ctx.lineTo(-this.width / 2, this.height / 2);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#00BFFF';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00BFFF';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.moveTo(this.width / 2, 0);
    ctx.lineTo(-this.width / 2, -this.height / 2);
    ctx.lineTo(-this.width / 3, 0);
    ctx.lineTo(-this.width / 2, this.height / 2);
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = '#00BFFF';
    ctx.shadowColor = '#00BFFF';
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.ellipse(-this.width / 6, 0, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    const flameIntensity = 0.7 + Math.random() * 0.3;
    const flameGradient = ctx.createLinearGradient(-this.width / 2, 0, -this.width / 2 - 20 * flameIntensity, 0);
    flameGradient.addColorStop(0, '#00BFFF');
    flameGradient.addColorStop(0.5, '#FF6347');
    flameGradient.addColorStop(1, 'rgba(255, 99, 71, 0)');

    ctx.fillStyle = flameGradient;
    ctx.shadowColor = '#FF6347';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.moveTo(-this.width / 2, -this.height / 4);
    ctx.lineTo(-this.width / 2 - 15 * flameIntensity - Math.random() * 5, 0);
    ctx.lineTo(-this.width / 2, this.height / 4);
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  hit(): boolean {
    if (this.isInvincible) return true;
    this.lives--;
    if (this.lives <= 0) return false;
    this.isInvincible = true;
    this.invincibleTimer = 1000;
    this.flickerTimer = 0;
    return true;
  }

  reset(): void {
    this.x = CONFIG.canvasWidth * 0.3;
    this.y = CONFIG.canvasHeight * 0.5;
    this.targetX = this.x;
    this.targetY = this.y;
    this.lives = 3;
    this.isInvincible = false;
    this.invincibleTimer = 0;
    this.visible = true;
    this.flickerTimer = 0;
  }

  setTarget(x: number, y: number): void {
    this.targetX = x;
    this.targetY = y;
  }

  getBounds(): { left: number; right: number; top: number; bottom: number } {
    return {
      left: this.x - this.width / 2 + 5,
      right: this.x + this.width / 2 - 5,
      top: this.y - this.height / 2 + 5,
      bottom: this.y + this.height / 2 - 5
    };
  }
}

export class Bullet {
  x: number = 0;
  y: number = 0;
  width: number = 4;
  height: number = 12;
  speed: number = 10;
  trail: { x: number; y: number; alpha: number }[] = [];
  active: boolean = false;

  init(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.active = true;
    this.trail = [];
  }

  update(): void {
    this.trail.unshift({ x: this.x, y: this.y + this.height / 2, alpha: 1 });
    if (this.trail.length > 8) {
      this.trail.pop();
    }
    this.trail.forEach((t, i) => {
      t.alpha = 1 - (i / this.trail.length);
    });

    this.x += this.speed;

    if (this.x > CONFIG.canvasWidth + 20) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    this.trail.forEach((t) => {
      ctx.fillStyle = `rgba(0, 191, 255, ${t.alpha * 0.5})`;
      ctx.fillRect(t.x - this.width / 2, t.y - this.height / 4, this.width, this.height / 2);
    });

    ctx.save();
    ctx.shadowColor = '#00BFFF';
    ctx.shadowBlur = 10;

    const gradient = ctx.createLinearGradient(this.x, this.y - this.height / 2, this.x, this.y + this.height / 2);
    gradient.addColorStop(0, '#87CEEB');
    gradient.addColorStop(0.5, '#00BFFF');
    gradient.addColorStop(1, '#0099CC');

    ctx.fillStyle = gradient;
    ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);

    ctx.restore();
  }

  getBounds(): { left: number; right: number; top: number; bottom: number } {
    return {
      left: this.x - this.width / 2,
      right: this.x + this.width / 2,
      top: this.y - this.height / 2,
      bottom: this.y + this.height / 2
    };
  }
}

export class Asteroid {
  x: number = 0;
  y: number = 0;
  radius: number = 0;
  size: AsteroidSize = AsteroidSize.SMALL;
  type: AsteroidType = AsteroidType.NORMAL;
  hp: number = 1;
  maxHp: number = 1;
  vx: number = 0;
  vy: number = 0;
  color: string = '#3A3F47';
  noisePattern: number[] = [];
  active: boolean = false;
  scoreValue: number = 0;
  rotation: number = 0;
  rotationSpeed: number = 0;

  init(x: number, y: number, size: AsteroidSize, type: AsteroidType = AsteroidType.NORMAL): void {
    this.x = x;
    this.y = y;
    this.size = size;
    this.type = type;
    this.active = true;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.04;

    switch (size) {
      case AsteroidSize.LARGE:
        this.radius = 40 + Math.random() * 10;
        this.hp = 3;
        this.maxHp = 3;
        this.scoreValue = 50;
        break;
      case AsteroidSize.MEDIUM:
        this.radius = 25 + Math.random() * 10;
        this.hp = 2;
        this.maxHp = 2;
        this.scoreValue = 25;
        break;
      case AsteroidSize.SMALL:
        this.radius = 15 + Math.random() * 5;
        this.hp = 1;
        this.maxHp = 1;
        this.scoreValue = 10;
        break;
    }

    if (type === AsteroidType.EXPLOSIVE) {
      this.radius = 30;
      this.color = '#FF4500';
      this.hp = 2;
      this.maxHp = 2;
      this.scoreValue = 40;
    } else {
      const colorMix = Math.random();
      const r = Math.floor(58 + (139 - 58) * colorMix * 0.5);
      const g = Math.floor(63 + (0 - 63) * colorMix);
      const b = Math.floor(71 + (0 - 71) * colorMix);
      this.color = `rgb(${r}, ${g}, ${b})`;
    }

    this.noisePattern = [];
    const points = 12;
    for (let i = 0; i < points; i++) {
      this.noisePattern.push(0.75 + Math.random() * 0.5);
    }

    const speedMultiplier = 0.5 + Math.random() * 1.5;
    this.vx = -2 * speedMultiplier;
    this.vy = (Math.random() - 0.5) * 0.5;
  }

  update(): void {
    this.x += this.vx;
    this.y += this.vy;
    this.rotation += this.rotationSpeed;

    if (this.y - this.radius < 0 || this.y + this.radius > CONFIG.canvasHeight) {
      this.vy *= -1;
      this.y = Math.max(this.radius, Math.min(CONFIG.canvasHeight - this.radius, this.y));
    }

    if (this.x + this.radius < -50) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.shadowColor = this.type === AsteroidType.EXPLOSIVE ? '#FF4500' : '#1a1a1a';
    ctx.shadowBlur = this.type === AsteroidType.EXPLOSIVE ? 15 : 5;

    ctx.beginPath();
    const points = this.noisePattern.length;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = this.radius * this.noisePattern[i];
      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();

    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
    if (this.type === AsteroidType.EXPLOSIVE) {
      gradient.addColorStop(0, '#FF6347');
      gradient.addColorStop(0.7, '#FF4500');
      gradient.addColorStop(1, '#8B0000');
    } else {
      gradient.addColorStop(0, this.lightenColor(this.color, 30));
      gradient.addColorStop(0.7, this.color);
      gradient.addColorStop(1, this.darkenColor(this.color, 30));
    }
    ctx.fillStyle = gradient;
    ctx.fill();

    ctx.strokeStyle = this.type === AsteroidType.EXPLOSIVE ? '#FFD700' : this.darkenColor(this.color, 40);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = Math.random() * this.radius * 0.6;
      const nx = Math.cos(angle) * dist;
      const ny = Math.sin(angle) * dist;
      const nr = 2 + Math.random() * 4;
      ctx.fillStyle = Math.random() > 0.5 ? this.lightenColor(this.color, 20) : this.darkenColor(this.color, 20);
      ctx.beginPath();
      ctx.arc(nx, ny, nr, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    if (this.hp < this.maxHp && this.type === AsteroidType.NORMAL) {
      const barWidth = this.radius * 1.5;
      const barHeight = 4;
      const barY = -this.radius - 12;

      ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
      ctx.fillRect(-barWidth / 2, barY, barWidth, barHeight);

      ctx.fillStyle = '#00BFFF';
      ctx.fillRect(-barWidth / 2, barY, barWidth * (this.hp / this.maxHp), barHeight);
    }

    ctx.restore();
  }

  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.min(255, (num >> 16) + amt);
    const G = Math.min(255, ((num >> 8) & 0x00FF) + amt);
    const B = Math.min(255, (num & 0x0000FF) + amt);
    return `rgb(${R}, ${G}, ${B})`;
  }

  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace('#', ''), 16);
    const amt = Math.round(2.55 * percent);
    const R = Math.max(0, (num >> 16) - amt);
    const G = Math.max(0, ((num >> 8) & 0x00FF) - amt);
    const B = Math.max(0, (num & 0x0000FF) - amt);
    return `rgb(${R}, ${G}, ${B})`;
  }

  hit(damage: number): boolean {
    this.hp -= damage;
    return this.hp <= 0;
  }

  collidesWithRect(rect: { left: number; right: number; top: number; bottom: number }): boolean {
    const closestX = Math.max(rect.left, Math.min(this.x, rect.right));
    const closestY = Math.max(rect.top, Math.min(this.y, rect.bottom));
    const distanceX = this.x - closestX;
    const distanceY = this.y - closestY;
    return (distanceX * distanceX + distanceY * distanceY) < (this.radius * this.radius);
  }
}

export class ExplosionFragment {
  x: number = 0;
  y: number = 0;
  radius: number = 5;
  vx: number = 0;
  vy: number = 0;
  speed: number = 3;
  active: boolean = false;
  life: number = 0;
  maxLife: number = 180;

  init(x: number, y: number, angle: number): void {
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * this.speed;
    this.vy = Math.sin(angle) * this.speed;
    this.active = true;
    this.life = 0;
  }

  update(): void {
    this.x += this.vx;
    this.y += this.vy;
    this.life++;

    this.vx *= 0.995;
    this.vy *= 0.995;

    if (this.life >= this.maxLife ||
        this.x < -50 || this.x > CONFIG.canvasWidth + 50 ||
        this.y < -50 || this.y > CONFIG.canvasHeight + 50) {
      this.active = false;
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;

    const alpha = 1 - (this.life / this.maxLife);

    ctx.save();
    ctx.shadowColor = '#FF4500';
    ctx.shadowBlur = 8;

    const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.radius);
    gradient.addColorStop(0, `rgba(255, 215, 0, ${alpha})`);
    gradient.addColorStop(0.5, `rgba(255, 69, 0, ${alpha})`);
    gradient.addColorStop(1, `rgba(139, 0, 0, ${alpha * 0.5})`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  collidesWithRect(rect: { left: number; right: number; top: number; bottom: number }): boolean {
    const closestX = Math.max(rect.left, Math.min(this.x, rect.right));
    const closestY = Math.max(rect.top, Math.min(this.y, rect.bottom));
    const distanceX = this.x - closestX;
    const distanceY = this.y - closestY;
    return (distanceX * distanceX + distanceY * distanceY) < (this.radius * this.radius);
  }
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
}
