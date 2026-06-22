import * as d3 from 'd3';

interface HeatmapCell {
  userType: string;
  stepName: string;
  value: number;
  userCount: number;
}

interface HeatmapConfig {
  container: HTMLDivElement;
  data: Record<string, Record<string, { avgDwellTime: number; userCount: number }>>;
  steps: string[];
  maxDwellTime: number;
  onHover?: (cell: HeatmapCell | null) => void;
}

const COLOR_LOW = '#3B82F6';
const COLOR_HIGH = '#EF4444';

export class HeatmapRenderer {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private tooltip: HTMLDivElement;
  private width = 0;
  private height = 0;
  private cellWidth = 0;
  private cellHeight = 0;
  private padding = { top: 40, right: 20, bottom: 30, left: 90 };
  private data: Record<string, Record<string, { avgDwellTime: number; userCount: number }>> = {};
  private steps: string[] = [];
  private userTypes: string[] = [];
  private maxDwellTime = 300;
  private colorScale: d3.ScaleLinear<string, string> = d3.scaleLinear<string>()
    .domain([0, 300])
    .range([COLOR_LOW, COLOR_HIGH])
    .clamp(true);
  private transform = d3.zoomIdentity;
  private zoom: d3.ZoomBehavior<HTMLCanvasElement, unknown> | null = null;
  private container: HTMLDivElement;
  private animFrame = 0;
  private currentColors: Map<string, { r: number; g: number; b: number; target: string }> = new Map();

  constructor(config: HeatmapConfig) {
    this.container = config.container;
    this.data = config.data;
    this.steps = config.steps;
    this.maxDwellTime = config.maxDwellTime || 300;
    this.colorScale.domain([0, this.maxDwellTime]);

    this.userTypes = Object.keys(this.data);

    this.canvas = document.createElement('canvas');
    this.canvas.style.width = '100%';
    this.canvas.style.height = '100%';
    this.canvas.style.cursor = 'crosshair';
    this.container.appendChild(this.canvas);

    this.tooltip = document.createElement('div');
    this.tooltip.style.cssText = `
      position: absolute; display: none; background: #1E293B; color: #F8FAFC;
      padding: 8px 12px; border-radius: 8px; font-size: 12px; pointer-events: none;
      box-shadow: 0 4px 12px rgba(0,0,0,0.5); z-index: 100; border: 1px solid #334155;
    `;
    this.container.appendChild(this.tooltip);

    this.ctx = this.canvas.getContext('2d')!;
    this.resize();
    this.bindEvents();
    this.draw();
  }

  private resize() {
    const rect = this.container.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.scale(dpr, dpr);

    const innerWidth = this.width - this.padding.left - this.padding.right;
    const innerHeight = this.height - this.padding.top - this.padding.bottom;
    this.cellWidth = this.steps.length > 0 ? innerWidth / this.steps.length : innerWidth;
    this.cellHeight = this.userTypes.length > 0 ? innerHeight / this.userTypes.length : innerHeight;
  }

  private bindEvents() {
    this.zoom = d3.zoom<HTMLCanvasElement, unknown>()
      .scaleExtent([0.5, 4])
      .on('zoom', (event) => {
        this.transform = event.transform;
        this.draw();
      });
    d3.select(this.canvas).call(this.zoom!);

    this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => {
      this.tooltip.style.display = 'none';
    });
  }

  private getCellAt(mx: number, my: number): HeatmapCell | null {
    const x = (mx - this.padding.left - this.transform.x) / this.transform.k;
    const y = (my - this.padding.top - this.transform.y) / this.transform.k;

    const col = Math.floor(x / this.cellWidth);
    const row = Math.floor(y / this.cellHeight);

    if (col < 0 || col >= this.steps.length || row < 0 || row >= this.userTypes.length) {
      return null;
    }

    const userType = this.userTypes[row];
    const stepName = this.steps[col];
    const cellData = this.data[userType]?.[stepName];

    return {
      userType,
      stepName,
      value: cellData?.avgDwellTime || 0,
      userCount: cellData?.userCount || 0,
    };
  }

  private onMouseMove(e: MouseEvent) {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    const cell = this.getCellAt(mx, my);
    if (cell) {
      this.tooltip.style.display = 'block';
      this.tooltip.innerHTML = `
        <div style="font-weight:600;margin-bottom:4px">${cell.userType} - ${cell.stepName}</div>
        <div>平均停留: <span style="color:#3B82F6">${cell.value.toFixed(1)}s</span></div>
        <div>用户数: <span style="color:#10B981">${cell.userCount}</span></div>
      `;
      this.tooltip.style.left = (mx + 12) + 'px';
      this.tooltip.style.top = (my - 10) + 'px';
    } else {
      this.tooltip.style.display = 'none';
    }
  }

  private draw() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(this.padding.left, this.padding.top,
      this.width - this.padding.left - this.padding.right,
      this.height - this.padding.top - this.padding.bottom);

    ctx.save();
    ctx.translate(this.padding.left + this.transform.x, this.padding.top + this.transform.y);
    ctx.scale(this.transform.k, this.transform.k);

    for (let row = 0; row < this.userTypes.length; row++) {
      for (let col = 0; col < this.steps.length; col++) {
        const userType = this.userTypes[row];
        const stepName = this.steps[col];
        const cellData = this.data[userType]?.[stepName];
        const value = cellData?.avgDwellTime || 0;
        const color = this.colorScale(Math.min(value, this.maxDwellTime));

        const x = col * this.cellWidth;
        const y = row * this.cellHeight;

        ctx.fillStyle = color;
        ctx.beginPath();
        const r = 4;
        ctx.roundRect(x + 2, y + 2, this.cellWidth - 4, this.cellHeight - 4, r);
        ctx.fill();

        if (this.cellWidth > 40 && this.cellHeight > 30) {
          ctx.fillStyle = '#F8FAFC';
          ctx.font = '11px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${value.toFixed(1)}s`, x + this.cellWidth / 2, y + this.cellHeight / 2);
        }
      }
    }

    ctx.restore();

    ctx.fillStyle = '#94A3B8';
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let row = 0; row < this.userTypes.length; row++) {
      const y = this.padding.top + row * this.cellHeight + this.cellHeight / 2;
      ctx.fillText(this.userTypes[row], this.padding.left - 8, y);
    }

    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    for (let col = 0; col < this.steps.length; col++) {
      const x = this.padding.left + col * this.cellWidth + this.cellWidth / 2;
      ctx.fillText(this.steps[col], x, this.height - this.padding.bottom + 8);
    }
  }

  updateData(data: Record<string, Record<string, { avgDwellTime: number; userCount: number }>>, steps: string[]) {
    this.data = data;
    this.steps = steps;
    this.userTypes = Object.keys(data);
    this.resize();
    this.draw();
  }

  destroy() {
    if (this.animFrame) cancelAnimationFrame(this.animFrame);
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('mouseleave', this.onMouseMove);
    d3.select(this.canvas).on('.zoom', null);
    if (this.container.contains(this.canvas)) this.container.removeChild(this.canvas);
    if (this.container.contains(this.tooltip)) this.container.removeChild(this.tooltip);
  }
}
