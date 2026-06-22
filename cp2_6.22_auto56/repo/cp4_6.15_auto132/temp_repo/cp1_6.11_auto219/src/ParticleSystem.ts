export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  r: number;
  g: number;
  b: number;
  opacity: number;
  createdAt: number;
  lifetime: number;
  fadingOut: boolean;
  fadeStartTime: number;
  fadeDuration: number;
}

const PRESET_COLORS: [number, number, number][] = [
  [212, 163, 115],
  [106, 76, 147],
  [42, 157, 143],
  [231, 111, 81],
  [244, 162, 97],
  [38, 70, 83],
  [142, 202, 230],
  [255, 183, 3],
];

const MAX_PARTICLES = 2000;

export class ParticleSystem {
  particles: Particle[] = [];
  selectedColor: [number, number, number] = [...PRESET_COLORS[0]];
  flowSpeed: number = 2;
  lastInteractionTime: number = Date.now();
  lowPowerMode: boolean = false;

  createParticle(x: number, y: number, speed: number): void {
    const density = Math.min(30, Math.max(5, Math.floor(speed * 0.5)));
    const count = Math.floor(density);

    for (let i = 0; i < count; i++) {
      if (this.particles.length >= MAX_PARTICLES) {
        this.particles.splice(0, Math.floor(MAX_PARTICLES / 2));
      }

      const angle = Math.random() * Math.PI * 2;
      const spread = Math.random() * 20 + 5;
      const vx = Math.cos(angle) * spread * 0.3;
      const vy = Math.sin(angle) * spread * 0.3 + 0.5;
      const radius = Math.random() * 4 + 2;

      const colorMix = Math.random();
      let r: number, g: number, b: number;
      if (colorMix < 0.7) {
        r = this.selectedColor[0];
        g = this.selectedColor[1];
        b = this.selectedColor[2];
      } else {
        const randColor = PRESET_COLORS[Math.floor(Math.random() * PRESET_COLORS.length)];
        r = randColor[0];
        g = randColor[1];
        b = randColor[2];
      }

      const lifetime = this.getLifetime();

      this.particles.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        vx,
        vy,
        radius,
        r,
        g,
        b,
        opacity: 1.0,
        createdAt: Date.now(),
        lifetime,
        fadingOut: false,
        fadeStartTime: 0,
        fadeDuration: 2000,
      });
    }
  }

  private getLifetime(): number {
    switch (this.flowSpeed) {
      case 1: return 5000;
      case 2: return 3000;
      case 3: return 1500;
      default: return 3000;
    }
  }

  updateAllLifetimes(): void {
    const lifetime = this.getLifetime();
    for (const p of this.particles) {
      p.lifetime = lifetime;
    }
  }

  update(dt: number): void {
    const now = Date.now();
    const friction = 0.96;
    const gravity = 0.08;
    const collisionRange = this.lowPowerMode ? 12 : 24;

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      if (p.fadingOut) {
        const elapsed = now - p.fadeStartTime;
        p.opacity = Math.max(0, 1.0 - elapsed / p.fadeDuration);
        if (p.opacity <= 0) {
          this.particles.splice(i, 1);
          continue;
        }
      } else {
        const age = now - p.createdAt;
        if (age > p.lifetime) {
          p.opacity = Math.max(0, 1.0 - (age - p.lifetime) / 1000);
          if (p.opacity <= 0) {
            this.particles.splice(i, 1);
            continue;
          }
        }
      }

      p.vy += gravity;
      p.vx *= friction;
      p.vy *= friction;
      p.x += p.vx * dt;
      p.y += p.vy * dt;

      if (p.x < p.radius) { p.x = p.radius; p.vx *= -0.3; }
      if (p.x > 800 - p.radius) { p.x = 800 - p.radius; p.vx *= -0.3; }
      if (p.y < p.radius) { p.y = p.radius; p.vy *= -0.3; }
      if (p.y > 600 - p.radius) { p.y = 600 - p.radius; p.vy *= -0.3; }
    }

    if (!this.lowPowerMode) {
      this.handleCollisions(collisionRange);
    } else {
      this.handleCollisions(collisionRange);
    }
  }

  private handleCollisions(range: number): void {
    const len = this.particles.length;
    const step = this.lowPowerMode ? 3 : 1;

    for (let i = 0; i < len; i += step) {
      const a = this.particles[i];
      if (!a || a.fadingOut) continue;

      for (let j = i + 1; j < len; j += step) {
        const b = this.particles[j];
        if (!b || b.fadingOut) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;

        if (distSq < range * range && distSq > 0.01) {
          const dist = Math.sqrt(distSq);
          const colorDiffR = Math.abs(a.r - b.r);
          const colorDiffG = Math.abs(a.g - b.g);
          const colorDiffB = Math.abs(a.b - b.b);

          const mixRate = 0.5;

          if (colorDiffR > 0) {
            const shift = Math.min(mixRate, colorDiffR);
            if (a.r < b.r) { a.r += shift; b.r -= shift; }
            else { a.r -= shift; b.r += shift; }
          }
          if (colorDiffG > 0) {
            const shift = Math.min(mixRate, colorDiffG);
            if (a.g < b.g) { a.g += shift; b.g -= shift; }
            else { a.g -= shift; b.g += shift; }
          }
          if (colorDiffB > 0) {
            const shift = Math.min(mixRate, colorDiffB);
            if (a.b < b.b) { a.b += shift; b.b -= shift; }
            else { a.b -= shift; b.b += shift; }
          }

          const overlap = (a.radius + b.radius) - dist;
          if (overlap > 0) {
            const nx = dx / dist;
            const ny = dy / dist;
            const push = overlap * 0.25;
            a.vx -= nx * push;
            a.vy -= ny * push;
            b.vx += nx * push;
            b.vy += ny * push;
          }
        }
      }
    }
  }

  clearAll(): void {
    const now = Date.now();
    for (const p of this.particles) {
      if (!p.fadingOut) {
        p.fadingOut = true;
        p.fadeStartTime = now;
        p.fadeDuration = 2000;
      }
    }
  }

  setColor(r: number, g: number, b: number): void {
    this.selectedColor = [r, g, b];
  }

  getParticleCount(): number {
    return this.particles.length;
  }
}
