import { DoublePendulum, PendulumPosition } from './engine';

export interface TrailPoint {
  x: number;
  y: number;
}

export interface RendererOptions {
  showArms: boolean;
  showTrail: boolean;
  ballRadius: number;
  handleRadius: number;
  trailColor: string;
  trailWidth: number;
  maxTrailPoints: number;
}

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private originX: number;
  private originY: number;
  private trail: TrailPoint[] = [];
  private frameCount: number = 0;
  private trailInterval: number = 10;

  public options: RendererOptions = {
    showArms: true,
    showTrail: true,
    ballRadius: 8,
    handleRadius: 12,
    trailColor: '#87ceeb',
    trailWidth: 1.5,
    maxTrailPoints: 2000
  };

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('无法获取Canvas 2D上下文');
    this.ctx = ctx;
    this.originX = canvas.width / 2;
    this.originY = canvas.height / 3;
  }

  public getOrigin(): { x: number; y: number } {
    return { x: this.originX, y: this.originY };
  }

  public clearTrail(): void {
    this.trail = [];
  }

  public updateTrail(pos: PendulumPosition): void {
    this.frameCount++;
    if (this.frameCount % this.trailInterval !== 0) return;
    
    this.trail.push({ x: pos.x2, y: pos.y2 });
    if (this.trail.length > this.options.maxTrailPoints) {
      this.trail.shift();
    }
  }

  public setTrailInterval(interval: number): void {
    this.trailInterval = Math.max(1, Math.floor(interval));
  }

  public getTrailInterval(): number {
    return this.trailInterval;
  }

  public drawBackground(): void {
    this.ctx.fillStyle = '#1a1a2e';
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  public drawPolarGrid(l1: number, l2: number): void {
    const gridColor = 'rgba(255, 255, 255, 0.1)';
    this.ctx.strokeStyle = gridColor;
    this.ctx.lineWidth = 1;

    const maxRadius = l1 + l2 + 30;
    const rings = [l1 * 0.5, l1, l1 + l2 * 0.5, l1 + l2];
    
    for (const r of rings) {
      this.ctx.beginPath();
      this.ctx.arc(this.originX, this.originY, r, 0, Math.PI * 2);
      this.ctx.stroke();
    }

    for (let angle = 0; angle < 360; angle += 30) {
      const rad = (angle * Math.PI) / 180;
      const x = this.originX + maxRadius * Math.sin(rad);
      const y = this.originY + maxRadius * Math.cos(rad);
      this.ctx.beginPath();
      this.ctx.moveTo(this.originX, this.originY);
      this.ctx.lineTo(x, y);
      this.ctx.stroke();
    }
  }

  public drawTrail(): void {
    if (!this.options.showTrail || this.trail.length < 1) return;
    
    for (let i = 0; i < this.trail.length; i++) {
      const alpha = (i / this.trail.length) * 0.9;
      this.ctx.globalAlpha = alpha;
      this.ctx.fillStyle = this.options.trailColor;
      this.ctx.beginPath();
      this.ctx.arc(this.trail[i].x, this.trail[i].y, 1.5, 0, Math.PI * 2);
      this.ctx.fill();
    }
    this.ctx.globalAlpha = 1;
  }

  public drawArms(pos: PendulumPosition): void {
    if (!this.options.showArms) return;
    
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.lineCap = 'round';
    
    this.ctx.beginPath();
    this.ctx.moveTo(this.originX, this.originY);
    this.ctx.lineTo(pos.x1, pos.y1);
    this.ctx.stroke();
    
    this.ctx.beginPath();
    this.ctx.moveTo(pos.x1, pos.y1);
    this.ctx.lineTo(pos.x2, pos.y2);
    this.ctx.stroke();
  }

  public drawBalls(pos: PendulumPosition): void {
    const r = this.options.ballRadius;
    
    this.ctx.fillStyle = '#ff6b6b';
    this.ctx.beginPath();
    this.ctx.arc(pos.x1, pos.y1, r, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.fillStyle = '#4ecdc4';
    this.ctx.beginPath();
    this.ctx.arc(pos.x2, pos.y2, r, 0, Math.PI * 2);
    this.ctx.fill();
  }

  public drawPivot(): void {
    this.ctx.fillStyle = '#ffffff';
    this.ctx.beginPath();
    this.ctx.arc(this.originX, this.originY, 4, 0, Math.PI * 2);
    this.ctx.fill();
  }

  public drawHandle(
    centerX: number,
    centerY: number,
    angle: number,
    length: number,
    color: string,
    showLabel: boolean,
    label: string
  ): void {
    const handleX = centerX + length * Math.sin(angle);
    const handleY = centerY + length * Math.cos(angle);
    
    this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    this.ctx.moveTo(centerX, centerY);
    this.ctx.lineTo(handleX, handleY);
    this.ctx.stroke();
    
    if (showLabel) {
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.moveTo(centerX, centerY);
      this.ctx.lineTo(handleX, handleY);
      this.ctx.stroke();
      
      this.ctx.fillStyle = '#ffffff';
      this.ctx.font = 'bold 13px sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      const degrees = Math.round((angle * 180) / Math.PI);
      this.ctx.fillText(`${label}=${degrees}°`, handleX, handleY - this.options.handleRadius - 18);
    }
    
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(handleX, handleY, this.options.handleRadius, 0, Math.PI * 2);
    this.ctx.fill();
    
    this.ctx.strokeStyle = '#ffffff';
    this.ctx.lineWidth = 2;
    this.ctx.beginPath();
    this.ctx.arc(handleX, handleY, this.options.handleRadius, 0, Math.PI * 2);
    this.ctx.stroke();
  }

  public render(
    pendulum: DoublePendulum,
    isDragging1: boolean,
    isDragging2: boolean,
    isHovering: boolean
  ): void {
    const pos = pendulum.getPositions(this.originX, this.originY);
    const showLabels = isDragging1 || isDragging2 || isHovering;
    
    if (!isDragging1 && !isDragging2) {
      this.updateTrail(pos);
    }
    
    this.drawBackground();
    this.drawPolarGrid(pendulum.l1, pendulum.l2);
    this.drawTrail();
    
    const h1x = this.originX + pendulum.l1 * Math.sin(pendulum.initialState.theta1);
    const h1y = this.originY + pendulum.l1 * Math.cos(pendulum.initialState.theta1);
    
    this.drawHandle(
      this.originX,
      this.originY,
      pendulum.initialState.theta1,
      pendulum.l1,
      '#ff6b6b',
      showLabels,
      'θ1'
    );
    this.drawHandle(
      h1x,
      h1y,
      pendulum.initialState.theta2,
      pendulum.l2,
      '#4ecdc4',
      showLabels,
      'θ2'
    );
    
    this.drawArms(pos);
    this.drawBalls(pos);
    this.drawPivot();
  }

  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }
}
