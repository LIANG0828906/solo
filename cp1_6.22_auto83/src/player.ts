
import { GameMap, LOGICAL_WIDTH, LOGICAL_HEIGHT, rayRectIntersect } from './map';

export const PLAYER_RADIUS = 14;
export const PLAYER_SPEED = 90;
export const PLAYER_VISION_ANGLE = Math.PI / 2;
export const PLAYER_VISION_RANGE = 200;

export class Player {
  x: number;
  y: number;
  direction: number = 0;
  targetX: number;
  targetY: number;
  hiding: boolean = false;
  hideAnim: number = 0;
  mouseX: number = LOGICAL_WIDTH / 2;
  mouseY: number = LOGICAL_HEIGHT / 2;

  constructor(startX: number, startY: number) {
    this.x = startX;
    this.y = startY;
    this.targetX = startX;
    this.targetY = startY;
  }

  setMousePosition(mx: number, my: number): void {
    this.mouseX = mx;
    this.mouseY = my;
  }

  update(dt: number, map: GameMap): void {
    const dx = this.mouseX - this.x;
    const dy = this.mouseY - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 2) {
      this.direction = Math.atan2(dy, dx);
    }
    if (dist > 10) {
      const moveX = (dx / dist) * PLAYER_SPEED * dt;
      const moveY = (dy / dist) * PLAYER_SPEED * dt;
      this.tryMove(moveX, moveY, map);
    }
    const shouldHide = this.checkHiding(map);
    this.hiding = shouldHide;
    const targetAnim = shouldHide ? 1 : 0;
    this.hideAnim += (targetAnim - this.hideAnim) * Math.min(1, dt * 8);
  }

  private tryMove(mx: number, my: number, map: GameMap): void {
    const newX = this.x + mx;
    if (!map.isPointBlocked(newX, this.y, PLAYER_RADIUS)) {
      this.x = newX;
    }
    const newY = this.y + my;
    if (!map.isPointBlocked(this.x, newY, PLAYER_RADIUS)) {
      this.y = newY;
    }
  }

  private checkHiding(map: GameMap): boolean {
    for (const o of map.obstacles) {
      const cx = o.x + o.width / 2;
      const cy = o.y + o.height / 2;
      const ddx = this.x - cx;
      const ddy = this.y - cy;
      const distToC = Math.sqrt(ddx * ddx + ddy * ddy);
      if (distToC < Math.max(o.width, o.height) / 2 + 30) {
        return true;
      }
    }
    return false;
  }

  getActualOpacity(): number {
    return 1 - this.hideAnim * 0.5;
  }

  render(ctx: CanvasRenderingContext2D, map: GameMap): void {
    this.renderVisionCone(ctx, map);
    const alpha = this.getActualOpacity();
    ctx.save();
    ctx.globalAlpha = alpha;
    const grad = ctx.createRadialGradient(this.x - 4, this.y - 4, 2, this.x, this.y, PLAYER_RADIUS);
    grad.addColorStop(0, '#4a4a4a');
    grad.addColorStop(1, '#0a0a0a');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, PLAYER_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.stroke();
    if (this.hideAnim > 0.05) {
      ctx.globalAlpha = this.hideAnim;
      ctx.strokeStyle = '#88ccff';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(this.x, this.y, PLAYER_RADIUS + 5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.globalAlpha = alpha;
    }
    const eyeX = this.x + Math.cos(this.direction) * (PLAYER_RADIUS * 0.5);
    const eyeY = this.y + Math.sin(this.direction) * (PLAYER_RADIUS * 0.5);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private renderVisionCone(ctx: CanvasRenderingContext2D, map: GameMap): void {
    const steps = 40;
    const halfAngle = PLAYER_VISION_ANGLE / 2;
    const points: { x: number; y: number }[] = [{ x: this.x, y: this.y }];
    const rects = map.getAllBlockingRects();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = this.direction - halfAngle + PLAYER_VISION_ANGLE * t;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      let maxT = PLAYER_VISION_RANGE;
      for (const r of rects) {
        const rt = rayRectIntersect(this.x, this.y, dx, dy, r.x, r.y, r.width, r.height);
        if (rt < maxT) maxT = rt;
      }
      points.push({
        x: this.x + dx * maxT,
        y: this.y + dy * maxT,
      });
    }
    ctx.save();
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
