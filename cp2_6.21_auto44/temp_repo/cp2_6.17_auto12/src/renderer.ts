import { Photon, PhotonColor, COLOR_CONFIG, PhotonState, BurstParticle, Ripple } from './photon';
import { GRID_SIZE, CELL_SIZE, PHOTON_RADIUS } from './grid';
import { ChainPositionInfo } from './chainResolver';

export interface HaloResidue {
  x: number;
  y: number;
  color: PhotonColor;
  startTime: number;
  duration: number;
  maxRadius: number;
}

export interface FullscreenPulse {
  startTime: number;
  duration: number;
}

export class Renderer {
  ctx: CanvasRenderingContext2D;
  width: number = 0;
  height: number = 0;
  gridOffsetX: number = 0;
  gridOffsetY: number = 0;
  stars: { x: number; y: number; size: number; speed: number; brightness: number }[] = [];
  haloResidues: HaloResidue[] = [];
  fullscreenPulses: FullscreenPulse[] = [];
  chainPulseStart: number = 0;
  chainPulseDuration: number = 0.3;
  chainPulseTriggered: boolean = false;

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

  drawChainCounter(chainCount: number, currentTime: number) {
    if (chainCount <= 0) return;
    const ctx = this.ctx;
    const centerX = this.gridOffsetX + GRID_SIZE * CELL_SIZE / 2;
    const chainY = this.gridOffsetY - 100;

    let scale = 1;
    if (this.chainPulseTriggered) {
      const elapsed = currentTime - this.chainPulseStart;
      if (elapsed >= 0 && elapsed <= this.chainPulseDuration) {
        const t = elapsed / this.chainPulseDuration;
        scale = this.pulseEasing(t);
      } else {
        this.chainPulseTriggered = false;
        scale = 1;
      }
    }

    const outerGrad = ctx.createRadialGradient(centerX, chainY, 0, centerX, chainY, 70);
    outerGrad.addColorStop(0, 'rgba(74, 144, 217, 0.35)');
    outerGrad.addColorStop(1, 'rgba(74, 144, 217, 0)');
    ctx.fillStyle = outerGrad;
    ctx.beginPath();
    ctx.arc(centerX, chainY, 70, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(centerX, chainY);
    ctx.scale(scale, scale);

    ctx.font = 'bold 28px "Courier New", "Consolas", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.fillStyle = 'rgba(123, 104, 238, 0.35)';
    ctx.fillText(`CHAIN  x${chainCount}`, 2, 2);

    const grad = ctx.createLinearGradient(-90, 0, 90, 0);
    grad.addColorStop(0, '#88CCFF');
    grad.addColorStop(0.5, '#FFFFFF');
    grad.addColorStop(1, '#FFEE88');
    ctx.fillStyle = grad;
    ctx.fillText(`CHAIN  x${chainCount}`, 0, 0);

    ctx.font = 'bold 34px "Courier New", monospace';
    ctx.fillStyle = 'rgba(255, 238, 136, 0.15)';
    ctx.fillText(`${chainCount}`, 0, 0);

    ctx.restore();

    if (chainCount >= 3) {
      ctx.save();
      ctx.font = '11px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(136, 204, 255, 0.7)';
      const flash = 0.5 + Math.abs(Math.sin(currentTime * 6)) * 0.5;
      ctx.globalAlpha = flash;
      ctx.fillText('[ QUANTUM RESONANCE ACTIVE ]', centerX, chainY + 30);
      ctx.restore();
    }
  }

  triggerChainPulse(currentTime: number) {
    this.chainPulseStart = currentTime;
    this.chainPulseTriggered = true;
  }

  pulseEasing(t: number): number {
    if (t < 0.2) {
      return 1 + (t / 0.2) * 0.3;
    } else {
      const rt = (t - 0.2) / 0.8;
      return 1.3 - 0.3 * this.easeOutBack(rt);
    }
  }

  addHaloResidue(x: number, y: number, color: PhotonColor, currentTime: number) {
    this.haloResidues.push({
      x,
      y,
      color,
      startTime: currentTime,
      duration: 0.5,
      maxRadius: PHOTON_RADIUS * 2.2,
    });
  }

  drawHaloResidues(currentTime: number) {
    const ctx = this.ctx;
    this.haloResidues = this.haloResidues.filter(h => currentTime - h.startTime < h.duration);
    for (const h of this.haloResidues) {
      const elapsed = currentTime - h.startTime;
      const t = elapsed / h.duration;
      const cfg = COLOR_CONFIG[h.color];
      const scale = 1 - t * 0.55;
      const alpha = (1 - t) * 0.65;
      const radius = h.maxRadius * scale;

      const grad = ctx.createRadialGradient(h.x, h.y, 0, h.x, h.y, radius);
      grad.addColorStop(0, `rgba(${cfg.rgb}, ${alpha})`);
      grad.addColorStop(0.4, `rgba(${cfg.rgb}, ${alpha * 0.5})`);
      grad.addColorStop(1, `rgba(${cfg.rgb}, 0)`);

      ctx.save();
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(h.x, h.y, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = `rgba(${cfg.rgb}, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(h.x, h.y, radius * 0.7, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  addFullscreenPulse(currentTime: number) {
    this.fullscreenPulses.push({
      startTime: currentTime,
      duration: 0.8,
    });
  }

  drawFullscreenPulses(currentTime: number) {
    const ctx = this.ctx;
    this.fullscreenPulses = this.fullscreenPulses.filter(p => currentTime - p.startTime < p.duration);
    if (this.fullscreenPulses.length === 0) return;

    const cx = this.width / 2;
    const cy = this.height / 2;
    const maxR = Math.hypot(this.width, this.height) * 0.7;

    for (const pulse of this.fullscreenPulses) {
      const elapsed = currentTime - pulse.startTime;
      const t = elapsed / pulse.duration;
      const alpha = (1 - t) * 0.6;
      const radius = t * maxR;

      ctx.save();
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
      grad.addColorStop(0, 'rgba(74, 144, 217, 0)');
      grad.addColorStop(Math.max(0, t - 0.15), 'rgba(74, 144, 217, 0)');
      grad.addColorStop(t, `rgba(123, 104, 238, ${alpha * 0.6})`);
      grad.addColorStop(1, `rgba(74, 144, 217, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);

      ctx.strokeStyle = `rgba(136, 204, 255, ${alpha})`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, radius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = `rgba(123, 104, 238, ${alpha * 0.5})`;
      ctx.lineWidth = 1.5;
      if (t > 0.1) {
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 0.85, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  applyChainVisualEffects(info: ChainPositionInfo, currentTime: number) {
    for (const p of info.positions) {
      if (p.pixelX !== undefined && p.pixelY !== undefined) {
        this.addHaloResidue(p.pixelX, p.pixelY, p.color, currentTime);
      }
    }
    if (info.chainLevel >= 3) {
      this.addFullscreenPulse(currentTime);
    }
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

  drawReturningPhoton(
    photon: Photon,
    startX: number,
    startY: number,
    endX: number,
    endY: number,
    progress: number,
    time: number
  ) {
    const e = this.easeOutBack(progress);
    const prevX = photon.x;
    const prevY = photon.y;
    photon.x = startX + (endX - startX) * e;
    photon.y = startY + (endY - startY) * e;
    this.drawPhoton(photon, time);
    photon.x = prevX;
    photon.y = prevY;
  }

  drawBurstParticles(particles: BurstParticle[]) {
    this.drawParticles(particles);
  }

  drawSuperposeMerge(
    photonA: Photon,
    photonB: Photon,
    origAX: number,
    origAY: number,
    origBX: number,
    origBY: number,
    progress: number,
    time: number
  ) {
    const ctx = this.ctx;
    const dur = 0.6;
    const t = this.easeInOutCubic(progress);
    const ax = origAX + (origBX - origAX) * t * 0.5;
    const ay = origAY + (origBY - origAY) * t * 0.5;
    const bx = origBX + (origAX - origBX) * t * 0.5;
    const by = origBY + (origAY - origBY) * t * 0.5;
    const config = COLOR_CONFIG[photonA.color];

    const prevAX = photonA.x;
    const prevAY = photonA.y;
    const prevAS = photonA.scale;
    const prevAO = photonA.opacity;
    photonA.x = ax;
    photonA.y = ay;
    photonA.scale = 1 + t * 0.2;
    this.drawPhoton(photonA, time);
    photonA.x = prevAX;
    photonA.y = prevAY;
    photonA.scale = prevAS;
    photonA.opacity = prevAO;

    if (t < 0.95) {
      const prevBX = photonB.x;
      const prevBY = photonB.y;
      const prevBS = photonB.scale;
      const prevBO = photonB.opacity;
      photonB.x = bx;
      photonB.y = by;
      photonB.opacity = 1 - t;
      this.drawPhoton(photonB, time);
      photonB.x = prevBX;
      photonB.y = prevBY;
      photonB.scale = prevBS;
      photonB.opacity = prevBO;
    }

    if (progress > 0.25) {
      const rp = (progress - 0.25) / 0.75;
      const midX = (origAX + origBX) / 2;
      const midY = (origAY + origBY) / 2;
      const alpha = (1 - rp) * 0.5;
      ctx.save();
      ctx.strokeStyle = `rgba(${config.rgb}, ${alpha})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(midX, midY, rp * CELL_SIZE * 0.9, 0, Math.PI * 2);
      ctx.stroke();
      if (rp > 0.3) {
        const alpha2 = (1 - rp) * 0.35;
        ctx.strokeStyle = `rgba(${config.rgb}, ${alpha2})`;
        ctx.beginPath();
        ctx.arc(midX, midY, (rp - 0.3) * CELL_SIZE * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  drawCollapseBurst(
    photon: Photon,
    progress: number,
    time: number,
    particles: BurstParticle[]
  ) {
    const ctx = this.ctx;
    const config = COLOR_CONFIG[photon.color];
    const flash = Math.abs(Math.sin(progress * 20 * Math.PI));
    const radius = PHOTON_RADIUS * (photon.scale || 1) * (1 + progress * 0.5);

    const prevO = photon.opacity;
    const prevS = photon.scale;
    photon.opacity = 0.4 + flash * 0.6;
    photon.scale = (photon.scale || 1) * (1 + progress * 0.3) * (1 + flash * 0.1);
    this.drawPhoton(photon, time);
    photon.opacity = prevO;
    photon.scale = prevS;

    ctx.save();
    ctx.globalAlpha = flash * (1 - progress) * 0.6;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(photon.x, photon.y, radius * 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    if (progress >= 0.8 && particles.length === 0) {
      const count = 8 + Math.floor(Math.random() * 5);
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.4;
        const speed = 80 + Math.random() * 120;
        particles.push({
          x: photon.x,
          y: photon.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0.6 + Math.random() * 0.4,
          maxLife: 0.6 + Math.random() * 0.4,
          color: Math.random() > 0.5 ? config.base : config.glow,
          size: 2 + Math.random() * 3,
        });
      }
    }
  }

  drawDragPhoton(
    photon: Photon,
    dragX: number,
    dragY: number,
    ghostX: number,
    ghostY: number,
    time: number
  ) {
    const ctx = this.ctx;
    const config = COLOR_CONFIG[photon.color];
    const quantum = photon.getQuantumOffset(time);
    const radius = Math.max(1, PHOTON_RADIUS * photon.scale * quantum.extraScale);

    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.translate(ghostX + quantum.dx, ghostY + quantum.dy);
    const ghostGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, radius * 1.5);
    ghostGrad.addColorStop(0, `rgba(${config.rgb}, 0.7)`);
    ghostGrad.addColorStop(1, `rgba(${config.rgb}, 0)`);
    ctx.fillStyle = ghostGrad;
    ctx.beginPath();
    ctx.arc(0, 0, radius * 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    const prevX = photon.x;
    const prevY = photon.y;
    photon.x = dragX;
    photon.y = dragY;
    this.drawPhoton(photon, time);
    photon.x = prevX;
    photon.y = prevY;
  }
}
