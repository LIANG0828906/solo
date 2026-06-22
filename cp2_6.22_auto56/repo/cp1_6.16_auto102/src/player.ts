export interface HaloEffect {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  active: boolean;
}

export class Player {
  public x: number;
  public y: number;
  public vy: number;
  public radius: number = 15;
  public isJumping: boolean = false;
  public groundY: number;
  public jumpVelocity: number = -500;
  public gravity: number = 800;
  public baseJumpHeight: number = 200;
  public beatBonusHeight: number = 30;
  public halo: HaloEffect | null = null;
  public glowIntensity: number = 0;

  constructor(x: number, groundY: number) {
    this.x = x;
    this.groundY = groundY;
    this.y = groundY;
    this.vy = 0;
  }

  public jump(onBeat: boolean): void {
    if (!this.isJumping) {
      this.isJumping = true;
      let jumpHeight = this.baseJumpHeight;
      if (onBeat) {
        jumpHeight += this.beatBonusHeight;
        this.triggerHalo();
      }
      this.vy = -Math.sqrt(2 * this.gravity * jumpHeight);
    }
  }

  public triggerHalo(): void {
    this.halo = {
      x: this.x,
      y: this.y,
      radius: 0,
      maxRadius: 60,
      alpha: 0.6,
      active: true,
    };
    this.glowIntensity = 1;
  }

  public update(deltaTime: number): void {
    if (this.isJumping) {
      this.vy += this.gravity * deltaTime;
      this.y += this.vy * deltaTime;

      if (this.y >= this.groundY) {
        this.y = this.groundY;
        this.vy = 0;
        this.isJumping = false;
      }
    }

    if (this.halo && this.halo.active) {
      this.halo.radius += (this.halo.maxRadius / 0.3) * deltaTime;
      this.halo.alpha -= (0.6 / 0.3) * deltaTime;
      if (this.halo.radius >= this.halo.maxRadius || this.halo.alpha <= 0) {
        this.halo.active = false;
        this.halo = null;
      }
    }

    if (this.glowIntensity > 0) {
      this.glowIntensity -= deltaTime * 2;
      if (this.glowIntensity < 0) this.glowIntensity = 0;
    }
  }

  public draw(ctx: CanvasRenderingContext2D): void {
    if (this.halo && this.halo.active) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.halo.radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${this.halo.alpha})`;
      ctx.fill();
      ctx.restore();
    }

    ctx.save();
    const glowRadius = this.radius * 2 + this.glowIntensity * 20;
    const glowGradient = ctx.createRadialGradient(
      this.x, this.y, this.radius * 0.5,
      this.x, this.y, glowRadius
    );
    glowGradient.addColorStop(0, 'rgba(0, 255, 255, 0.2)');
    glowGradient.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, glowRadius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    const gradient = ctx.createRadialGradient(
      this.x - this.radius * 0.3, this.y - this.radius * 0.3, 0,
      this.x, this.y, this.radius
    );
    gradient.addColorStop(0, '#00ffff');
    gradient.addColorStop(1, '#0044ff');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  public getCollisionBox(): { x: number; y: number; width: number; height: number } {
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
    };
  }
}
