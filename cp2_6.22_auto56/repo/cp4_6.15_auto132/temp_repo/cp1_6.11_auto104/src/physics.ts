import { Rect, Player, Obstacle, PowerUpItem } from './objects';

export function rectIntersect(a: Rect, b: Rect): boolean {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

export function pointInRect(px: number, py: number, r: Rect): boolean {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

export function circleRectIntersect(cx: number, cy: number, cr: number, r: Rect): boolean {
  const nx = Math.max(r.x, Math.min(cx, r.x + r.w));
  const ny = Math.max(r.y, Math.min(cy, r.y + r.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy <= cr * cr;
}

export function circleIntersect(ax: number, ay: number, ar: number, bx: number, by: number, br: number): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const r = ar + br;
  return dx * dx + dy * dy <= r * r;
}

export function checkPlayerObstacle(p: Player, o: Obstacle): boolean {
  return rectIntersect(p.rect, o);
}

export function resolvePlayerObstacle(p: Player, obstacles: Obstacle[]) {
  for (const o of obstacles) {
    if (!rectIntersect(p.rect, o)) continue;
    const dx1 = (p.x) - o.x;
    const dx2 = (o.x + o.w) - p.x;
    const dy1 = (p.y) - o.y;
    const dy2 = (o.y + o.h) - p.y;
    const minX = Math.min(dx1, dx2);
    const minY = Math.min(dy1, dy2);
    if (minX < minY) {
      if (dx1 < dx2) p.x = o.x - p.width / 2;
      else p.x = o.x + o.w + p.width / 2;
      if (p.isKnockback) {
        p.knockbackVx = 0;
        p.hp = Math.max(0, p.hp - 2);
        o.shakeTime = 200;
      }
    } else {
      if (dy1 < dy2) p.y = o.y - p.height / 2;
      else p.y = o.y + o.h + p.height / 2;
      if (p.isKnockback) {
        p.knockbackVy = 0;
        p.hp = Math.max(0, p.hp - 2);
        o.shakeTime = 200;
      }
    }
  }
}

export function checkPowerUpPickup(p: Player, item: PowerUpItem): boolean {
  if (item.collected) return false;
  const dx = p.x - item.x;
  const dy = p.y - item.y;
  return dx * dx + dy * dy <= 32 * 32;
}

export function isOutOfBounds(p: Player, w: number, h: number): boolean {
  return p.x < -50 || p.x > w + 50 || p.y < -50 || p.y > h + 50;
}

export function pointInSector(cx: number, cy: number, radius: number, angleCenter: number, angleSpread: number, px: number, py: number): boolean {
  const dx = px - cx;
  const dy = py - cy;
  const dist = Math.hypot(dx, dy);
  if (dist > radius) return false;
  let angle = Math.atan2(dy, dx);
  let diff = angle - angleCenter;
  while (diff > Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  return Math.abs(diff) <= angleSpread / 2;
}

export function resolvePlayerPlayer(a: Player, b: Player) {
  if (!rectIntersect(a.rect, b.rect)) return;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const len = Math.hypot(dx, dy) || 1;
  const overlap = 18;
  const nx = dx / len;
  const ny = dy / len;
  if (!a.isKnockback) {
    a.x -= nx * overlap / 2;
    a.y -= ny * overlap / 2;
  }
  if (!b.isKnockback) {
    b.x += nx * overlap / 2;
    b.y += ny * overlap / 2;
  }
}

export function clampToBounds(p: Player, w: number, h: number) {
  if (!p.isKnockback) {
    p.x = Math.max(p.width / 2, Math.min(w - p.width / 2, p.x));
    p.y = Math.max(p.height / 2, Math.min(h - p.height / 2, p.y));
  }
}
