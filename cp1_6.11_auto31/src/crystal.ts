export type CrystalColor = 'red' | 'blue' | 'green' | 'purple';

const CRYSTAL_COLORS: Record<CrystalColor, string> = {
  red: '#ff4466',
  blue: '#4488ff',
  green: '#44ff88',
  purple: '#cc44ff'
};

const CRYSTAL_SCORES: Record<CrystalColor, number> = {
  red: 50,
  blue: 100,
  green: 150,
  purple: 200
};

export class Crystal {
  x: number;
  y: number;
  size: number;
  color: CrystalColor;
  rotation: number;
  rotationSpeed: number;
  active: boolean;
  canvasWidth: number;
  canvasHeight: number;
  pulsePhase: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.size = 12;
    this.x = 100 + Math.random() * (canvasWidth - 200);
    this.y = 50 + Math.random() * (canvasHeight - 100);

    const colors: CrystalColor[] = ['red', 'blue', 'green', 'purple'];
    const weights = [0.4, 0.3, 0.2, 0.1];
    const rand = Math.random();
    let cumulative = 0;
    let chosenColor: CrystalColor = 'red';
    for (let i = 0; i < colors.length; i++) {
      cumulative += weights[i];
      if (rand < cumulative) {
        chosenColor = colors[i];
        break;
      }
    }
    this.color = chosenColor;

    this.rotation = 0;
    this.rotationSpeed = 0.03;
    this.active = true;
    this.pulsePhase = Math.random() * Math.PI * 2;
  }

  update(): void {
    this.rotation += this.rotationSpeed;
    this.pulsePhase += 0.1;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    const pulseScale = 1 + Math.sin(this.pulsePhase) * 0.1;
    const size = this.size * pulseScale;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const color = CRYSTAL_COLORS[this.color];
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;

    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(angle) * size;
      const py = Math.sin(angle) * size;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(angle) * size * 0.5;
      const py = Math.sin(angle) * size * 0.5;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  }

  getScore(): number {
    return CRYSTAL_SCORES[this.color];
  }

  getColorHex(): string {
    return CRYSTAL_COLORS[this.color];
  }

  getCollisionRadius(): number {
    return this.size * 1.2;
  }

  resize(canvasWidth: number, canvasHeight: number): void {
    const ratioX = canvasWidth / this.canvasWidth;
    const ratioY = canvasHeight / this.canvasHeight;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.x *= ratioX;
    this.y *= ratioY;
  }
}

export class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;

  constructor(x: number, y: number, color: string) {
    this.x = x;
    this.y = y;
    this.color = color;
    this.maxLife = 0.5;
    this.life = this.maxLife;

    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 4;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.size = 2 + Math.random() * 4;
  }

  update(deltaTime: number): boolean {
    this.life -= deltaTime;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.98;
    this.vy *= 0.98;
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
