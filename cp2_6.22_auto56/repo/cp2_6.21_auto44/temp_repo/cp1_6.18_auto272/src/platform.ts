export interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  passed: boolean;
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
  warningTimer: number;
  active: boolean;
  hasRollingRock: boolean;
  rockX: number;
  rockY: number;
  rockVY: number;
  rockFalling: boolean;
  crackSeeds: number[];
}

export class PlatformManager {
  platforms: Platform[] = [];
  obstacles: Obstacle[] = [];
  canvasHeight: number;
  groundY: number;
  nextPlatformX: number;
  nextObstacleTime: number;
  nextCollectibleX: number;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasHeight = canvasHeight;
    this.groundY = canvasHeight - 60;
    this.nextPlatformX = 0;
    this.nextObstacleTime = 20 + Math.random() * 20;
    this.nextCollectibleX = 200 + Math.random() * 200;
    this.generateInitialPlatforms(canvasWidth);
  }

  generateInitialPlatforms(canvasWidth: number) {
    let x = 0;
    while (x < canvasWidth + 600) {
      const width = 80 + Math.random() * 150;
      const height = 20 + Math.random() * 20;
      this.platforms.push({
        x,
        y: this.groundY - height,
        width,
        height,
        passed: false,
      });
      x += width + 100 + Math.random() * 200;
    }
    this.nextPlatformX = x;
  }

  generatePlatform(): Platform {
    const width = 80 + Math.random() * 150;
    const height = 20 + Math.random() * 20;
    const gap = 100 + Math.random() * 200;
    const plat: Platform = {
      x: this.nextPlatformX,
      y: this.groundY - height,
      width,
      height,
      passed: false,
    };
    this.nextPlatformX += width + gap;
    return plat;
  }

  generateObstacle(): Obstacle {
    const height = 60 + Math.random() * 20;
    const width = 20 + Math.random() * 10;
    const plat = this.platforms[this.platforms.length - 1];
    const baseY = plat ? plat.y : this.groundY - 30;
    const crackSeeds: number[] = [];
    const numCracks = 2 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numCracks; i++) {
      crackSeeds.push(Math.random());
    }
    return {
      x: plat ? plat.x + plat.width * 0.5 : this.nextPlatformX - 100,
      y: baseY - height,
      width,
      height,
      warningTimer: 1,
      active: false,
      hasRollingRock: Math.random() < 0.4,
      rockX: plat ? plat.x + plat.width * 0.5 + width * 0.5 : 0,
      rockY: baseY - height - 20,
      rockVY: 0,
      rockFalling: false,
      crackSeeds,
    };
  }

  update(scrollSpeed: number, dt: number, gameTime: number) {
    for (const p of this.platforms) {
      p.x -= scrollSpeed;
    }
    for (const o of this.obstacles) {
      o.x -= scrollSpeed;
      if (o.hasRollingRock) {
        o.rockX -= scrollSpeed;
      }

      if (o.warningTimer > 0) {
        o.warningTimer -= dt;
        if (o.warningTimer <= 0) {
          o.active = true;
          if (o.hasRollingRock) {
            o.rockFalling = true;
          }
        }
      }

      if (o.rockFalling) {
        o.rockVY += 0.1;
        o.rockY += o.rockVY;
        const plat = this.platforms.find(
          (p) => o.rockX >= p.x && o.rockX <= p.x + p.width && Math.abs(o.rockY - p.y) < 15
        );
        if (plat) {
          o.rockFalling = false;
          o.rockVY = 0;
        }
      }
    }

    this.platforms = this.platforms.filter((p) => p.x + p.width > -50);
    this.obstacles = this.obstacles.filter((o) => o.x + o.width > -50);

    const rightmost = this.platforms.reduce((max, p) => Math.max(max, p.x + p.width), 0);
    while (rightmost < this.nextPlatformX && this.nextPlatformX - scrollSpeed < rightmost + 800) {
      break;
    }
    while (this.nextPlatformX - scrollSpeed < rightmost + 800) {
      const p = this.generatePlatform();
      this.platforms.push(p);
    }

    this.nextObstacleTime -= dt;
    if (this.nextObstacleTime <= 0) {
      this.obstacles.push(this.generateObstacle());
      this.nextObstacleTime = 20 + Math.random() * 20;
    }
  }

  resize(canvasHeight: number) {
    this.canvasHeight = canvasHeight;
    this.groundY = canvasHeight - 60;
  }

  drawPlatforms(ctx: CanvasRenderingContext2D) {
    for (const p of this.platforms) {
      const gradient = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
      gradient.addColorStop(0, '#4E342E');
      gradient.addColorStop(1, '#3E2723');
      ctx.fillStyle = gradient;

      ctx.beginPath();
      const points = this.generateIrregularPoints(p);
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.closePath();
      ctx.fill();

      ctx.shadowColor = '#FFD54F';
      ctx.shadowBlur = 6;
      ctx.strokeStyle = 'rgba(255, 213, 79, 0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;

      for (let sx = p.x + 8; sx < p.x + p.width - 8; sx += 12 + Math.random() * 8) {
        const sy = p.y + 2 + Math.random() * 4;
        ctx.fillStyle = 'rgba(255, 213, 79, 0.15)';
        ctx.beginPath();
        ctx.arc(sx, sy, 1.5 + Math.random(), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  generateIrregularPoints(p: Platform): { x: number; y: number }[] {
    const pts: { x: number; y: number }[] = [];
    const segments = Math.floor(p.width / 15);
    pts.push({ x: p.x, y: p.y + p.height });
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      pts.push({
        x: p.x + t * p.width,
        y: p.y + Math.sin(t * Math.PI) * 3 + Math.random() * 2,
      });
    }
    pts.push({ x: p.x + p.width, y: p.y + p.height });
    return pts;
  }

  drawObstacles(ctx: CanvasRenderingContext2D) {
    for (const o of this.obstacles) {
      if (o.warningTimer > 0) {
        const blink = Math.sin(o.warningTimer * Math.PI * 4) > 0;
        if (blink) {
          ctx.strokeStyle = '#FF0000';
          ctx.lineWidth = 4;
          ctx.strokeRect(o.x - 4, o.y - 4, o.width + 8, o.height + 8);
        }
      }

      if (o.active) {
        const gradient = ctx.createLinearGradient(o.x, o.y, o.x, o.y + o.height);
        gradient.addColorStop(0, '#4E342E');
        gradient.addColorStop(1, '#3E2723');
        ctx.fillStyle = gradient;

        ctx.beginPath();
        const pts = this.generateRockPoints(o);
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(pts[i].x, pts[i].y);
        }
        ctx.closePath();
        ctx.fill();

        ctx.strokeStyle = '#8D6E63';
        ctx.lineWidth = 1;
        for (let i = 0; i < o.crackSeeds.length; i++) {
          const seed = o.crackSeeds[i];
          const cx = o.x + o.width * seed;
          const cy = o.y + o.height * (0.2 + seed * 0.5);
          ctx.beginPath();
          ctx.moveTo(cx, cy);
          ctx.lineTo(cx + (seed - 0.5) * 10, cy + 8 + seed * 5);
          ctx.stroke();
        }

        if (o.hasRollingRock) {
          ctx.fillStyle = '#616161';
          ctx.beginPath();
          ctx.arc(o.rockX, o.rockY, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#757575';
          ctx.beginPath();
          ctx.arc(o.rockX - 3, o.rockY - 3, 3, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  generateRockPoints(o: Obstacle): { x: number; y: number }[] {
    return [
      { x: o.x + 2, y: o.y + o.height },
      { x: o.x - 2, y: o.y + o.height * 0.6 },
      { x: o.x + 3, y: o.y + o.height * 0.2 },
      { x: o.x + o.width * 0.3, y: o.y - 2 },
      { x: o.x + o.width * 0.7, y: o.y + 1 },
      { x: o.x + o.width + 1, y: o.y + o.height * 0.3 },
      { x: o.x + o.width + 2, y: o.y + o.height * 0.7 },
      { x: o.x + o.width - 1, y: o.y + o.height },
    ];
  }

  getGroundYAt(x: number): number | null {
    for (const p of this.platforms) {
      if (x >= p.x && x <= p.x + p.width) {
        return p.y;
      }
    }
    return null;
  }
}
