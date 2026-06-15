import type { GameEngine, GameStats, GameEvent } from './engine';
import { SpriteManager } from './sprites';

const TIMER_COLORS = [
  '#f87171',
  '#ef4444',
  '#dc2626',
  '#b91c1c',
  '#991b1b',
  '#7f1d1d',
];

export class UIRenderer {
  private engine: GameEngine;
  private spriteManager: SpriteManager;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private uiContainer: HTMLElement;

  private scoreEl: HTMLElement | null = null;
  private comboEl: HTMLElement | null = null;
  private timerEl: HTMLElement | null = null;
  private progressFillEl: HTMLElement | null = null;
  private fragmentTextEl: HTMLElement | null = null;
  private fragmentDisplayEl: HTMLElement | null = null;
  private startOverlay: HTMLElement | null = null;
  private endOverlay: HTMLElement | null = null;
  private startBtn: HTMLButtonElement | null = null;
  private restartBtn: HTMLButtonElement | null = null;
  private pauseBtn: HTMLButtonElement | null = null;
  private keyEls: Map<string, HTMLElement> = new Map();

  private lastFrameTime = 0;
  private fps = 60;
  private frameCount = 0;
  private lastFpsUpdate = 0;

  private logicalW = 800;
  private logicalH = 600;

  private offscreenCanvas: HTMLCanvasElement;
  private offscreenCtx: CanvasRenderingContext2D;

  private unsubscribers: Array<() => void> = [];

  constructor(
    engine: GameEngine,
    spriteManager: SpriteManager,
    canvas: HTMLCanvasElement,
    uiContainer: HTMLElement
  ) {
    this.engine = engine;
    this.spriteManager = spriteManager;
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas 2D context');
    this.ctx = ctx;

    this.offscreenCanvas = document.createElement('canvas');
    this.offscreenCanvas.width = this.logicalW;
    this.offscreenCanvas.height = this.logicalH;
    const octx = this.offscreenCanvas.getContext('2d');
    if (!octx) throw new Error('Failed to get offscreen canvas context');
    this.offscreenCtx = octx;

    this.uiContainer = uiContainer;
    this.cacheElements();
    this.bindEngineEvents();
    this.setupCanvasScaling();
    window.addEventListener('resize', this.handleResize);
    this.renderFragmentSlots();
  }

  private cacheElements(): void {
    this.scoreEl = document.getElementById('scoreValue');
    this.comboEl = document.getElementById('comboDisplay');
    this.timerEl = document.getElementById('timerValue');
    this.progressFillEl = document.getElementById('progressFill');
    this.fragmentTextEl = document.getElementById('fragmentText');
    this.fragmentDisplayEl = document.getElementById('fragmentDisplay');
    this.startOverlay = document.getElementById('startOverlay');
    this.endOverlay = document.getElementById('endOverlay');
    this.startBtn = document.getElementById('startBtn') as HTMLButtonElement;
    this.restartBtn = document.getElementById('restartBtn') as HTMLButtonElement;
    this.pauseBtn = document.getElementById('pauseBtn') as HTMLButtonElement;

    const keyNodes = this.uiContainer.querySelectorAll('[data-key]');
    keyNodes.forEach((node) => {
      const k = node.getAttribute('data-key');
      if (k) this.keyEls.set(k, node as HTMLElement);
    });
  }

  private bindEngineEvents(): void {
    this.unsubscribers.push(
      this.engine.on('scoreUpdate' as GameEvent, (total: number, delta: number) => {
        this.updateScore(total, delta);
      })
    );
    this.unsubscribers.push(
      this.engine.on('comboChange' as GameEvent, (combo: number) => {
        this.updateCombo(combo);
      })
    );
    this.unsubscribers.push(
      this.engine.on('timerUpdate' as GameEvent, (remaining: number) => {
        this.updateTimer(remaining);
      })
    );
    this.unsubscribers.push(
      this.engine.on('fragmentCollect' as GameEvent, (count: number) => {
        this.updateFragmentProgress(count);
      })
    );
    this.unsubscribers.push(
      this.engine.on('spriteSynth' as GameEvent, () => {
        this.spriteManager.startSpriteSynth(this.logicalW, this.logicalH);
      })
    );
    this.unsubscribers.push(
      this.engine.on('noteHit' as GameEvent, (info: { key: string }) => {
        this.flashKey(info.key, true);
      })
    );
    this.unsubscribers.push(
      this.engine.on('noteMiss' as GameEvent, (info: { key: string }) => {
        this.flashKey(info.key, false);
      })
    );
    this.unsubscribers.push(
      this.engine.on('gameEnd' as GameEvent, (stats: GameStats & { accuracy: number; fragmentsNeeded: number }) => {
        this.showGameEnd(stats);
      })
    );
  }

  private setupCanvasScaling(): void {
    this.handleResize();
  }

  private handleResize = (): void => {
    const wrapper = this.canvas.parentElement;
    if (!wrapper) return;
    const rect = wrapper.getBoundingClientRect();

    const scaleX = rect.width / this.logicalW;
    const scaleY = rect.height / this.logicalH;
    const scale = Math.min(scaleX, scaleY);

    const displayW = Math.round(this.logicalW * scale);
    const displayH = Math.round(this.logicalH * scale);

    this.canvas.style.width = `${displayW}px`;
    this.canvas.style.height = `${displayH}px`;
    this.canvas.style.left = `${(rect.width - displayW) / 2}px`;
    this.canvas.style.top = `${(rect.height - displayH) / 2}px`;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.logicalW * dpr);
    this.canvas.height = Math.round(this.logicalH * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  onStartClick(cb: () => void): void {
    this.startBtn?.addEventListener('click', () => {
      this.hideStartOverlay();
      cb();
    });
  }

  onRestartClick(cb: () => void): void {
    this.restartBtn?.addEventListener('click', () => {
      this.hideEndOverlay();
      cb();
    });
  }

  onPauseClick(cb: (paused: boolean) => void): void {
    this.pauseBtn?.addEventListener('click', () => {
      const p = !this.engine.isPaused();
      if (p) {
        this.engine.pause();
        if (this.pauseBtn) this.pauseBtn.textContent = '继 续';
      } else {
        this.engine.resume();
        if (this.pauseBtn) this.pauseBtn.textContent = '暂 停';
      }
      cb(p);
    });
  }

  private hideStartOverlay(): void {
    this.startOverlay?.classList.add('hidden');
  }

  private hideEndOverlay(): void {
    this.endOverlay?.classList.add('hidden');
  }

  private showEndOverlay(): void {
    this.endOverlay?.classList.remove('hidden');
  }

  private updateScore(total: number, _delta: number): void {
    if (!this.scoreEl) return;
    this.scoreEl.textContent = String(total);
    this.scoreEl.classList.remove('bump');
    void this.scoreEl.offsetWidth;
    this.scoreEl.classList.add('bump');
    setTimeout(() => {
      this.scoreEl?.classList.remove('bump');
    }, 220);
  }

  private updateCombo(combo: number): void {
    if (!this.comboEl) return;
    if (combo >= 2) {
      this.comboEl.textContent = `⚡ COMBO x${combo}`;
      this.comboEl.style.opacity = '1';
    } else {
      this.comboEl.textContent = '';
    }
  }

  private updateTimer(remaining: number): void {
    if (!this.timerEl) return;
    const seconds = Math.ceil(remaining);
    this.timerEl.textContent = String(seconds);

    const elapsed = 60 - remaining;
    const stage = Math.min(TIMER_COLORS.length - 1, Math.floor(elapsed / 10));
    this.timerEl.style.color = TIMER_COLORS[stage];
  }

  private updateFragmentProgress(count: number): void {
    const total = this.spriteManager.getTotalFragments();
    const safeCount = Math.max(0, Math.min(count, total));
    const pct = (safeCount / total) * 100;
    if (this.progressFillEl) {
      this.progressFillEl.style.width = `${pct}%`;
    }
    if (this.fragmentTextEl) {
      this.fragmentTextEl.textContent = `${safeCount} / ${total}`;
    }
    this.renderFragmentSlots();
  }

  private renderFragmentSlots(): void {
    if (!this.fragmentDisplayEl) return;
    const total = this.spriteManager.getTotalFragments();
    const collected = this.spriteManager.getCollectedCount();
    this.fragmentDisplayEl.innerHTML = '';
    for (let i = 0; i < total; i++) {
      const slot = document.createElement('div');
      slot.className = 'fragment-slot' + (i < collected ? ' filled' : '');
      this.fragmentDisplayEl.appendChild(slot);
    }
  }

  private flashKey(key: string, success: boolean): void {
    const el = this.keyEls.get(key);
    if (!el) return;
    el.classList.add('active');
    if (!success) {
      el.style.borderColor = 'rgba(248, 113, 113, 0.8)';
      el.style.boxShadow = '0 0 16px rgba(248, 113, 113, 0.6)';
    }
    setTimeout(() => {
      el.classList.remove('active');
      el.style.borderColor = '';
      el.style.boxShadow = '';
    }, 180);
  }

  private showGameEnd(stats: GameStats & { accuracy: number; fragmentsNeeded: number }): void {
    const endTitle = document.getElementById('endTitle');
    const endSubtitle = document.getElementById('endSubtitle');
    const finalScore = document.getElementById('finalScore');
    const finalAccuracy = document.getElementById('finalAccuracy');
    const finalMaxCombo = document.getElementById('finalMaxCombo');

    const spriteDone = stats.fragments >= stats.fragmentsNeeded;

    if (endTitle) {
      endTitle.textContent = spriteDone ? '精 灵 唤 醒' : '训 练 完 成';
    }
    if (endSubtitle) {
      endSubtitle.textContent = spriteDone
        ? '你的脑波已与精灵完美同步！'
        : '继续练习，提升节奏感知力和左右脑协调能力';
    }
    if (finalScore) finalScore.textContent = String(stats.score);
    if (finalAccuracy) finalAccuracy.textContent = `${stats.accuracy}%`;
    if (finalMaxCombo) finalMaxCombo.textContent = String(stats.maxCombo);

    if (this.pauseBtn) this.pauseBtn.textContent = '暂 停';
    setTimeout(() => this.showEndOverlay(), 1200);
  }

  handleKeyDown(key: string): void {
    const upper = key.toUpperCase();
    if (this.engine.getKeyAngle(upper) !== null) {
      const el = this.keyEls.get(upper);
      if (el && !el.classList.contains('active')) {
        el.classList.add('active');
      }
    }
  }

  handleKeyUp(key: string): void {
    const upper = key.toUpperCase();
    if (this.engine.getKeyAngle(upper) !== null) {
      const el = this.keyEls.get(upper);
      if (el) el.classList.remove('active');
    }
  }

  drawBackground(): void {
    const ctx = this.offscreenCtx;
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, this.logicalW, this.logicalH);

    const grad1 = ctx.createRadialGradient(
      this.logicalW * 0.3,
      this.logicalH * 0.25,
      0,
      this.logicalW * 0.3,
      this.logicalH * 0.25,
      this.logicalW * 0.4
    );
    grad1.addColorStop(0, 'rgba(99, 102, 241, 0.08)');
    grad1.addColorStop(1, 'transparent');
    ctx.fillStyle = grad1;
    ctx.fillRect(0, 0, this.logicalW, this.logicalH);

    const grad2 = ctx.createRadialGradient(
      this.logicalW * 0.7,
      this.logicalH * 0.8,
      0,
      this.logicalW * 0.7,
      this.logicalH * 0.8,
      this.logicalW * 0.4
    );
    grad2.addColorStop(0, 'rgba(168, 85, 247, 0.08)');
    grad2.addColorStop(1, 'transparent');
    ctx.fillStyle = grad2;
    ctx.fillRect(0, 0, this.logicalW, this.logicalH);

    ctx.strokeStyle = 'rgba(99, 102, 241, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= this.logicalW; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, this.logicalH);
      ctx.stroke();
    }
    for (let y = 0; y <= this.logicalH; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(this.logicalW, y);
      ctx.stroke();
    }
  }

  private gameToCanvasAngle(gameAngle: number): number {
    return ((gameAngle - 90) * Math.PI) / 180;
  }

  drawRing(): void {
    const ctx = this.offscreenCtx;
    const cx = this.logicalW / 2;
    const cy = this.logicalH / 2;

    const shake = this.engine.getShakeOffset();
    const adjustedCx = cx + shake.x;
    const adjustedCy = cy + shake.y;

    const brightness = this.engine.getGlowBrightness();

    const glowRadius = brightness > 1 ? 25 + (brightness - 1) * 60 : 20;
    ctx.save();
    ctx.shadowColor = brightness > 1 ? '#fbbf24' : '#6366f1';
    ctx.shadowBlur = glowRadius;

    const innerR = 100;
    const outerR = 130;

    const rot = this.engine.rotationAngle;

    for (let seg = 0; seg < 360; seg += 2) {
      const gameAngle1 = seg + rot;
      const gameAngle2 = seg + 2 + rot;
      const a1 = this.gameToCanvasAngle(gameAngle1);
      const a2 = this.gameToCanvasAngle(gameAngle2);

      const t1 = seg / 360;
      const t2 = (seg + 2) / 360;
      const col1 = this.interpolateColor(t1, brightness);
      const col2 = this.interpolateColor(t2, brightness);

      const midA = (a1 + a2) / 2;
      const grad = ctx.createLinearGradient(
        adjustedCx + Math.cos(midA) * innerR,
        adjustedCy + Math.sin(midA) * innerR,
        adjustedCx + Math.cos(midA) * outerR,
        adjustedCy + Math.sin(midA) * outerR
      );
      grad.addColorStop(0, col1);
      grad.addColorStop(1, col2);

      ctx.beginPath();
      ctx.arc(adjustedCx, adjustedCy, outerR, a1, a2);
      ctx.arc(adjustedCx, adjustedCy, innerR, a2, a1, true);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();
    }

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.08 * brightness})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(adjustedCx, adjustedCy, outerR + 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(adjustedCx, adjustedCy, innerR - 1, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();

    this.drawStars(adjustedCx, adjustedCy, innerR, outerR, brightness);
    this.drawPointer(adjustedCx, adjustedCy, outerR);
  }

  private interpolateColor(t: number, brightness: number): string {
    const r1 = 99, g1 = 102, b1 = 241;
    const r2 = 168, g2 = 85, b2 = 247;
    const tt = Math.sin(t * Math.PI * 2) * 0.5 + 0.5;
    const r = Math.round((r1 + (r2 - r1) * tt) * brightness);
    const g = Math.round((g1 + (g2 - g1) * tt) * brightness);
    const b = Math.round((b1 + (b2 - b1) * tt) * brightness);
    return `rgba(${Math.min(255, r)}, ${Math.min(255, g)}, ${Math.min(255, b)}, 1)`;
  }

  private drawStars(
    cx: number,
    cy: number,
    innerR: number,
    outerR: number,
    brightness: number
  ): void {
    const ctx = this.offscreenCtx;
    const midR = (innerR + outerR) / 2;
    const starSize = 16;
    const rot = this.engine.rotationAngle;

    for (let i = 0; i < 8; i++) {
      const gameAngle = i * 45 + rot;
      const canvasAngle = this.gameToCanvasAngle(gameAngle);
      const sx = cx + Math.cos(canvasAngle) * midR;
      const sy = cy + Math.sin(canvasAngle) * midR;

      const normalized = ((gameAngle % 360) + 360) % 360;
      const diff = Math.min(normalized, 360 - normalized);
      const nearTop = diff <= 15;

      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(canvasAngle + Math.PI / 2);

      if (nearTop) {
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 30 * brightness;
      } else {
        ctx.shadowColor = '#fbbf24';
        ctx.shadowBlur = 12;
      }

      ctx.fillStyle = nearTop ? '#fff9c4' : '#fbbf24';
      ctx.strokeStyle = nearTop ? '#ffffff' : '#fbbf24';
      ctx.lineWidth = nearTop ? 2 : 1.5;

      this.drawStarShape(ctx, starSize / 2);
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      if (nearTop) {
        ctx.save();
        ctx.globalAlpha = 0.3;
        ctx.beginPath();
        ctx.arc(sx, sy, starSize * 1.5, 0, Math.PI * 2);
        const glowGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, starSize * 1.5);
        glowGrad.addColorStop(0, 'rgba(251, 191, 36, 0.6)');
        glowGrad.addColorStop(1, 'rgba(251, 191, 36, 0)');
        ctx.fillStyle = glowGrad;
        ctx.fill();
        ctx.restore();
      }
    }
  }

  private drawStarShape(ctx: CanvasRenderingContext2D, outer: number): void {
    const points = 5;
    const inner = outer * 0.45;
    ctx.beginPath();
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 === 0 ? outer : inner;
      const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
      const px = Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
  }

  private drawPointer(cx: number, cy: number, outerR: number): void {
    const ctx = this.offscreenCtx;
    const pointerLen = 38;
    const tipX = cx;
    const tipY = cy - outerR - pointerLen;
    const baseY = cy - outerR - 4;
    const baseHalf = 8;

    const pulse = (Math.sin(performance.now() / 300) + 1) / 2;

    ctx.save();
    ctx.shadowColor = '#fbbf24';
    ctx.shadowBlur = 12 + pulse * 10;

    const grad = ctx.createLinearGradient(tipX, tipY, tipX, baseY);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#fbbf24');
    grad.addColorStop(1, 'rgba(251, 191, 36, 0.6)');

    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX - baseHalf, baseY);
    ctx.lineTo(tipX + baseHalf, baseY);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(251, 191, 36, 0.2)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.moveTo(tipX, baseY);
    ctx.lineTo(tipX, cy - 100);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }

  drawHitBursts(): void {
    // placeholder for future burst effects
  }

  render(): void {
    const now = performance.now();
    this.frameCount++;
    if (now - this.lastFpsUpdate >= 500) {
      this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }
    const dt = Math.min(0.05, (now - this.lastFrameTime) / 1000);
    this.lastFrameTime = now;

    this.spriteManager.update(dt);

    this.drawBackground();
    this.drawRing();
    this.drawHitBursts();

    const collected = this.spriteManager.getCollectedCount();
    if (collected < this.spriteManager.getTotalFragments()) {
      this.spriteManager.drawFallingFragments(this.offscreenCtx);
    }

    this.spriteManager.drawParticles(this.offscreenCtx);

    if (this.spriteManager.spriteCompleted) {
      this.spriteManager.drawCompletedSprite(
        this.offscreenCtx,
        this.spriteManager.synthCenter.x,
        this.spriteManager.synthCenter.y,
        this.spriteManager.synthProgress
      );
    }

    this.drawFpsCounter();

    this.ctx.clearRect(0, 0, this.logicalW, this.logicalH);
    this.ctx.drawImage(
      this.offscreenCanvas,
      0,
      0,
      this.offscreenCanvas.width,
      this.offscreenCanvas.height,
      0,
      0,
      this.logicalW,
      this.logicalH
    );
  }

  private drawFpsCounter(): void {
    const ctx = this.offscreenCtx;
    ctx.save();
    ctx.font = '11px monospace';
    ctx.fillStyle = this.fps >= 55 ? 'rgba(134, 239, 172, 0.6)' : 'rgba(248, 113, 113, 0.7)';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`FPS ${this.fps}`, this.logicalW - 12, this.logicalH - 12);
    ctx.restore();
  }

  collectFragmentVisual(index: number): void {
    this.spriteManager.collectFragment(index, this.logicalW, this.logicalH);
  }

  resetForRestart(): void {
    this.spriteManager.initFragments();
    if (this.pauseBtn) this.pauseBtn.textContent = '暂 停';
    this.updateScore(0, 0);
    this.updateCombo(0);
    this.updateTimer(60);
    this.updateFragmentProgress(0);
  }

  destroy(): void {
    window.removeEventListener('resize', this.handleResize);
    this.unsubscribers.forEach((fn) => fn());
    this.unsubscribers = [];
  }

  getLogicalSize(): { w: number; h: number } {
    return { w: this.logicalW, h: this.logicalH };
  }

  toLogicalCoords(clientX: number, clientY: number): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * this.logicalW;
    const y = ((clientY - rect.top) / rect.height) * this.logicalH;
    return { x, y };
  }
}
