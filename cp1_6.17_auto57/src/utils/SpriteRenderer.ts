import { COLORS } from './constants';

export class SpriteRenderer {
  ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Failed to get 2D context');
    }
    this.ctx = ctx;
    this.ctx.imageSmoothingEnabled = false;
  }

  clear(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  }

  drawPixelRect(x: number, y: number, w: number, h: number, color: string): void {
    this.ctx.fillStyle = color;
    this.ctx.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
  }

  drawPlayer(
    x: number,
    y: number,
    bounceOffset: number,
    direction: string,
    isAttacking: boolean,
    attackProgress: number,
    hurtFlash: boolean
  ): void {
    const drawY = y + bounceOffset;
    const baseColor = hurtFlash ? COLORS.HURT_FLASH : '#4B5563';

    this.drawPixelRect(x + 4, drawY + 6, 8, 10, baseColor);
    this.drawPixelRect(x + 4, drawY + 2, 8, 6, COLORS.GOLD_HELMET);
    this.drawPixelRect(x + 5, drawY + 1, 6, 2, COLORS.GOLD_HELMET);

    if (direction === 'left') {
      this.drawPixelRect(x + 5, drawY + 4, 2, 2, '#1F2937');
    } else {
      this.drawPixelRect(x + 9, drawY + 4, 2, 2, '#1F2937');
    }

    if (isAttacking) {
      const swordAngle = (attackProgress * Math.PI) - Math.PI / 4;
      const swordLength = 14;
      const swordBaseX = direction === 'left' ? x + 4 : x + 12;
      const swordBaseY = drawY + 8;
      const swordEndX = swordBaseX + Math.cos(swordAngle) * swordLength * (direction === 'left' ? -1 : 1);
      const swordEndY = swordBaseY + Math.sin(swordAngle) * swordLength;

      this.ctx.strokeStyle = COLORS.BLUE_SWORD;
      this.ctx.lineWidth = 3;
      this.ctx.beginPath();
      this.ctx.moveTo(swordBaseX, swordBaseY);
      this.ctx.lineTo(swordEndX, swordEndY);
      this.ctx.stroke();

      const glowRadius = 8 + attackProgress * 8;
      const gradient = this.ctx.createRadialGradient(
        swordEndX, swordEndY, 0,
        swordEndX, swordEndY, glowRadius
      );
      gradient.addColorStop(0, COLORS.SWORD_GLOW + '80');
      gradient.addColorStop(1, COLORS.SWORD_GLOW + '00');
      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(swordEndX, swordEndY, glowRadius, 0, Math.PI * 2);
      this.ctx.fill();
    } else {
      if (direction === 'left') {
        this.drawPixelRect(x - 2, drawY + 6, 3, 8, COLORS.BLUE_SWORD);
      } else {
        this.drawPixelRect(x + 15, drawY + 6, 3, 8, COLORS.BLUE_SWORD);
      }
    }
  }

  drawSlime(x: number, y: number, w: number, h: number, bounceOffset: number): void {
    const drawY = y + bounceOffset;
    const stretch = bounceOffset < 0 ? 1 + Math.abs(bounceOffset) / 10 : 1 - Math.abs(bounceOffset) / 20;
    const bodyH = h * stretch;
    const bodyY = drawY + (h - bodyH);

    this.drawPixelRect(x + 2, bodyY, w - 4, bodyH, COLORS.SLIME);
    this.drawPixelRect(x + 1, bodyY + 2, 1, bodyH - 4, COLORS.SLIME);
    this.drawPixelRect(x + w - 2, bodyY + 2, 1, bodyH - 4, COLORS.SLIME);

    this.drawPixelRect(x + w / 2 - 3, bodyY + 3, 2, 2, '#1F2937');
    this.drawPixelRect(x + w / 2 + 1, bodyY + 3, 2, 2, '#1F2937');

    this.drawPixelRect(x + w / 2 - 2, bodyY + bodyH - 3, 4, 1, '#22C55E');
  }

  drawSkeleton(x: number, y: number, _w: number, _h: number, direction: string): void {
    this.drawPixelRect(x + 4, y + 2, 8, 6, COLORS.SKELETON);
    this.drawPixelRect(x + 3, y + 3, 1, 4, COLORS.SKELETON);
    this.drawPixelRect(x + 12, y + 3, 1, 4, COLORS.SKELETON);

    if (direction === 'left') {
      this.drawPixelRect(x + 5, y + 4, 2, 2, '#1F2937');
    } else {
      this.drawPixelRect(x + 9, y + 4, 2, 2, '#1F2937');
    }

    this.drawPixelRect(x + 6, y + 8, 4, 8, COLORS.SKELETON);
    this.drawPixelRect(x + 4, y + 9, 2, 6, COLORS.SKELETON);
    this.drawPixelRect(x + 10, y + 9, 2, 6, COLORS.SKELETON);

    this.drawPixelRect(x + 5, y + 16, 2, 4, COLORS.SKELETON);
    this.drawPixelRect(x + 9, y + 16, 2, 4, COLORS.SKELETON);
  }

  drawBat(x: number, y: number, w: number, h: number, wingOffset: number): void {
    this.drawPixelRect(x + w / 2 - 2, y + h / 2 - 2, 4, 4, COLORS.BAT);
    this.drawPixelRect(x + w / 2 - 1, y + h / 2 - 4, 2, 2, COLORS.BAT);

    const wingY = y + h / 2 - 2 + wingOffset;
    const wingHeight = 4 - Math.abs(wingOffset) * 0.5;

    this.drawPixelRect(x, wingY, w / 2 - 3, wingHeight, COLORS.BAT);
    this.drawPixelRect(x + w / 2 + 3, wingY, w / 2 - 3, wingHeight, COLORS.BAT);

    this.drawPixelRect(x + w / 2 - 2, y + h / 2, 1, 1, '#F8FAFC');
    this.drawPixelRect(x + w / 2 + 1, y + h / 2, 1, 1, '#F8FAFC');
  }

  drawChest(
    x: number,
    y: number,
    w: number,
    h: number,
    type: string,
    openProgress: number,
    glowProgress: number
  ): void {
    const bodyColor = type === 'wooden' ? COLORS.WOODEN_CHEST : COLORS.SILVER_CHEST;
    const lidAngle = -openProgress * Math.PI / 2;
    const lidHeight = h * 0.35;

    this.drawPixelRect(x, y + lidHeight, w, h - lidHeight, bodyColor);
    this.drawPixelRect(x + 2, y + lidHeight + 2, w - 4, h - lidHeight - 4, bodyColor);
    this.drawPixelRect(x + w / 2 - 2, y + lidHeight + h / 3, 4, 4, COLORS.GOLD);

    this.ctx.save();
    this.ctx.translate(x + w / 2, y + lidHeight);
    this.ctx.rotate(lidAngle);
    this.drawPixelRect(-w / 2, -lidHeight, w, lidHeight, bodyColor);
    this.drawPixelRect(-w / 2 + 2, -lidHeight + 2, w - 4, lidHeight - 4, bodyColor);
    this.ctx.restore();

    if (glowProgress > 0) {
      const alpha = glowProgress * 0.6;
      const glowSize = w * 0.8 + (1 - glowProgress) * 20;
      const gradient = this.ctx.createRadialGradient(
        x + w / 2, y + h / 2, 0,
        x + w / 2, y + h / 2, glowSize
      );
      gradient.addColorStop(0, COLORS.GOLD_HELMET + Math.floor(alpha * 255).toString(16).padStart(2, '0'));
      gradient.addColorStop(1, COLORS.GOLD_HELMET + '00');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x - glowSize, y - glowSize, w + glowSize * 2, h + glowSize * 2);
    }
  }

  drawTrap(
    x: number,
    y: number,
    w: number,
    h: number,
    type: string,
    animationProgress: number
  ): void {
    if (type === 'falling_rock') {
      const fallY = y - (1 - animationProgress) * h * 2;
      this.drawPixelRect(x + 2, fallY, w - 4, h - 4, COLORS.ROCK);
      this.drawPixelRect(x, fallY + 2, w, h - 4, COLORS.ROCK);
      this.drawPixelRect(x + 4, fallY + 2, 3, 3, '#4B5563');
      this.drawPixelRect(x + w - 8, fallY + h - 8, 4, 3, '#4B5563');
    } else if (type === 'spike') {
      const spikeHeight = animationProgress * h;
      const spikeCount = 3;
      const spikeWidth = w / spikeCount;

      for (let i = 0; i < spikeCount; i++) {
        const spikeX = x + i * spikeWidth + spikeWidth / 2;
        const spikeBaseY = y + h;
        const spikeTopY = spikeBaseY - spikeHeight;

        this.ctx.fillStyle = COLORS.SPIKE;
        this.ctx.beginPath();
        this.ctx.moveTo(spikeX - spikeWidth / 2 + 2, spikeBaseY);
        this.ctx.lineTo(spikeX, spikeTopY);
        this.ctx.lineTo(spikeX + spikeWidth / 2 - 2, spikeBaseY);
        this.ctx.closePath();
        this.ctx.fill();
      }

      this.drawPixelRect(x, y + h - 2, w, 2, '#4B5563');
    }
  }

  drawParticle(x: number, y: number, size: number, color: string, alpha: number): void {
    this.ctx.globalAlpha = alpha;
    this.drawPixelRect(x, y, size, size, color);
    this.ctx.globalAlpha = 1;
  }

  drawProjectile(x: number, y: number, size: number, color: string): void {
    this.drawPixelRect(x - size / 2, y - size / 2, size, size, color);
    this.drawPixelRect(x - size / 2 + 1, y - size / 2 - 1, size - 2, 1, color);
  }

  drawFloor(x: number, y: number, w: number, h: number, color: string): void {
    this.drawPixelRect(x, y, w, h, color);
    this.drawPixelRect(x, y, w, 4, COLORS.FLOOR_TOP);

    for (let i = 0; i < w; i += 16) {
      this.drawPixelRect(x + i, y + 4, 8, 1, COLORS.FLOOR_TOP + '80');
    }
  }

  drawStairs(x: number, y: number, w: number, h: number): void {
    const stepCount = 4;
    const stepHeight = h / stepCount;
    const stepWidth = w / stepCount;

    for (let i = 0; i < stepCount; i++) {
      const stepX = x + i * stepWidth;
      const stepY = y + i * stepHeight;
      const stepW = w - i * stepWidth;
      const stepH = stepHeight;

      this.drawPixelRect(stepX, stepY, stepW, stepH, '#6B7280');
      this.drawPixelRect(stepX, stepY, stepW, 2, '#9CA3AF');
    }

    this.ctx.fillStyle = COLORS.GOLD_HELMET + '40';
    this.ctx.fillRect(x, y, w, h);
  }

  drawHealthBar(x: number, y: number, w: number, h: number, current: number, max: number): void {
    const percentage = Math.max(0, current / max);
    const fillWidth = w * percentage;

    this.drawPixelRect(x, y, w, h, '#1F2937');
    this.drawPixelRect(x + 1, y + 1, w - 2, h - 2, '#374151');

    if (fillWidth > 2) {
      const gradient = this.ctx.createLinearGradient(x, y, x + fillWidth, y);
      gradient.addColorStop(0, COLORS.HP_BAR_START);
      gradient.addColorStop(1, COLORS.HP_BAR_END);
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(x + 1, y + 1, fillWidth - 2, h - 2);
    }

    this.ctx.strokeStyle = '#0F172A';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, w, h);
  }
}
