import { MirrorShape, Point, LineSegment } from './types';
import { LightSource } from './lightSource';

export class Mirror {
  public x: number;
  public y: number;
  public width: number;
  public height: number;
  public angle: number;
  public shape: MirrorShape;
  public id: number;
  public opacity: number = 0.7;

  private static idCounter = 0;

  constructor(
    x: number,
    y: number,
    width: number,
    height: number,
    angle: number = 0,
    shape: MirrorShape = 'rectangle'
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.angle = angle;
    this.shape = shape;
    this.id = Mirror.idCounter++;
  }

  getCorners(): Point[] {
    const rad = (this.angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);

    const hw = this.width / 2;
    const hh = this.height / 2;

    let localCorners: Point[];
    if (this.shape === 'rectangle') {
      localCorners = [
        { x: -hw, y: -hh },
        { x: hw, y: -hh },
        { x: hw, y: hh },
        { x: -hw, y: hh }
      ];
    } else {
      localCorners = [
        { x: hw, y: 0 },
        { x: -hw, y: -hh },
        { x: -hw, y: hh }
      ];
    }

    return localCorners.map(c => ({
      x: this.x + c.x * cos - c.y * sin,
      y: this.y + c.x * sin + c.y * cos
    }));
  }

  getEdges(): LineSegment[] {
    const corners = this.getCorners();
    const edges: LineSegment[] = [];
    for (let i = 0; i < corners.length; i++) {
      edges.push({
        start: corners[i],
        end: corners[(i + 1) % corners.length]
      });
    }
    return edges;
  }

  containsPoint(px: number, py: number): boolean {
    const rad = (-this.angle * Math.PI) / 180;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    const localX = (px - this.x) * cos - (py - this.y) * sin;
    const localY = (px - this.x) * sin + (py - this.y) * cos;

    const hw = this.width / 2;
    const hh = this.height / 2;

    if (this.shape === 'rectangle') {
      return localX >= -hw && localX <= hw && localY >= -hh && localY <= hh;
    } else {
      if (localX < -hw || localX > hw) return false;
      const t = (localX + hw) / (2 * hw);
      const yAtX = hh * (1 - 2 * Math.abs(t - 0.5));
      return Math.abs(localY) <= yAtX;
    }
  }

  getRotationHandlePos(): Point {
    const handleDist = this.width / 2 + 30;
    const rad = (this.angle * Math.PI) / 180;
    return {
      x: this.x + Math.cos(rad) * handleDist,
      y: this.y + Math.sin(rad) * handleDist
    };
  }

  isOnRotationHandle(px: number, py: number, radius: number = 10): boolean {
    const handle = this.getRotationHandlePos();
    const dx = px - handle.x;
    const dy = py - handle.y;
    return dx * dx + dy * dy <= radius * radius;
  }

  draw(ctx: CanvasRenderingContext2D, _lights: LightSource[], showHandles: boolean = false, globalOpacity: number = this.opacity): void {
    const corners = this.getCorners();
    ctx.save();

    ctx.globalAlpha = globalOpacity;

    this.drawMirrorFill(ctx, corners);
    this.drawMirrorEdge(ctx, corners);

    if (this.shape === 'rectangle') {
      this.drawBrushedTexture(ctx, corners);
    } else {
      this.drawTriHatch(ctx, corners);
    }

    ctx.restore();
    ctx.save();

    if (showHandles) {
      this.drawAngleIndicator(ctx);
      const hp = this.getRotationHandlePos();
      ctx.beginPath();
      ctx.arc(hp.x, hp.y, 7, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,215,0,0.9)';
      ctx.shadowColor = 'rgba(255,215,0,0.8)';
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }

    this.drawAngleLabel(ctx);
    ctx.restore();
  }

  private drawMirrorFill(ctx: CanvasRenderingContext2D, corners: Point[]): void {
    const grad = ctx.createLinearGradient(
      corners[0].x, corners[0].y,
      corners[2].x, corners[2].y
    );
    grad.addColorStop(0, 'rgba(180, 200, 220, 0.4)');
    grad.addColorStop(0.5, 'rgba(220, 230, 240, 0.6)');
    grad.addColorStop(1, 'rgba(140, 160, 180, 0.3)');

    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) {
      ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
  }

  private drawMirrorEdge(ctx: CanvasRenderingContext2D, corners: Point[]): void {
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) {
      ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();

    const edgeGrad = ctx.createLinearGradient(
      corners[0].x, corners[0].y,
      corners[2].x, corners[2].y
    );
    edgeGrad.addColorStop(0, '#c0c8d0');
    edgeGrad.addColorStop(0.3, '#f0f4f8');
    edgeGrad.addColorStop(0.7, '#e0e4e8');
    edgeGrad.addColorStop(1, '#90a0b0');

    ctx.strokeStyle = edgeGrad;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  private drawBrushedTexture(ctx: CanvasRenderingContext2D, corners: Point[]): void {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) {
      ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();
    ctx.clip();

    const rad = (this.angle * Math.PI) / 180;
    const dirX = Math.cos(rad);
    const dirY = Math.sin(rad);
    const perpX = -dirY;
    const perpY = dirX;

    const center: Point = { x: this.x, y: this.y };
    const halfDiag = (this.width + this.height) / 1.4;

    const lineCount = Math.floor(this.height / 4);
    for (let i = -lineCount; i <= lineCount; i++) {
      const offset = i * 3.5;
      const alpha = 0.07 + Math.random() * 0.04;
      const start: Point = {
        x: center.x + perpX * offset - dirX * halfDiag,
        y: center.y + perpY * offset - dirY * halfDiag
      };
      const end: Point = {
        x: center.x + perpX * offset + dirX * halfDiag,
        y: center.y + perpY * offset + dirY * halfDiag
      };
      ctx.beginPath();
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);
      ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawTriHatch(ctx: CanvasRenderingContext2D, corners: Point[]): void {
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(corners[0].x, corners[0].y);
    for (let i = 1; i < corners.length; i++) {
      ctx.lineTo(corners[i].x, corners[i].y);
    }
    ctx.closePath();
    ctx.clip();

    const rad = (this.angle * Math.PI) / 180;
    const dirX = Math.cos(rad);
    const dirY = Math.sin(rad);
    const halfDiag = (this.width + this.height);
    for (let i = -10; i <= 10; i++) {
      const offset = i * 5;
      ctx.beginPath();
      ctx.moveTo(
        this.x - dirX * halfDiag - dirY * offset,
        this.y - dirY * halfDiag + dirX * offset
      );
      ctx.lineTo(
        this.x + dirX * halfDiag - dirY * offset,
        this.y + dirY * halfDiag + dirX * offset
      );
      ctx.strokeStyle = 'rgba(255,255,255,0.09)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    ctx.restore();
  }

  private drawAngleIndicator(ctx: CanvasRenderingContext2D): void {
    const rad = (this.angle * Math.PI) / 180;
    const halfW = this.width / 2;
    const len = halfW + 18;
    const sx = this.x + Math.cos(rad) * halfW;
    const sy = this.y + Math.sin(rad) * halfW;
    const ex = this.x + Math.cos(rad) * len;
    const ey = this.y + Math.sin(rad) * len;

    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(ex, ey);
    ctx.strokeStyle = 'rgba(255,215,0,0.5)';
    ctx.setLineDash([4, 3]);
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }

  private drawAngleLabel(ctx: CanvasRenderingContext2D): void {
    const normalizedAngle = ((this.angle % 360) + 360) % 360;
    const displayAngle = normalizedAngle > 180 ? normalizedAngle - 360 : normalizedAngle;
    const labelText = `${displayAngle.toFixed(0)}°`;

    const offset = this.height / 2 + 18;
    const rad = ((this.angle - 90) * Math.PI) / 180;
    const lx = this.x + Math.cos(rad) * offset;
    const ly = this.y + Math.sin(rad) * offset;

    ctx.font = 'bold 11px Consolas, monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const metrics = ctx.measureText(labelText);
    const padX = 6;
    const boxW = metrics.width + padX * 2;
    const boxH = 16;

    ctx.fillStyle = 'rgba(10, 10, 25, 0.85)';
    ctx.strokeStyle = 'rgba(255,215,0,0.5)';
    ctx.lineWidth = 1;
    const boxX = lx - boxW / 2;
    const boxY = ly - boxH / 2;
    this.roundRect(ctx, boxX, boxY, boxW, boxH, 4);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ffd966';
    ctx.fillText(labelText, lx, ly);
  }

  private roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
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

  clone(): Mirror {
    const m = new Mirror(this.x, this.y, this.width, this.height, this.angle, this.shape);
    m.opacity = this.opacity;
    m.id = this.id;
    return m;
  }
}
