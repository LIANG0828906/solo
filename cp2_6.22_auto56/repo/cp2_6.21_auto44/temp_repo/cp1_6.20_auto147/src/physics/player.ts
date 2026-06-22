export interface PlayerState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ax: number;
  ay: number;
  radius: number;
  onGround: boolean;
  trail: { x: number; y: number; alpha: number }[];
}

export class Player {
  public x: number;
  public y: number;
  public vx: number;
  public vy: number;
  public ax: number;
  public ay: number;
  public radius: number;
  public onGround: boolean;
  public trail: { x: number; y: number; alpha: number }[];

  public startX: number;
  public startY: number;

  constructor(startX: number = 120, startY: number = 120, radius: number = 14) {
    this.startX = startX;
    this.startY = startY;
    this.x = startX;
    this.y = startY;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 980;
    this.radius = radius;
    this.onGround = false;
    this.trail = [];
  }

  public reset(): void {
    this.x = this.startX;
    this.y = this.startY;
    this.vx = 0;
    this.vy = 0;
    this.ax = 0;
    this.ay = 980;
    this.onGround = false;
    this.trail = [];
  }

  public addTrailPoint(): void {
    this.trail.push({ x: this.x, y: this.y, alpha: 0.5 });
    if (this.trail.length > 20) {
      this.trail.shift();
    }
    for (const p of this.trail) {
      p.alpha *= 0.92;
    }
    this.trail = this.trail.filter(p => p.alpha > 0.02);
  }

  public getState(): PlayerState {
    return {
      x: this.x,
      y: this.y,
      vx: this.vx,
      vy: this.vy,
      ax: this.ax,
      ay: this.ay,
      radius: this.radius,
      onGround: this.onGround,
      trail: this.trail,
    };
  }
}
