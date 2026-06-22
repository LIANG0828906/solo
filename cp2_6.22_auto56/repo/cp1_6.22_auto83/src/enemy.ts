
import { GameMap, Vector2, rayRectIntersect, LOGICAL_WIDTH, LOGICAL_HEIGHT, WALL_THICKNESS } from './map';
import { PLAYER_RADIUS, PLAYER_SPEED } from './player';

export const ENEMY_RADIUS = 16;
export const ENEMY_VISION_ANGLE = Math.PI / 3;
export const ENEMY_VISION_RANGE = 150;
export const ENEMY_PATROL_SPEED = 60;
export const ENEMY_CHASE_SPEED = PLAYER_SPEED * 1.5;
export const ALERT_ANIM_DURATION = 0.3;
export const LOST_TARGET_TIME = 2.5;

export class Enemy {
  x: number;
  y: number;
  direction: number = 0;
  patrolPath: Vector2[];
  currentPathIndex: number = 1;
  pathDirection: 1 | -1 = 1;
  chasing: boolean = false;
  alertAnim: number = 0;
  alertActive: boolean = false;
  lostTimer: number = 0;
  lastSeenX: number = 0;
  lastSeenY: number = 0;
  hasSeen: boolean = false;

  constructor(startX: number, startY: number, path: Vector2[]) {
    this.x = startX;
    this.y = startY;
    this.patrolPath = path;
    if (path.length > 0) {
      this.direction = Math.atan2(path[0].y - startY, path[0].x - startX);
    }
  }

  update(dt: number, map: GameMap, player: { x: number; y: number; hiding: boolean }): { spotted: boolean; caught: boolean } {
    let spotted = false;
    let caught = false;
    const canSeePlayer = this.canSee(player.x, player.y, map, player.hiding);
    if (canSeePlayer) {
      this.lastSeenX = player.x;
      this.lastSeenY = player.y;
      this.hasSeen = true;
      if (!this.chasing) {
        this.alertActive = true;
        this.alertAnim = 0;
      }
      this.chasing = true;
      this.lostTimer = 0;
      spotted = true;
    } else if (this.chasing) {
      this.lostTimer += dt;
      if (this.lostTimer >= LOST_TARGET_TIME) {
        this.chasing = false;
        this.hasSeen = false;
        this.alertActive = false;
      }
    }
    if (this.alertActive) {
      this.alertAnim = Math.min(1, this.alertAnim + dt / ALERT_ANIM_DURATION);
      if (this.alertAnim >= 1) this.alertActive = false;
    } else if (this.alertAnim > 0 && !this.chasing) {
      this.alertAnim = Math.max(0, this.alertAnim - dt * 2);
    }
    if (this.chasing) {
      caught = this.moveToward(this.lastSeenX, this.lastSeenY, ENEMY_CHASE_SPEED * dt, map);
      const dx = this.lastSeenX - this.x;
      const dy = this.lastSeenY - this.y;
      if (Math.sqrt(dx * dx + dy * dy) > 2) {
        this.direction = Math.atan2(dy, dx);
      }
    } else {
      this.patrol(dt, map);
    }
    const distP = Math.sqrt((player.x - this.x) ** 2 + (player.y - this.y) ** 2);
    if (distP < ENEMY_RADIUS + PLAYER_RADIUS - 2 && !player.hiding) {
      caught = true;
    }
    return { spotted, caught };
  }

  private patrol(dt: number, map: GameMap): void {
    if (this.patrolPath.length < 2) return;
    const target = this.patrolPath[this.currentPathIndex];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 8) {
      let nextIdx = this.currentPathIndex + this.pathDirection;
      if (nextIdx >= this.patrolPath.length) {
        this.pathDirection = -1;
        nextIdx = this.currentPathIndex - 1;
      } else if (nextIdx < 0) {
        this.pathDirection = 1;
        nextIdx = this.currentPathIndex + 1;
      }
      this.currentPathIndex = Math.max(0, Math.min(this.patrolPath.length - 1, nextIdx));
    } else {
      if (dist > 2) this.direction = Math.atan2(dy, dx);
      const mx = (dx / dist) * ENEMY_PATROL_SPEED * dt;
      const my = (dy / dist) * ENEMY_PATROL_SPEED * dt;
      this.tryMove(mx, my, map);
    }
  }

  private moveToward(tx: number, ty: number, step: number, map: GameMap): boolean {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 6) return false;
    const ratio = Math.min(1, step / dist);
    const mx = dx * ratio;
    const my = dy * ratio;
    this.tryMove(mx, my, map);
    return false;
  }

  private tryMove(mx: number, my: number, map: GameMap): void {
    const newX = this.x + mx;
    if (!map.isPointBlocked(newX, this.y, ENEMY_RADIUS)) this.x = newX;
    const newY = this.y + my;
    if (!map.isPointBlocked(this.x, newY, ENEMY_RADIUS)) this.y = newY;
  }

  canSee(px: number, py: number, map: GameMap, playerHiding: boolean): boolean {
    if (playerHiding) return false;
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > ENEMY_VISION_RANGE) return false;
    const angleTo = Math.atan2(dy, dx);
    let diff = angleTo - this.direction;
    while (diff > Math.PI) diff -= 2 * Math.PI;
    while (diff < -Math.PI) diff += 2 * Math.PI;
    if (Math.abs(diff) > ENEMY_VISION_ANGLE / 2) return false;
    const ndx = dx / dist;
    const ndy = dy / dist;
    const rects = map.getAllBlockingRects();
    for (const r of rects) {
      const t = rayRectIntersect(this.x, this.y, ndx, ndy, r.x, r.y, r.width, r.height);
      if (t < dist - 2) return false;
    }
    return true;
  }

  render(ctx: CanvasRenderingContext2D, map: GameMap): void {
    this.renderVisionCone(ctx, map);
    const grad = ctx.createRadialGradient(this.x - 4, this.y - 4, 2, this.x, this.y, ENEMY_RADIUS);
    if (this.chasing) {
      grad.addColorStop(0, '#ff6060');
      grad.addColorStop(1, '#b01020');
    } else {
      grad.addColorStop(0, '#e04040');
      grad.addColorStop(1, '#800818');
    }
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(this.x, this.y, ENEMY_RADIUS, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#300';
    ctx.lineWidth = 2;
    ctx.stroke();
    const eyeX = this.x + Math.cos(this.direction) * (ENEMY_RADIUS * 0.5);
    const eyeY = this.y + Math.sin(this.direction) * (ENEMY_RADIUS * 0.5);
    ctx.fillStyle = '#ffff88';
    ctx.beginPath();
    ctx.arc(eyeX, eyeY, 3, 0, Math.PI * 2);
    ctx.fill();
    if (this.alertAnim > 0.01 || (this.chasing && this.lostTimer < 0.5)) {
      const scale = this.alertAnim;
      const bounce = 1 + Math.sin(Date.now() / 80) * 0.08;
      ctx.save();
      ctx.translate(this.x, this.y - ENEMY_RADIUS - 18);
      ctx.scale(scale * bounce, scale * bounce);
      ctx.fillStyle = '#ffff00';
      ctx.strokeStyle = '#880';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(0, 0, 12, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#880';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('!', 0, 1);
      ctx.restore();
    }
  }

  private renderVisionCone(ctx: CanvasRenderingContext2D, map: GameMap): void {
    const steps = 36;
    const halfAngle = ENEMY_VISION_ANGLE / 2;
    const points: { x: number; y: number }[] = [{ x: this.x, y: this.y }];
    const rects = map.getAllBlockingRects();
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const angle = this.direction - halfAngle + ENEMY_VISION_ANGLE * t;
      const dx = Math.cos(angle);
      const dy = Math.sin(angle);
      let maxT = ENEMY_VISION_RANGE;
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
    const visionColor = this.chasing ? 'rgba(255,50,0,0.35)' : 'rgba(255,100,0,0.3)';
    ctx.fillStyle = visionColor;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = this.chasing ? 'rgba(255,80,0,0.5)' : 'rgba(255,150,0,0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }
}

export function createEnemies(map: GameMap): Enemy[] {
  const spawnPoints = [
    { x: LOGICAL_WIDTH / 2 + 200, y: WALL_THICKNESS + 120 },
    { x: LOGICAL_WIDTH - 200, y: LOGICAL_HEIGHT / 2 },
    { x: LOGICAL_WIDTH / 2, y: LOGICAL_HEIGHT - 180 },
  ];
  const enemies: Enemy[] = [];
  for (const sp of spawnPoints) {
    const path = map.generatePatrolPath(sp.x, sp.y, 3 + Math.floor(Math.random() * 2));
    enemies.push(new Enemy(sp.x, sp.y, path));
  }
  return enemies;
}
