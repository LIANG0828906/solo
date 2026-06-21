export enum PlayerState {
  Running = 'running',
  Jumping = 'jumping',
  Sliding = 'sliding',
  Flipping = 'flipping',
  Boosting = 'boosting',
  Dead = 'dead'
}

export class Player {
  x: number = 80;
  y: number = 0;
  width: number = 32;
  height: number = 48;
  vy: number = 0;
  state: PlayerState = PlayerState.Running;
  health: number = 3;
  score: number = 0;
  flipAngle: number = 0;
  flipCount: number = 0;
  slideTimer: number = 0;
  boostTimer: number = 0;
  invincibleTimer: number = 0;
  grounded: boolean = true;
  animFrame: number = 0;
  animTimer: number = 0;

  private jumpForce: number = -14;
  private gravity: number = 0.7;
  private slideDuration: number = 30;
  private boostDuration: number = 180;
  private invincibleDuration: number = 60;

  get hitbox(): { x: number; y: number; w: number; h: number } {
    if (this.state === PlayerState.Sliding) {
      return { x: this.x, y: this.y + this.height - 20, w: this.width, h: 20 };
    }
    return { x: this.x, y: this.y, w: this.width, h: this.height };
  }

  get speed(): number {
    const base = 5;
    if (this.state === PlayerState.Boosting) return base * 1.5;
    return base;
  }

  reset(groundY: number): void {
    this.y = groundY - this.height;
    this.vy = 0;
    this.state = PlayerState.Running;
    this.health = 3;
    this.score = 0;
    this.flipAngle = 0;
    this.flipCount = 0;
    this.slideTimer = 0;
    this.boostTimer = 0;
    this.invincibleTimer = 0;
    this.grounded = true;
    this.animFrame = 0;
    this.animTimer = 0;
  }

  jump(): void {
    if (this.grounded && this.state !== PlayerState.Sliding) {
      this.vy = this.jumpForce;
      this.grounded = false;
      this.state = PlayerState.Jumping;
    }
  }

  slide(): void {
    if (this.grounded && this.state !== PlayerState.Sliding) {
      this.state = PlayerState.Sliding;
      this.slideTimer = this.slideDuration;
      this.animFrame = 0;
      this.animTimer = 0;
    }
  }

  flip(): void {
    if (!this.grounded && this.state === PlayerState.Jumping) {
      this.state = PlayerState.Flipping;
      this.flipAngle = 0;
      this.flipCount = 0;
    }
  }

  activateBoost(): void {
    this.state = PlayerState.Boosting;
    this.boostTimer = this.boostDuration;
  }

  takeDamage(): boolean {
    if (this.invincibleTimer > 0) return false;
    if (this.state === PlayerState.Boosting) return false;
    this.health--;
    this.invincibleTimer = this.invincibleDuration;
    return true;
  }

  update(groundY: number): void {
    this.animTimer++;
    const frameInterval = this.state === PlayerState.Sliding ? 5 : 6;
    if (this.animTimer >= frameInterval) {
      this.animTimer = 0;
      const frameCount = this.state === PlayerState.Sliding ? 4 : 4;
      this.animFrame = (this.animFrame + 1) % frameCount;
    }

    if (!this.grounded) {
      this.vy += this.gravity;
      this.y += this.vy;
    }

    if (this.state === PlayerState.Flipping) {
      this.flipAngle += 15;
      if (this.flipAngle >= 360) {
        this.flipAngle = 0;
        this.flipCount++;
        this.score += 50;
      }
    }

    if (this.state === PlayerState.Sliding) {
      this.slideTimer--;
      if (this.slideTimer <= 0) {
        this.state = PlayerState.Running;
      }
    }

    if (this.state === PlayerState.Boosting) {
      this.boostTimer--;
      if (this.boostTimer <= 0) {
        this.state = this.grounded ? PlayerState.Running : PlayerState.Jumping;
      }
    }

    if (this.invincibleTimer > 0) {
      this.invincibleTimer--;
    }

    if (this.y >= groundY - this.height) {
      this.y = groundY - this.height;
      this.vy = 0;
      if (!this.grounded) {
        this.grounded = true;
        if (this.state === PlayerState.Jumping || this.state === PlayerState.Flipping) {
          this.state = this.boostTimer > 0 ? PlayerState.Boosting : PlayerState.Running;
        }
        this.flipAngle = 0;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, cameraX: number): void {
    const screenX = this.x - cameraX;
    const screenY = this.y;

    ctx.save();

    if (this.invincibleTimer > 0 && Math.floor(this.invincibleTimer / 4) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    const centerX = screenX + this.width / 2;
    const centerY = screenY + this.height / 2;

    if (this.state === PlayerState.Flipping) {
      ctx.translate(centerX, centerY);
      ctx.rotate((this.flipAngle * Math.PI) / 180);
      ctx.translate(-centerX, -centerY);
    }

    if (this.state === PlayerState.Sliding) {
      this.drawSliding(ctx, screenX, screenY);
    } else if (!this.grounded || this.state === PlayerState.Jumping || this.state === PlayerState.Flipping) {
      this.drawJumping(ctx, screenX, screenY);
    } else {
      this.drawRunning(ctx, screenX, screenY);
    }

    ctx.restore();

    if (this.state === PlayerState.Boosting) {
      this.drawBoostTrail(ctx, screenX, screenY);
    }
  }

  private drawRunning(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(sx + 4, sy, 24, 8);
    ctx.fillStyle = '#00d0e0';
    ctx.fillRect(sx + 10, sy - 3, 12, 4);

    ctx.fillStyle = '#ffeaa7';
    ctx.fillRect(sx + 8, sy + 8, 16, 12);
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(sx + 11, sy + 12, 3, 3);
    ctx.fillRect(sx + 18, sy + 12, 3, 3);

    ctx.fillStyle = '#dfe6e9';
    ctx.fillRect(sx + 6, sy + 20, 20, 14);
    ctx.fillStyle = '#b2bec3';
    ctx.fillRect(sx + 6, sy + 20, 20, 3);

    ctx.fillStyle = '#636e72';
    if (this.animFrame === 0) {
      ctx.fillRect(sx + 8, sy + 34, 6, 14);
      ctx.fillRect(sx + 18, sy + 36, 6, 12);
    } else if (this.animFrame === 1) {
      ctx.fillRect(sx + 6, sy + 36, 6, 12);
      ctx.fillRect(sx + 20, sy + 34, 6, 14);
    } else if (this.animFrame === 2) {
      ctx.fillRect(sx + 8, sy + 36, 6, 12);
      ctx.fillRect(sx + 18, sy + 34, 6, 14);
    } else {
      ctx.fillRect(sx + 6, sy + 34, 6, 14);
      ctx.fillRect(sx + 20, sy + 36, 6, 12);
    }

    ctx.fillStyle = '#e17055';
    if (this.animFrame % 2 === 0) {
      ctx.fillRect(sx + 2, sy + 24, 6, 4);
      ctx.fillRect(sx + 24, sy + 20, 6, 4);
    } else {
      ctx.fillRect(sx + 2, sy + 20, 6, 4);
      ctx.fillRect(sx + 24, sy + 24, 6, 4);
    }

    ctx.fillStyle = '#2d3436';
    ctx.fillRect(sx + 2, sy + 44, 28, 4);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(sx + 2, sy + 44, 28, 1);
  }

  private drawJumping(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
    const isRising = this.vy < 0;

    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(sx + 4, sy, 24, 8);
    ctx.fillStyle = '#00d0e0';
    ctx.fillRect(sx + 10, sy - 3, 12, 4);

    ctx.fillStyle = '#ffeaa7';
    ctx.fillRect(sx + 8, sy + 8, 16, 12);
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(sx + 11, sy + 12, 3, 3);
    ctx.fillRect(sx + 18, sy + 12, 3, 3);

    ctx.fillStyle = '#dfe6e9';
    ctx.fillRect(sx + 6, sy + 20, 20, 16);
    ctx.fillStyle = '#b2bec3';
    ctx.fillRect(sx + 6, sy + 20, 20, 3);

    ctx.fillStyle = '#e17055';
    if (isRising) {
      ctx.fillRect(sx - 4, sy + 18, 8, 6);
      ctx.fillRect(sx + 28, sy + 18, 8, 6);
    } else {
      ctx.fillRect(sx - 2, sy + 24, 6, 6);
      ctx.fillRect(sx + 28, sy + 24, 6, 6);
    }

    ctx.fillStyle = '#636e72';
    if (isRising) {
      ctx.fillRect(sx + 4, sy + 34, 10, 6);
      ctx.fillRect(sx + 18, sy + 34, 10, 6);
    } else {
      ctx.fillRect(sx + 6, sy + 36, 8, 10);
      ctx.fillRect(sx + 18, sy + 36, 8, 10);
    }

    ctx.fillStyle = '#2d3436';
    ctx.fillRect(sx + 2, sy + 44, 28, 4);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(sx + 2, sy + 44, 28, 1);
  }

  private drawSliding(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(sx + 2, sy + 26, 26, 6);

    ctx.fillStyle = '#ffeaa7';
    ctx.fillRect(sx + 24, sy + 22, 10, 10);
    ctx.fillStyle = '#2d3436';
    ctx.fillRect(sx + 28, sy + 26, 2, 2);

    ctx.fillStyle = '#dfe6e9';
    ctx.fillRect(sx + 4, sy + 32, 24, 10);

    ctx.fillStyle = '#e17055';
    if (this.animFrame === 0) {
      ctx.fillRect(sx + 0, sy + 34, 6, 3);
    } else if (this.animFrame === 1) {
      ctx.fillRect(sx + 0, sy + 36, 6, 3);
    } else if (this.animFrame === 2) {
      ctx.fillRect(sx + 0, sy + 38, 6, 3);
    } else {
      ctx.fillRect(sx + 0, sy + 36, 6, 3);
    }

    ctx.fillStyle = '#636e72';
    ctx.fillRect(sx + 6, sy + 42, 22, 4);

    ctx.fillStyle = '#2d3436';
    ctx.fillRect(sx + 2, sy + 44, 28, 4);
    ctx.fillStyle = '#00f0ff';
    ctx.fillRect(sx + 2, sy + 44, 28, 1);
  }

  private drawBoostTrail(ctx: CanvasRenderingContext2D, sx: number, sy: number): void {
    const trailCount = 10;
    const trailY = sy + this.height / 2;
    for (let i = 1; i <= trailCount; i++) {
      const ratio = i / trailCount;
      const r = Math.floor(231 + (243 - 231) * ratio);
      const g = Math.floor(76 + (156 - 76) * ratio);
      const b = Math.floor(60 + (18 - 60) * ratio);
      const alpha = 1 - ratio * 0.85;
      const size = 3 - 2 * ratio;
      ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
      ctx.beginPath();
      const jitter = (Math.random() - 0.5) * 10;
      ctx.arc(sx - i * 4, trailY + jitter, Math.max(size, 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
  }
}
