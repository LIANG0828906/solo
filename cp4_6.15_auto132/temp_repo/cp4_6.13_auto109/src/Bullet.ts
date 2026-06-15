export class Bullet {
  x: number;
  y: number;
  speed = 550;
  size = 3;
  piercing = false;

  constructor(x: number, y: number, piercing = false) {
    this.x = x;
    this.y = y;
    this.piercing = piercing;
  }

  update(dt: number): void {
    this.y -= this.speed * dt;
  }

  isOffScreen(): boolean {
    return this.y + 6 < 0;
  }

  getRadius(): number {
    return this.size;
  }
}
