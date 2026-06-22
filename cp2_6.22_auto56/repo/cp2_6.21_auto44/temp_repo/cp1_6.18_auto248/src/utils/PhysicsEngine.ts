import { Ball } from '../entity/Ball';

export interface PredictPoint {
  x: number;
  y: number;
  ballId: number;
}

export class PhysicsEngine {
  public balls: Ball[] = [];
  public gravity: number = 9.8;
  public drag: number = 0.01;
  public canvasWidth: number;
  public canvasHeight: number;
  public isSimulating: boolean = false;
  public isPredicting: boolean = false;
  public predictDuration: number = 3.0;
  public predictedPaths: Map<number, PredictPoint[]> = new Map();

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  public addBall(ball: Ball): void {
    ball.saveInitial();
    this.balls.push(ball);
  }

  public removeBall(ballId: number): void {
    this.balls = this.balls.filter((b) => b.id !== ballId);
  }

  public clearAll(): void {
    this.balls = [];
    this.predictedPaths.clear();
  }

  public getBallAt(x: number, y: number): Ball | null {
    for (let i = this.balls.length - 1; i >= 0; i--) {
      if (this.balls[i].containsPoint(x, y)) {
        return this.balls[i];
      }
    }
    return null;
  }

  public resetAll(): void {
    for (const ball of this.balls) {
      ball.startResetAnimation();
    }
    this.predictedPaths.clear();
  }

  public step(dt: number): void {
    if (!this.isSimulating) return;

    const substeps = 4;
    const subDt = dt / substeps;

    for (let s = 0; s < substeps; s++) {
      for (const ball of this.balls) {
        ball.update(subDt, this.gravity, this.drag, this.canvasWidth, this.canvasHeight, this.balls);
      }
    }

    if (this.isPredicting) {
      this.calculatePredictions();
    }
  }

  public drawAll(ctx: CanvasRenderingContext2D, selectedBall: Ball | null = null): void {
    if (this.isPredicting) {
      this.drawPredictions(ctx);
    }

    for (const ball of this.balls) {
      ball.draw(ctx, ball === selectedBall);
    }
  }

  public calculatePredictions(): void {
    this.predictedPaths.clear();

    const clonedBalls: Ball[] = [];
    for (const ball of this.balls) {
      clonedBalls.push(ball.clone());
    }

    const totalSteps = Math.ceil(this.predictDuration / 0.016);
    const stepDt = 0.016;
    const substeps = 2;
    const subDt = stepDt / substeps;

    for (const ball of clonedBalls) {
      this.predictedPaths.set(ball.id, [{ x: ball.x, y: ball.y, ballId: ball.id }]);
    }

    for (let step = 0; step < totalSteps; step++) {
      for (let s = 0; s < substeps; s++) {
        for (const ball of clonedBalls) {
          ball.vy += this.gravity * 50 * subDt;
          ball.vx *= 1 - this.drag;
          ball.vy *= 1 - this.drag;
          ball.x += ball.vx * subDt;
          ball.y += ball.vy * subDt;

          if (ball.x - ball.radius < 0) {
            ball.x = ball.radius;
            ball.vx = -ball.vx;
          } else if (ball.x + ball.radius > this.canvasWidth) {
            ball.x = this.canvasWidth - ball.radius;
            ball.vx = -ball.vx;
          }

          if (ball.y - ball.radius < 0) {
            ball.y = ball.radius;
            ball.vy = -ball.vy;
          } else if (ball.y + ball.radius > this.canvasHeight) {
            ball.y = this.canvasHeight - ball.radius;
            ball.vy = -ball.vy;
          }

          for (const other of clonedBalls) {
            if (other === ball) continue;
            this.predictCollision(ball, other);
          }
        }
      }

      if (step % 2 === 0) {
        for (const ball of clonedBalls) {
          const path = this.predictedPaths.get(ball.id);
          if (path) {
            path.push({ x: ball.x, y: ball.y, ballId: ball.id });
          }
        }
      }
    }
  }

  private predictCollision(a: Ball, b: Ball): void {
    const dx = b.x - a.x;
    const dy = b.y - a.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const minDist = a.radius + b.radius;

    if (dist < minDist && dist > 0) {
      const nx = dx / dist;
      const ny = dy / dist;

      const overlap = minDist - dist;
      const totalMass = a.radius * a.radius + b.radius * b.radius;
      const aMass = a.radius * a.radius;
      const bMass = b.radius * b.radius;

      a.x -= nx * overlap * (bMass / totalMass);
      a.y -= ny * overlap * (bMass / totalMass);
      b.x += nx * overlap * (aMass / totalMass);
      b.y += ny * overlap * (aMass / totalMass);

      const dvx = a.vx - b.vx;
      const dvy = a.vy - b.vy;
      const dvDotN = dvx * nx + dvy * ny;

      if (dvDotN > 0) {
        const impulse = (2 * dvDotN) / (aMass + bMass);
        a.vx -= impulse * bMass * nx;
        a.vy -= impulse * bMass * ny;
        b.vx += impulse * aMass * nx;
        b.vy += impulse * aMass * ny;
      }
    }
  }

  private drawPredictions(ctx: CanvasRenderingContext2D): void {
    for (const ball of this.balls) {
      const path = this.predictedPaths.get(ball.id);
      if (!path || path.length < 2) continue;

      const hex = ball.color;
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (!result) continue;
      const r = parseInt(result[1], 16);
      const g = parseInt(result[2], 16);
      const b = parseInt(result[3], 16);

      ctx.save();
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }
  }
}
