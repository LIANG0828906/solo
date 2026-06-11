export interface UIPosition {
  x: number;
  y: number;
}

export class UI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private energyBar: {
    x: number;
    y: number;
    width: number;
    height: number;
    value: number;
    targetValue: number;
    flowOffset: number;
  };
  private score: {
    value: number;
    displayValue: number;
    scale: number;
    targetScale: number;
    lastChangeTime: number;
  };
  private summaryPanel: {
    x: number;
    y: number;
    width: number;
    height: number;
    text: string;
    hovered: boolean;
    colorTransition: number;
  };
  private currentTime: number = 0;

  constructor(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    this.canvas = canvas;
    this.ctx = ctx;

    this.energyBar = {
      x: 40,
      y: 40,
      width: 200,
      height: 12,
      value: 0,
      targetValue: 0,
      flowOffset: 0
    };

    this.score = {
      value: 0,
      displayValue: 0,
      scale: 1,
      targetScale: 1,
      lastChangeTime: 0
    };

    this.summaryPanel = {
      x: 0,
      y: 0,
      width: 200,
      height: 80,
      text: '星象沉寂中...\n点击星座唤醒星辰之力',
      hovered: false,
      colorTransition: 0
    };
  }

  setLayout(canvasWidth: number, canvasHeight: number): void {
    this.energyBar.x = 40;
    this.energyBar.y = 40;

    this.summaryPanel.x = canvasWidth / 2 + 120;
    this.summaryPanel.y = canvasHeight / 2 - 280;
  }

  addEnergy(amount: number): void {
    this.energyBar.targetValue = Math.min(100, this.energyBar.targetValue + amount);
  }

  resetEnergy(): void {
    this.energyBar.targetValue = 0;
  }

  getEnergy(): number {
    return this.energyBar.value;
  }

  isEnergyFull(): boolean {
    return this.energyBar.value >= 99.9;
  }

  addScore(amount: number): void {
    this.score.value += amount;
    this.score.targetScale = 34 / 28;
    this.score.lastChangeTime = performance.now();
  }

  getScore(): number {
    return this.score.value;
  }

  setSummary(text: string): void {
    this.summaryPanel.text = text;
  }

  setSummaryHovered(hovered: boolean): void {
    this.summaryPanel.hovered = hovered;
  }

  isPointInSummary(mx: number, my: number): boolean {
    const p = this.summaryPanel;
    return mx >= p.x && mx <= p.x + p.width && my >= p.y && my <= p.y + p.height;
  }

  getSummaryRect(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.summaryPanel.x,
      y: this.summaryPanel.y,
      width: this.summaryPanel.width,
      height: this.summaryPanel.height
    };
  }

  update(deltaTime: number, currentTime: number): void {
    this.currentTime = currentTime;

    const energyDiff = this.energyBar.targetValue - this.energyBar.value;
    this.energyBar.value += energyDiff * 0.08;
    this.energyBar.flowOffset += deltaTime * 0.1;

    const scoreDiff = this.score.value - this.score.displayValue;
    this.score.displayValue += scoreDiff * 0.1;

    const timeSinceChange = currentTime - this.score.lastChangeTime;
    if (timeSinceChange < 300) {
      this.score.scale = 1 + (this.score.targetScale - 1) * (1 - timeSinceChange / 300);
    } else {
      this.score.scale = 1;
    }

    if (this.summaryPanel.hovered) {
      this.summaryPanel.colorTransition = Math.min(1, this.summaryPanel.colorTransition + deltaTime * 0.003);
    } else {
      this.summaryPanel.colorTransition = Math.max(0, this.summaryPanel.colorTransition - deltaTime * 0.003);
    }
  }

  draw(): void {
    this.drawEnergyBar();
    this.drawScore();
    this.drawSummaryPanel();
  }

  private drawEnergyBar(): void {
    const ctx = this.ctx;
    const bar = this.energyBar;
    const radius = bar.height / 2;

    this.drawRoundRect(bar.x - 2, bar.y - 2, bar.width + 4, bar.height + 4, radius + 2);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fill();

    this.drawRoundRect(bar.x, bar.y, bar.width, bar.height, radius);
    ctx.fillStyle = '#2D1B3E';
    ctx.fill();
    ctx.strokeStyle = 'rgba(155, 89, 182, 0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();

    if (bar.value > 0.5) {
      const fillWidth = (bar.value / 100) * (bar.width - 4);
      const fillX = bar.x + 2;
      const fillY = bar.y + 2;
      const fillH = bar.height - 4;

      ctx.save();
      this.drawRoundRect(fillX, fillY, fillWidth, fillH, (bar.height - 4) / 2);
      ctx.clip();

      const gradient = ctx.createLinearGradient(fillX, fillY, fillX + bar.width, fillY);
      const phase = Math.sin(bar.flowOffset * 0.01) * 0.2 + 0.5;
      gradient.addColorStop(0, '#9B59B6');
      gradient.addColorStop(0.5, this.interpolateColor('#9B59B6', '#FFD700', phase));
      gradient.addColorStop(1, '#FFD700');
      ctx.fillStyle = gradient;
      ctx.fillRect(fillX, fillY, bar.width, fillH);

      ctx.globalAlpha = 0.4;
      const stripeCount = 8;
      const stripeWidth = 8;
      const spacing = bar.width / stripeCount;
      for (let i = -1; i < stripeCount + 1; i++) {
        const sx = fillX + ((i * spacing + bar.flowOffset) % (bar.width + spacing)) - spacing;
        const stripeGrad = ctx.createLinearGradient(sx, fillY, sx + stripeWidth, fillY);
        stripeGrad.addColorStop(0, 'rgba(255, 255, 255, 0)');
        stripeGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
        stripeGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = stripeGrad;
        ctx.fillRect(sx, fillY, stripeWidth, fillH);
      }
      ctx.restore();

      if (bar.value >= 99) {
        const pulse = (Math.sin(this.currentTime * 0.005) + 1) / 2;
        this.drawRoundRect(bar.x - 1, bar.y - 1, bar.width + 2, bar.height + 2, radius + 1);
        ctx.strokeStyle = `rgba(255, 215, 0, ${0.4 + pulse * 0.6})`;
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    ctx.save();
    ctx.font = '10px "Microsoft YaHei", serif';
    ctx.fillStyle = 'rgba(232, 213, 183, 0.8)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText('符文能量', bar.x, bar.y - 5);
    ctx.restore();
  }

  private drawScore(): void {
    const ctx = this.ctx;
    const canvasWidth = this.canvas.width / (window.devicePixelRatio || 1);
    const scoreX = canvasWidth - 40;
    const scoreY = 46;

    ctx.save();
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';

    const baseFontSize = 28;
    const scaledFontSize = baseFontSize * this.score.scale;
    ctx.font = `bold ${scaledFontSize}px "Microsoft YaHei", "Georgia", serif`;
    ctx.letterSpacing = '2px';

    const displayScore = Math.floor(this.score.displayValue);
    const scoreStr = displayScore.toString();

    const pulse = (Math.sin(this.currentTime * 0.003) + 1) / 2;
    ctx.shadowColor = `rgba(196, 168, 130, ${0.3 + pulse * 0.3})`;
    ctx.shadowBlur = 10 + pulse * 5;

    ctx.fillStyle = '#C4A882';
    ctx.fillText(scoreStr, scoreX, scoreY);

    ctx.shadowBlur = 0;
    ctx.font = '10px "Microsoft YaHei", serif';
    ctx.fillStyle = 'rgba(196, 168, 130, 0.7)';
    ctx.fillText('命运点数', scoreX, scoreY + 24);
    ctx.restore();
  }

  private drawSummaryPanel(): void {
    const ctx = this.ctx;
    const p = this.summaryPanel;

    const colorT = p.colorTransition;
    const textColor = this.interpolateColor('#E8D5B7', '#FFD700', colorT);
    const borderColor = this.interpolateColor(
      'rgba(232, 213, 183, 0.3)',
      'rgba(255, 215, 0, 0.6)',
      colorT
    );

    ctx.save();
    this.drawRoundRect(p.x, p.y, p.width, p.height, 10);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.fill();
    ctx.strokeStyle = borderColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    this.drawRoundRect(p.x + 2, p.y + 2, p.width - 4, p.height - 4, 8);
    ctx.fillStyle = 'rgba(20, 10, 30, 0.5)';
    ctx.fill();

    ctx.fillStyle = textColor;
    ctx.font = '13px "Microsoft YaHei", "PingFang SC", serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const lines = p.text.split('\n');
    const lineHeight = 18;
    const totalHeight = lines.length * lineHeight;
    const startY = p.y + p.height / 2 - totalHeight / 2 + lineHeight / 2;

    for (let i = 0; i < lines.length; i++) {
      ctx.fillText(lines[i], p.x + p.width / 2, startY + i * lineHeight);
    }
    ctx.restore();
  }

  private drawRoundRect(x: number, y: number, w: number, h: number, r: number): void {
    const ctx = this.ctx;
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

  private interpolateColor(c1: string, c2: string, t: number): string {
    if (c1.startsWith('rgba') || c1.startsWith('rgb')) {
      return this.interpolateRgba(c1, c2, t);
    }
    const h1 = c1.replace('#', '');
    const h2 = c2.replace('#', '');
    const r1 = parseInt(h1.substring(0, 2), 16);
    const g1 = parseInt(h1.substring(2, 4), 16);
    const b1 = parseInt(h1.substring(4, 6), 16);
    const r2 = parseInt(h2.substring(0, 2), 16);
    const g2 = parseInt(h2.substring(2, 4), 16);
    const b2 = parseInt(h2.substring(4, 6), 16);
    const r = Math.round(r1 + (r2 - r1) * t);
    const g = Math.round(g1 + (g2 - g1) * t);
    const b = Math.round(b1 + (b2 - b1) * t);
    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  }

  private interpolateRgba(c1: string, c2: string, t: number): string {
    const p1 = this.parseRgba(c1);
    const p2 = this.parseRgba(c2);
    const r = Math.round(p1.r + (p2.r - p1.r) * t);
    const g = Math.round(p1.g + (p2.g - p1.g) * t);
    const b = Math.round(p1.b + (p2.b - p1.b) * t);
    const a = p1.a + (p2.a - p1.a) * t;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  private parseRgba(c: string): { r: number; g: number; b: number; a: number } {
    const match = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\)/);
    if (match) {
      return {
        r: parseInt(match[1]),
        g: parseInt(match[2]),
        b: parseInt(match[3]),
        a: match[4] !== undefined ? parseFloat(match[4]) : 1
      };
    }
    return { r: 255, g: 255, b: 255, a: 1 };
  }
}
