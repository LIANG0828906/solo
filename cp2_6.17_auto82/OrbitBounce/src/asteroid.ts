const TRAIL_LENGTH = 50;
const BASE_ORBITAL_SPEED = 120;

export class Asteroid {
  x: number;
  y: number;
  vx: number = 0;
  vy: number = 0;
  radius: number;
  color: string;
  trail: { x: number; y: number }[] = [];
  alive: boolean = true;
  orbitRadius: number;

  constructor(
    starX: number,
    starY: number,
    orbitRadius: number,
    radius: number,
    color: string
  ) {
    this.orbitRadius = orbitRadius;
    this.radius = radius;
    this.color = color;

    const angle = Math.random() * Math.PI * 2;
    this.x = starX + Math.cos(angle) * orbitRadius;
    this.y = starY + Math.sin(angle) * orbitRadius;

    const speed = BASE_ORBITAL_SPEED / Math.sqrt(orbitRadius);
    const direction = Math.random() > 0.5 ? 1 : -1;
    this.vx = -Math.sin(angle) * speed * direction;
    this.vy = Math.cos(angle) * speed * direction;
  }

  update(dt: number, starX: number, starY: number): void {
    if (!this.alive) return;

    const dx = starX - this.x;
    const dy = starY - this.y;
    const distSq = dx * dx + dy * dy;
    const dist = Math.sqrt(distSq);

    if (dist > 0) {
      const gravity = 5000 / distSq;
      const cappedGravity = Math.min(gravity, 3);
      this.vx += (dx / dist) * cappedGravity;
      this.vy += (dy / dist) * cappedGravity;
    }

    this.x += this.vx * dt * 60;
    this.y += this.vy * dt * 60;

    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > TRAIL_LENGTH) {
      this.trail.shift();
    }
  }

  applyPulse(px: number, py: number): void {
    const dx = px - this.x;
    const dy = py - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 200 && dist > 0) {
      const force = Math.min(3, 600 / dist);
      this.vx += (dx / dist) * force;
      this.vy += (dy / dist) * force;
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (!this.alive) return;

    if (this.trail.length > 1) {
      ctx.strokeStyle = 'rgba(255,255,255,0.2)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(this.trail[0].x, this.trail[0].y);
      for (let i = 1; i < this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x, this.trail[i].y);
      }
      ctx.stroke();
    }

    ctx.shadowColor = this.color;
    ctx.shadowBlur = 6;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  reset(starX: number, starY: number, orbitRadius: number, radius: number, color: string): void {
    this.orbitRadius = orbitRadius;
    this.radius = radius;
    this.color = color;
    this.alive = true;
    this.trail = [];

    const angle = Math.random() * Math.PI * 2;
    this.x = starX + Math.cos(angle) * orbitRadius;
    this.y = starY + Math.sin(angle) * orbitRadius;

    const speed = BASE_ORBITAL_SPEED / Math.sqrt(orbitRadius);
    const direction = Math.random() > 0.5 ? 1 : -1;
    this.vx = -Math.sin(angle) * speed * direction;
    this.vy = Math.cos(angle) * speed * direction;
  }
}

const ASTEROID_POOL_SIZE = 25;
export class AsteroidPool {
  pool: Asteroid[] = [];
  activeCount: number = 0;

  init(starX: number, starY: number, minOrbit: number, maxOrbit: number): void {
    this.pool = [];
    this.activeCount = 0;

    for (let i = 0; i < ASTEROID_POOL_SIZE; i++) {
      const orbitRadius = minOrbit + Math.random() * (maxOrbit - minOrbit);
      const radius = 3 + Math.random() * 5;
      const t = (orbitRadius - minOrbit) / (maxOrbit - minOrbit);
      const color = lerpColor('#00BFFF', '#FF6347', t);
      const asteroid = new Asteroid(starX, starY, orbitRadius, radius, color);
      asteroid.alive = false;
      this.pool.push(asteroid);
    }
  }

  spawn(starX: number, starY: number, minOrbit: number, maxOrbit: number): Asteroid | null {
    for (let i = 0; i < this.pool.length; i++) {
      if (!this.pool[i].alive) {
        const orbitRadius = minOrbit + Math.random() * (maxOrbit - minOrbit);
        const radius = 3 + Math.random() * 5;
        const t = (orbitRadius - minOrbit) / (maxOrbit - minOrbit);
        const color = lerpColor('#00BFFF', '#FF6347', t);
        this.pool[i].reset(starX, starY, orbitRadius, radius, color);
        this.activeCount++;
        return this.pool[i];
      }
    }
    return null;
  }

  getActive(): Asteroid[] {
    return this.pool.filter(a => a.alive);
  }

  deactivate(asteroid: Asteroid): void {
    asteroid.alive = false;
    asteroid.trail = [];
    this.activeCount--;
  }
}

function lerpColor(c1: string, c2: string, t: number): string {
  const r1 = parseInt(c1.slice(1, 3), 16);
  const g1 = parseInt(c1.slice(3, 5), 16);
  const b1 = parseInt(c1.slice(5, 7), 16);
  const r2 = parseInt(c2.slice(1, 3), 16);
  const g2 = parseInt(c2.slice(3, 5), 16);
  const b2 = parseInt(c2.slice(5, 7), 16);
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  return `rgb(${r},${g},${b})`;
}
