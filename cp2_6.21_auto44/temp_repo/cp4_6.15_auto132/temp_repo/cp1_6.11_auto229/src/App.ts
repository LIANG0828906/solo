import { InkSimulator } from './InkSimulator';
import { Scorer, ScoreResult } from './Scorer';
import { UIManager } from './UIManager';

class App {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private textureCanvas: HTMLCanvasElement;
  private ink: InkSimulator;
  private scorer: Scorer;
  private ui: UIManager;
  private isTracing: boolean = false;
  private currentChar: string = '永';
  private lastScore: ScoreResult | null = null;

  constructor() {
    this.canvas = document.getElementById('canvas') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.textureCanvas = document.getElementById('texture-canvas') as HTMLCanvasElement;
    this.ink = new InkSimulator(this.canvas);
    this.scorer = new Scorer(this.currentChar);
    this.ui = new UIManager();

    this.generatePaperTexture();
    this.setupEventListeners();
    this.drawScene();
  }

  private generatePaperTexture(): void {
    const tCtx = this.textureCanvas.getContext('2d')!;
    const w = this.textureCanvas.width;
    const h = this.textureCanvas.height;
    const imageData = tCtx.createImageData(w, h);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = Math.random() * 60;
      data[i] = noise;
      data[i + 1] = noise;
      data[i + 2] = noise;
      data[i + 3] = 25;
    }

    tCtx.putImageData(imageData, 0, 0);
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    this.canvas.addEventListener('pointermove', (e) => this.onPointerMove(e));
    this.canvas.addEventListener('pointerup', () => this.onPointerUp());
    this.canvas.addEventListener('pointerleave', () => this.onPointerUp());
    this.canvas.style.touchAction = 'none';

    this.ui.setStartHandler(() => this.startTracing());
    this.ui.setSubmitHandler(() => this.submitScore());
    this.ui.setClearHandler(() => this.clearCanvas());
    this.ui.setExportHandler(() => this.exportPNG());
    this.ui.setInkChangeHandler((level) => this.ink.setInkDensity(level));
    this.ui.setBrushChangeHandler((size) => this.ink.setBrushSize(size));
    this.ui.setCharChangeHandler((char) => this.changeCharacter(char));
  }

  private getCanvasPos(e: PointerEvent): { x: number; y: number } {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY
    };
  }

  private onPointerDown(e: PointerEvent): void {
    if (!this.isTracing) return;
    const pos = this.getCanvasPos(e);
    this.ink.startStroke(pos.x, pos.y);
  }

  private onPointerMove(e: PointerEvent): void {
    if (!this.ink.isDrawing()) return;
    const pos = this.getCanvasPos(e);
    this.ink.continueStroke(pos.x, pos.y);
    this.drawScene();
  }

  private onPointerUp(): void {
    if (!this.ink.isDrawing()) return;
    this.ink.endStroke();
    this.drawScene();
  }

  private startTracing(): void {
    this.isTracing = true;
    this.lastScore = null;
    this.ui.setTracingMode(true);
    this.ui.hideScore();
    this.drawScene();
  }

  private submitScore(): void {
    const strokes = this.ink.getStrokes();
    if (strokes.length === 0) {
      this.ui.setStatus('请先书写后再提交评分');
      return;
    }

    this.ui.setStatus('评分计算中...');
    requestAnimationFrame(() => {
      this.lastScore = this.scorer.score(strokes);
      this.ui.showScore(this.lastScore);
    });
  }

  private clearCanvas(): void {
    this.ink.clear();
    this.lastScore = null;
    this.isTracing = false;
    this.ui.setTracingMode(false);
    this.ui.hideScore();
    this.drawScene();
  }

  private changeCharacter(char: string): void {
    this.currentChar = char;
    this.scorer.setCharacter(char);
    this.ink.clear();
    this.lastScore = null;
    this.isTracing = false;
    this.ui.setTracingMode(false);
    this.ui.hideScore();
    this.drawScene();
  }

  private drawScene(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.fillStyle = '#F5E6C8';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawTemplate();
    this.ink.drawCompletedStrokes();
    this.ink.drawCurrentStroke();
  }

  private drawTemplate(): void {
    this.ctx.save();
    this.ctx.globalAlpha = 0.5;
    this.ctx.fillStyle = '#C0C0C0';
    this.ctx.font = '380px "Noto Serif SC", KaiTi, STKaiti, serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(this.currentChar, 400, 310);
    this.ctx.restore();

    this.ctx.save();
    this.ctx.globalAlpha = 0.12;
    this.ctx.strokeStyle = '#C0C0C0';
    this.ctx.setLineDash([8, 8]);
    this.ctx.lineWidth = 0.5;

    this.ctx.beginPath();
    this.ctx.moveTo(400, 50);
    this.ctx.lineTo(400, 550);
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.moveTo(150, 300);
    this.ctx.lineTo(650, 300);
    this.ctx.stroke();

    this.ctx.setLineDash([]);
    this.ctx.restore();
  }

  private exportPNG(): void {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = this.canvas.width;
    exportCanvas.height = this.canvas.height;
    const eCtx = exportCanvas.getContext('2d')!;

    eCtx.fillStyle = '#F5E6C8';
    eCtx.fillRect(0, 0, exportCanvas.width, exportCanvas.height);

    this.drawTemplateOnCtx(eCtx);

    this.ink.renderAllStrokesOnCtx(eCtx);

    if (this.lastScore) {
      eCtx.save();
      eCtx.font = '12px "Noto Serif SC", KaiTi, serif';
      eCtx.fillStyle = 'rgba(92, 58, 33, 0.6)';
      eCtx.textAlign = 'right';
      eCtx.textBaseline = 'bottom';
      const scoreText = `评分: ${this.lastScore.total}% ${'★'.repeat(this.lastScore.stars)}${'☆'.repeat(5 - this.lastScore.stars)}`;
      eCtx.fillText(scoreText, exportCanvas.width - 12, exportCanvas.height - 12);
      eCtx.restore();
    }

    const link = document.createElement('a');
    link.download = `书法临摹_${this.currentChar}_${Date.now()}.png`;
    link.href = exportCanvas.toDataURL('image/png');
    link.click();
  }

  private drawTemplateOnCtx(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#C0C0C0';
    ctx.font = '380px "Noto Serif SC", KaiTi, STKaiti, serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.currentChar, 400, 310);
    ctx.restore();
  }
}

new App();
