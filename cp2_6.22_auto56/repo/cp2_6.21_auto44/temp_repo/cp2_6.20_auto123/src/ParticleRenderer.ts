import { Particle, Theme } from './ParticleEngine';

const TAU = Math.PI * 2;

const themeGlowColors: Record<Theme, string> = {
  fire: 'rgba(255, 100, 50, 0.8)',
  ice: 'rgba(129, 212, 250, 0.8)',
  sand: 'rgba(212, 165, 116, 0.8)',
  petal: 'rgba(244, 143, 177, 0.8)',
};

function getThemeBgStart(theme: Theme, progress: number): string {
  switch (theme) {
    case 'fire':
      return `rgba(139, 0, 0, ${progress * 0.6})`;
    case 'ice':
      return `rgba(179, 229, 252, ${progress * 0.5})`;
    case 'sand':
      return `rgba(245, 222, 179, ${progress * 0.5})`;
    case 'petal':
      return `rgba(255, 182, 193, ${progress * 0.5})`;
  }
}

function drawCircle(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, TAU);
  ctx.fill();
}

function drawSquare(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.beginPath();
  ctx.rect(-size / 2, -size / 2, size, size);
  ctx.fill();
}

function drawTriangle(ctx: CanvasRenderingContext2D, size: number): void {
  const h = size * Math.sqrt(3) / 2;
  ctx.beginPath();
  ctx.moveTo(0, -h / 1.5);
  ctx.lineTo(-size / 2, h / 3);
  ctx.lineTo(size / 2, h / 3);
  ctx.closePath();
  ctx.fill();
}

function drawEllipse(ctx: CanvasRenderingContext2D, size: number): void {
  ctx.beginPath();
  ctx.ellipse(0, 0, size / 2, size / 3, 0, 0, TAU);
  ctx.fill();
}

function drawShard(ctx: CanvasRenderingContext2D, size: number): void {
  const points = 6;
  const outer = size / 2;
  const inner = size / 4;
  ctx.beginPath();
  for (let i = 0; i < points; i++) {
    const angle = (i / points) * TAU;
    const r = i % 2 === 0 ? outer : inner;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();
}

export class ParticleRenderer {
  private ctx: CanvasRenderingContext2D;
  private width: number;
  private height: number;

  constructor(ctx: CanvasRenderingContext2D, width: number, height: number) {
    this.ctx = ctx;
    this.width = width;
    this.height = height;
  }

  setSize(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }

  render(particles: Particle[], theme: Theme, progress: number): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const halfW = w / 2;
    const halfH = h / 2;

    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, w, h);

    const bgStart = getThemeBgStart(theme, progress);
    const bgGradient = ctx.createRadialGradient(halfW, halfH, 0, halfW, halfH, Math.max(w, h) / 2);
    bgGradient.addColorStop(0, bgStart);
    bgGradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, w, h);

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const glowColor = themeGlowColors[theme];

    for (const particle of particles) {
      if (particle.dead || particle.alpha <= 0) continue;

      const { x, y, rotation, alpha, size, color, shape, life, maxLife, originX, originY } = particle;

      ctx.save();
      ctx.translate(x + halfW, y + halfH);
      ctx.rotate(rotation);
      ctx.globalAlpha = alpha;
      ctx.shadowBlur = size * 1.5;
      ctx.shadowColor = glowColor;
      ctx.fillStyle = color;

      switch (shape) {
        case 'circle':
          drawCircle(ctx, size);
          break;
        case 'square':
          drawSquare(ctx, size);
          break;
        case 'triangle':
          drawTriangle(ctx, size);
          break;
        case 'ellipse':
          drawEllipse(ctx, size);
          break;
        case 'shard':
          drawShard(ctx, size);
          break;
      }

      ctx.restore();
    }

    this.renderThemeOverlay(ctx, particles, theme, halfW, halfH, glowColor);
  }

  private renderThemeOverlay(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    theme: Theme,
    halfW: number,
    halfH: number,
    glowColor: string
  ): void {
    switch (theme) {
      case 'fire':
        this.renderFireOverlay(ctx, particles, halfW, halfH);
        break;
      case 'ice':
        this.renderIceOverlay(ctx, particles, halfW, halfH);
        break;
      case 'sand':
        this.renderSandOverlay(ctx, particles, halfW, halfH);
        break;
      case 'petal':
        this.renderPetalOverlay(ctx, particles, halfW, halfH, glowColor);
        break;
    }
  }

  private renderFireOverlay(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    halfW: number,
    halfH: number
  ): void {
    for (const particle of particles) {
      if (particle.dead || particle.alpha <= 0) continue;

      const { x, y, alpha, size } = particle;
      const haloSize = size * 2;

      ctx.save();
      ctx.globalAlpha = alpha * 0.3;
      const haloGradient = ctx.createRadialGradient(
        x + halfW,
        y + halfH,
        0,
        x + halfW,
        y + halfH,
        haloSize
      );
      haloGradient.addColorStop(0, 'rgba(255, 140, 0, 0.6)');
      haloGradient.addColorStop(0.5, 'rgba(255, 69, 0, 0.3)');
      haloGradient.addColorStop(1, 'rgba(139, 0, 0, 0)');
      ctx.fillStyle = haloGradient;
      ctx.beginPath();
      ctx.arc(x + halfW, y + halfH, haloSize, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
  }

  private renderIceOverlay(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    halfW: number,
    halfH: number
  ): void {
    for (const particle of particles) {
      if (particle.dead || particle.alpha <= 0) continue;
      if (particle.life % 6 >= 3) continue;

      const { x, y, alpha, size } = particle;
      const sparkleSize = Math.max(1, size * 0.3);

      ctx.save();
      ctx.globalAlpha = alpha * 0.9;
      ctx.fillStyle = '#ffffff';
      ctx.shadowBlur = 4;
      ctx.shadowColor = 'rgba(255,255,255,0.8)';
      ctx.fillRect(
        x + halfW - sparkleSize / 2,
        y + halfH - sparkleSize / 2,
        sparkleSize,
        sparkleSize
      );
      ctx.restore();
    }
  }

  private renderSandOverlay(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    halfW: number,
    halfH: number
  ): void {
    ctx.save();
    ctx.strokeStyle = 'rgba(160, 120, 80, 0.4)';
    ctx.lineWidth = 0.5;

    for (const particle of particles) {
      if (particle.dead || particle.alpha <= 0) continue;
      if (particle.life <= particle.maxLife * 0.2) continue;

      const { x, y, originX, originY } = particle;

      ctx.beginPath();
      ctx.moveTo(originX + halfW, originY + halfH);
      ctx.lineTo(x + halfW, y + halfH);
      ctx.stroke();
    }

    ctx.restore();
  }

  private renderPetalOverlay(
    ctx: CanvasRenderingContext2D,
    particles: Particle[],
    halfW: number,
    halfH: number,
    glowColor: string
  ): void {
    for (const particle of particles) {
      if (particle.dead || particle.alpha <= 0) continue;
      if (particle.shape !== 'ellipse') continue;

      const { x, y, rotation, alpha, size } = particle;

      ctx.save();
      ctx.translate(x + halfW, y + halfH);
      ctx.rotate(rotation);
      ctx.globalAlpha = alpha * 0.8;
      ctx.strokeStyle = 'rgba(194, 80, 120, 0.6)';
      ctx.lineWidth = 0.8;
      ctx.shadowBlur = size * 0.5;
      ctx.shadowColor = glowColor;
      ctx.beginPath();
      ctx.ellipse(0, 0, size / 2, size / 3, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }
}
