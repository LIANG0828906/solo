import { Ball, Baffle, Hole, Vector2D, GAME_CONFIG } from '../types';

export class PhysicsEngine {
  private gravity: Vector2D;
  private restitution: number;
  private friction: number;

  constructor() {
    this.gravity = { x: 0, y: GAME_CONFIG.GRAVITY };
    this.restitution = GAME_CONFIG.RESTITUTION;
    this.friction = GAME_CONFIG.FRICTION;
  }

  update(ball: Ball, baffles: Baffle[], hole: Hole): { bounced: boolean; inHole: boolean } {
    let bounced = false;

    ball.vx += this.gravity.x;
    ball.vy += this.gravity.y;

    ball.vx *= this.friction;
    ball.vy *= this.friction;

    ball.x += ball.vx;
    ball.y += ball.vy;

    for (const baffle of baffles) {
      if (this.checkCircleRectCollision(ball, baffle)) {
        this.resolveCircleRectCollision(ball, baffle);
        bounced = true;
      }
    }

    const inHole = this.checkBallInHole(ball, hole);

    return { bounced, inHole };
  }

  private checkCircleRectCollision(ball: Ball, rect: Baffle): boolean {
    const rectBounds = this.getRectBounds(rect);
    
    const closestX = Math.max(rectBounds.left, Math.min(ball.x, rectBounds.right));
    const closestY = Math.max(rectBounds.top, Math.min(ball.y, rectBounds.bottom));

    const distanceX = ball.x - closestX;
    const distanceY = ball.y - closestY;
    const distanceSquared = distanceX * distanceX + distanceY * distanceY;

    return distanceSquared < ball.radius * ball.radius;
  }

  private getRectBounds(rect: Baffle): { left: number; right: number; top: number; bottom: number } {
    if (rect.orientation === 'horizontal') {
      return {
        left: rect.x,
        right: rect.x + rect.length,
        top: rect.y,
        bottom: rect.y + rect.width,
      };
    } else {
      return {
        left: rect.x,
        right: rect.x + rect.width,
        top: rect.y,
        bottom: rect.y + rect.length,
      };
    }
  }

  private resolveCircleRectCollision(ball: Ball, rect: Baffle): void {
    const rectBounds = this.getRectBounds(rect);
    
    const closestX = Math.max(rectBounds.left, Math.min(ball.x, rectBounds.right));
    const closestY = Math.max(rectBounds.top, Math.min(ball.y, rectBounds.bottom));

    let dx = ball.x - closestX;
    let dy = ball.y - closestY;
    let dist = Math.sqrt(dx * dx + dy * dy);

    if (dist === 0) {
      const centerX = (rectBounds.left + rectBounds.right) / 2;
      const centerY = (rectBounds.top + rectBounds.bottom) / 2;
      dx = ball.x - centerX;
      dy = ball.y - centerY;
      dist = Math.sqrt(dx * dx + dy * dy) || 1;
    }

    const nx = dx / dist;
    const ny = dy / dist;

    const overlap = ball.radius - dist;
    if (overlap > 0) {
      ball.x += nx * overlap;
      ball.y += ny * overlap;
    }

    const dotProduct = ball.vx * nx + ball.vy * ny;
    
    if (dotProduct < 0) {
      ball.vx -= 2 * dotProduct * nx * this.restitution;
      ball.vy -= 2 * dotProduct * ny * this.restitution;
    }
  }

  checkBallInHole(ball: Ball, hole: Hole): boolean {
    const dx = ball.x - hole.x;
    const dy = ball.y - hole.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance + ball.radius * 0.3 < hole.radius;
  }

  resetBall(ball: Ball, startPos: Vector2D): void {
    ball.x = startPos.x;
    ball.y = startPos.y;
    ball.vx = 0;
    ball.vy = 0;
  }

  createBall(startPos: Vector2D): Ball {
    return {
      x: startPos.x,
      y: startPos.y,
      vx: 0,
      vy: 0,
      radius: GAME_CONFIG.BALL_RADIUS,
      color: '#FF6B6B',
      shadowColor: '#CC5555',
    };
  }
}

export const physicsEngine = new PhysicsEngine();
