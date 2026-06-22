export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  life: number;
  maxLife: number;
  active: boolean;
  type: 'normal' | 'flash' | 'vortex';
  angle?: number;
  angularSpeed?: number;
  orbitRadius?: number;
  centerX?: number;
  centerY?: number;
}

export class ParticlePool {
  private pool: Particle[];

  constructor(maxParticles: number = 500) {
    this.pool = [];
    for (let i = 0; i < maxParticles; i++) {
      this.pool.push(this.createEmptyParticle());
    }
  }

  private createEmptyParticle(): Particle {
    return {
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      radius: 0,
      color: '#ffffff',
      alpha: 0,
      life: 0,
      maxLife: 0,
      active: false,
      type: 'normal',
    };
  }

  emit(
    x: number,
    y: number,
    count: number,
    options: {
      color?: string;
      colors?: string[];
      minRadius?: number;
      maxRadius?: number;
      minSpeed?: number;
      maxSpeed?: number;
      life?: number;
      type?: 'normal' | 'flash' | 'vortex';
      angle?: number;
      spread?: number;
      vortexCenterX?: number;
      vortexCenterY?: number;
    } = {}
  ): void {
    const {
      color = '#ffffff',
      colors,
      minRadius = 1,
      maxRadius = 3,
      minSpeed = 20,
      maxSpeed = 80,
      life = 0.5,
      type = 'normal',
      angle,
      spread = Math.PI * 2,
      vortexCenterX,
      vortexCenterY,
    } = options;

    let emitted = 0;
    for (let i = 0; i < this.pool.length && emitted < count; i++) {
      const p = this.pool[i];
      if (!p.active) {
        const speed = minSpeed + Math.random() * (maxSpeed - minSpeed);
        let particleAngle: number;
        if (angle !== undefined) {
          particleAngle = angle - spread / 2 + Math.random() * spread;
        } else {
          particleAngle = Math.random() * Math.PI * 2;
        }

        p.x = x;
        p.y = y;
        p.vx = Math.cos(particleAngle) * speed;
        p.vy = Math.sin(particleAngle) * speed;
        p.radius = minRadius + Math.random() * (maxRadius - minRadius);
        p.color = colors ? colors[Math.floor(Math.random() * colors.length)] : color;
        p.alpha = 1;
        p.life = life;
        p.maxLife = life;
        p.active = true;
        p.type = type;

        if (type === 'vortex') {
          p.angle = Math.random() * Math.PI * 2;
          p.angularSpeed = (2 + Math.random() * 3) * (Math.random() > 0.5 ? 1 : -1);
          p.orbitRadius = 10 + Math.random() * 20;
          p.centerX = vortexCenterX ?? x;
          p.centerY = vortexCenterY ?? y;
          p.vx = 0;
          p.vy = 0;
        }

        emitted++;
      }
    }
  }

  emitCollision(x: number, y: number, color1: string, color2: string): void {
    this.emit(x, y, 25, {
      colors: [color1, color2],
      minRadius: 1,
      maxRadius: 3,
      minSpeed: 40,
      maxSpeed: 120,
      life: 0.5,
      type: 'normal',
    });

    this.emit(x, y, 1, {
      color: '#ffffff',
      minRadius: 15,
      maxRadius: 15,
      minSpeed: 0,
      maxSpeed: 0,
      life: 0.1,
      type: 'flash',
    });
  }

  emitVortex(x: number, y: number, colors: string[]): void {
    this.emit(x, y, 60, {
      colors,
      minRadius: 1,
      maxRadius: 2.5,
      minSpeed: 0,
      maxSpeed: 0,
      life: 1,
      type: 'vortex',
      vortexCenterX: x,
      vortexCenterY: y,
    });
  }

  update(deltaTime: number): void {
    const friction = 0.92;
    const vortexShrinkSpeed = 15;

    for (const p of this.pool) {
      if (!p.active) continue;

      p.life -= deltaTime;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      p.alpha = p.life / p.maxLife;

      if (p.type === 'normal') {
        p.x += p.vx * deltaTime;
        p.y += p.vy * deltaTime;
        p.vx *= friction;
        p.vy *= friction;
      } else if (p.type === 'flash') {
        const t = 1 - p.life / p.maxLife;
        p.radius = 15 + t * 5;
      } else if (p.type === 'vortex') {
        if (p.angle !== undefined && p.angularSpeed !== undefined && p.orbitRadius !== undefined
            && p.centerX !== undefined && p.centerY !== undefined) {
          p.angle += p.angularSpeed * deltaTime * 3;
          p.orbitRadius -= vortexShrinkSpeed * deltaTime;
          if (p.orbitRadius < 0) p.orbitRadius = 0;

          p.x = p.centerX + Math.cos(p.angle) * p.orbitRadius;
          p.y = p.centerY + Math.sin(p.angle) * p.orbitRadius;
        }
      }
    }
  }

  getActiveParticles(): Particle[] {
    return this.pool.filter(p => p.active);
  }

  clear(): void {
    for (const p of this.pool) {
      p.active = false;
    }
  }
}
