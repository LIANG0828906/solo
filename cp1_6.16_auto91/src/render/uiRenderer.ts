import { GameState, Player, CONFIG } from '../types';

export interface UIRenderData {
  gameState: GameState;
  player: Player;
  fps: number;
  mouseX: number;
  mouseY: number;
}

export class UIRenderer {
  private ctx: CanvasRenderingContext2D;
  private hoverStates: { pause: boolean; restart: boolean; resume: boolean } = {
    pause: false,
    restart: false,
    resume: false
  };

  constructor(ctx: CanvasRenderingContext2D) {
    this.ctx = ctx;
  }

  updateHoverStates(mouseX: number, mouseY: number, scaleX: number, scaleY: number, offsetX: number, offsetY: number): void {
    const mx = (mouseX - offsetX) / scaleX;
    const my = (mouseY - offsetY) / scaleY;

    const pauseBtn = { x: CONFIG.CANVAS_WIDTH - 100, y: 50, w: 60, h: 40 };
    this.hoverStates.pause = mx >= pauseBtn.x && mx <= pauseBtn.x + pauseBtn.w &&
                                 my >= pauseBtn.y && my <= pauseBtn.y + pauseBtn.h;

    if (this.hoverStates.pause) {
      document.body.style.cursor = 'pointer';
    } else {
      document.body.style.cursor = 'default';
    }
  }

  isPauseButtonClicked(x: number, y: number, scaleX: number, scaleY: number, offsetX: number, offsetY: number): boolean {
    const cx = (x - offsetX) / scaleX;
    const cy = (y - offsetY) / scaleY;
    
    return cx >= CONFIG.CANVAS_WIDTH - 100 && cx <= CONFIG.CANVAS_WIDTH - 40 &&
           cy >= 50 && cy <= 90;
  }

  isResumeButtonClicked(x: number, y: number, scaleX: number, scaleY: number, offsetX: number, offsetY: number): boolean {
    const cx = (x - offsetX) / scaleX;
    const cy = (y - offsetY) / scaleY;
    
    return cx >= CONFIG.CANVAS_WIDTH / 2 - 100 && cx <= CONFIG.CANVAS_WIDTH / 2 + 100 &&
           cy >= CONFIG.CANVAS_HEIGHT / 2 - 40 && cy <= CONFIG.CANVAS_HEIGHT / 2 + 40;
  }

  isRestartButtonClicked(x: number, y: number, scaleX: number, scaleY: number, offsetX: number, offsetY: number): boolean {
    const cx = (x - offsetX) / scaleX;
    const cy = (y - offsetY) / scaleY;
    
    const gameOver = cy >= CONFIG.CANVAS_HEIGHT / 2 + 80 && cy <= CONFIG.CANVAS_HEIGHT / 2 + 160 &&
                     cx >= CONFIG.CANVAS_WIDTH / 2 - 120 && cx <= CONFIG.CANVAS_WIDTH / 2 + 120;
                     
    const paused = cy >= CONFIG.CANVAS_HEIGHT / 2 + 40 && cy <= CONFIG.CANVAS_HEIGHT / 2 + 120 &&
                   cx >= CONFIG.CANVAS_WIDTH / 2 - 120 && cx <= CONFIG.CANVAS_WIDTH / 2 + 120;
    
    return gameOver || paused;
  }

  draw(data: UIRenderData): void {
    this.drawStatusBar(data.fps);
    this.drawHUD(data.gameState, data.player);
    
    if (data.gameState.isPaused && !data.gameState.isGameOver) {
      this.drawPauseMenu();
    }
    
    if (data.gameState.isGameOver) {
      this.drawGameOver(data.gameState);
    }
  }

  private drawStatusBar(fps: number): void {
    const ctx = this.ctx;
    const { CANVAS_WIDTH } = CONFIG;

    ctx.fillStyle = '#1a1a2a';
    ctx.fillRect(0, 0, CANVAS_WIDTH, 20);

    const gradient = ctx.createLinearGradient(0, 0, 200, 0);
    gradient.addColorStop(0, '#FF00FF');
    gradient.addColorStop(1, '#00FFFF');
    
    ctx.fillStyle = gradient;
    ctx.font = 'bold 12px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = '#FF00FF';
    ctx.shadowBlur = 10;
    ctx.fillText('CYBER DASH', 10, 10);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FFFFFF';
    ctx.font = '10px "Press Start 2P", monospace';
    ctx.textAlign = 'right';
    ctx.fillText(`${Math.round(fps)} FPS`, CANVAS_WIDTH - 10, 10);
  }

  private drawHUD(gameState: GameState, player: Player): void {
    const ctx = this.ctx;
    const { CANVAS_WIDTH } = CONFIG;

    const scoreText = `${Math.floor(gameState.displayScore)}`;
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 32px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.shadowColor = '#000000';
    ctx.shadowBlur = 4;
    ctx.fillText(scoreText, 76, 62);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#00FFFF';
    ctx.shadowBlur = 10;
    ctx.fillText(scoreText, 72, 58);
    ctx.shadowBlur = 0;

    for (let i = 0; i < player.lives; i++) {
      this.drawHeart(80 + i * 30, 90, 20, 18);
    }

    this.drawPauseButton(CANVAS_WIDTH - 100, 50, gameState.isPaused);
  }

  private drawHeart(x: number, y: number, w: number, h: number): void {
    const ctx = this.ctx;
    
    ctx.save();
    ctx.fillStyle = '#FF3366';
    ctx.shadowColor = '#FF0066';
    ctx.shadowBlur = 10;

    ctx.beginPath();
    ctx.moveTo(x + w / 2, y + h * 0.25);
    ctx.bezierCurveTo(x + w / 2, y, x, y, x, y + h * 0.25);
    ctx.bezierCurveTo(x, y + h * 0.5, x + w / 2, y + h * 0.75, x + w / 2, y + h);
    ctx.bezierCurveTo(x + w / 2, y + h * 0.75, x + w, y + h * 0.5, x + w, y + h * 0.25);
    ctx.bezierCurveTo(x + w, y, x + w / 2, y, x + w / 2, y + h * 0.25);
    ctx.fill();

    ctx.fillStyle = '#FF99AA';
    ctx.beginPath();
    ctx.arc(x + w * 0.3, y + h * 0.35, 3, 0, Math.PI * 2);
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawPauseButton(x: number, y: number, isPaused: boolean): void {
    const ctx = this.ctx;
    const w = 60;
    const h = 40;
    const scale = this.hoverStates.pause ? 1.05 : 1;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-(x + w / 2), -(y + h / 2));

    ctx.fillStyle = this.hoverStates.pause ? '#FFE066' : '#FFFF00';
    ctx.shadowColor = '#FFFF00';
    ctx.shadowBlur = 15;

    ctx.beginPath();
    if (isPaused) {
      ctx.moveTo(x + 15, y + 10);
      ctx.lineTo(x + 15, y + h - 10);
      ctx.lineTo(x + w - 10, y + h / 2);
      ctx.closePath();
    } else {
      ctx.moveTo(x + 15, y + 10);
      ctx.lineTo(x + 15, y + h - 10);
      ctx.lineTo(x + 25, y + h - 10);
      ctx.lineTo(x + 25, y + 10);
      ctx.closePath();
      ctx.moveTo(x + 35, y + 10);
      ctx.lineTo(x + 35, y + h - 10);
      ctx.lineTo(x + 45, y + h - 10);
      ctx.lineTo(x + 45, y + 10);
      ctx.closePath();
    }
    ctx.fill();

    ctx.shadowBlur = 0;
    ctx.restore();
  }

  private drawPauseMenu(): void {
    const ctx = this.ctx;
    const { CANVAS_WIDTH, CANVAS_HEIGHT } = CONFIG;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 48px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FF00FF';
    ctx.shadowBlur = 20;
    ctx.fillText('PAUSED', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 100);
    ctx.shadowBlur = 0;

    this.drawButton(
      CANVAS_WIDTH / 2 - 100,
      CANVAS_HEIGHT / 2 - 40,
      200,
      80,
      'RESUME',
      '#00FF00',
      this.hoverStates.resume
    );

    this.drawButton(
      CANVAS_WIDTH / 2 - 120,
      CANVAS_HEIGHT / 2 + 40,
      240,
      80,
      'RESTART',
      '#00FFFF',
      this.hoverStates.restart
    );
  }

  private drawGameOver(gameState: GameState): void {
    const ctx = this.ctx;
    const { CANVAS_WIDTH, CANVAS_HEIGHT } = CONFIG;

    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.fillStyle = '#FF0066';
    ctx.font = 'bold 56px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.shadowColor = '#FF0066';
    ctx.shadowBlur = 30;
    ctx.fillText('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 150);
    ctx.shadowBlur = 0;

    const displayScore = Math.floor(gameState.displayScore);
    ctx.fillStyle = '#FFFF00';
    ctx.font = 'bold 36px "Press Start 2P", monospace';
    ctx.shadowColor = '#FFFF00';
    ctx.shadowBlur = 15;
    ctx.fillText(`SCORE: ${displayScore}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
    ctx.shadowBlur = 0;

    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 24px "Press Start 2P", monospace';
    ctx.shadowColor = '#FFD700';
    ctx.shadowBlur = 15;
    ctx.fillText(`HIGH SCORE: ${Math.floor(gameState.highScore)}`, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
    ctx.shadowBlur = 0;

    this.drawButton(
      CANVAS_WIDTH / 2 - 120,
      CANVAS_HEIGHT / 2 + 80,
      240,
      80,
      'PLAY AGAIN',
      '#00FF00',
      this.hoverStates.restart
    );
  }

  private drawButton(x: number, y: number, w: number, h: number, text: string, color: string, hovered: boolean): void {
    const ctx = this.ctx;
    const scale = hovered ? 1.05 : 1;

    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    ctx.scale(scale, scale);
    ctx.translate(-(x + w / 2), -(y + h / 2));

    const brightness = hovered ? '120%' : '100%';
    ctx.fillStyle = color;
    ctx.filter = `brightness(${brightness})`;
    ctx.shadowColor = color;
    ctx.shadowBlur = 20;

    const radius = 12;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, radius);
    ctx.fill();

    ctx.filter = 'none';
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#000000';
    ctx.font = 'bold 20px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, x + w / 2, y + h / 2);

    ctx.restore();
  }
}
