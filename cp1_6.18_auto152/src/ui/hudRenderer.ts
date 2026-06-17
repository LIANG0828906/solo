import type { GameState } from '../types/gameTypes';

export class HUDRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private width: number = 0;
  private height: number = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');
    this.ctx = ctx;
    this.resize();
  }

  public resize(width?: number, height?: number): void {
    if (width !== undefined && height !== undefined) {
      this.width = width;
      this.height = height;
    } else {
      this.width = this.canvas.width;
      this.height = this.canvas.height;
    }
  }

  public render(state: GameState): void {
    this.ctx.save();

    this.drawScore(state.score, state.highScore);
    this.drawCombo(state.combo);
    this.drawProgressBar(state.musicProgress);
    this.drawLevel(state.level);

    this.ctx.restore();
  }

  private drawScore(score: number, highScore: number): void {
    this.ctx.save();

    this.ctx.font = 'bold 24px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    this.ctx.textBaseline = 'top';

    this.ctx.shadowColor = '#000000';
    this.ctx.shadowBlur = 4;
    this.ctx.shadowOffsetX = 2;
    this.ctx.shadowOffsetY = 2;

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillText(`分数: ${score}`, 20, 20);

    this.ctx.font = 'bold 16px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    this.ctx.fillStyle = '#66FCF1';
    this.ctx.fillText(`最高分: ${highScore || 0}`, 20, 50);

    this.ctx.restore();
  }

  private drawCombo(combo: number): void {
    if (combo <= 0) return;

    this.ctx.save();

    const baseFontSize = 24;
    const fontSize = combo >= 10 ? baseFontSize + 10 : baseFontSize;

    this.ctx.font = `bold ${fontSize}px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif`;
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'top';

    if (combo >= 10) {
      const flash = Math.sin(performance.now() / 100) * 0.5 + 0.5;
      this.ctx.globalAlpha = 0.5 + flash * 0.5;
      this.ctx.shadowColor = '#FFD700';
      this.ctx.shadowBlur = 20;
    }

    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillText(`连击 x${combo}`, this.width - 20, 20);

    this.ctx.restore();
  }

  private drawProgressBar(progress: number): void {
    this.ctx.save();

    const barHeight = 6;
    const barY = this.height - 20;
    const padding = 40;
    const barWidth = this.width - padding * 2;
    const barX = padding;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.fillRect(barX, barY, barWidth, barHeight);

    const gradient = this.ctx.createLinearGradient(barX, barY, barX + barWidth, barY);
    gradient.addColorStop(0, '#00FF88');
    gradient.addColorStop(0.5, '#66FCF1');
    gradient.addColorStop(1, '#45A29E');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    this.ctx.shadowColor = '#00FF88';
    this.ctx.shadowBlur = 5;
    this.ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    this.ctx.restore();
  }

  private drawLevel(level: number): void {
    this.ctx.save();

    this.ctx.font = 'bold 18px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'top';
    this.ctx.fillStyle = '#66FCF1';
    this.ctx.fillText(`关卡 ${level}`, this.width / 2, 20);

    this.ctx.restore();
  }

  public drawMenu(): void {
    this.ctx.save();

    const gradient = this.ctx.createLinearGradient(0, 0, 0, this.height);
    gradient.addColorStop(0, '#0B0C10');
    gradient.addColorStop(1, '#1F2833');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.ctx.font = 'bold 48px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.shadowColor = '#66FCF1';
    this.ctx.shadowBlur = 20;
    this.ctx.fillText('音波竞速', this.width / 2, this.height / 2 - 80);

    this.ctx.font = '20px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    this.ctx.fillStyle = '#C5C6C7';
    this.ctx.shadowBlur = 0;
    this.ctx.fillText('驾驶飞船，跟随节拍，收集音符，躲避障碍！', this.width / 2, this.height / 2 - 20);

    this.drawButton(
      this.width / 2 - 100,
      this.height / 2 + 40,
      200,
      50,
      '开始游戏',
      false
    );

    this.ctx.font = '14px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    this.ctx.fillStyle = '#66FCF1';
    this.ctx.fillText('空格键/点击跳跃  |  A/D或方向键左右移动', this.width / 2, this.height / 2 + 130);

    this.ctx.restore();
  }

  public drawGameOver(score: number, highScore: number): void {
    this.ctx.save();

    this.ctx.fillStyle = 'rgba(11, 12, 16, 0.85)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    this.ctx.font = 'bold 42px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    this.ctx.fillStyle = '#FF3333';
    this.ctx.shadowColor = '#FF3333';
    this.ctx.shadowBlur = 15;
    this.ctx.fillText('游戏结束', this.width / 2, this.height / 2 - 100);

    this.ctx.shadowBlur = 0;

    this.ctx.font = 'bold 32px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.fillText(`得分: ${score}`, this.width / 2, this.height / 2 - 40);

    this.ctx.font = 'bold 20px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    this.ctx.fillStyle = '#FFD700';
    this.ctx.fillText(`最高分: ${highScore}`, this.width / 2, this.height / 2);

    if (score >= highScore && score > 0) {
      this.ctx.font = 'bold 18px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
      this.ctx.fillStyle = '#00FF88';
      const flash = Math.sin(performance.now() / 150) * 0.3 + 0.7;
      this.ctx.globalAlpha = flash;
      this.ctx.fillText('🎉 新纪录！', this.width / 2, this.height / 2 + 35);
      this.ctx.globalAlpha = 1;
    }

    this.drawButton(
      this.width / 2 - 100,
      this.height / 2 + 70,
      200,
      50,
      '再来一次',
      false
    );

    this.ctx.restore();
  }

  private drawButton(
    x: number,
    y: number,
    width: number,
    height: number,
    text: string,
    hover: boolean
  ): void {
    const radius = 8;

    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();

    this.ctx.fillStyle = hover ? '#66FCF1' : '#45A29E';
    this.ctx.fill();

    this.ctx.strokeStyle = '#66FCF1';
    this.ctx.lineWidth = 2;
    this.ctx.stroke();

    this.ctx.font = 'bold 20px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(text, x + width / 2, y + height / 2);
  }

  public isClickOnButton(clickX: number, clickY: number, phase: 'menu' | 'gameover'): boolean {
    const buttonX = this.width / 2 - 100;
    const buttonY = phase === 'menu' ? this.height / 2 + 40 : this.height / 2 + 70;
    const buttonWidth = 200;
    const buttonHeight = 50;

    return (
      clickX >= buttonX &&
      clickX <= buttonX + buttonWidth &&
      clickY >= buttonY &&
      clickY <= buttonY + buttonHeight
    );
  }
}
