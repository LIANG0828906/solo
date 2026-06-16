interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  radius: number;
}

export class Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  onGround: boolean;
  jumpsLeft: number;
  gravity: number;
  moveSpeed: number;
  jumpSpeed: number;
  particles: Particle[];
  maxParticles: number;
  trailActive: boolean;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;
    this.onGround = false;
    this.jumpsLeft = 2;
    this.gravity = 0.5;
    this.moveSpeed = 4;
    this.jumpSpeed = 12;
    this.particles = [];
    this.maxParticles = 200;
    this.trailActive = false;
  }

  update(keys: Set<string>, canvasWidth: number): void {
    if (keys.has('ArrowLeft')) {
      this.vx = -this.moveSpeed;
    } else if (keys.has('ArrowRight')) {
      this.vx = this.moveSpeed;
    } else {
      this.vx *= 0.8;
    }

    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;

    if (this.x - this.radius < 0) {
      this.x = this.radius;
      this.vx = 0;
    }
    if (this.x + this.radius > canvasWidth) {
      this.x = canvasWidth - this.radius;
      this.vx = 0;
    }

    if (!this.onGround) {
      this.trailActive = true;
      this.spawnTrailParticles();
    } else {
      this.trailActive = false;
    }

    this.updateParticles();
  }

  jump(): void {
    if (this.jumpsLeft > 0) {
      this.vy = -this.jumpSpeed;
      this.jumpsLeft--;
      this.onGround = false;
    }
  }

  resetGround(): void {
    this.onGround = true;
    this.jumpsLeft = 2;
  }

  spawnTrailParticles(): void {
    for (let i = 0; i < 3; i++) {
      if (this.particles.length >= this.maxParticles) {
        this.particles.shift();
      }
      this.particles.push({
        x: this.x + (Math.random() - 0.5) * 8,
        y: this.y + (Math.random() - 0.5) * 8,
        vx: (Math.random() - 0.5) * 1,
        vy: Math.random() * 1 + 0.5,
        life: 0.5,
        maxLife: 0.5,
        radius: Math.random() * 3 + 2
      });
    }
  }

  updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.life -= 1 / 60;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, cameraY: number): void {
    for (const p of this.particles) {
      const alpha = p.life / p.maxLife;
      ctx.save();
      ctx.globalAlpha = alpha * 0.6;
      ctx.fillStyle = '#88ddff';
      ctx.beginPath();
      ctx.arc(p.x, p.y - cameraY, p.radius * alpha, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    const drawY = this.y - cameraY;

    ctx.save();
    const glowGradient = ctx.createRadialGradient(
      this.x, drawY, this.radius * 0.5,
      this.x, drawY, this.radius * 2.5
    );
    glowGradient.addColorStop(0, 'rgba(0, 212, 255, 0.4)');
    glowGradient.addColorStop(0.5, 'rgba(0, 212, 255, 0.15)');
    glowGradient.addColorStop(1, 'rgba(0, 212, 255, 0)');
    ctx.fillStyle = glowGradient;
    ctx.beginPath();
    ctx.arc(this.x, drawY, this.radius * 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    const bodyGradient = ctx.createRadialGradient(
      this.x - 3, drawY - 3, 2,
      this.x, drawY, this.radius
    );
    bodyGradient.addColorStop(0, '#a0f0ff');
    bodyGradient.addColorStop(0.6, '#00d4ff');
    bodyGradient.addColorStop(1, '#0088aa');
    ctx.fillStyle = bodyGradient;
    ctx.beginPath();
    ctx.arc(this.x, drawY, this.radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();
  }

  checkPlatformCollision(platformX: number, platformY: number, platformW: number, platformH: number): boolean {
    if (this.vy <= 0) return false;

    const playerBottom = this.y + this.radius;
    const playerPrevBottom = playerBottom - this.vy;

    if (
      playerPrevBottom <= platformY &&
      playerBottom >= platformY &&
      this.x + this.radius > platformX &&
      this.x - this.radius < platformX + platformW
    ) {
      this.y = platformY - this.radius;
      this.vy = 0;
      this.resetGround();
      return true;
    }
    return false;
  }

  checkLavaCollision(lavaY: number): boolean {
    return this.y + this.radius > lavaY;
  }

  getBounds(): { x: number; y: number; radius: number } {
    return { x: this.x, y: this.y, radius: this.radius };
  }
}
