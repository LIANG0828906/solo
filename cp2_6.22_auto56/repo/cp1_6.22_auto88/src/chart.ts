import type { Stock, ChartState, TooltipState, TimeAxis, LineAnimation } from './types';
import { CONFIG } from './types';

interface Coordinate {
  x: number;
  y: number;
}

export class StockChart {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private stocks: Stock[] = [];
  private state: ChartState;
  private tooltip: TooltipState;
  private timeAxis: TimeAxis;
  private lineAnimations: Map<string, LineAnimation> = new Map();
  private gradientCache: Map<string, CanvasGradient> = new Map();
  private backgroundCache: HTMLCanvasElement | null = null;
  private dpr: number = window.devicePixelRatio || 1;
  private chartArea: { x: number; y: number; width: number; height: number } = { x: 0, y: 0, width: 0, height: 0 };
  private priceRange: { min: number; max: number } = { min: 0, max: 0 };
  private onTimeRangeChange: (() => void) | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get 2D context');
    this.ctx = ctx;

    this.state = {
      viewOffset: 0,
      targetViewOffset: 0,
      hoveredPoint: null,
      isDragging: false,
      dragStartX: 0,
      dragStartOffset: 0
    };

    this.tooltip = {
      visible: false,
      x: 0,
      y: 0,
      value: 0,
      stockName: '',
      opacity: 0,
      scale: 0.8,
      targetOpacity: 0,
      targetScale: 0.8
    };

    this.timeAxis = {
      x: 0,
      y: 0,
      width: 0,
      height: CONFIG.TIME_AXIS_HEIGHT,
      thumbX: 0,
      thumbWidth: 100
    };

    this.resize();
    this.setupEventListeners();
  }

  public setOnTimeRangeChange(callback: () => void): void {
    this.onTimeRangeChange = callback;
  }

  public updateStocks(stocks: Stock[]): void {
    this.stocks = stocks;
    this.updatePriceRange();
    
    stocks.forEach(stock => {
      if (!this.lineAnimations.has(stock.id)) {
        this.lineAnimations.set(stock.id, {
          progress: 0,
          startTime: performance.now(),
          duration: CONFIG.ANIMATION_DURATION_LINE
        });
      }
    });
  }

  private updatePriceRange(): void {
    let min = Infinity;
    let max = -Infinity;
    const visibleRange = this.getVisibleDataRange();

    this.stocks.forEach(stock => {
      for (let i = visibleRange.start; i < visibleRange.end && i < stock.data.length; i++) {
        const price = stock.data[i].price;
        min = Math.min(min, price);
        max = Math.max(max, price);
      }
    });

    if (min === Infinity || max === -Infinity) {
      this.stocks.forEach(stock => {
        min = Math.min(min, stock.basePrice * 0.9);
        max = Math.max(max, stock.basePrice * 1.1);
      });
    }

    const padding = (max - min) * 0.1;
    this.priceRange = {
      min: min - padding,
      max: max + padding
    };
  }

  private getVisibleDataRange(): { start: number; end: number } {
    const totalPoints = Math.max(...this.stocks.map(s => s.data.length));
    const visiblePoints = CONFIG.VISIBLE_POINTS;
    const maxOffset = Math.max(0, totalPoints - visiblePoints);
    const offset = Math.floor(this.state.viewOffset * maxOffset);
    const start = Math.max(0, offset);
    const end = Math.min(totalPoints, start + visiblePoints);
    return { start, end };
  }

  public resize(): void {
    const container = this.canvas.parentElement;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    this.dpr = window.devicePixelRatio || 1;
    
    this.canvas.width = rect.width * this.dpr;
    this.canvas.height = rect.height * this.dpr;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
    
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const chartHeight = rect.height * CONFIG.CHART_HEIGHT_RATIO;
    this.chartArea = {
      x: 60,
      y: 20,
      width: rect.width - 80,
      height: chartHeight - 40
    };

    this.timeAxis.x = this.chartArea.x;
    this.timeAxis.y = chartHeight + 10;
    this.timeAxis.width = this.chartArea.width;
    this.timeAxis.thumbX = this.timeAxis.width - this.timeAxis.thumbWidth;

    this.backgroundCache = null;
    this.gradientCache.clear();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    this.canvas.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    window.addEventListener('resize', this.resize.bind(this));
  }

  private handleMouseMove(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.state.isDragging) {
      const deltaX = x - this.state.dragStartX;
      const maxDrag = this.timeAxis.width - this.timeAxis.thumbWidth;
      const newThumbX = Math.max(0, Math.min(maxDrag, this.state.dragStartOffset + deltaX));
      const newOffset = maxDrag > 0 ? newThumbX / maxDrag : 0;
      this.state.targetViewOffset = newOffset;
      this.state.viewOffset = newOffset;
      this.updatePriceRange();
      if (this.onTimeRangeChange) {
        this.onTimeRangeChange();
      }
      return;
    }

    if (this.isInChartArea(x, y)) {
      this.findNearestPoint(x, y);
    } else {
      this.hideTooltip();
    }
  }

  private isInChartArea(x: number, y: number): boolean {
    return x >= this.chartArea.x && 
           x <= this.chartArea.x + this.chartArea.width &&
           y >= this.chartArea.y && 
           y <= this.chartArea.y + this.chartArea.height;
  }

  private isInThumb(x: number, y: number): boolean {
    const thumbLeft = this.timeAxis.x + this.timeAxis.thumbX;
    return x >= thumbLeft && 
           x <= thumbLeft + this.timeAxis.thumbWidth &&
           y >= this.timeAxis.y && 
           y <= this.timeAxis.y + this.timeAxis.height;
  }

  private findNearestPoint(mouseX: number, mouseY: number): void {
    const visibleRange = this.getVisibleDataRange();
    const xScale = this.chartArea.width / CONFIG.VISIBLE_POINTS;
    
    let nearestDist = Infinity;
    let nearestStock: Stock | null = null;
    let nearestIndex = -1;
    let nearestPoint: Coordinate | null = null;

    for (let s = 0; s < this.stocks.length; s++) {
      const stock = this.stocks[s];
      for (let i = visibleRange.start; i < visibleRange.end && i < stock.data.length; i++) {
        const pointX = this.chartArea.x + (i - visibleRange.start) * xScale;
        const pointY = this.priceToY(stock.data[i].price);
        
        const dist = Math.sqrt((mouseX - pointX) ** 2 + (mouseY - pointY) ** 2);
        if (dist < nearestDist && dist < 20) {
          nearestDist = dist;
          nearestStock = stock;
          nearestIndex = i;
          nearestPoint = { x: pointX, y: pointY };
        }
      }
    }

    if (nearestStock && nearestIndex >= 0 && nearestPoint) {
      const foundStock = nearestStock;
      const foundPoint = nearestPoint;
      this.state.hoveredPoint = {
        stockId: foundStock.id,
        index: nearestIndex,
        x: foundPoint.x,
        y: foundPoint.y
      };
      this.showTooltip(foundPoint.x, foundPoint.y, foundStock.data[nearestIndex].price, foundStock.name);
    } else {
      this.state.hoveredPoint = null;
      this.hideTooltip();
    }
  }

  private showTooltip(x: number, y: number, value: number, stockName: string): void {
    this.tooltip.x = x;
    this.tooltip.y = y;
    this.tooltip.value = value;
    this.tooltip.stockName = stockName;
    this.tooltip.targetOpacity = 1;
    this.tooltip.targetScale = 1;
  }

  private hideTooltip(): void {
    this.tooltip.targetOpacity = 0;
    this.tooltip.targetScale = 0.8;
  }

  private handleMouseDown(e: MouseEvent): void {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (this.isInThumb(x, y)) {
      this.state.isDragging = true;
      this.state.dragStartX = x;
      this.state.dragStartOffset = this.timeAxis.thumbX;
      this.canvas.style.cursor = 'grabbing';
    }
  }

  private handleMouseUp(): void {
    if (this.state.isDragging) {
      this.state.isDragging = false;
      this.canvas.style.cursor = 'default';
    }
  }

  private handleMouseLeave(): void {
    this.state.isDragging = false;
    this.state.hoveredPoint = null;
    this.hideTooltip();
    this.canvas.style.cursor = 'default';
  }

  private priceToY(price: number): number {
    const { min, max } = this.priceRange;
    const ratio = (price - min) / (max - min);
    return this.chartArea.y + this.chartArea.height - ratio * this.chartArea.height;
  }

  public render(): void {
    this.updateAnimations();
    this.drawBackground();
    this.drawGrid();
    this.drawLines();
    this.drawAnnotations();
    this.drawHoveredPoint();
    this.drawTimeAxis();
    this.drawTooltip();
    this.drawPriceScale();
  }

  private updateAnimations(): void {
    const now = performance.now();

    this.lineAnimations.forEach(anim => {
      if (anim.progress < 1) {
        const elapsed = now - anim.startTime;
        anim.progress = Math.min(1, elapsed / anim.duration);
      }
    });

    if (!this.state.isDragging && Math.abs(this.state.viewOffset - this.state.targetViewOffset) > 0.001) {
      const diff = this.state.targetViewOffset - this.state.viewOffset;
      this.state.viewOffset += diff * 0.15;
      if (Math.abs(diff) < 0.001) {
        this.state.viewOffset = this.state.targetViewOffset;
      }
      this.updatePriceRange();
      const maxDrag = this.timeAxis.width - this.timeAxis.thumbWidth;
      this.timeAxis.thumbX = this.state.viewOffset * maxDrag;
    }

    this.tooltip.opacity += (this.tooltip.targetOpacity - this.tooltip.opacity) * 0.2;
    this.tooltip.scale += (this.tooltip.targetScale - this.tooltip.scale) * 0.2;
  }

  private drawBackground(): void {
    if (this.canvas.width <= 0 || this.canvas.height <= 0) return;
    
    if (this.backgroundCache && this.backgroundCache.width > 0 && this.backgroundCache.height > 0) {
      this.ctx.drawImage(this.backgroundCache, 0, 0);
      return;
    }

    const cache = document.createElement('canvas');
    cache.width = this.canvas.width;
    cache.height = this.canvas.height;
    
    if (cache.width <= 0 || cache.height <= 0) return;
    
    const cacheCtx = cache.getContext('2d');
    if (!cacheCtx) return;

    cacheCtx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    const gradient = cacheCtx.createRadialGradient(
      this.chartArea.x + this.chartArea.width / 2,
      this.chartArea.y + this.chartArea.height / 2,
      0,
      this.chartArea.x + this.chartArea.width / 2,
      this.chartArea.y + this.chartArea.height / 2,
      Math.max(this.chartArea.width, this.chartArea.height) * 0.8
    );
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#0f0f1a');

    cacheCtx.fillStyle = gradient;
    cacheCtx.fillRect(0, 0, this.canvas.width / this.dpr, this.canvas.height / this.dpr);

    this.backgroundCache = cache;
    this.ctx.drawImage(cache, 0, 0);
  }

  private drawGrid(): void {
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    this.ctx.lineWidth = 0.3;

    for (let x = this.chartArea.x; x <= this.chartArea.x + this.chartArea.width; x += CONFIG.GRID_SPACING) {
      this.ctx.beginPath();
      this.ctx.moveTo(x, this.chartArea.y);
      this.ctx.lineTo(x, this.chartArea.y + this.chartArea.height);
      this.ctx.stroke();
    }

    for (let y = this.chartArea.y; y <= this.chartArea.y + this.chartArea.height; y += CONFIG.GRID_SPACING) {
      this.ctx.beginPath();
      this.ctx.moveTo(this.chartArea.x, y);
      this.ctx.lineTo(this.chartArea.x + this.chartArea.width, y);
      this.ctx.stroke();
    }
  }

  private drawPriceScale(): void {
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.font = '11px "JetBrains Mono", monospace';
    this.ctx.textAlign = 'right';
    this.ctx.textBaseline = 'middle';

    const steps = 5;
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      const price = this.priceRange.min + (this.priceRange.max - this.priceRange.min) * ratio;
      const y = this.chartArea.y + this.chartArea.height * (1 - ratio);
      this.ctx.fillText(price.toFixed(2), this.chartArea.x - 10, y);
    }
  }

  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  private rgbToHex(r: number, g: number, b: number): string {
    return '#' + [r, g, b].map(x => {
      const hex = Math.round(x).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    }).join('');
  }

  private lightenColor(hex: string, percent: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    return this.rgbToHex(
      rgb.r + (255 - rgb.r) * percent,
      rgb.g + (255 - rgb.g) * percent,
      rgb.b + (255 - rgb.b) * percent
    );
  }

  private darkenColor(hex: string, percent: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;
    return this.rgbToHex(
      rgb.r * (1 - percent),
      rgb.g * (1 - percent),
      rgb.b * (1 - percent)
    );
  }

  private getStockGradient(stock: Stock): CanvasGradient {
    let gradient = this.gradientCache.get(stock.id);
    if (!gradient) {
      const baseColor = stock.color;
      gradient = this.ctx.createLinearGradient(
        this.chartArea.x,
        0,
        this.chartArea.x + this.chartArea.width,
        0
      );
      gradient.addColorStop(0, this.darkenColor(baseColor, 0.3));
      gradient.addColorStop(0.5, baseColor);
      gradient.addColorStop(1, this.lightenColor(baseColor, 0.3));
      this.gradientCache.set(stock.id, gradient);
    }
    return gradient;
  }

  private drawLines(): void {
    const visibleRange = this.getVisibleDataRange();
    const xScale = this.chartArea.width / CONFIG.VISIBLE_POINTS;

    this.stocks.forEach(stock => {
      const anim = this.lineAnimations.get(stock.id);
      const progress = anim ? anim.progress : 1;
      const visibleCount = visibleRange.end - visibleRange.start;
      const drawCount = Math.floor(visibleCount * progress);
      if (drawCount < 2) return;

      this.ctx.strokeStyle = this.getStockGradient(stock);
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';
      this.ctx.lineJoin = 'round';

      this.ctx.beginPath();
      let started = false;

      for (let i = 0; i < drawCount && visibleRange.start + i < stock.data.length; i++) {
        const dataIndex = visibleRange.start + i;
        const point = stock.data[dataIndex];
        const x = this.chartArea.x + i * xScale;
        const y = this.priceToY(point.price);

        if (!started) {
          this.ctx.moveTo(x, y);
          started = true;
        } else {
          this.ctx.lineTo(x, y);
        }
      }

      this.ctx.stroke();
    });
  }

  private drawAnnotations(): void {
    const visibleRange = this.getVisibleDataRange();
    const xScale = this.chartArea.width / CONFIG.VISIBLE_POINTS;

    this.stocks.forEach(stock => {
      stock.annotations.forEach(ann => {
        for (let i = visibleRange.start; i < visibleRange.end && i < stock.data.length; i++) {
          if (stock.data[i].timestamp === ann.timestamp) {
            const x = this.chartArea.x + (i - visibleRange.start) * xScale;
            const y = this.priceToY(stock.data[i].price);

            this.ctx.beginPath();
            this.ctx.arc(x, y, 8, 0, Math.PI * 2);
            this.ctx.fillStyle = ann.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#fff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            this.ctx.beginPath();
            this.ctx.arc(x, y, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = '#fff';
            this.ctx.fill();
            break;
          }
        }
      });
    });
  }

  private drawHoveredPoint(): void {
    if (!this.state.hoveredPoint) return;

    const { x, y, stockId } = this.state.hoveredPoint;
    const stock = this.stocks.find(s => s.id === stockId);
    if (!stock) return;

    this.ctx.beginPath();
    this.ctx.arc(x, y, 6, 0, Math.PI * 2);
    this.ctx.fillStyle = '#fff';
    this.ctx.fill();
    this.ctx.strokeStyle = stock.color;
    this.ctx.lineWidth = 3;
    this.ctx.stroke();

    this.ctx.beginPath();
    this.ctx.arc(x, y, 3, 0, Math.PI * 2);
    this.ctx.fillStyle = stock.color;
    this.ctx.fill();
  }

  private drawTimeAxis(): void {
    const { x, y, width, height, thumbX, thumbWidth } = this.timeAxis;

    this.ctx.fillStyle = 'rgba(30, 58, 138, 0.3)';
    this.ctx.fillRect(x, y, width, height);

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 1;
    this.ctx.strokeRect(x, y, width, height);

    const thumbLeft = x + thumbX;
    const gradient = this.ctx.createLinearGradient(thumbLeft, y, thumbLeft + thumbWidth, y);
    gradient.addColorStop(0, '#1e40af');
    gradient.addColorStop(1, '#3b82f6');
    
    this.ctx.fillStyle = gradient;
    this.beginRoundedRect(thumbLeft, y, thumbWidth, height, 6);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.beginRoundedRect(thumbLeft, y, thumbWidth, height, 6);
    this.ctx.stroke();

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    for (let i = 0; i < 3; i++) {
      const lineX = thumbLeft + thumbWidth / 4 + i * (thumbWidth / 4);
      this.ctx.fillRect(lineX - 1, y + height / 3, 2, height / 3);
    }

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    this.ctx.font = '10px "JetBrains Mono", monospace';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    
    const visibleRange = this.getVisibleDataRange();
    const startTime = this.stocks[0]?.data[visibleRange.start]?.timestamp || Date.now();
    const endTime = this.stocks[0]?.data[visibleRange.end - 1]?.timestamp || Date.now();
    
    this.ctx.fillText(this.formatTime(startTime), x + 40, y + height / 2);
    this.ctx.fillText(this.formatTime(endTime), x + width - 40, y + height / 2);
  }

  private formatTime(timestamp: number): string {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}:${date.getSeconds().toString().padStart(2, '0')}`;
  }

  private beginRoundedRect(x: number, y: number, w: number, h: number, r: number): void {
    this.ctx.beginPath();
    this.ctx.moveTo(x + r, y);
    this.ctx.lineTo(x + w - r, y);
    this.ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    this.ctx.lineTo(x + w, y + h - r);
    this.ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    this.ctx.lineTo(x + r, y + h);
    this.ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    this.ctx.lineTo(x, y + r);
    this.ctx.quadraticCurveTo(x, y, x + r, y);
    this.ctx.closePath();
  }

  private drawTooltip(): void {
    if (this.tooltip.opacity < 0.01) return;

    const { x, y, value, stockName, opacity, scale } = this.tooltip;
    
    this.ctx.save();
    this.ctx.globalAlpha = opacity;
    this.ctx.translate(x, y - 15);
    this.ctx.scale(scale, scale);

    const text = value.toFixed(2);
    const nameText = stockName;
    this.ctx.font = 'bold 14px "JetBrains Mono", monospace';
    const textWidth = this.ctx.measureText(text).width;
    this.ctx.font = '11px "Inter", sans-serif';
    const nameWidth = this.ctx.measureText(nameText).width;
    const width = Math.max(textWidth, nameWidth) + 24;
    const height = 48;

    this.ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
    this.ctx.shadowBlur = 10;
    this.ctx.shadowOffsetY = 4;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.beginRoundedRect(-width / 2, -height - 10, width, height, 8);
    this.ctx.fill();

    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    this.ctx.lineWidth = 1;
    this.beginRoundedRect(-width / 2, -height - 10, width, height, 8);
    this.ctx.stroke();

    this.ctx.shadowBlur = 0;

    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    this.ctx.font = '11px "Inter", sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(nameText, 0, -height / 2 - 10 - 8);

    this.ctx.fillStyle = '#fff';
    this.ctx.font = 'bold 14px "JetBrains Mono", monospace';
    this.ctx.fillText(text, 0, -height / 2 - 10 + 8);

    this.ctx.beginPath();
    this.ctx.moveTo(-6, -10);
    this.ctx.lineTo(6, -10);
    this.ctx.lineTo(0, 0);
    this.ctx.closePath();
    this.ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
    this.ctx.fill();

    this.ctx.restore();
  }

  public getVisibleStartIndex(): number {
    return this.getVisibleDataRange().start;
  }

  public getVisibleEndIndex(): number {
    return this.getVisibleDataRange().end;
  }
}
