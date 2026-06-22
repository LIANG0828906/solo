import {
  WeftPick,
  RenderConfig,
  WARP_COUNT,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  ROW_HEIGHT,
  MAX_ROWS
} from './types';

export class PatternRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private backBuffer: HTMLCanvasElement;
  private backCtx: CanvasRenderingContext2D;
  private config: RenderConfig;
  private lastRowCount: number = 0;
  private isDragging: boolean = false;
  private lastMouseX: number = 0;
  private lastMouseY: number = 0;
  private onRenderComplete?: () => void;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.canvas.width = CANVAS_WIDTH;
    this.canvas.height = CANVAS_HEIGHT;

    this.backBuffer = document.createElement('canvas');
    this.backBuffer.width = CANVAS_WIDTH;
    this.backBuffer.height = CANVAS_HEIGHT;
    this.backCtx = this.backBuffer.getContext('2d')!;

    this.config = {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      cellWidth: CANVAS_WIDTH / WARP_COUNT,
      cellHeight: ROW_HEIGHT
    };

    this.setupEventListeners();
    this.drawEmptyState();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('wheel', this.handleWheel.bind(this), { passive: false });
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));

    this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
    this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
    this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this));
  }

  private handleWheel(e: WheelEvent): void {
    e.preventDefault();
    
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    const newScale = Math.max(0.5, Math.min(2, this.config.scale * delta));

    if (newScale !== this.config.scale) {
      const scaleRatio = newScale / this.config.scale;
      this.config.offsetX = mouseX - (mouseX - this.config.offsetX) * scaleRatio;
      this.config.offsetY = mouseY - (mouseY - this.config.offsetY) * scaleRatio;
      this.config.scale = newScale;

      this.applyTransform();
    }
  }

  private handleMouseDown(e: MouseEvent): void {
    this.isDragging = true;
    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;
    this.canvas.style.cursor = 'grabbing';
  }

  private handleMouseMove(e: MouseEvent): void {
    if (!this.isDragging) return;

    const dx = e.clientX - this.lastMouseX;
    const dy = e.clientY - this.lastMouseY;

    this.config.offsetX += dx;
    this.config.offsetY += dy;

    this.lastMouseX = e.clientX;
    this.lastMouseY = e.clientY;

    this.applyTransform();
  }

  private handleMouseUp(): void {
    this.isDragging = false;
    this.canvas.style.cursor = 'grab';
  }

  private handleTouchStart(e: TouchEvent): void {
    if (e.touches.length === 1) {
      e.preventDefault();
      this.isDragging = true;
      this.lastMouseX = e.touches[0].clientX;
      this.lastMouseY = e.touches[0].clientY;
    }
  }

  private handleTouchMove(e: TouchEvent): void {
    if (!this.isDragging || e.touches.length !== 1) return;
    e.preventDefault();

    const dx = e.touches[0].clientX - this.lastMouseX;
    const dy = e.touches[0].clientY - this.lastMouseY;

    this.config.offsetX += dx;
    this.config.offsetY += dy;

    this.lastMouseX = e.touches[0].clientX;
    this.lastMouseY = e.touches[0].clientY;

    this.applyTransform();
  }

  private handleTouchEnd(): void {
    this.isDragging = false;
  }

  private applyTransform(): void {
    this.canvas.style.transition = 'transform 0.3s ease';
    this.canvas.style.transformOrigin = '0 0';
    this.canvas.style.transform = `translate(${this.config.offsetX}px, ${this.config.offsetY}px) scale(${this.config.scale})`;
  }

  private drawEmptyState(): void {
    const ctx = this.backCtx;
    
    ctx.fillStyle = '#F5E6CA';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    ctx.strokeStyle = '#C0B090';
    ctx.lineWidth = 0.5;

    for (let x = 0; x <= CANVAS_WIDTH; x += 10) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, CANVAS_HEIGHT);
      ctx.stroke();
    }

    for (let y = 0; y <= CANVAS_HEIGHT; y += 10) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(CANVAS_WIDTH, y);
      ctx.stroke();
    }

    ctx.font = 'italic 24px serif';
    ctx.fillStyle = 'rgba(139, 69, 19, 0.5)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('等待织造开始', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);

    this.ctx.drawImage(this.backBuffer, 0, 0);
  }

  private drawSilkTexture(): void {
    const ctx = this.backCtx;
    ctx.fillStyle = '#E8D5A3';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    const imageData = ctx.getImageData(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const noise = (Math.random() - 0.5) * 10;
      data[i] = Math.min(255, Math.max(0, data[i] + noise));
      data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise));
      data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise));
    }

    ctx.putImageData(imageData, 0, 0);
  }

  private drawRow(pick: WeftPick, rowIndex: number, opacity: number = 1): void {
    const ctx = this.backCtx;
    const cellWidth = this.config.cellWidth;
    const cellHeight = this.config.cellHeight;
    
    const y = CANVAS_HEIGHT - (rowIndex + 1) * cellHeight;

    if (opacity < 1) {
      ctx.globalAlpha = opacity;
    }

    for (let i = 0; i < pick.interlacements.length; i++) {
      const interlacement = pick.interlacements[i];
      const x = i * cellWidth;

      ctx.fillStyle = interlacement.color;

      if (interlacement.isWarpFaced) {
        ctx.fillRect(x + cellWidth / 2 - 1, y, 2, cellHeight);
      } else {
        ctx.fillRect(x, y + cellHeight / 2 - 1, cellWidth, 2);
      }
    }

    if (opacity < 1) {
      ctx.globalAlpha = 1;
    }
  }

  private drawShadow(rowCount: number): void {
    if (rowCount === 0) return;

    const ctx = this.backCtx;
    const shadowHeight = rowCount * this.config.cellHeight;
    const gradient = ctx.createLinearGradient(0, CANVAS_HEIGHT - shadowHeight, 0, CANVAS_HEIGHT);
    
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.08)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, CANVAS_HEIGHT - shadowHeight, CANVAS_WIDTH, shadowHeight);
  }

  render(weftPicks: WeftPick[], fullRedraw: boolean = false): void {
    const startTime = performance.now();

    if (fullRedraw || weftPicks.length === 0) {
      this.drawSilkTexture();
      this.lastRowCount = 0;
    }

    const startIndex = fullRedraw ? 0 : this.lastRowCount;
    const totalRows = weftPicks.length;

    for (let i = startIndex; i < totalRows; i++) {
      const opacity = totalRows > MAX_ROWS && i < totalRows - MAX_ROWS ? 0.3 : 1;
      this.drawRow(weftPicks[i], i, opacity);
    }

    this.drawShadow(totalRows);
    this.lastRowCount = totalRows;

    this.ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    this.ctx.drawImage(this.backBuffer, 0, 0);

    const elapsed = performance.now() - startTime;
    if (elapsed > 100) {
      console.warn(`Render took ${elapsed}ms, exceeds 100ms target`);
    }

    if (this.onRenderComplete) {
      this.onRenderComplete();
    }
  }

  renderFrame(weftPicks: WeftPick[], targetCanvas: HTMLCanvasElement): void {
    const ctx = targetCanvas.getContext('2d')!;
    
    ctx.fillStyle = '#E8D5A3';
    ctx.fillRect(0, 0, targetCanvas.width, targetCanvas.height);

    const cellWidth = targetCanvas.width / WARP_COUNT;
    const cellHeight = targetCanvas.height / Math.max(80, weftPicks.length + 20);

    for (let i = 0; i < weftPicks.length; i++) {
      const pick = weftPicks[i];
      const y = targetCanvas.height - (i + 1) * cellHeight;

      for (let j = 0; j < pick.interlacements.length; j++) {
        const interlacement = pick.interlacements[j];
        const x = j * cellWidth;

        ctx.fillStyle = interlacement.color;

        if (interlacement.isWarpFaced) {
          ctx.fillRect(x + cellWidth / 2 - 1, y, 2, cellHeight);
        } else {
          ctx.fillRect(x, y + cellHeight / 2 - 1, cellWidth, 2);
        }
      }
    }
  }

  setOnRenderComplete(callback: () => void): void {
    this.onRenderComplete = callback;
  }

  getConfig(): RenderConfig {
    return { ...this.config };
  }

  reset(): void {
    this.config = {
      scale: 1,
      offsetX: 0,
      offsetY: 0,
      cellWidth: CANVAS_WIDTH / WARP_COUNT,
      cellHeight: ROW_HEIGHT
    };
    this.lastRowCount = 0;
    this.canvas.style.transform = 'none';
    this.drawEmptyState();
  }

  getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
