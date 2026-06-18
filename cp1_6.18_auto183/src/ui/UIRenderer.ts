import {
  GameState,
  CollectedElements,
  PortalState,
  ELEMENT_COLORS,
  HUD_HEIGHT,
  CANVAS_WIDTH,
  CANVAS_HEIGHT
} from '../types';
import { drawRoundRect } from '../utils/CanvasUtils';

export class UIRenderer {
  private gameState: GameState = {
    score: 0,
    level: 1,
    combo: 0,
    comboMultiplier: 1,
    isFailed: false,
    failFlashTime: 0
  };
  private cache: CollectedElements = {
    fire: 0,
    water: 0,
    wind: 0,
    earth: 0,
    shadow: 0
  };
  private portalState: PortalState = {
    isActive: false,
    activationProgress: 0,
    currentLayer: 0,
    totalLayers: 3,
    layerAnimProgress: 0,
    isFlashing: false
  };
  private cacheLimit: number = 5;
  private displayScore: number = 0;

  updateGameState(state: GameState): void {
    this.gameState = { ...state };
  }

  updateCache(cache: CollectedElements, limit: number): void {
    this.cache = { ...cache };
    this.cacheLimit = limit;
  }

  updatePortalState(state: PortalState): void {
    this.portalState = { ...state };
  }

  update(deltaTime: number): void {
    const diff = this.gameState.score - this.displayScore;
    if (Math.abs(diff) > 0.5) {
      this.displayScore += diff * Math.min(1, deltaTime / 150);
    } else {
      this.displayScore = this.gameState.score;
    }

    if (this.gameState.isFailed) {
      this.gameState.failFlashTime -= deltaTime;
      if (this.gameState.failFlashTime <= 0) {
        this.gameState.isFailed = false;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, currentTime: number): void {
    this.renderBackground(ctx);
    this.renderHUD(ctx);
    this.renderChargeProgress(ctx);
    this.renderComboDisplay(ctx, currentTime);
    this.renderFailFlash(ctx, currentTime);
    this.renderVignette(ctx);
  }

  private renderBackground(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#0F0F1A';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, 100,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.8
    );
    gradient.addColorStop(0, 'rgba(50, 50, 100, 0.08)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private renderHUD(ctx: CanvasRenderingContext2D): void {
    ctx.fillStyle = '#1A1A2E';
    ctx.fillRect(0, 0, CANVAS_WIDTH, HUD_HEIGHT);

    ctx.fillStyle = 'rgba(78, 205, 196, 0.1)';
    ctx.fillRect(0, HUD_HEIGHT - 1, CANVAS_WIDTH, 1);

    ctx.font = '18px monospace';
    ctx.fillStyle = '#F5F5F5';
    ctx.textBaseline = 'middle';

    const scoreText = `分数: ${Math.floor(this.displayScore)}`;
    ctx.fillText(scoreText, 20, HUD_HEIGHT / 2);

    const levelText = `关卡: ${this.gameState.level}`;
    const levelMetrics = ctx.measureText(levelText);
    ctx.fillText(levelText, 20 + ctx.measureText(scoreText).width + 40, HUD_HEIGHT / 2);

    this.renderElementCache(ctx, 20 + ctx.measureText(scoreText).width + 40 + levelMetrics.width + 40);
  }

  private renderElementCache(ctx: CanvasRenderingContext2D, startX: number): void {
    const types: ('fire' | 'water' | 'wind' | 'earth')[] = ['fire', 'water', 'wind', 'earth'];
    const boxSize = 16;
    const gap = 12;
    let x = startX;
    const y = HUD_HEIGHT / 2;

    ctx.font = '14px monospace';
    ctx.fillStyle = '#F5F5F5';
    ctx.textBaseline = 'middle';
    ctx.fillText('缓存:', x, y);
    x += 50;

    for (const type of types) {
      drawRoundRect(ctx, x, y - boxSize / 2, boxSize, boxSize, 4);
      ctx.fillStyle = ELEMENT_COLORS[type];
      ctx.fill();

      const count = Math.min(this.cache[type], this.cacheLimit);
      ctx.fillStyle = count >= this.cacheLimit ? '#FF6B6B' : '#F5F5F5';
      ctx.font = '14px monospace';
      ctx.fillText(`${count}/${this.cacheLimit}`, x + boxSize + 4, y);

      x += boxSize + 40 + gap;
    }
  }

  private renderChargeProgress(ctx: CanvasRenderingContext2D): void {
    if (this.portalState.activationProgress <= 0 || this.portalState.isActive) return;

    const barWidth = 200;
    const barHeight = 8;
    const x = CANVAS_WIDTH / 2 - barWidth / 2;
    const y = HUD_HEIGHT + 30;

    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    drawRoundRect(ctx, x, y, barWidth, barHeight, 4);
    ctx.fill();

    const progress = this.portalState.activationProgress;
    const gradient = ctx.createLinearGradient(x, y, x + barWidth, y);
    gradient.addColorStop(0, '#4ECDC4');
    gradient.addColorStop(0.5, '#95E1D3');
    gradient.addColorStop(1, '#FFD700');

    ctx.fillStyle = gradient;
    drawRoundRect(ctx, x, y, barWidth * progress, barHeight, 4);
    ctx.fill();

    ctx.font = '12px monospace';
    ctx.fillStyle = '#F5F5F5';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText('充能中...', CANVAS_WIDTH / 2, y - 4);
    ctx.textAlign = 'left';
  }

  private renderComboDisplay(ctx: CanvasRenderingContext2D, currentTime: number): void {
    if (this.gameState.combo < 2) return;

    const pulse = 1 + 0.1 * Math.sin(currentTime * 0.01);
    const fontSize = 32 * pulse;

    ctx.save();
    ctx.font = `bold ${fontSize}px monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const text = `连击 x${this.gameState.comboMultiplier}`;
    const textX = CANVAS_WIDTH / 2;
    const textY = CANVAS_HEIGHT - 80;

    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 20;
    ctx.fillStyle = '#FFD700';
    ctx.fillText(text, textX, textY);

    ctx.shadowBlur = 0;
    ctx.strokeStyle = '#FF6B35';
    ctx.lineWidth = 2;
    ctx.strokeText(text, textX, textY);

    ctx.restore();
  }

  private renderFailFlash(ctx: CanvasRenderingContext2D, currentTime: number): void {
    if (!this.gameState.isFailed) return;

    const alpha = Math.min(1, this.gameState.failFlashTime / 300) * 0.4;
    ctx.fillStyle = `rgba(255, 50, 50, ${alpha})`;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private renderVignette(ctx: CanvasRenderingContext2D): void {
    const gradient = ctx.createRadialGradient(
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.3,
      CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2, CANVAS_HEIGHT * 0.8
    );
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }
}
