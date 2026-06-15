export class Asteroid {
  x: number;
  y: number;
  radius: number;
  speed: number;
  angle: number;
  vertices: { x: number; y: number }[];
  craters: { x: number; y: number; radius: number }[];
  rotation: number;
  rotationSpeed: number;
  canvasWidth: number;
  canvasHeight: number;
  active: boolean;
  dodged: boolean;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.radius = 20 + Math.random() * 40;
    this.x = canvasWidth + this.radius;
    this.y = Math.random() * canvasHeight;
    this.speed = 1 + Math.random() * 2.5;
    this.angle = (Math.random() - 0.5) * 0.3;
    this.rotation = 0;
    this.rotationSpeed = (Math.random() - 0.5) * 0.03;
    this.active = true;
    this.dodged = false;

    const vertexCount = Math.floor(4 + Math.random() * 5);
    this.vertices = [];
    for (let i = 0; i < vertexCount; i++) {
      const angle = (i / vertexCount) * Math.PI * 2;
      const r = this.radius * (0.75 + Math.random() * 0.4);
      this.vertices.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r
      });
    }

    this.craters = [];
    const craterCount = Math.floor(2 + Math.random() * 4);
    for (let i = 0; i < craterCount; i++) {
      const craterRadius = this.radius * (0.1 + Math.random() * 0.2);
      const craterAngle = Math.random() * Math.PI * 2;
      const craterDist = this.radius * (0.2 + Math.random() * 0.4);
      this.craters.push({
        x: Math.cos(craterAngle) * craterDist,
        y: Math.sin(craterAngle) * craterDist,
        radius: craterRadius
      });
    }
  }

  update(): void {
    this.x -= this.speed;
    this.y += Math.sin(this.angle) * this.speed * 0.5;
    this.rotation += this.rotationSpeed;

    if (this.y - this.radius < 0 || this.y + this.radius > this.canvasHeight) {
      this.angle = -this.angle;
    }

    if (this.x + this.radius < 0) {
      this.active = false;
      this.dodged = true;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    const gradient = ctx.createRadialGradient(
      -this.radius * 0.3, -this.radius * 0.3, 0,
      0, 0, this.radius
    );
    gradient.addColorStop(0, '#887766');
    gradient.addColorStop(0.5, '#554433');
    gradient.addColorStop(1, '#332211');

    ctx.fillStyle = gradient;
    ctx.strokeStyle = '#443322';
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.moveTo(this.vertices[0].x, this.vertices[0].y);
    for (let i = 1; i < this.vertices.length; i++) {
      ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = 'rgba(30, 20, 15, 0.6)';
    for (const crater of this.craters) {
      ctx.beginPath();
      ctx.arc(crater.x, crater.y, crater.radius, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = 'rgba(40, 30, 20, 0.5)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 5; i++) {
      const startAngle = Math.random() * Math.PI * 2;
      const startR = this.radius * (0.3 + Math.random() * 0.4);
      const length = this.radius * (0.2 + Math.random() * 0.3);
      ctx.beginPath();
      ctx.moveTo(
        Math.cos(startAngle) * startR,
        Math.sin(startAngle) * startR
      );
      ctx.lineTo(
        Math.cos(startAngle + 0.3) * (startR + length),
        Math.sin(startAngle + 0.3) * (startR + length)
      );
      ctx.stroke();
    }

    ctx.restore();
  }

  getCollisionRadius(): number {
    return this.radius * 0.8;
  }

  resize(canvasWidth: number, canvasHeight: number): void {
    const ratioX = canvasWidth / this.canvasWidth;
    const ratioY = canvasHeight / this.canvasHeight;
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
    this.x *= ratioX;
    this.y *= ratioY;
  }
}
