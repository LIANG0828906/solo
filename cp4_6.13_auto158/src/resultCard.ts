import { TypingEngine, RoundResult } from './typingEngine';

type RestartCallback = () => void;

export class ResultCard {
  private container: HTMLElement;
  private engine: TypingEngine;

  private cardEl!: HTMLDivElement;
  private chartCanvas!: HTMLCanvasElement;
  private chartCtx!: CanvasRenderingContext2D;
  private badgeEl!: HTMLDivElement;
  private badgeGlowEl!: HTMLDivElement;
  private scoreTextEl!: HTMLDivElement;
  private statsEl!: HTMLDivElement;
  private restartBtn!: HTMLButtonElement;
  private shareBtn!: HTMLButtonElement;

  private visible: boolean = false;
  private currentResult: RoundResult | null = null;
  private restartCallbacks: RestartCallback[] = [];
  private badgeAnimFrame: number = 0;
  private chartAnimFrame: number = 0;
  private breathStart: number = 0;

  constructor(container: HTMLElement, engine: TypingEngine) {
    this.container = container;
    this.engine = engine;
    this.buildDOM();
  }

  private buildDOM(): void {
    this.cardEl = document.createElement('div');
    this.cardEl.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 640px;
      height: 400px;
      max-width: 92vw;
      max-height: 80vh;
      background: #ffffffcc;
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 20px;
      padding: 28px 32px;
      z-index: 1000;
      display: none;
      flex-direction: column;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
      color: #1e1e2e;
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      overflow: hidden;
    `;

    const badgeContainer = document.createElement('div');
    badgeContainer.style.cssText = `
      position: absolute;
      top: 20px;
      left: 24px;
      width: 64px;
      height: 64px;
    `;

    this.badgeGlowEl = document.createElement('div');
    this.badgeGlowEl.style.cssText = `
      position: absolute;
      top: -4px;
      left: -4px;
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: conic-gradient(from 0deg, transparent 0%, rgba(255,255,255,0.6) 25%, transparent 50%);
      animation: badgeGlow 2s linear infinite;
    `;

    this.badgeEl = document.createElement('div');
    this.badgeEl.style.cssText = `
      position: relative;
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 800;
      color: #1e1e2e;
      z-index: 1;
    `;

    badgeContainer.appendChild(this.badgeGlowEl);
    badgeContainer.appendChild(this.badgeEl);
    this.cardEl.appendChild(badgeContainer);

    this.scoreTextEl = document.createElement('div');
    this.scoreTextEl.style.cssText = `
      position: absolute;
      top: 28px;
      left: 100px;
      font-size: 28px;
      font-weight: 800;
      color: #1e1e2e;
    `;
    this.cardEl.appendChild(this.scoreTextEl);

    this.statsEl = document.createElement('div');
    this.statsEl.style.cssText = `
      position: absolute;
      top: 64px;
      left: 100px;
      font-size: 13px;
      color: #6c7086;
      display: flex;
      gap: 16px;
    `;
    this.cardEl.appendChild(this.statsEl);

    const chartContainer = document.createElement('div');
    chartContainer.style.cssText = `
      position: absolute;
      top: 100px;
      left: 24px;
      right: 24px;
      bottom: 70px;
    `;

    this.chartCanvas = document.createElement('canvas');
    this.chartCanvas.style.cssText = `width: 100%; height: 100%; display: block;`;
    chartContainer.appendChild(this.chartCanvas);
    this.cardEl.appendChild(chartContainer);

    const btnRow = document.createElement('div');
    btnRow.style.cssText = `
      position: absolute;
      bottom: 20px;
      left: 24px;
      right: 24px;
      display: flex;
      gap: 12px;
      justify-content: center;
    `;

    this.restartBtn = document.createElement('button');
    this.restartBtn.textContent = 'Play Again';
    this.restartBtn.style.cssText = `
      padding: 10px 28px;
      border: none;
      border-radius: 10px;
      background: linear-gradient(135deg, #7c3aed, #3b82f6);
      color: white;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    this.restartBtn.addEventListener('mouseenter', () => {
      this.restartBtn.style.transform = 'scale(1.08)';
      this.restartBtn.style.boxShadow = '0 8px 25px rgba(124, 58, 237, 0.4)';
    });
    this.restartBtn.addEventListener('mouseleave', () => {
      this.restartBtn.style.transform = 'scale(1)';
      this.restartBtn.style.boxShadow = 'none';
    });
    this.restartBtn.addEventListener('mousedown', () => {
      this.restartBtn.style.transform = 'scale(0.95)';
    });
    this.restartBtn.addEventListener('mouseup', () => {
      this.restartBtn.style.transform = 'scale(1.08)';
    });
    this.restartBtn.addEventListener('click', () => {
      this.hide();
      this.restartCallbacks.forEach(cb => cb());
    });

    this.shareBtn = document.createElement('button');
    this.shareBtn.textContent = 'Share';
    this.shareBtn.style.cssText = `
      padding: 10px 28px;
      border: none;
      border-radius: 10px;
      background: rgba(30, 30, 46, 0.8);
      color: #e2e8f0;
      font-family: 'Consolas', 'Monaco', monospace;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    `;
    this.shareBtn.addEventListener('mouseenter', () => {
      this.shareBtn.style.transform = 'scale(1.08)';
      this.shareBtn.style.boxShadow = '0 8px 25px rgba(0, 0, 0, 0.3)';
    });
    this.shareBtn.addEventListener('mouseleave', () => {
      this.shareBtn.style.transform = 'scale(1)';
      this.shareBtn.style.boxShadow = 'none';
    });
    this.shareBtn.addEventListener('mousedown', () => {
      this.shareBtn.style.transform = 'scale(0.95)';
    });
    this.shareBtn.addEventListener('mouseup', () => {
      this.shareBtn.style.transform = 'scale(1.08)';
    });
    this.shareBtn.addEventListener('click', () => {
      this.shareResult();
    });

    btnRow.appendChild(this.restartBtn);
    btnRow.appendChild(this.shareBtn);
    this.cardEl.appendChild(btnRow);

    const overlay = document.createElement('div');
    overlay.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 15, 26, 0.6);
      z-index: 999;
      display: none;
    `;
    overlay.id = 'result-overlay';

    this.container.appendChild(overlay);
    this.container.appendChild(this.cardEl);
  }

  on(event: 'restart', cb: RestartCallback): void {
    this.restartCallbacks.push(cb);
  }

  show(result: RoundResult): void {
    this.currentResult = result;
    this.visible = true;

    const overlay = document.getElementById('result-overlay');
    if (overlay) overlay.style.display = 'block';

    this.cardEl.style.display = 'flex';
    this.cardEl.classList.remove('card-animate-out');
    this.cardEl.classList.add('card-animate-in');

    this.updateBadge(result.score);
    this.scoreTextEl.textContent = `${result.score} pts`;

    const wpmSpan = document.createElement('span');
    wpmSpan.textContent = `WPM: ${result.wpm}`;

    const accSpan = document.createElement('span');
    accSpan.textContent = `Accuracy: ${result.accuracy}%`;

    const timeSpan = document.createElement('span');
    timeSpan.textContent = `Time: ${(result.timeUsed / 1000).toFixed(1)}s`;

    this.statsEl.innerHTML = '';
    this.statsEl.appendChild(wpmSpan);
    this.statsEl.appendChild(accSpan);
    this.statsEl.appendChild(timeSpan);

    this.resizeChartCanvas();
    this.breathStart = performance.now();
    this.drawTrendChart();
  }

  hide(): void {
    this.cardEl.classList.remove('card-animate-in');
    this.cardEl.classList.add('card-animate-out');

    setTimeout(() => {
      this.cardEl.style.display = 'none';
      this.visible = false;

      const overlay = document.getElementById('result-overlay');
      if (overlay) overlay.style.display = 'none';

      if (this.chartAnimFrame) {
        cancelAnimationFrame(this.chartAnimFrame);
        this.chartAnimFrame = 0;
      }
    }, 400);
  }

  isVisible(): boolean {
    return this.visible;
  }

  private updateBadge(score: number): void {
    let badgeColor: string;
    let label: string;

    if (score >= 80) {
      badgeColor = '#ffd700';
      label = 'GOLD';
    } else if (score >= 60) {
      badgeColor = '#c0c0c0';
      label = 'SILVER';
    } else if (score >= 40) {
      badgeColor = '#b87333';
      label = 'BRONZE';
    } else {
      badgeColor = '#6c7086';
      label = 'TRY';
    }

    this.badgeEl.style.background = badgeColor;
    this.badgeEl.textContent = label;

    this.badgeGlowEl.style.background = `conic-gradient(from 0deg, transparent 0%, ${badgeColor}88 25%, transparent 50%, ${badgeColor}44 75%, transparent 100%)`;
  }

  private resizeChartCanvas(): void {
    const parent = this.chartCanvas.parentElement!;
    const rect = parent.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.chartCanvas.width = rect.width * dpr;
    this.chartCanvas.height = rect.height * dpr;
    this.chartCanvas.style.width = rect.width + 'px';
    this.chartCanvas.style.height = rect.height + 'px';
    this.chartCtx = this.chartCanvas.getContext('2d')!;
    this.chartCtx.scale(dpr, dpr);
  }

  private drawTrendChart(): void {
    const ctx = this.chartCtx;
    if (!ctx) return;

    const history = this.engine.getHistory();
    const last10 = history.slice(-10);
    if (last10.length === 0) return;

    const canvas = this.chartCanvas;
    const w = canvas.width / (window.devicePixelRatio || 1);
    const h = canvas.height / (window.devicePixelRatio || 1);

    const padding = { top: 20, right: 20, bottom: 30, left: 40 };
    const chartW = w - padding.left - padding.right;
    const chartH = h - padding.top - padding.bottom;

    const maxWPM = 120;

    const animate = (time: number) => {
      ctx.clearRect(0, 0, w, h);

      ctx.strokeStyle = 'rgba(100, 100, 120, 0.2)';
      ctx.lineWidth = 1;
      ctx.font = '10px Consolas, Monaco, monospace';
      ctx.fillStyle = '#999';

      for (let v = 0; v <= maxWPM; v += 30) {
        const y = padding.top + chartH - (v / maxWPM) * chartH;
        ctx.beginPath();
        ctx.moveTo(padding.left, y);
        ctx.lineTo(w - padding.right, y);
        ctx.stroke();
        ctx.textAlign = 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(v.toString(), padding.left - 6, y);
      }

      const startIdx = Math.max(0, history.length - 10);
      for (let i = 0; i < last10.length; i++) {
        const x = padding.left + (i / Math.max(1, last10.length - 1)) * chartW;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';
        ctx.fillStyle = '#999';
        ctx.fillText((startIdx + i + 1).toString(), x, h - padding.bottom + 8);
      }

      if (last10.length < 2) {
        if (last10.length === 1) {
          const x = padding.left;
          const y = padding.top + chartH - (last10[0].wpm / maxWPM) * chartH;
          ctx.beginPath();
          ctx.arc(x, y, 4, 0, Math.PI * 2);
          ctx.fillStyle = this.getLineColor(last10[0].score);
          ctx.fill();
        }
        if (this.visible) {
          this.chartAnimFrame = requestAnimationFrame(animate);
        }
        return;
      }

      const points = last10.map((r, i) => ({
        x: padding.left + (i / (last10.length - 1)) * chartW,
        y: padding.top + chartH - (Math.min(r.wpm, maxWPM) / maxWPM) * chartH,
        score: r.score
      }));

      const lineColor = this.getLineColor(last10[last10.length - 1].score);

      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(points[0].x, padding.top + chartH);
      ctx.lineTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        ctx.lineTo(points[i].x, points[i].y);
      }
      ctx.lineTo(points[points.length - 1].x, padding.top + chartH);
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, padding.top, 0, padding.top + chartH);
      gradient.addColorStop(0, this.hexToRgba(lineColor, 0.2));
      gradient.addColorStop(1, this.hexToRgba(lineColor, 0.2));
      ctx.fillStyle = gradient;
      ctx.fill();

      points.forEach((p, i) => {
        if (i < points.length - 1) {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = lineColor;
          ctx.fill();
        }
      });

      const lastPoint = points[points.length - 1];
      const breathElapsed = (time - this.breathStart) % 800;
      const breathProgress = breathElapsed / 800;
      const breathWave = Math.sin(breathProgress * Math.PI * 2);
      const breathAlpha = 0.5 + 0.5 * breathWave;
      const breathScale = 0.8 + 0.4 * breathWave;

      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, 10 * breathScale, 0, Math.PI * 2);
      ctx.fillStyle = this.hexToRgba(lineColor, breathAlpha * 0.2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, 7 * breathScale, 0, Math.PI * 2);
      ctx.fillStyle = this.hexToRgba(lineColor, breathAlpha * 0.4);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = lineColor;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2);
      ctx.strokeStyle = this.hexToRgba(lineColor, breathAlpha);
      ctx.lineWidth = 2;
      ctx.stroke();

      if (this.visible) {
        this.chartAnimFrame = requestAnimationFrame(animate);
      }
    };

    this.chartAnimFrame = requestAnimationFrame(animate);
  }

  private getLineColor(score: number): string {
    if (score < 40) return '#50fa7b';
    if (score <= 70) return '#f1fa8c';
    return '#ff5555';
  }

  private hexToRgba(hex: string, alpha: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  private shareResult(): void {
    if (!this.currentResult) return;

    const text = `🔤 Typing Trainer\nWPM: ${this.currentResult.wpm} | Accuracy: ${this.currentResult.accuracy}% | Score: ${this.currentResult.score}`;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => {
        this.showToast('Copied to clipboard!');
      }).catch(() => {
        this.fallbackCopy(text);
      });
    } else {
      this.fallbackCopy(text);
    }
  }

  private fallbackCopy(text: string): void {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.cssText = 'position: fixed; left: -9999px;';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      this.showToast('Copied to clipboard!');
    } catch {
      this.showToast('Failed to copy');
    }
    document.body.removeChild(textarea);
  }

  private showToast(msg: string): void {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);

    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 2600);
  }
}
