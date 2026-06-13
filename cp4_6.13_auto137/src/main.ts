import { GameManager, AchievementLevel } from './gameManager';
import { Bubble, COLOR_MAP } from './bubble';
import { ParticleSystem } from './particleSystem';
import { EffectsManager } from './effects';
import { easeOutQuad } from './utils';

interface UIState {
  hoveredBubble: Bubble | null;
  buttonHovered: boolean;
  buttonPressed: boolean;
}

class GameApp {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private uiCanvas: HTMLCanvasElement;
  private uiCtx: CanvasRenderingContext2D;

  private gameManager: GameManager;
  private particleSystem: ParticleSystem;
  private effectsManager: EffectsManager;

  private lastTime: number = 0;
  private animationId: number = 0;
  private running: boolean = false;

  private uiState: UIState = {
    hoveredBubble: null,
    buttonHovered: false,
    buttonPressed: false
  };

  private buttonBounds: { x: number; y: number; w: number; h: number } = { x: 0, y: 0, w: 200, h: 60 };

  constructor() {
    this.canvas = document.getElementById('game') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;

    this.uiCanvas = document.createElement('canvas');
    this.uiCanvas.width = this.canvas.width;
    this.uiCanvas.height = this.canvas.height;
    this.uiCtx = this.uiCanvas.getContext('2d')!;

    this.gameManager = GameManager.getInstance();
    this.gameManager.init(this.canvas.width, this.canvas.height);

    this.particleSystem = new ParticleSystem(this.ctx);
    this.effectsManager = new EffectsManager(this.canvas);

    this.bindEvents();
  }

  private bindEvents(): void {
    const rect = () => this.canvas.getBoundingClientRect();

    this.canvas.addEventListener('mousemove', (e) => {
      const r = rect();
      const x = (e.clientX - r.left) * (this.canvas.width / r.width);
      const y = (e.clientY - r.top) * (this.canvas.height / r.height);
      this.handleMouseMove(x, y);
    });

    this.canvas.addEventListener('click', (e) => {
      const r = rect();
      const x = (e.clientX - r.left) * (this.canvas.width / r.width);
      const y = (e.clientY - r.top) * (this.canvas.height / r.height);
      this.handleClick(x, y);
    });

    this.canvas.addEventListener('mousedown', (e) => {
      const r = rect();
      const x = (e.clientX - r.left) * (this.canvas.width / r.width);
      const y = (e.clientY - r.top) * (this.canvas.height / r.height);
      if (this.gameManager.getState() === 'ended' && this.isPointInButton(x, y)) {
        this.uiState.buttonPressed = true;
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.uiState.buttonPressed = false;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.uiState.hoveredBubble = null;
      this.uiState.buttonHovered = false;
      this.uiState.buttonPressed = false;
      this.canvas.classList.remove('clickable');
    });
  }

  private handleMouseMove(x: number, y: number): void {
    const state = this.gameManager.getState();

    if (state === 'playing') {
      let found: Bubble | null = null;
      const bubbles = this.gameManager.getBubbles();
      for (let i = bubbles.length - 1; i >= 0; i--) {
        const b = bubbles[i];
        if (b.isClickable() && b.containsPoint(x, y)) {
          found = b;
          break;
        }
      }
      this.uiState.hoveredBubble = found;
      if (found) {
        this.canvas.classList.add('clickable');
      } else {
        this.canvas.classList.remove('clickable');
      }
    } else if (state === 'ended') {
      this.uiState.buttonHovered = this.isPointInButton(x, y);
      if (this.uiState.buttonHovered) {
        this.canvas.classList.add('clickable');
      } else {
        this.canvas.classList.remove('clickable');
      }
    } else if (state === 'waiting') {
      this.canvas.classList.remove('clickable');
    }
  }

  private handleClick(x: number, y: number): void {
    const state = this.gameManager.getState();

    if (state === 'waiting') {
      this.gameManager.start();
      return;
    }

    if (state === 'ended') {
      if (this.isPointInButton(x, y)) {
        this.restart();
      }
      return;
    }

    if (state === 'playing') {
      const result = this.gameManager.handleClick(x, y);

      if (result.hit && result.bubble) {
        if (result.shouldFlashRed) {
          this.effectsManager.addFlash('#ff3333', 350, 0.45);
        }
        
        if (result.shouldBurst) {
          this.effectsManager.addBurst('#ffffff', 500);
          this.gameManager.fullScreenBurst();
        }
        
        if (result.isBomb) {
          this.particleSystem.createBubbleBurst(result.bubble.x, result.bubble.y, '#ff4444', 20);
          if (result.scoreGained < 0) {
            this.particleSystem.createScorePopup(result.bubble.x, result.bubble.y - 20, result.scoreGained, '#ff6666');
          }
        } else if (result.isCorrect) {
          const stats = this.gameManager.getStats();
          const color = COLOR_MAP[stats.targetColor] || COLOR_MAP[result.bubble.color];
          this.particleSystem.createBubbleBurst(result.bubble.x, result.bubble.y, color, 18);
          
          if (result.scoreGained > 0) {
            this.particleSystem.createScorePopup(result.bubble.x, result.bubble.y - 20, result.scoreGained, '#ffffff');
          }
          
          if (stats.combo >= 3) {
            this.particleSystem.createComboEffect(result.bubble.x, result.bubble.y, stats.combo);
          }
          
          if (stats.combo === 6 || stats.combo === 11) {
            this.effectsManager.addGlow('#ffd700', 1200, 0.25);
          }
        } else {
          this.particleSystem.createBubbleBurst(result.bubble.x, result.bubble.y, '#888888', 8);
        }
      }
    }
  }

  private isPointInButton(x: number, y: number): boolean {
    const { x: bx, y: by, w, h } = this.buttonBounds;
    return x >= bx && x <= bx + w && y >= by && y <= by + h;
  }

  private restart(): void {
    this.gameManager.reset();
    this.particleSystem.clear();
    this.effectsManager.clear();
    this.gameManager.start();
  }

  start(): void {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.gameManager.start();
    this.loop();
  }

  private loop(): void {
    if (!this.running) return;

    const now = performance.now();
    const deltaTime = Math.min(now - this.lastTime, 50);
    this.lastTime = now;

    this.update(now, deltaTime);
    this.render();

    this.animationId = requestAnimationFrame(() => this.loop());
  }

  private update(currentTime: number, deltaTime: number): void {
    this.gameManager.update(currentTime, deltaTime);
    this.particleSystem.update(deltaTime);
    this.effectsManager.update();

    const bubbles = this.gameManager.getBubbles();
    for (const b of bubbles) {
      if (b.shouldEmitTrail(currentTime, 25)) {
        const pos = b.getTrailPosition();
        const color = COLOR_MAP[b.color];
        this.particleSystem.createTrailParticle(pos.x, pos.y, color);
      }
    }

    if (this.gameManager.hasSpecialBubble()) {
      if (Math.random() < 0.02) {
        const glowColors = ['#ff66ff', '#66ffff', '#ffff66', '#ff6666'];
        this.effectsManager.addGlow(glowColors[Math.floor(Math.random() * glowColors.length)], 800, 0.1);
      }
    }
  }

  private render(): void {
    const ctx = this.ctx;
    const { width, height } = this.canvas;

    ctx.clearRect(0, 0, width, height);
    this.drawBackground();

    const bubbles = this.gameManager.getBubbles();
    for (const b of bubbles) {
      b.render(ctx);
    }

    this.particleSystem.render();
    this.effectsManager.render();

    this.drawUI();
    ctx.drawImage(this.uiCanvas, 0, 0);
  }

  private drawBackground(): void {
    const { width, height } = this.canvas;
    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0a2e');
    gradient.addColorStop(0.5, '#1a0a3e');
    gradient.addColorStop(1, '#0d1a3d');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);

    this.ctx.save();
    this.ctx.globalAlpha = 0.08;
    for (let i = 0; i < 40; i++) {
      const x = (i * 73 + (performance.now() * 0.01) % width) % width;
      const y = (i * 41) % height;
      const r = 1 + (i % 3);
      this.ctx.fillStyle = '#ffffff';
      this.ctx.beginPath();
      this.ctx.arc(x, y, r, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.restore();
  }

  private drawUI(): void {
    const ctx = this.uiCtx;
    const { width } = this.uiCanvas;
    ctx.clearRect(0, 0, width, this.uiCanvas.height);

    const state = this.gameManager.getState();
    const stats = this.gameManager.getStats();

    if (state === 'waiting') {
      this.drawStartScreen();
      return;
    }

    if (state === 'ended') {
      this.drawEndScreen();
      return;
    }

    this.drawTopHUD(stats);
    this.drawTargetIndicator(stats);
  }

  private drawTopHUD(stats: ReturnType<GameManager['getStats']>): void {
    const ctx = this.uiCtx;
    ctx.save();

    ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.textBaseline = 'top';

    ctx.textAlign = 'left';
    this.drawShadowText(ctx, `得分: ${stats.score}`, 20, 18, '#ffffff');

    ctx.textAlign = 'center';
    const timeStr = `${Math.ceil(stats.timeRemaining)}s`;
    const timeColor = stats.timeRemaining <= 10 ? '#ff6666' : '#ffffff';
    this.drawShadowText(ctx, `时间: ${timeStr}`, this.uiCanvas.width / 2, 18, timeColor);

    ctx.textAlign = 'right';
    let comboText = `连击: ${stats.combo}`;
    const mult = this.gameManager.getComboMultiplier();
    if (mult > 1) {
      comboText += ` (x${mult})`;
    }
    this.drawShadowText(ctx, comboText, this.uiCanvas.width - 20, 18, '#ffffff');

    ctx.textAlign = 'center';
    this.drawShadowText(ctx, `Lv.${stats.level}`, this.uiCanvas.width / 2, 48, '#ffd700', 16);

    ctx.restore();
  }

  private drawTargetIndicator(stats: ReturnType<GameManager['getStats']>): void {
    const ctx = this.uiCtx;
    const color = COLOR_MAP[stats.targetColor];
    const cx = this.uiCanvas.width / 2;
    const cy = 95;
    const r = 20;

    ctx.save();
    const pulse = 1 + Math.sin(performance.now() * 0.005) * 0.08;

    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 2 * pulse);
    gradient.addColorStop(0, color);
    gradient.addColorStop(0.5, this.hexToRgba(color, 0.3));
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(cx, cy, r * 2 * pulse, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = color;
    ctx.shadowColor = color;
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(cx, cy, r * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    this.drawShadowText(ctx, '目标', cx, cy, '#ffffff', 13);

    ctx.restore();
  }

  private drawStartScreen(): void {
    const ctx = this.uiCtx;
    const { width, height } = this.uiCanvas;

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const pulse = 1 + Math.sin(performance.now() * 0.003) * 0.05;
    ctx.save();
    ctx.translate(width / 2, height / 2 - 60);
    ctx.scale(pulse, pulse);
    ctx.font = 'bold 52px "Segoe UI", sans-serif';
    this.drawShadowText(ctx, '梦幻泡泡爆破', 0, 0, '#ffffff');
    ctx.restore();

    ctx.font = '20px "Segoe UI", sans-serif';
    this.drawShadowText(ctx, '点击匹配目标颜色的泡泡获得分数', width / 2, height / 2 + 10, '#dddddd');
    this.drawShadowText(ctx, '90秒内尽可能获得高分！', width / 2, height / 2 + 45, '#dddddd');

    const tipY = height / 2 + 95;
    ctx.font = '14px "Segoe UI", sans-serif';
    this.drawShadowText(ctx, '连击 >5 次 x1.5  |  连击 >10 次 x2', width / 2, tipY, '#ffd700');
    this.drawShadowText(ctx, '点击任意位置开始游戏', width / 2, tipY + 35, '#aabbff');

    ctx.restore();
  }

  private drawEndScreen(): void {
    const ctx = this.uiCtx;
    const { width, height } = this.uiCanvas;
    const stats = this.gameManager.getStats();

    ctx.save();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(0, 0, width, height);

    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    ctx.font = 'bold 44px "Segoe UI", sans-serif';
    this.drawShadowText(ctx, '游戏结束', width / 2, 90, '#ffffff');

    this.drawBadge(width / 2, 220, stats.achievement ?? 'bronze');

    ctx.font = 'bold 28px "Segoe UI", sans-serif';
    this.drawShadowText(ctx, `最终得分: ${stats.score}`, width / 2, 350, '#ffd700');

    ctx.font = '20px "Segoe UI", sans-serif';
    this.drawShadowText(ctx, `最高连击: ${stats.maxCombo}  |  通关级别: Lv.${stats.level}`, width / 2, 395, '#dddddd');

    const btnW = 200;
    const btnH = 60;
    const btnX = (width - btnW) / 2;
    const btnY = 450;
    this.buttonBounds = { x: btnX, y: btnY, w: btnW, h: btnH };
    this.drawButton(btnX, btnY, btnW, btnH, '再来一局');

    ctx.restore();
  }

  private drawBadge(cx: number, cy: number, level: AchievementLevel): void {
    const ctx = this.uiCtx;
    const colors: Record<AchievementLevel, { outer: string; inner: string; text: string; label: string }> = {
      bronze: { outer: '#cd7f32', inner: '#e8a962', text: '#ffffff', label: '青铜' },
      silver: { outer: '#c0c0c0', inner: '#e8e8e8', text: '#333333', label: '白银' },
      gold: { outer: '#ffd700', inner: '#ffec8b', text: '#8b4513', label: '黄金' },
      diamond: { outer: '#b9f2ff', inner: '#e0ffff', text: '#1e90ff', label: '钻石' }
    };

    const c = colors[level];
    const radius = 70;
    const pulse = 1 + Math.sin(performance.now() * 0.004) * 0.04;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);

    for (let i = 3; i >= 1; i--) {
      ctx.globalAlpha = 0.15 * i;
      ctx.fillStyle = c.outer;
      ctx.shadowColor = c.outer;
      ctx.shadowBlur = 25 * i;
      ctx.beginPath();
      ctx.arc(0, 0, radius + i * 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 30;

    const gradient = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, 0, 0, 0, radius);
    gradient.addColorStop(0, c.inner);
    gradient.addColorStop(1, c.outer);
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = c.text;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, radius - 5, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    ctx.fillStyle = c.text;
    ctx.font = 'bold 34px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.3)';
    ctx.shadowBlur = 4;
    ctx.fillText(c.label, 0, -5);

    ctx.font = '13px "Segoe UI", sans-serif';
    ctx.fillText('ACHIEVEMENT', 0, 28);

    ctx.restore();
  }

  private drawButton(x: number, y: number, w: number, h: number, text: string): void {
    const ctx = this.uiCtx;
    const t = performance.now() * 0.003;
    const breathe = 0.5 + Math.sin(t) * 0.5;
    const glowIntensity = easeOutQuad(breathe);

    const hovered = this.uiState.buttonHovered;
    const pressed = this.uiState.buttonPressed;
    const scale = pressed ? 0.96 : hovered ? 1.04 : 1;

    const cx = x + w / 2;
    const cy = y + h / 2;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(scale, scale);
    ctx.translate(-cx, -cy);

    const glowRadius = 20 + glowIntensity * 20;
    const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius + w / 2);
    gradient.addColorStop(0, `rgba(168, 85, 247, ${0.4 + glowIntensity * 0.3})`);
    gradient.addColorStop(0.6, `rgba(168, 85, 247, ${0.15 + glowIntensity * 0.1})`);
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.roundRect(x - glowRadius, y - glowRadius, w + glowRadius * 2, h + glowRadius * 2, 18);
    ctx.fill();

    const btnGradient = ctx.createLinearGradient(x, y, x, y + h);
    if (hovered) {
      btnGradient.addColorStop(0, '#a855f7');
      btnGradient.addColorStop(1, '#7c3aed');
    } else {
      btnGradient.addColorStop(0, '#8b5cf6');
      btnGradient.addColorStop(1, '#6d28d9');
    }

    ctx.fillStyle = btnGradient;
    ctx.shadowColor = '#a855f7';
    ctx.shadowBlur = 15 + glowIntensity * 15;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 14);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = `rgba(255, 255, 255, ${0.3 + glowIntensity * 0.4})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 14);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px "Segoe UI", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(0,0,0,0.4)';
    ctx.shadowBlur = 4;
    ctx.fillText(text, cx, cy);

    ctx.restore();
  }

  private drawShadowText(
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    color: string,
    size?: number
  ): void {
    ctx.save();
    if (size) {
      ctx.font = ctx.font.replace(/\d+px/, `${size}px`);
    }
    ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
    ctx.shadowBlur = 6;
    ctx.shadowOffsetX = 1;
    ctx.shadowOffsetY = 1;
    ctx.fillStyle = color;
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  private hexToRgba(hex: string, alpha: number): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(255, 255, 255, ${alpha})`;
    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  stop(): void {
    this.running = false;
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', () => {
    const app = new GameApp();
    app.start();
  });
}

export { GameApp };
