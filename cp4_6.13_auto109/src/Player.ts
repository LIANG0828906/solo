export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
}

export class Player {
  x: number;
  y: number;
  width = 30;
  height = 40;
  speed = 320;
  lives = 3;
  shootCooldown = 0;
  shootInterval = 125;
  powerUpActive = false;
  powerUpTimer = 0;
  powerUpDuration = 5000;
  invincible = false;
  invincibleTimer = 0;
  invincibleDuration = 2000;
  trailParticles: Particle[] = [];

  constructor(canvasWidth: number, canvasHeight: number) {
    this.x = canvasWidth / 2;
    this.y = canvasHeight - 80;
  }

  update(dt: number, keys: Set<string>, canvasWidth: number, canvasHeight: number): void {
    let dx = 0;
    let dy = 0;
    if (keys.has('ArrowLeft') || keys.has('a') || keys.has('A')) dx -= 1;
    if (keys.has('ArrowRight') || keys.has('d') || keys.has('D')) dx += 1;
    if (keys.has('ArrowUp') || keys.has('w') || keys.has('W')) dy -= 1;
    if (keys.has('ArrowDown') || keys.has('s') || keys.has('S')) dy += 1;

    if (dx !== 0 && dy !== 0) {
      dx *= 0.7071;
      dy *= 0.7071;
    }

    this.x += dx * this.speed * dt;
    this.y += dy * this.speed * dt;

    const halfH = canvasHeight / 2;
    const hw = this.width / 2;
    const hh = this.height / 2;
    if (this.x < hw) this.x = hw;
    if (this.x > canvasWidth - hw) this.x = canvasWidth - hw;
    if (this.y < halfH) this.y = halfH;
    if (this.y > canvasHeight - hh) this.y = canvasHeight - hh;

    if (this.shootCooldown > 0) this.shootCooldown -= dt * 1000;

    if (this.powerUpActive) {
      this.powerUpTimer -= dt * 1000;
      if (this.powerUpTimer <= 0) this.powerUpActive = false;
    }

    if (this.invincible) {
      this.invincibleTimer -= dt * 1000;
      if (this.invincibleTimer <= 0) this.invincible = false;
    }

    if (dx !== 0 || dy !== 0) this.emitTrail();

    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const p = this.trailParticles[i];
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) this.trailParticles.splice(i, 1);
    }
  }

  canShoot(): boolean {
    return this.shootCooldown <= 0;
  }

  shoot(): void {
    const interval = this.powerUpActive ? this.shootInterval / 2 : this.shootInterval;
    this.shootCooldown = interval;
  }

  hit(): void {
    if (this.invincible) return;
    this.lives--;
    this.invincible = true;
    this.invincibleTimer = this.invincibleDuration;
  }

  activatePowerUp(): void {
    this.powerUpActive = true;
    this.powerUpTimer = this.powerUpDuration;
  }

  getRadius(): number {
    return Math.min(this.width, this.height) / 2;
  }

  private emitTrail(): void {
    if (this.trailParticles.length > 60) return;
    for (let i = 0; i < 2; i++) {
      this.trailParticles.push({
        x: this.x + (Math.random() - 0.5) * 10,
        y: this.y + this.height / 2,
        vx: (Math.random() - 0.5) * 40,
        vy: Math.random() * 100 + 50,
        life: 0.3 + Math.random() * 0.2,
        maxLife: 0.5,
        color: this.powerUpActive ? '#00ff88' : '#4488ff',
        size: 2 + Math.random() * 3,
      });
    }
  }
}
