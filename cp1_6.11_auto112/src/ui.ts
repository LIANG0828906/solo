import type { Spot, AnalyzeResult, HistoryItem } from './analyzer';

const SEVERITY_LABELS: Record<string, { text: string; class: string }> = {
  mild: { text: '轻度', class: 'mild' },
  moderate: { text: '中度', class: 'moderate' },
  severe: { text: '重度', class: 'severe' }
};

export class UI {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private historyEl: HTMLElement;
  private tooltip: HTMLElement;
  private canvasPlaceholder: HTMLElement;
  private reportPlaceholder: HTMLElement;
  private reportContent: HTMLElement;
  private historyEmpty: HTMLElement;
  private loadingOverlay: HTMLElement;
  private spots: Spot[] = [];
  private imageOffset = { x: 0, y: 0, scale: 1 };
  private currentImage: HTMLImageElement | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    _reportEl: HTMLElement,
    historyEl: HTMLElement
  ) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.historyEl = historyEl;
    this.tooltip = document.getElementById('tooltip')!;
    this.canvasPlaceholder = document.getElementById('canvas-placeholder')!;
    this.reportPlaceholder = document.getElementById('report-placeholder')!;
    this.reportContent = document.getElementById('report-content')!;
    this.historyEmpty = document.getElementById('history-empty')!;
    this.loadingOverlay = document.getElementById('loading-overlay')!;

    this.initCanvasEvents();
  }

  private initCanvasEvents(): void {
    this.canvas.addEventListener('mousemove', (e) => this.handleCanvasMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => this.hideTooltip());
  }

  private handleCanvasMouseMove(e: MouseEvent): void {
    if (this.spots.length === 0) return;

    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    const hoveredSpot = this.spots.find(spot => {
      const dx = spot.x - x;
      const dy = spot.y - y;
      return Math.sqrt(dx * dx + dy * dy) <= 15;
    });

    if (hoveredSpot) {
      this.showTooltip(e.clientX, e.clientY, hoveredSpot.disease);
      this.canvas.style.cursor = 'pointer';
    } else {
      this.hideTooltip();
      this.canvas.style.cursor = 'default';
    }
  }

  showTooltip(x: number, y: number, disease: string): void {
    this.tooltip.textContent = `病害类型：${disease}`;
    this.tooltip.style.left = `${x + 15}px`;
    this.tooltip.style.top = `${y + 15}px`;
    this.tooltip.classList.add('visible');
  }

  hideTooltip(): void {
    this.tooltip.classList.remove('visible');
  }

  showLoading(): void {
    this.loadingOverlay.style.display = 'flex';
  }

  hideLoading(): void {
    this.loadingOverlay.style.display = 'none';
  }

  renderImage(img: HTMLImageElement): void {
    this.currentImage = img;
    this.canvasPlaceholder.style.display = 'none';

    const canvasWidth = this.canvas.width;
    const canvasHeight = this.canvas.height;

    const imgRatio = img.width / img.height;
    const canvasRatio = canvasWidth / canvasHeight;

    let drawWidth: number, drawHeight: number;

    if (imgRatio > canvasRatio) {
      drawWidth = canvasWidth;
      drawHeight = canvasWidth / imgRatio;
    } else {
      drawHeight = canvasHeight;
      drawWidth = canvasHeight * imgRatio;
    }

    const offsetX = (canvasWidth - drawWidth) / 2;
    const offsetY = (canvasHeight - drawHeight) / 2;

    this.imageOffset = {
      x: offsetX,
      y: offsetY,
      scale: drawWidth / img.width
    };

    this.ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    this.ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
  }

  renderSpots(spots: Spot[]): void {
    this.spots = spots;

    const { x: offsetX, y: offsetY, scale } = this.imageOffset;

    spots.forEach((spot, index) => {
      const drawX = offsetX + spot.x * scale;
      const drawY = offsetY + spot.y * scale;
      const drawRadius = 10 * scale;

      this.ctx.save();
      this.ctx.globalAlpha = 0.6;
      this.ctx.fillStyle = '#FF4444';
      this.ctx.beginPath();
      this.ctx.arc(drawX, drawY, drawRadius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.restore();

      this.ctx.save();
      this.ctx.globalAlpha = 0.8;
      this.ctx.strokeStyle = '#FFFFFF';
      this.ctx.lineWidth = 2 * scale;
      this.ctx.beginPath();
      this.ctx.arc(drawX, drawY, drawRadius, 0, Math.PI * 2);
      this.ctx.stroke();
      this.ctx.restore();

      this.animateSpot(index);
    });
  }

  private animateSpot(index: number): void {
    const startTime = performance.now();
    const duration = 300;
    const delay = index * 50;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime - delay;
      if (elapsed < 0) {
        requestAnimationFrame(animate);
        return;
      }

      const progress = Math.min(elapsed / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 3);
      const scale = 0.5 + easeOut * 0.5;

      if (progress < 1 && this.spots[index]) {
        const originalAlpha = this.ctx.globalAlpha;
        this.ctx.save();

        const { x: offsetX, y: offsetY, scale: imgScale } = this.imageOffset;
        const drawX = offsetX + this.spots[index].x * imgScale;
        const drawY = offsetY + this.spots[index].y * imgScale;
        const drawRadius = 10 * imgScale;

        this.ctx.clearRect(
          drawX - drawRadius - 5,
          drawY - drawRadius - 5,
          (drawRadius + 5) * 2,
          (drawRadius + 5) * 2
        );

        if (this.currentImage) {
          const imgRatio = this.currentImage.width / this.currentImage.height;
          const canvasRatio = this.canvas.width / this.canvas.height;
          let drawWidth: number, drawHeight: number;
          if (imgRatio > canvasRatio) {
            drawWidth = this.canvas.width;
            drawHeight = this.canvas.width / imgRatio;
          } else {
            drawHeight = this.canvas.height;
            drawWidth = this.canvas.height * imgRatio;
          }
          const offX = (this.canvas.width - drawWidth) / 2;
          const offY = (this.canvas.height - drawHeight) / 2;
          this.ctx.drawImage(this.currentImage, offX, offY, drawWidth, drawHeight);
        }

        this.ctx.globalAlpha = 0.6;
        this.ctx.fillStyle = '#FF4444';
        this.ctx.beginPath();
        this.ctx.arc(drawX, drawY, drawRadius * scale, 0, Math.PI * 2);
        this.ctx.fill();

        this.ctx.globalAlpha = 0.8;
        this.ctx.strokeStyle = '#FFFFFF';
        this.ctx.lineWidth = 2 * imgScale;
        this.ctx.beginPath();
        this.ctx.arc(drawX, drawY, drawRadius * scale, 0, Math.PI * 2);
        this.ctx.stroke();

        this.ctx.globalAlpha = originalAlpha;
        this.ctx.restore();

        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }

  renderReport(result: AnalyzeResult): void {
    this.reportPlaceholder.style.display = 'none';
    this.reportContent.style.display = 'block';

    const severityInfo = SEVERITY_LABELS[result.severity];

    this.reportContent.innerHTML = `
      <div class="report-section">
        <div class="report-label">检测到的病斑数量</div>
        <div class="report-value spot-count">${result.spots.length} 个</div>
      </div>
      <div class="report-section">
        <div class="report-label">病害名称</div>
        <div class="report-value">${result.diseaseName}</div>
      </div>
      <div class="report-section">
        <div class="report-label">病情等级</div>
        <span class="severity-tag ${severityInfo.class}">${severityInfo.text}</span>
      </div>
      <div class="report-section">
        <div class="report-label">治疗建议</div>
        <ul class="suggestions-list">
          ${result.suggestions.map(s => `<li>${s}</li>`).join('')}
        </ul>
      </div>
      <button class="reanalyze-btn" id="reanalyze-btn">重新分析</button>
    `;
  }

  addToHistory(item: HistoryItem): void {
    if (this.historyEmpty) {
      this.historyEmpty.style.display = 'none';
    }

    const severityInfo = SEVERITY_LABELS[item.severity];

    const historyItem = document.createElement('div');
    historyItem.className = 'history-item';
    historyItem.dataset.id = item.id;
    historyItem.innerHTML = `
      <img class="history-thumbnail" src="${item.thumbnail}" alt="叶片缩略图" />
      <div class="history-disease">${item.diseaseName}</div>
      <span class="severity-tag ${severityInfo.class}">${severityInfo.text}</span>
    `;

    const container = this.historyEl.querySelector('.history-container')!;
    container.insertBefore(historyItem, container.firstChild);
  }

  setActiveHistoryItem(id: string): void {
    const items = this.historyEl.querySelectorAll('.history-item');
    items.forEach(item => {
      const htmlItem = item as HTMLElement;
      htmlItem.classList.remove('active');
      if (htmlItem.dataset.id === id) {
        htmlItem.classList.add('active');
      }
    });
  }

  clearCanvas(): void {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.spots = [];
    this.currentImage = null;
    this.canvasPlaceholder.style.display = 'block';
  }

  generateThumbnail(img: HTMLImageElement): string {
    const thumbCanvas = document.createElement('canvas');
    thumbCanvas.width = 64;
    thumbCanvas.height = 64;
    const thumbCtx = thumbCanvas.getContext('2d')!;

    const size = Math.min(img.width, img.height);
    const sx = (img.width - size) / 2;
    const sy = (img.height - size) / 2;

    thumbCtx.drawImage(img, sx, sy, size, size, 0, 0, 64, 64);

    return thumbCanvas.toDataURL('image/jpeg', 0.8);
  }

  getReanalyzeButton(): HTMLButtonElement | null {
    return document.getElementById('reanalyze-btn') as HTMLButtonElement | null;
  }

  disableReanalyzeButton(): void {
    const btn = this.getReanalyzeButton();
    if (btn) {
      btn.disabled = true;
      btn.textContent = '分析中...';
    }
  }

  enableReanalyzeButton(): void {
    const btn = this.getReanalyzeButton();
    if (btn) {
      btn.disabled = false;
      btn.textContent = '重新分析';
    }
  }
}
