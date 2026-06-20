import { ScoreResult } from './Scorer';

export class UIManager {
  private btnStart: HTMLButtonElement;
  private btnSubmit: HTMLButtonElement;
  private btnClear: HTMLButtonElement;
  private btnExport: HTMLButtonElement;
  private inkPalette: HTMLElement;
  private brushPalette: HTMLElement;
  private scoreArea: HTMLElement;
  private scorePercentage: HTMLElement;
  private scoreStars: HTMLElement;
  private scoreDetail: HTMLElement;
  private radarCanvas: HTMLCanvasElement;
  private statusText: HTMLElement;
  private charBtns: NodeListOf<HTMLButtonElement>;

  private onInkChange: (level: number) => void = () => {};
  private onBrushChange: (size: number) => void = () => {};
  private onCharChange: (char: string) => void = () => {};

  constructor() {
    this.btnStart = document.getElementById('btn-start') as HTMLButtonElement;
    this.btnSubmit = document.getElementById('btn-submit') as HTMLButtonElement;
    this.btnClear = document.getElementById('btn-clear') as HTMLButtonElement;
    this.btnExport = document.getElementById('btn-export') as HTMLButtonElement;
    this.inkPalette = document.getElementById('ink-palette')!;
    this.brushPalette = document.getElementById('brush-palette')!;
    this.scoreArea = document.getElementById('score-area')!;
    this.scorePercentage = document.getElementById('score-percentage')!;
    this.scoreStars = document.getElementById('score-stars')!;
    this.scoreDetail = document.getElementById('score-detail')!;
    this.radarCanvas = document.getElementById('radar-canvas') as HTMLCanvasElement;
    this.statusText = document.getElementById('status')!;
    this.charBtns = document.querySelectorAll('.char-btn');

    this.setupPaletteListeners();
    this.setupCharListeners();
  }

  private setupPaletteListeners(): void {
    const inkItems = this.inkPalette.querySelectorAll('.palette-item');
    inkItems.forEach(item => {
      item.addEventListener('click', () => {
        inkItems.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        this.onInkChange(parseInt((item as HTMLElement).dataset.ink!));
      });
    });

    const brushItems = this.brushPalette.querySelectorAll('.brush-item');
    brushItems.forEach(item => {
      item.addEventListener('click', () => {
        brushItems.forEach(i => i.classList.remove('selected'));
        item.classList.add('selected');
        this.onBrushChange(parseInt((item as HTMLElement).dataset.brush!));
      });
    });
  }

  private setupCharListeners(): void {
    this.charBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        this.charBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.onCharChange(btn.dataset.char!);
      });
    });
  }

  setInkChangeHandler(handler: (level: number) => void): void {
    this.onInkChange = handler;
  }

  setBrushChangeHandler(handler: (size: number) => void): void {
    this.onBrushChange = handler;
  }

  setCharChangeHandler(handler: (char: string) => void): void {
    this.onCharChange = handler;
  }

  setStartHandler(handler: () => void): void {
    this.btnStart.addEventListener('click', handler);
  }

  setSubmitHandler(handler: () => void): void {
    this.btnSubmit.addEventListener('click', handler);
  }

  setClearHandler(handler: () => void): void {
    this.btnClear.addEventListener('click', handler);
  }

  setExportHandler(handler: () => void): void {
    this.btnExport.addEventListener('click', handler);
  }

  setTracingMode(enabled: boolean): void {
    this.btnStart.disabled = enabled;
    this.btnSubmit.disabled = !enabled;
    this.btnExport.disabled = true;
    this.statusText.textContent = enabled
      ? '临摹模式已开启，请跟随范本书写'
      : '请点击「开始临摹」进入书写模式';
  }

  showScore(result: ScoreResult): void {
    this.scoreArea.classList.remove('hidden');
    this.scorePercentage.textContent = `${result.total}%`;
    this.scoreStars.textContent = '★'.repeat(result.stars) + '☆'.repeat(5 - result.stars);
    this.scoreDetail.innerHTML =
      `笔顺: <span style="color:#4A90D9">${result.strokeOrder}%</span> &nbsp; ` +
      `形态: <span style="color:#50C878">${result.shape}%</span> &nbsp; ` +
      `布局: <span style="color:#FF8C00">${result.layout}%</span>`;
    this.drawRadarChart(result);
    this.btnExport.disabled = false;
    this.statusText.textContent = '评分完成，可导出作品或清空重写';
  }

  hideScore(): void {
    this.scoreArea.classList.add('hidden');
  }

  drawRadarChart(result: ScoreResult): void {
    const ctx = this.radarCanvas.getContext('2d')!;
    const w = this.radarCanvas.width;
    const h = this.radarCanvas.height;
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const cy = h / 2 + 10;
    const sideLen = 150;
    const triH = sideLen * Math.sqrt(3) / 2;

    const vertices = [
      { x: cx, y: cy - triH * 2 / 3, label: '笔顺', color: '#4A90D9' },
      { x: cx - sideLen / 2, y: cy + triH / 3, label: '形态', color: '#50C878' },
      { x: cx + sideLen / 2, y: cy + triH / 3, label: '布局', color: '#FF8C00' }
    ];

    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    ctx.lineTo(vertices[1].x, vertices[1].y);
    ctx.lineTo(vertices[2].x, vertices[2].y);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(92, 58, 33, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - triH * 2 / 3 / 3);
    ctx.lineTo(cx - sideLen / 6, cy + triH / 9);
    ctx.lineTo(cx + sideLen / 6, cy + triH / 9);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(92, 58, 33, 0.15)';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(cx, cy - triH * 2 / 9);
    ctx.lineTo(cx - sideLen / 3, cy + triH * 2 / 9);
    ctx.lineTo(cx + sideLen / 3, cy + triH * 2 / 9);
    ctx.closePath();
    ctx.strokeStyle = 'rgba(92, 58, 33, 0.15)';
    ctx.stroke();

    const scores = [result.strokeOrder, result.shape, result.layout];
    const dataPoints = vertices.map((v, i) => ({
      x: cx + (v.x - cx) * scores[i] / 100,
      y: cy + (v.y - cy) * scores[i] / 100,
      color: v.color
    }));

    ctx.beginPath();
    ctx.moveTo(dataPoints[0].x, dataPoints[0].y);
    ctx.lineTo(dataPoints[1].x, dataPoints[1].y);
    ctx.lineTo(dataPoints[2].x, dataPoints[2].y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(194, 59, 34, 0.15)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(194, 59, 34, 0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();

    dataPoints.forEach(dp => {
      ctx.beginPath();
      ctx.arc(dp.x, dp.y, 4, 0, Math.PI * 2);
      ctx.fillStyle = dp.color;
      ctx.fill();
    });

    ctx.font = '12px "Noto Serif SC", KaiTi, serif';
    ctx.textAlign = 'center';
    vertices.forEach((v, i) => {
      ctx.fillStyle = v.color;
      const offsetY = i === 0 ? -10 : 18;
      ctx.fillText(`${v.label} ${scores[i]}`, v.x, v.y + offsetY);
    });
  }

  setStatus(text: string): void {
    this.statusText.textContent = text;
  }
}
