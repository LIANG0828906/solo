export interface Point {
  x: number;
  y: number;
}

export interface Circle {
  x: number;
  y: number;
  radius: number;
}

export interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Laser {
  x: number;
  y: number;
  dx: number;
  dy: number;
  length: number;
  width: number;
  active: boolean;
}

export function pointCircleCollision(px: number, py: number, cx: number, cy: number, radius: number): boolean {
  const dx = px - cx;
  const dy = py - cy;
  return dx * dx + dy * dy <= radius * radius;
}

export function circleCircleCollision(c1: Circle, c2: Circle): boolean {
  const dx = c1.x - c2.x;
  const dy = c1.y - c2.y;
  const totalRadius = c1.radius + c2.radius;
  return dx * dx + dy * dy <= totalRadius * totalRadius;
}

export function circleRectCollision(circle: Circle, rect: Rectangle): boolean {
  const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
  const dx = circle.x - closestX;
  const dy = circle.y - closestY;
  return dx * dx + dy * dy <= circle.radius * circle.radius;
}

export function laserCircleCollision(laser: Laser, circle: Circle): boolean {
  const laserEndX = laser.x + laser.dx * laser.length;
  const laserEndY = laser.y + laser.dy * laser.length;
  
  const dx = laserEndX - laser.x;
  const dy = laserEndY - laser.y;
  const fx = laser.x - circle.x;
  const fy = laser.y - circle.y;
  
  const a = dx * dx + dy * dy;
  const b = 2 * (fx * dx + fy * dy);
  const c = fx * fx + fy * fy - circle.radius * circle.radius;
  
  let discriminant = b * b - 4 * a * c;
  
  if (discriminant < 0) {
    return false;
  }
  
  discriminant = Math.sqrt(discriminant);
  const t1 = (-b - discriminant) / (2 * a);
  const t2 = (-b + discriminant) / (2 * a);
  
  return (t1 >= 0 && t1 <= 1) || (t2 >= 0 && t2 <= 1);
}
