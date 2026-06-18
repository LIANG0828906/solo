interface Particle {
  position: { x: number; y: number; z: number };
  previous: { x: number; y: number; z: number };
  original: { x: number; y: number; z: number };
  acceleration: { x: number; y: number; z: number };
  mass: number;
  pinned: boolean;
}

interface Constraint {
  p1: number;
  p2: number;
  restLength: number;
}

export class ClothSim {
  private width: number;
  private height: number;
  private segmentsX: number;
  private segmentsY: number;
  private particles: Particle[] = [];
  private constraints: Constraint[] = [];
  private gravity = { x: 0, y: -0.5, z: 0 };
  private damping = 0.98;
  private time = 0;

  constructor(width: number, height: number, segmentsX: number, segmentsY: number) {
    this.width = width;
    this.height = height;
    this.segmentsX = segmentsX;
    this.segmentsY = segmentsY;
    this.initGrid();
  }

  initGrid(): void {
    this.particles = [];
    this.constraints = [];

    const stepX = this.width / this.segmentsX;
    const stepY = this.height / this.segmentsY;

    for (let y = 0; y <= this.segmentsY; y++) {
      for (let x = 0; x <= this.segmentsX; x++) {
        const px = x * stepX;
        const py = y * stepY;

        const particle: Particle = {
          position: { x: px, y: py, z: 0 },
          previous: { x: px, y: py, z: 0 },
          original: { x: px, y: py, z: 0 },
          acceleration: { x: 0, y: 0, z: 0 },
          mass: 1,
          pinned: x === 0
        };

        this.particles.push(particle);
      }
    }

    for (let y = 0; y <= this.segmentsY; y++) {
      for (let x = 0; x <= this.segmentsX; x++) {
        const index = y * (this.segmentsX + 1) + x;

        if (x < this.segmentsX) {
          this.constraints.push({
            p1: index,
            p2: index + 1,
            restLength: stepX
          });
        }

        if (y < this.segmentsY) {
          this.constraints.push({
            p1: index,
            p2: index + this.segmentsX + 1,
            restLength: stepY
          });
        }

        if (x < this.segmentsX && y < this.segmentsY) {
          this.constraints.push({
            p1: index,
            p2: index + this.segmentsX + 2,
            restLength: Math.sqrt(stepX * stepX + stepY * stepY)
          });
          this.constraints.push({
            p1: index + 1,
            p2: index + this.segmentsX + 1,
            restLength: Math.sqrt(stepX * stepX + stepY * stepY)
          });
        }
      }
    }
  }

  private addForce(index: number, force: { x: number; y: number; z: number }): void {
    const p = this.particles[index];
    if (!p.pinned) {
      p.acceleration.x += force.x / p.mass;
      p.acceleration.y += force.y / p.mass;
      p.acceleration.z += force.z / p.mass;
    }
  }

  private integrate(dt: number): void {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.pinned) continue;

      const vx = p.position.x - p.previous.x;
      const vy = p.position.y - p.previous.y;
      const vz = p.position.z - p.previous.z;

      p.previous.x = p.position.x;
      p.previous.y = p.position.y;
      p.previous.z = p.position.z;

      p.position.x += vx * this.damping + p.acceleration.x * dt * dt;
      p.position.y += vy * this.damping + p.acceleration.y * dt * dt;
      p.position.z += vz * this.damping + p.acceleration.z * dt * dt;

      p.acceleration.x = 0;
      p.acceleration.y = 0;
      p.acceleration.z = 0;
    }
  }

  private satisfyConstraints(): void {
    for (let iteration = 0; iteration < 15; iteration++) {
      for (let i = 0; i < this.constraints.length; i++) {
        const c = this.constraints[i];
        const p1 = this.particles[c.p1];
        const p2 = this.particles[c.p2];

        const dx = p2.position.x - p1.position.x;
        const dy = p2.position.y - p1.position.y;
        const dz = p2.position.z - p1.position.z;

        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist === 0) continue;

        const diff = (dist - c.restLength) / dist;
        const correction = 0.5 * diff;

        if (!p1.pinned) {
          p1.position.x += dx * correction;
          p1.position.y += dy * correction;
          p1.position.z += dz * correction;
        }

        if (!p2.pinned) {
          p2.position.x -= dx * correction;
          p2.position.y -= dy * correction;
          p2.position.z -= dz * correction;
        }
      }
    }
  }

  update(deltaTime: number, windSpeed: number): Float32Array {
    this.time += deltaTime;

    const windForce = windSpeed * 0.15;
    const amplitude = windSpeed * 0.08;

    for (let y = 0; y <= this.segmentsY; y++) {
      for (let x = 0; x <= this.segmentsX; x++) {
        const index = y * (this.segmentsX + 1) + x;

        this.addForce(index, this.gravity);

        const waveX = Math.sin(this.time * 3 + x * 0.8 + y * 0.5) * amplitude;
        const waveZ = Math.cos(this.time * 2.5 + x * 0.6 + y * 0.4) * amplitude * 0.5;

        const turbulenceX = (windForce + waveX) * (x / this.segmentsX);
        const turbulenceZ = (waveZ + windForce * 0.3) * (x / this.segmentsX);

        this.addForce(index, {
          x: turbulenceX,
          y: 0,
          z: turbulenceZ
        });
      }
    }

    const clampedDt = Math.min(deltaTime, 0.033);
    this.integrate(clampedDt);
    this.satisfyConstraints();

    const vertices = new Float32Array(this.particles.length * 3);
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      vertices[i * 3] = p.position.x;
      vertices[i * 3 + 1] = p.position.y;
      vertices[i * 3 + 2] = p.position.z;
    }

    return vertices;
  }

  reset(): void {
    for (const p of this.particles) {
      p.position.x = p.original.x;
      p.position.y = p.original.y;
      p.position.z = p.original.z;
      p.previous.x = p.original.x;
      p.previous.y = p.original.y;
      p.previous.z = p.original.z;
      p.acceleration.x = 0;
      p.acceleration.y = 0;
      p.acceleration.z = 0;
    }
    this.time = 0;
  }

  resize(segmentsX: number, segmentsY: number): void {
    this.segmentsX = segmentsX;
    this.segmentsY = segmentsY;
    this.initGrid();
  }

  getSegments(): { x: number; y: number } {
    return { x: this.segmentsX, y: this.segmentsY };
  }
}
