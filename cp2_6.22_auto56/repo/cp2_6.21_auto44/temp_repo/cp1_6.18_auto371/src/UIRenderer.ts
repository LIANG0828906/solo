import {
  GameState,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  PLAYER_BASE_Y,
  TRACK_SPACING,
} from './types';

export class UIRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private gridPattern: CanvasPattern | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas上下文');
    this.ctx = ctx;
    this.createGridPattern();
  }

  private createGridPattern(): void {
    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = 20;
    patternCanvas.height = 20;
    const patternCtx = patternCanvas.getContext('2d');
    if (!patternCtx) return;

    patternCtx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    patternCtx.lineWidth = 1;
    patternCtx.beginPath();
    patternCtx.moveTo(0, 20);
    patternCtx.lineTo(0, 0);
    patternCtx.lineTo(20, 0);
    patternCtx.stroke();

    this.gridPattern = this.ctx.createPattern(patternCanvas, 'repeat');
  }

  render(state: GameState): void {
    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.drawBackground();
    this.drawGrid();
    this.drawTracks();
    this.drawBeatPoints(state);
    this.drawObstacles(state);
    this.drawGlowEffects(state);
    this.drawParticles(state);
    this.drawPlayer(state);
    this.drawHUD(state);
    this.drawComboEffects(state);
  }

  private drawBackground(): void {
    const gradient = this.ctx.createRadialGradient(
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      0,
      CANVAS_WIDTH / 2,
      CANVAS_HEIGHT / 2,
      CANVAS_WIDTH * 0.7
    );
    gradient.addColorStop(0, '#1A1025');
    gradient.addColorStop(1, '#0B0E1A');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
  }

  private drawGrid(): void {
    if (this.gridPattern) {
      this.ctx.fillStyle = this.gridPattern;
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    }
  }

  private drawTracks(): void {
    this.ctx.save();
    this.ctx.shadowColor = '#FFFFFF';
    this.ctx.shadowBlur = 4;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 2;

    for (let i = 0; i < 3; i++) {
      const y = PLAYER_BASE_Y + (i - 1) * TRACK_SPACING;
      this.ctx.beginPath();
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(CANVAS_WIDTH, y);
      this.ctx.stroke();
    }

    this.ctx.restore();
  }

  private getLaneY(lane: number): number {
    return PLAYER_BASE_Y + (lane - 1) * TRACK_SPACING;
  }

  private drawPlayer(state: GameState): void {
    const player = state.player;

    this.ctx.save();
    this.ctx.globalAlpha = player.opacity;

    this.ctx.shadowColor = '#00E5FF';
    this.ctx.shadowBlur = 8;

    this.ctx.beginPath();
    this.ctx.arc(
      player.x,
      player.y,
      player.radius * player.scale,
      0,
      Math.PI * 2
    );
    this.ctx.fillStyle = '#00E5FF';
    this.ctx.fill();

    this.ctx.shadowBlur = 0;
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();

    this.ctx.restore();
  }

  private drawObstacles(state: GameState): void {
    for (const obs of state.obstacles) {
      const laneY = this.getLaneY(obs.lane);

      this.ctx.save();

      switch (obs.type) {
        case 'spike':
          this.drawSpike(obs.x, laneY, obs.width, obs.height);
          break;
        case 'bar':
          this.drawBar(obs.x, obs.y, obs.width, obs.height);
          break;
        case 'missile':
          this.drawMissile(obs.x, laneY - 20, obs.width, obs.height);
          break;
      }

      this.ctx.restore();
    }
  }

  private drawSpike(x: number, y: number, width: number, height: number): void {
    this.ctx.fillStyle = '#FF4040';
    this.ctx.shadowColor = '#FF4040';
    this.ctx.shadowBlur = 8;

    this.ctx.beginPath();
    this.ctx.moveTo(x - width / 2, y);
    this.ctx.lineTo(x, y - height);
    this.ctx.lineTo(x + width / 2, y);
    this.ctx.closePath();
    this.ctx.fill();

    this.ctx.shadowBlur = 0;
    this.ctx.strokeStyle = '#FF6060';
    this.ctx.lineWidth = 1;
    this.ctx.stroke();
  }

  private drawBar(x: number, y: number, width: number, height: number): void {
    this.ctx.fillStyle = '#888888';
    this.ctx.shadowColor = '#AAAAAA';
    this.ctx.shadowBlur = 6;

    this.ctx.fillRect(x - width / 2, y, width, height);

    this.ctx.shadowBlur = 0;
    this.ctx.strokeStyle = '#AAAAAA';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x - width / 2, y, width, height);
  }

  private drawMissile(x: number, y: number, width: number, _height: number): void {
    this.ctx.fillStyle = '#FFD700';
    this.ctx.shadowColor = '#FFD700';
    this.ctx.shadowBlur = 12;

    this.ctx.beginPath();
    this.ctx.arc(x, y, width / 2, 0, Math.PI * 2);
    this.ctx.fill();

    this.ctx.shadowBlur = 0;
    this.ctx.fillStyle = '#FFA500';
    this.ctx.beginPath();
    this.ctx.arc(x - 5, y, 4, 0, Math.PI * 2);
    this.ctx.fill();
  }

  private drawBeatPoints(state: GameState): void {
    for (const bp of state.beatPoints) {
      if (bp.collected) continue;

      const y = this.getLaneY(bp.lane);

      this.ctx.save();
      this.ctx.fillStyle = '#FFD700';
      this.ctx.shadowColor = '#FFD700';
      this.ctx.shadowBlur = 10;

      const size = 12;
      this.ctx.translate(bp.x, y);
      this.ctx.rotate(Math.PI / 4);

      this.ctx.fillRect(-size / 2, -size / 2, size, size);

      this.ctx.shadowBlur = 0;
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(-size / 2, -size / 2, size, size);

      this.ctx.restore();
    }
  }

  private drawParticles(state: GameState): void {
    for (const p of state.particles) {
      const alpha = 1 - p.life / p.maxLife;

      this.ctx.save();
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = p.color;
      this.ctx.shadowColor = p.color;
      this.ctx.shadowBlur = 4;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size * alpha, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  private drawGlowEffects(state: GameState): void {
    for (const g of state.glowEffects) {
      this.ctx.save();
      this.ctx.globalAlpha = g.opacity;

      const gradient = this.ctx.createRadialGradient(
        g.x,
        g.y,
        0,
        g.x,
        g.y,
        g.radius
      );
      gradient.addColorStop(0, g.color);
      gradient.addColorStop(1, 'transparent');

      this.ctx.fillStyle = gradient;
      this.ctx.beginPath();
      this.ctx.arc(g.x, g.y, g.radius, 0, Math.PI * 2);
      this.ctx.fill();

      this.ctx.restore();
    }
  }

  private drawHUD(state: GameState): void {
    this.ctx.save();

    this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    this.roundRect(15, 15, 180, 80, 8);
    this.ctx.fill();

    this.ctx.fillStyle = '#FFFFFF';
    this.ctx.font = 'bold 18px Arial, sans-serif';
    this.ctx.textBaseline = 'top';
    this.ctx.fillText(`得分: ${state.score}`, 30, 25);

    const comboFontSize = Math.min(32, 18 + state.combo * 0.8);
    this.ctx.fillStyle = '#FFD700';
    this.ctx.shadowColor = '#FFD700';
    this.ctx.shadowBlur = 6;
    this.ctx.font = `bold ${comboFontSize}px Arial, sans-serif`;
    this.ctx.fillText(`连击: ${state.combo}x`, 30, 55);
    this.ctx.shadowBlur = 0;

    this.ctx.restore();
  }

  private drawComboEffects(state: GameState): void {
    if (state.comboEffect === 1) {
      this.ctx.save();
      const borderWidth = 6;
      this.ctx.strokeStyle = '#FFD700';
      this.ctx.shadowColor = '#FFD700';
      this.ctx.shadowBlur = 20;
      this.ctx.lineWidth = borderWidth;
      this.ctx.strokeRect(
        borderWidth / 2,
        borderWidth / 2,
        CANVAS_WIDTH - borderWidth,
        CANVAS_HEIGHT - borderWidth
      );
      this.ctx.restore();
    } else if (state.comboEffect === 2) {
      this.ctx.save();
      this.ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 96px Arial, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.shadowColor = '#FFD700';
      this.ctx.shadowBlur = 30;
      this.ctx.fillText('10x COMBO!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      this.ctx.restore();
    } else if (state.comboEffect === 3) {
      this.ctx.save();

      const gradient = this.ctx.createLinearGradient(0, 0, CANVAS_WIDTH, 0);
      const hue = (performance.now() / 5) % 360;
      gradient.addColorStop(0, `hsl(${hue}, 100%, 50%)`);
      gradient.addColorStop(0.25, `hsl(${(hue + 90) % 360}, 100%, 50%)`);
      gradient.addColorStop(0.5, `hsl(${(hue + 180) % 360}, 100%, 50%)`);
      gradient.addColorStop(0.75, `hsl(${(hue + 270) % 360}, 100%, 50%)`);
      gradient.addColorStop(1, `hsl(${hue}, 100%, 50%)`);

      this.ctx.globalAlpha = 0.4;
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      this.ctx.globalAlpha = 1;
      this.ctx.fillStyle = '#FFFFFF';
      this.ctx.font = 'bold 80px Arial, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.shadowColor = '#FFFFFF';
      this.ctx.shadowBlur = 40;
      this.ctx.fillText('15x MEGA COMBO!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
      this.ctx.restore();
    }
  }

  private roundRect(
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number
  ): void {
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
  }

  resize(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.createGridPattern();
  }
}
