export interface WindParams {
  angle: number;
  level: number;
  offsetPerFrame: number;
}

const COLORS = {
  WIND_BAR_BG: '#333333',
  WIND_BAR_FILL: '#FF4500',
  TEXT: '#FFFFFF'
};

const SIZES = {
  WIND_BAR_WIDTH: 100,
  WIND_BAR_HEIGHT: 6,
  UI_CORNER_RADIUS: 8
};

export class Wind {
  private params: WindParams;

  constructor() {
    this.params = { angle: 0, level: 0, offsetPerFrame: 0 };
    this.regenerate();
  }

  regenerate(): void {
    const angle = (Math.random() * 60) - 30;
    const level = Math.floor(Math.random() * 6);
    const offsetPerFrame = (level / 5) * 8;
    this.params = { angle, level, offsetPerFrame };
  }

  getParams(): WindParams {
    return { ...this.params };
  }

  getWindArrowSymbol(): string {
    const a = this.params.angle;
    if (a <= -22) return '←';
    if (a <= -8) return '↖';
    if (a <= 8) return '↑';
    if (a <= 22) return '↗';
    return '→';
  }

  drawWindIndicator(ctx: CanvasRenderingContext2D, x: number, y: number): void {
    const panelWidth = 180;
    const panelHeight = 60;

    ctx.save();
    this.drawWoodPanel(ctx, x - panelWidth, y, panelWidth, panelHeight);

    ctx.fillStyle = COLORS.TEXT;
    ctx.font = 'bold 16px "KaiTi", "楷体", serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('风况', x - panelWidth + 12, y + 8);

    const arrowSymbol = this.getWindArrowSymbol();
    ctx.font = 'bold 22px "KaiTi", "楷体", serif';
    ctx.fillStyle = this.params.level >= 3 ? '#FFD700' : COLORS.TEXT;
    ctx.fillText(arrowSymbol, x - panelWidth + 12, y + 30);

    ctx.fillStyle = COLORS.TEXT;
    ctx.font = '13px "KaiTi", "楷体", serif';
    const angleText = `${this.params.angle >= 0 ? '+' : ''}${this.params.angle.toFixed(0)}°`;
    ctx.fillText(`${this.params.level}级 ${angleText}`, x - panelWidth + 44, y + 34);

    const barX = x - SIZES.WIND_BAR_WIDTH - 12;
    const barY = y + 34;
    ctx.fillStyle = COLORS.WIND_BAR_BG;
    this.roundRect(ctx, barX, barY, SIZES.WIND_BAR_WIDTH, SIZES.WIND_BAR_HEIGHT, 3);
    ctx.fill();

    const fillRatio = this.params.level / 5;
    const fillWidth = SIZES.WIND_BAR_WIDTH * fillRatio;
    const gradient = ctx.createLinearGradient(barX, barY, barX + SIZES.WIND_BAR_WIDTH, barY);
    gradient.addColorStop(0, '#FFD700');
    gradient.addColorStop(1, COLORS.WIND_BAR_FILL);
    ctx.fillStyle = gradient;
    this.roundRect(ctx, barX, barY, fillWidth, SIZES.WIND_BAR_HEIGHT, 3);
    ctx.fill();

    ctx.restore();
  }

  private drawWoodPanel(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number): void {
    ctx.fillStyle = 'rgba(26, 26, 26, 0.82)';
    this.roundRect(ctx, x, y, w, h, SIZES.UI_CORNER_RADIUS);
    ctx.fill();
    ctx.strokeStyle = 'rgba(139, 37, 0, 0.6)';
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.globalAlpha = 0.08;
    for (let i = 0; i < h; i += 4) {
      ctx.beginPath();
      ctx.moveTo(x + 2, y + i);
      ctx.lineTo(x + w - 2, y + i + 1);
      ctx.strokeStyle = '#5C3A21';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
}
