export interface Vec2 {
  x: number;
  y: number;
}

interface Star {
  position: Vec2;
  size: number;
  phase: number;
  period: number;
}

interface Particle {
  position: Vec2;
  velocity: Vec2;
  life: number;
  maxLife: number;
  size: number;
}

interface TrailPoint extends Vec2 {}

const NUM_STARS = 30;
const MAX_PARTICLES = 200;
const PARTICLES_PER_FRAME = 3;

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  private canvas: HTMLCanvasElement;
  private width: number;
  private height: number;
  private stars: Star[];
  private particles: Particle[];
  private trail: TrailPoint[];
  private maxTrail: number;
  private planetAngle: number;
  private time: number;

  constructor(canvas: HTMLCanvasElement, maxTrail: number) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('无法获取 Canvas 2D 上下文');
    }
    this.ctx = ctx;
    this.width = canvas.width;
    this.height = canvas.height;
    this.stars = [];
    this.particles = [];
    this.trail = [];
    this.maxTrail = maxTrail;
    this.planetAngle = 0;
    this.time = 0;
    this.generateStars();
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.canvas.width = width;
    this.canvas.height = height;
    this.generateStars();
  }

  private generateStars(): void {
    this.stars = [];
    for (let i = 0; i < NUM_STARS; i++) {
      this.stars.push({
        position: {
          x: Math.random() * this.width,
          y: Math.random() * this.height
        },
        size: 1 + Math.random() * 2,
        phase: Math.random() * Math.PI * 2,
        period: 2 + Math.random() * 2
      });
    }
  }

  public resetTrailAndParticles(): void {
    this.trail = [];
    this.particles = [];
  }

  public render(
    spacecraft: { position: Vec2; velocity: Vec2 },
    planet: { position: Vec2; radius: number },
    collided: boolean,
    escaped: boolean
  ): void {
    this.time += 1 / 60;
    this.planetAngle += (0.5 * Math.PI) / 180;

    this.drawBackground();
    this.drawStars();
    this.drawTrail();
    this.drawPlanet(planet.position, planet.radius);

    if (!collided) {
      if (!escaped) {
        this.updateTrail(spacecraft.position);
        this.updateParticles(spacecraft.position, spacecraft.velocity);
      }
      this.drawParticles();
      this.drawSpacecraft(spacecraft.position);
    }
  }

  private drawBackground(): void {
    this.ctx.fillStyle = '#060D17';
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private drawStars(): void {
    for (const star of this.stars) {
      const t = (this.time / star.period) * Math.PI * 2 + star.phase;
      const brightness = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(t));
      const alpha = 0.5 * brightness;

      this.ctx.beginPath();
      this.ctx.arc(star.position.x, star.position.y, star.size, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      this.ctx.fill();
    }
  }

  private updateTrail(pos: Vec2): void {
    this.trail.push({ x: pos.x, y: pos.y });
    while (this.trail.length > this.maxTrail) {
      this.trail.shift();
    }
  }

  private drawTrail(): void {
    if (this.trail.length < 2) return;

    const ctx = this.ctx;
    ctx.beginPath();
    ctx.moveTo(this.trail[0].x, this.trail[0].y);

    for (let i = 1; i < this.trail.length; i++) {
      const p = this.trail[i];
      ctx.lineTo(p.x, p.y);
    }

    ctx.strokeStyle = 'rgba(0, 191, 255, 0.5)';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();
  }

  private drawPlanet(pos: Vec2, radius: number): void {
    const ctx = this.ctx;

    ctx.save();
    const haloRadius = radius + 30;
    const halo = ctx.createRadialGradient(
      pos.x, pos.y, radius,
      pos.x, pos.y, haloRadius
    );
    halo.addColorStop(0, 'rgba(255, 69, 0, 0.35)');
    halo.addColorStop(1, 'rgba(255, 69, 0, 0)');
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, haloRadius, 0, Math.PI * 2);
    ctx.fillStyle = halo;
    ctx.fill();
    ctx.restore();

    const body = ctx.createRadialGradient(
      pos.x - radius * 0.3, pos.y - radius * 0.3, radius * 0.1,
      pos.x, pos.y, radius
    );
    body.addColorStop(0, '#FF8C00');
    body.addColorStop(1, '#FF4500');
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.fillStyle = body;
    ctx.fill();

    ctx.save();
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, radius, 0, Math.PI * 2);
    ctx.clip();

    const spotAngle = this.planetAngle;
    const spotDist = radius * 0.5;
    const spotX = pos.x + Math.cos(spotAngle) * spotDist;
    const spotY = pos.y + Math.sin(spotAngle) * spotDist;
    const spotRadius = radius * 0.35;

    const spot = ctx.createRadialGradient(
      spotX, spotY, 0,
      spotX, spotY, spotRadius
    );
    spot.addColorStop(0, 'rgba(255, 220, 150, 0.55)');
    spot.addColorStop(0.6, 'rgba(255, 200, 120, 0.2)');
    spot.addColorStop(1, 'rgba(255, 200, 120, 0)');

    ctx.beginPath();
    ctx.arc(spotX, spotY, spotRadius, 0, Math.PI * 2);
    ctx.fillStyle = spot;
    ctx.fill();

    ctx.restore();
  }

  private updateParticles(pos: Vec2, vel: Vec2): void {
    const speed = Math.hypot(vel.x, vel.y);
    const dirX = speed > 0 ? -vel.x / speed : -1;
    const dirY = speed > 0 ? -vel.y / speed : 0;

    for (let i = 0; i < PARTICLES_PER_FRAME; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.particles.shift();
      }

      const spread = 0.6;
      const angleJitter = (Math.random() - 0.5) * spread;
      const cosA = Math.cos(angleJitter);
      const sinA = Math.sin(angleJitter);
      const pDirX = dirX * cosA - dirY * sinA;
      const pDirY = dirX * sinA + dirY * cosA;
      const pSpeed = 20 + Math.random() * 40;

      this.particles.push({
        position: {
          x: pos.x + (Math.random() - 0.5) * 2,
          y: pos.y + (Math.random() - 0.5) * 2
        },
        velocity: {
          x: pDirX * pSpeed,
          y: pDirY * pSpeed
        },
        life: 1,
        maxLife: 0.5 + Math.random() * 0.5,
        size: 1.5 + Math.random() * 2
      });
    }

    const dt = 1 / 60;
    for (const p of this.particles) {
      p.position.x += p.velocity.x * dt;
      p.position.y += p.velocity.y * dt;
      p.life -= dt / p.maxLife;
    }

    this.particles = this.particles.filter(p => p.life > 0);
  }

  private drawParticles(): void {
    const ctx = this.ctx;

    for (const p of this.particles) {
      const alpha = Math.max(0, p.life) * 0.8;
      ctx.beginPath();
      ctx.arc(p.position.x, p.position.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
      ctx.fill();
    }
  }

  private drawSpacecraft(pos: Vec2): void {
    const ctx = this.ctx;
    const r = 4;

    const glow = ctx.createRadialGradient(
      pos.x, pos.y, 0,
      pos.x, pos.y, r * 3
    );
    glow.addColorStop(0, 'rgba(255, 255, 255, 0.6)');
    glow.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r * 3, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, r, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(pos.x - r * 0.3, pos.y - r * 0.3, r * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.fill();
  }
}
