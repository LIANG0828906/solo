import { CANVAS_WIDTH, CANVAS_HEIGHT, COLORS } from './types';
import { randomRange, randomInt } from './utils';

interface Star {
  x: number;
  y: number;
  size: number;
  speed: number;
  color: string;
  layer: number;
}

interface Nebula {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  speed: number;
}

export class Background {
  private stars: Star[];
  private nebulas: Nebula[];
  private nearStarCount: number = 100;
  private farStarCount: number = 150;
  private nebulaCount: number = 5;

  constructor() {
    this.stars = [];
    this.nebulas = [];
    this.initStars();
    this.initNebulas();
  }

  private initStars(): void {
    for (let i = 0; i < this.farStarCount; i++) {
      this.stars.push({
        x: randomRange(0, CANVAS_WIDTH),
        y: randomRange(0, CANVAS_HEIGHT),
        size: randomRange(0.5, 1.5),
        speed: randomRange(10, 25),
        color: COLORS.STAR_FAR,
        layer: 0
      });
    }

    for (let i = 0; i < this.nearStarCount; i++) {
      this.stars.push({
        x: randomRange(0, CANVAS_WIDTH),
        y: randomRange(0, CANVAS_HEIGHT),
        size: randomRange(1.5, 3),
        speed: randomRange(50, 100),
        color: COLORS.STAR_NEAR,
        layer: 1
      });
    }
  }

  private initNebulas(): void {
    const nebulaColors = ['#1a1a4a', '#2a1a4a', '#1a2a4a', '#3a1a5a'];
    
    for (let i = 0; i < this.nebulaCount; i++) {
      this.nebulas.push({
        x: randomRange(0, CANVAS_WIDTH),
        y: randomRange(0, CANVAS_HEIGHT),
        radius: randomRange(100, 300),
        color: nebulaColors[randomInt(0, nebulaColors.length - 1)],
        alpha: randomRange(0.1, 0.3),
        speed: randomRange(5, 15)
      });
    }
  }

  update(dt: number): void {
    for (const star of this.stars) {
      star.x -= star.speed * dt;
      
      if (star.x < -10) {
        star.x = CANVAS_WIDTH + 10;
        star.y = randomRange(0, CANVAS_HEIGHT);
      }
    }

    for (const nebula of this.nebulas) {
      nebula.x -= nebula.speed * dt;
      
      if (nebula.x < -nebula.radius) {
        nebula.x = CANVAS_WIDTH + nebula.radius;
        nebula.y = randomRange(0, CANVAS_HEIGHT);
      }
    }
  }

  render(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createLinearGradient(0, 0, 0, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#050520');
    gradient.addColorStop(0.5, '#0a0a2e');
    gradient.addColorStop(1, '#0f0f3a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    for (const nebula of this.nebulas) {
      const nebulaGradient = ctx.createRadialGradient(
        nebula.x, nebula.y, 0,
        nebula.x, nebula.y, nebula.radius
      );
      nebulaGradient.addColorStop(0, nebula.color);
      nebulaGradient.addColorStop(1, 'transparent');
      
      ctx.globalAlpha = nebula.alpha;
      ctx.fillStyle = nebulaGradient;
      ctx.fillRect(
        nebula.x - nebula.radius,
        nebula.y - nebula.radius,
        nebula.radius * 2,
        nebula.radius * 2
      );
    }
    ctx.globalAlpha = 1;

    for (const star of this.stars) {
      if (star.layer === 1) {
        ctx.shadowColor = star.color;
        ctx.shadowBlur = 3;
      }
      
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }
}
