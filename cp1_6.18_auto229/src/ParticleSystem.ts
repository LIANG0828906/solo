import { Particle, Position, MAX_PARTICLES, ElementType, ELEMENT_COLORS } from './types';

export class ParticleSystem {
  private particles: Particle[] = [];
  private nextId = 0;

  update(deltaTime: number): void {
    const dt = deltaTime / 1000;
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.life -= deltaTime;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      p.position.x += p.velocity.x * dt;
      p.position.y += p.velocity.y * dt;
      if (p.gravity !== undefined) {
        p.velocity.y += p.gravity * dt;
      }
      if (p.rotation !== undefined && p.rotationSpeed !== undefined) {
        p.rotation += p.rotationSpeed * dt;
      }
      if (p.blinkPhase !== undefined) {
        p.blinkPhase += dt * 2;
      }
      p.opacity = p.maxOpacity * (p.life / p.maxLife);
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.fillStyle = p.color;

      if (p.type === 'shard') {
        this.drawStar(ctx, p.position.x, p.position.y, 5, p.size, p.size * 0.5, p.rotation || 0);
      } else {
        if (p.rotation !== undefined) {
          ctx.translate(p.position.x, p.position.y);
          ctx.rotate(p.rotation);
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        } else {
          ctx.beginPath();
          ctx.arc(p.position.x, p.position.y, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
    }
  }

  private drawStar(
    ctx: CanvasRenderingContext2D,
    cx: number,
    cy: number,
    spikes: number,
    outerRadius: number,
    innerRadius: number,
    rotation: number
  ): void {
    let rot = (Math.PI / 2) * 3 + rotation;
    const step = Math.PI / spikes;

    ctx.beginPath();
    ctx.moveTo(cx, cy - outerRadius);
    for (let i = 0; i < spikes; i++) {
      let x = cx + Math.cos(rot) * outerRadius;
      let y = cy + Math.sin(rot) * outerRadius;
      ctx.lineTo(x, y);
      rot += step;
      x = cx + Math.cos(rot) * innerRadius;
      y = cy + Math.sin(rot) * innerRadius;
      ctx.lineTo(x, y);
      rot += step;
    }
    ctx.lineTo(cx, cy - outerRadius);
    ctx.closePath();
    ctx.fill();
  }

  createTrailParticle(position: Position, element: ElementType): void {
    if (this.particles.length >= MAX_PARTICLES) {
      this.particles.shift();
    }
    const color = ELEMENT_COLORS[element];
    this.particles.push({
      id: this.nextId++,
      position: { ...position },
      velocity: { x: (Math.random() - 0.5) * 20, y: (Math.random() - 0.5) * 20 },
      size: 2 + Math.random() * 2,
      color,
      opacity: 0.8,
      maxOpacity: 0.8,
      life: 500,
      maxLife: 500,
      type: 'trail'
    });
  }

  createExplosion(position: Position, element: ElementType, _radius: number = 40): void {
    const count = 30 + Math.floor(Math.random() * 21);
    const color = ELEMENT_COLORS[element];

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.particles.shift();
      }
      const angle = Math.random() * Math.PI * 2;
      const speed = 50 + Math.random() * 150;
      this.particles.push({
        id: this.nextId++,
        position: { ...position },
        velocity: {
          x: Math.cos(angle) * speed,
          y: Math.sin(angle) * speed
        },
        size: 4 + Math.random() * 4,
        color,
        opacity: 1,
        maxOpacity: 1,
        life: 400,
        maxLife: 400,
        type: 'explosion',
        gravity: 200,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 10
      });
    }
  }

  createShardParticle(position: Position, element: ElementType): void {
    if (this.particles.length >= MAX_PARTICLES) {
      this.particles.shift();
    }
    const color = ELEMENT_COLORS[element];
    this.particles.push({
      id: this.nextId++,
      position: { ...position },
      velocity: { x: 0, y: 0 },
      size: 6,
      color,
      opacity: 1,
      maxOpacity: 1,
      life: 10000,
      maxLife: 10000,
      type: 'shard',
      rotation: 0,
      rotationSpeed: 1.5,
      element,
      blinkPhase: 0
    });
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  getCount(): number {
    return this.particles.length;
  }

  clear(): void {
    this.particles = [];
  }

  collectShard(position: Position, radius: number = 30): { element: ElementType; count: number } {
    let collectedCount = 0;
    let collectedElement: ElementType = 'none';

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      if (p.type !== 'shard') continue;

      const dx = p.position.x - position.x;
      const dy = p.position.y - position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < radius) {
        collectedElement = p.element || 'none';
        collectedCount++;
        this.particles.splice(i, 1);
      }
    }

    return { element: collectedElement, count: collectedCount };
  }
}
