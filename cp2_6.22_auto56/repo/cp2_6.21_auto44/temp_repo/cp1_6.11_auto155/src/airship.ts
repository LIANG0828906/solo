export class Bullet {
  x: number;
  y: number;
  width: number;
  height: number;
  speed: number;
  color: string;
  active: boolean = true;
  direction: number = 1;

  constructor(
    x: number, y: number,
    width: number, height: number,
    speed: number, color: string,
    direction: number = 1
  ) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.speed = speed;
    this.color = color;
    this.direction = direction;
  }

  update(dt: number): void {
    this.x += this.speed * this.direction * dt;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.active) return;
    ctx.save();
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.fillRect(this.x, this.y, this.width, this.height);
    ctx.restore();
  }

  isOffScreen(canvasWidth: number): boolean {
    return this.x > canvasWidth + 20 || this.x < -20;
  }

  getBounds(): { x: number; y: number; w: number; h: number } {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }
}

export class Airship {
  x: number;
  y: number;
  width: number = 80;
  height: number = 50;
  speed: number = 200;
  health: number = 100;
  maxHealth: number = 100;
  bullets: Bullet[] = [];
  propellerAngle: number = 0;
  invincibleTimer: number = 0;
  slowTimer: number = 0;
  shootCooldown: number = 0;
  private shootInterval: number = 0.25;

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = canvasWidth * 0.25 - this.width / 2;
    this.y = canvasHeight * 0.75 - this.height / 2;
  }

  update(dt: number, keys: Set<string>, canvasWidth: number, canvasHeight: number): void {
    let speedMult = 1;
    if (this.slowTimer > 0) {
      speedMult = 0.5;
      this.slowTimer -= dt;
    }

    const actualSpeed = this.speed * speedMult;

    if (keys.has('w') || keys.has('W')) this.y -= actualSpeed * dt;
    if (keys.has('s') || keys.has('S')) this.y += actualSpeed * dt;
    if (keys.has('a') || keys.has('A')) this.x -= actualSpeed * dt;
    if (keys.has('d') || keys.has('D')) this.x += actualSpeed * dt;

    if (this.x < 0) this.x = 0;
    if (this.y < 0) this.y = 0;
    if (this.x + this.width > canvasWidth) this.x = canvasWidth - this.width;
    if (this.y + this.height > canvasHeight - 60) this.y = canvasHeight - 60 - this.height;

    this.propellerAngle += dt * 1200;
    if (this.propellerAngle > 360) this.propellerAngle -= 360;

    if (this.invincibleTimer > 0) {
      this.invincibleTimer -= dt;
    }

    this.shootCooldown -= dt;
    if (keys.has(' ') && this.shootCooldown <= 0) {
      this.shoot();
      this.shootCooldown = this.shootInterval;
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].update(dt);
      if (this.bullets[i].isOffScreen(canvasWidth)) {
        this.bullets.splice(i, 1);
      }
    }
  }

  private shoot(): void {
    const bullet = new Bullet(
      this.x + this.width,
      this.y + this.height / 2 - 2,
      8, 4,
      400,
      '#FFD700',
      1
    );
    this.bullets.push(bullet);
  }

  takeDamage(amount: number): void {
    if (this.invincibleTimer > 0) return;
    this.health -= amount;
    if (this.health < 0) this.health = 0;
    this.invincibleTimer = 0.5;
  }

  applyLightningHit(): void {
    this.takeDamage(5);
    this.slowTimer = 2;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer * 10) % 2 === 0) {
      return;
    }

    ctx.save();
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;

    ctx.fillStyle = '#5C4033';
    ctx.beginPath();
    ctx.moveTo(this.x + 5, cy);
    ctx.lineTo(this.x + 20, this.y + 5);
    ctx.lineTo(this.x + this.width - 5, this.y + 5);
    ctx.lineTo(this.x + this.width, cy);
    ctx.lineTo(this.x + this.width - 5, this.y + this.height - 5);
    ctx.lineTo(this.x + 20, this.y + this.height - 5);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#B87333';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = '#B87333';
    ctx.fillRect(this.x + 18, this.y + 2, 3, this.height - 4);
    ctx.fillRect(this.x + 40, this.y + 2, 3, this.height - 4);
    ctx.fillRect(this.x + 60, this.y + 2, 3, this.height - 4);

    ctx.fillStyle = '#B87333';
    ctx.fillRect(cx - 6, this.y + this.height - 2, 12, 6);
    ctx.fillRect(cx - 2, this.y + this.height + 2, 4, 10);

    ctx.fillStyle = '#8B7355';
    ctx.beginPath();
    ctx.ellipse(cx, this.y - 12, 14, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#B87333';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#3B2F2A';
    ctx.fillRect(cx - 4, this.y - 18, 8, 8);

    const propCx = this.x - 8;
    const propCy = cy;
    ctx.save();
    ctx.translate(propCx, propCy);
    ctx.rotate((this.propellerAngle * Math.PI) / 180);
    ctx.fillStyle = '#B87333';
    ctx.fillRect(-2, -18, 4, 36);
    ctx.fillRect(-18, -2, 36, 4);
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fillStyle = '#5C4033';
    ctx.fill();
    ctx.restore();

    if (this.slowTimer > 0) {
      ctx.strokeStyle = `rgba(255,255,0,${0.3 + 0.2 * Math.sin(Date.now() * 0.01)})`;
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(this.x - 3, this.y - 3, this.width + 6, this.height + 6);
      ctx.setLineDash([]);
    }

    ctx.restore();

    for (const bullet of this.bullets) {
      bullet.draw(ctx);
    }
  }

  getBounds(): { x: number; y: number; w: number; h: number } {
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }
}
