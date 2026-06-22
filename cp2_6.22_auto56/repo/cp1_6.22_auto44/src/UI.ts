import { GameState, COLORS, CANVAS_WIDTH, CANVAS_HEIGHT } from './types';

export interface UIState {
  score: number;
  health: number;
  maxHealth: number;
  wave: number;
  finalScore: number;
  finalWave: number;
}

export interface UICallbacks {
  onStart: () => void;
  onRestart: () => void;
}

export class UI {
  private callbacks: UICallbacks;
  private breathTime: number = 0;
  private pulseTime: number = 0;
  private hoverRestart: boolean = false;
  private mouseX: number = 0;
  private mouseY: number = 0;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, callbacks: UICallbacks) {
    this.canvas = canvas;
    this.callbacks = callbacks;
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      this.mouseX = (e.clientX - rect.left) * scaleX;
      this.mouseY = (e.clientY - rect.top) * scaleY;
      
      this.hoverRestart = this.isOverRestartButton();
    });

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      
      if (this.isOverRestartButtonAt(x, y)) {
        this.callbacks.onRestart();
      }
    });
  }

  private isOverRestartButton(): boolean {
    return this.isOverRestartButtonAt(this.mouseX, this.mouseY);
  }

  private isOverRestartButtonAt(x: number, y: number): boolean {
    const btnX = CANVAS_WIDTH / 2 - 120;
    const btnY = CANVAS_HEIGHT / 2 + 80;
    const btnW = 240;
    const btnH = 60;
    
    return x >= btnX && x <= btnX + btnW && y >= btnY && y <= btnY + btnH;
  }

  update(dt: number): void {
    this.breathTime += dt * 3;
    this.pulseTime += dt * 2;
  }

  render(ctx: CanvasRenderingContext2D, state: UIState, gameState: GameState): void {
    if (gameState === GameState.MENU) {
      this.renderMenu(ctx);
    } else if (gameState === GameState.PLAYING || gameState === GameState.PAUSED) {
      this.renderHUD(ctx, state);
    } else if (gameState === GameState.GAME_OVER) {
      this.renderHUD(ctx, state);
      this.renderGameOver(ctx, state);
    }
  }

  private renderMenu(ctx: CanvasRenderingContext2D): void {
    const pulseScale = 1 + Math.sin(this.pulseTime) * 0.15;
    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    const gradient = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, 300 * pulseScale);
    gradient.addColorStop(0, 'rgba(0, 240, 255, 0.3)');
    gradient.addColorStop(0.5, 'rgba(0, 240, 255, 0.1)');
    gradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(centerX, centerY, 300 * pulseScale, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.shadowColor = COLORS.ACCENT;
    ctx.shadowBlur = 30;
    ctx.fillStyle = COLORS.ACCENT;
    ctx.font = '72px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('星际猎手', centerX, centerY - 50);
    ctx.restore();

    const breathAlpha = 0.5 + Math.sin(this.breathTime) * 0.5;
    ctx.globalAlpha = breathAlpha;
    ctx.fillStyle = COLORS.WHITE;
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('按空格键开始', centerX, centerY + 50);
    ctx.globalAlpha = 1;

    ctx.fillStyle = '#666666';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.fillText('方向键移动 | 空格射击', centerX, centerY + 120);
  }

  private renderHUD(ctx: CanvasRenderingContext2D, state: UIState): void {
    const breathAlpha = 0.7 + Math.sin(this.breathTime) * 0.3;
    
    ctx.save();
    ctx.globalAlpha = breathAlpha;
    ctx.shadowColor = COLORS.ACCENT;
    ctx.shadowBlur = 10;
    ctx.fillStyle = COLORS.ACCENT;
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    
    ctx.fillText(`分数: ${state.score}`, 30, 50);
    
    ctx.fillStyle = COLORS.WHITE;
    ctx.fillText('生命:', 30, 90);
    
    for (let i = 0; i < state.maxHealth; i++) {
      const heartX = 130 + i * 40;
      if (i < state.health) {
        ctx.fillStyle = COLORS.ACCENT;
        ctx.shadowColor = COLORS.ACCENT;
      } else {
        ctx.fillStyle = '#333333';
        ctx.shadowBlur = 0;
      }
      this.drawHeart(ctx, heartX, 78, 15);
    }
    
    ctx.globalAlpha = breathAlpha;
    ctx.shadowColor = COLORS.ACCENT;
    ctx.shadowBlur = 10;
    ctx.fillStyle = COLORS.ACCENT;
    ctx.textAlign = 'right';
    ctx.fillText(`波次: ${state.wave}`, CANVAS_WIDTH - 30, 50);
    
    ctx.restore();
  }

  private drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void {
    ctx.beginPath();
    ctx.moveTo(x, y + size / 4);
    ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
    ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 0.75, x, y + size);
    ctx.bezierCurveTo(x, y + size * 0.75, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
    ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
    ctx.fill();
  }

  private renderGameOver(ctx: CanvasRenderingContext2D, state: UIState): void {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const centerX = CANVAS_WIDTH / 2;
    const centerY = CANVAS_HEIGHT / 2;

    ctx.save();
    ctx.shadowColor = COLORS.ENEMY;
    ctx.shadowBlur = 20;
    ctx.fillStyle = COLORS.ENEMY;
    ctx.font = '56px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('游戏结束', centerX, centerY - 100);
    ctx.restore();

    ctx.fillStyle = COLORS.WHITE;
    ctx.font = '24px "Press Start 2P", monospace';
    ctx.fillText(`最终分数: ${state.finalScore}`, centerX, centerY - 20);
    ctx.fillText(`击败波次: ${state.finalWave}`, centerX, centerY + 20);

    const btnY = centerY + 80;
    const btnW = 240;
    const btnH = 60;
    
    const hoverScale = this.hoverRestart ? 1.1 : 1;
    const displayW = btnW * hoverScale;
    const displayH = btnH * hoverScale;
    const displayX = centerX - displayW / 2;
    const displayY = btnY - (displayH - btnH) / 2;

    ctx.save();
    ctx.shadowColor = this.hoverRestart ? COLORS.WHITE : COLORS.ACCENT;
    ctx.shadowBlur = 20;
    ctx.fillStyle = this.hoverRestart ? COLORS.WHITE : COLORS.ACCENT;
    ctx.fillRect(displayX, displayY, displayW, displayH);
    
    ctx.fillStyle = this.hoverRestart ? COLORS.BACKGROUND : COLORS.WHITE;
    ctx.font = '20px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('再试一次', centerX, displayY + displayH / 2);
    ctx.restore();

    ctx.fillStyle = '#666666';
    ctx.font = '12px "Press Start 2P", monospace';
    ctx.textBaseline = 'alphabetic';
    ctx.fillText('或按空格键重新开始', centerX, centerY + 200);
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
