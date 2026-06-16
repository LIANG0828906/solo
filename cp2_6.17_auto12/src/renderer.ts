import { Photon, PhotonColor, COLOR_CONFIG, PhotonState, BurstParticle, Ripple } from './photon';
import { GRID_SIZE, CELL_SIZE, PHOTON_RADIUS } from './grid';

export class Renderer {
  ctx: CanvasRenderingContext2D;
  width: number = 0;
  height: number = 0;
  gridOffsetX: number = 0;
  gridOffsetY: number = 0;
  stars: { x: number; y: number; size: number; speed: number; brightness: number }[] = [];

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
    this.initStars();
  }

  initStars() {
    this.stars = [];
    for (let i = 0; i < 80; i++) {
      this.stars.push({
        x: Math.random(),
        y: Math.random(),
        size: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 0.3 + 0.1,
        brightness: Math.random(),
      });
    }
  }

  resize() {
    this.width = this.ctx.canvas.width;
    this.height = this.ctx.canvas.height;
    this.gridOffsetX = (this.width - GRID_SIZE * CELL_SIZE) / 2;
    this.gridOffsetY = (this.height - GRID_SIZE * CELL_SIZE) / 2 + 20;
  }

  gridToPixel(gridX: number, gridY: number): { x: number; y: number } {
    return {
      x: this.gridOffsetX + gridX * CELL_SIZE + CELL_SIZE / 2,
      y: this.gridOffsetY + gridY * CELL_SIZE + CELL_SIZE / 2,
    };
  }

  pixelToGrid(px: number, py: number): { x: number; y: number } | null {
    const gx = Math.floor((px - this.gridOffsetX) / CELL_SIZE);
    const gy = Math.floor((py - this.gridOffsetY) / CELL_SIZE);
    if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) return null;
    return { x: gx, y: gy };
  }

  drawBackground(time: number) {
    const ctx = this.ctx;
    const gradient = ctx.createRadialGradient(
      this.width / 2, this.height / 2, 0,
      this.width / 2, this.height / 2, this.width * 0.7
    );
    gradient.addColorStop(0, '#1A1A3A');
    gradient.addColorStop(1, '#0B0F1F');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, this.width, this.height);

    for (const star of this.stars) {
      const sx = star.x * this.width;
      const sy = star.y * this.height;
      const twinkle = 0.3 + Math.abs(Math.sin(time * star.speed + star.brightness * 10)) * 0.7;
      ctx.fillStyle = `rgba(200, 220, 255, ${twinkle * 0.6})`;
      ctx.beginPath();
      ctx.arc(sx, sy, star.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  drawGrid() {
    const ctx = this.ctx;

    ctx.save();
    ctx.strokeStyle = 'rgba(74, 144, 217, 0.6)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#4A90D9';
    ctx.shadowBlur = 12;
    ctx.strokeRect(
      this.gridOffsetX - 2,
      this.gridOffsetY - 2,
      GRID_SIZE * CELL_SIZE + 4,
      GRID_SIZE * CELL_SIZE + 4
    );
    ctx.restore();

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(
          this.gridOffsetX + x * CELL_SIZE + 1,
          this.gridOffsetY + y * CELL_SIZE + 1,
          CELL_SIZE - 2,
          CELL_SIZE - 2
        );
      }
    }

    ctx.strokeStyle = 'rgba(136, 204, 255, 0.2)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(this.gridOffsetX + i * CELL_SIZE, this.gridOffsetY);
      ctx.lineTo(this.gridOffsetX + i * CELL_SIZE, this.gridOffsetY + GRID_SIZE * CELL_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(this.gridOffsetX, this.gridOffsetY + i * CELL_SIZE);
      ctx.lineTo(this.gridOffsetX + GRID_SIZE * CELL_SIZE, this.gridOffsetY + i * CELL_SIZE);
      ctx.stroke();
    }
  }

  drawPhoton(photon: Photon, time: number) {
    if (photon.opacity <= 0) return;
    const ctx = this.ctx;
    const config = COLOR_CONFIG[photon.color];
    const quantum = photon.getQuantumOffset(time);
    const effectiveScale = photon.scale * quantum.extraScale;
    const baseRadius = PHOTON_RADIUS * effectiveScale;
    const radius = Math.max(1, baseRadius);
    const effectiveAlpha = photon.opacity * quantum.extraAlpha;

    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, effectiveAlpha));
    ctx.translate(photon.x + quantum.dx, photon.y + quantum.dy);
    ctx.rotate(quantum.rotation);

    if (photon.energyLevel >= 2) {
      const haloRadius = radius * 1.6;
      ctx.save();
      ctx.rotate(photon.haloAngle);
      const haloGrad = ctx.createRadialGradient(0, 0, radius * 0.8, 0, 0, haloRadius);
      haloGrad.addColorStop(0, `rgba(${config.rgb}, 0.25)`);
      haloGrad.addColorStop(1, `rgba(${config.rgb}, 0)`);
      ctx.fillStyle = haloGrad;
      ctx.beginPath();
      ctx.arc(0, 0, haloRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const bodyGrad = ctx.createRadialGradient(
      -radius * 0.3, -radius * 0.3, 0,
      0, 0, radius
    );
    if (photon.energyLevel >= 2) {
      bodyGrad.addColorStop(0, config.glow);
      bodyGrad.addColorStop(1, config.dark);
    } else {
      bodyGrad.addColorStop(0, config.base);
      bodyGrad.addColorStop(1, config.dark);
    }
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(-radius * 0.25, -radius * 0.25, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawDragGhost(photon: Photon, dragX: number, dragY: number, time: number) {
    const ctx = this.ctx;
    const config = COLOR_CONFIG[photon.color];
    const quantum = photon.getQuantumOffset(time);
    const radius = Math.max(1, PHOTON_RADIUS * photon.scale * quantum.extraScale);

    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.translate(dragX, dragY);
    ctx.rotate(quantum.rotation);

    const ghostGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    ghostGrad.addColorStop(0, config.glow);
    ghostGrad.addColorStop(1, `rgba(${config.rgb}, 0)`);
    ctx.fillStyle = ghostGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawSuperposing(photonA: Photon, photonB: Photon, progress: number, time: number) {
    const ctx = this.ctx;
    const t = this.easeInOutCubic(progress);
    const ax = photonA.x + (photonB.x - photonA.x) * t * 0.5;
    const ay = photonA.y + (photonB.y - photonA.y) * t * 0.5;
    const bx = photonB.x + (photonA.x - photonB.x) * t * 0.5;
    const by = photonB.y + (photonA.y - photonB.y) * t * 0.5;

    const config = COLOR_CONFIG[photonA.color];
    const mergeScale = 1 + t * 0.3;
    const alphaA = 1 - t * 0.5;
    const alphaB = 1 - t;

    ctx.save();
    ctx.globalAlpha = alphaA;
    photonA.x = ax;
    photonA.y = ay;
    photonA.scale = mergeScale;
    this.drawPhoton(photonA, time);

    if (alphaB > 0.05) {
      ctx.globalAlpha = alphaB;
      photonB.x = bx;
      photonB.y = by;
      this.drawPhoton(photonB, time);
    }
    ctx.restore();

    const midX = (ax + bx) / 2;
    const midY = (ay + by) / 2;
    if (progress > 0.3) {
      const rippleProgress = (progress - 0.3) / 0.7;
      const rippleRadius = rippleProgress * CELL_SIZE * 0.8;
      const rippleAlpha = (1 - rippleProgress) * 0.4;
      ctx.save();
      ctx.strokeStyle = `rgba(${config.rgb}, ${rippleAlpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(midX, midY, rippleRadius, 0, Math.PI * 2);
      ctx.stroke();
      if (rippleProgress > 0.2) {
        const r2 = (rippleProgress - 0.2) / 0.8 * CELL_SIZE * 0.6;
        ctx.strokeStyle = `rgba(${config.rgb}, ${rippleAlpha * 0.6})`;
        ctx.beginPath();
        ctx.arc(midX, midY, r2, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawCollapsing(photon: Photon, progress: number, time: number) {
    const ctx = this.ctx;
    const config = COLOR_CONFIG[photon.color];
    const flashFreq = 20;
    const flash = Math.abs(Math.sin(progress * flashFreq * Math.PI));
    const expandScale = 1 + progress * 0.5;
    const radius = Math.max(1, PHOTON_RADIUS * photon.scale * expandScale);

    ctx.save();
    ctx.globalAlpha = (1 - progress) * 0.9;
    ctx.translate(photon.x, photon.y);

    const flashGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius);
    const mixR = Math.round(255 * flash);
    const mixG = Math.round(255 * flash);
    const mixB = Math.round(255 * flash);
    flashGrad.addColorStop(0, `rgba(${mixR}, ${mixG}, ${mixB}, 0.9)`);
    flashGrad.addColorStop(0.5, config.glow);
    flashGrad.addColorStop(1, `rgba(${config.rgb}, 0.3)`);
    ctx.fillStyle = flashGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  drawParticles(particles: BurstParticle[]) {
    const ctx = this.ctx;
    for (const p of particles) {
      if (p.life <= 0) continue;
      const alpha = Math.max(0, p.life / p.maxLife);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawRipples(ripples: Ripple[], time: number) {
    const ctx = this.ctx;
    for (const r of ripples) {
      const elapsed = time - r.startTime;
      if (elapsed < 0 || elapsed > r.duration) continue;
      const progress = elapsed / r.duration;
      const radius = progress * r.maxRadius;
      const alpha = (1 - progress) * 0.5;
      ctx.save();
      ctx.strokeStyle = r.color.replace('1)', `${alpha})`).replace('rgb', 'rgba');
      if (!r.color.includes('rgba')) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
      } else {
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = r.color;
      }
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  drawScore(score: number, displayScore: number, scoreAnimScale: number) {
    const ctx = this.ctx;
    const displayVal = Math.round(displayScore);
    ctx.save();
    const centerX = this.gridOffsetX + GRID_SIZE * CELL_SIZE / 2;
    const scoreY = this.gridOffsetY - 40;

    ctx.font = '24px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFFFFF';
    ctx.save();
    ctx.translate(centerX, scoreY);
    ctx.scale(scoreAnimScale, scoreAnimScale);
    ctx.fillText(`Score: ${displayVal}`, 0, 0);
    ctx.restore();
    ctx.restore();
  }

  drawChainCounter(chainCount: number, chainScale: number) {
    if (chainCount <= 0) return;
    const ctx = this.ctx;
    const centerX = this.gridOffsetX + GRID_SIZE * CELL_SIZE / 2;
    const chainY = this.gridOffsetY - 70;

    ctx.save();
    ctx.font = 'bold 16px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#FFEE88';
    ctx.translate(centerX, chainY);
    ctx.scale(chainScale, chainScale);
    ctx.fillText(`Chain x${chainCount}`, 0, 0);
    ctx.restore();
  }

  drawNextPreview(nextColor: PhotonColor) {
    const ctx = this.ctx;
    const config = COLOR_CONFIG[nextColor];
    const previewX = this.gridOffsetX + GRID_SIZE * CELL_SIZE / 2;
    const previewY = this.gridOffsetY + GRID_SIZE * CELL_SIZE + 40;

    ctx.save();
    ctx.font = '12px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(136, 204, 255, 0.6)';
    ctx.fillText('NEXT', previewX, previewY - 22);

    const previewSize = 20;
    const grad = ctx.createRadialGradient(
      previewX - previewSize * 0.2, previewY - previewSize * 0.2, 0,
      previewX, previewY, previewSize
    );
    grad.addColorStop(0, config.base);
    grad.addColorStop(1, config.dark);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(previewX, previewY, previewSize, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.beginPath();
    ctx.arc(previewX - previewSize * 0.2, previewY - previewSize * 0.2, previewSize * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawGameOver(score: number, time: number) {
    const ctx = this.ctx;
    ctx.save();

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, this.width, this.height);

    const panelW = 280;
    const panelH = 220;
    const panelX = (this.width - panelW) / 2;
    const panelY = (this.height - panelH) / 2;

    ctx.fillStyle = '#2A2A3A';
    ctx.strokeStyle = '#7B68EE';
    ctx.lineWidth = 2;
    this.roundRect(ctx, panelX, panelY, panelW, panelH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.font = 'bold 20px "Segoe UI", Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#7B68EE';
    ctx.fillText('GAME OVER', this.width / 2, panelY + 40);

    const gradText = ctx.createLinearGradient(
      this.width / 2 - 60, panelY + 80,
      this.width / 2 + 60, panelY + 80
    );
    const hue = (time * 60) % 360;
    gradText.addColorStop(0, `hsl(${hue}, 80%, 65%)`);
    gradText.addColorStop(0.5, `hsl(${(hue + 120) % 360}, 80%, 65%)`);
    gradText.addColorStop(1, `hsl(${(hue + 240) % 360}, 80%, 65%)`);

    ctx.font = 'bold 36px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = gradText;
    ctx.fillText(`${score}`, this.width / 2, panelY + 90);

    ctx.font = '14px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText('points', this.width / 2, panelY + 120);

    const btnW = 160;
    const btnH = 40;
    const btnX = (this.width - btnW) / 2;
    const btnY = panelY + 155;

    ctx.fillStyle = '#7B68EE';
    this.roundRect(ctx, btnX, btnY, btnW, btnH, 8);
    ctx.fill();

    ctx.font = '16px "Segoe UI", Arial, sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText('重新开始', this.width / 2, btnY + btnH / 2);

    ctx.restore();
  }

  isRestartButtonClicked(px: number, py: number): boolean {
    const panelW = 280;
    const panelH = 220;
    const panelY = (this.height - panelH) / 2;
    const btnW = 160;
    const btnH = 40;
    const btnX = (this.width - btnW) / 2;
    const btnY = panelY + 155;
    return px >= btnX && px <= btnX + btnW && py >= btnY && py <= btnY + btnH;
  }

  roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  easeInOutCubic(t: number): number {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  easeOutBack(t: number): number {
    const c1 = 1.70158;
    const c3 = c1 + 1;
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
  }

  easeOutQuad(t: number): number {
    return 1 - (1 - t) * (1 - t);
  }
}
