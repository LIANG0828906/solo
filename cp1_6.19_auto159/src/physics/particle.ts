import { ElectromagneticField } from './field';

export interface TrailPoint {
  x: number;
  y: number;
  z: number;
}

export class Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  charge: number;
  mass: number;
  radius: number;
  trail: TrailPoint[];
  maxTrailLength: number = 200;
  flashTimer: number = 0;

  constructor(
    x: number, y: number, z: number,
    vx: number, vy: number, vz: number,
    charge: number, mass: number,
    radius: number = 0.4
  ) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.vx = vx;
    this.vy = vy;
    this.vz = vz;
    this.charge = charge;
    this.mass = mass;
    this.radius = radius;
    this.trail = [];
  }

  update(field: ElectromagneticField, dt: number, boundaryHalf: number): void {
    this.trail.push({ x: this.x, y: this.y, z: this.z });
    if (this.trail.length > this.maxTrailLength) {
      this.trail.shift();
    }

    const E = field.getElectricField();
    const B = field.getMagneticField();
    const qm = this.charge / this.mass;
    const halfDt = dt * 0.5;

    const vMinusX = this.vx + qm * E.x * halfDt;
    const vMinusY = this.vy + qm * E.y * halfDt;
    const vMinusZ = this.vz + qm * E.z * halfDt;

    const tx = qm * B.x * halfDt;
    const ty = qm * B.y * halfDt;
    const tz = qm * B.z * halfDt;
    const tMag2 = tx * tx + ty * ty + tz * tz;
    const sx = 2 * tx / (1 + tMag2);
    const sy = 2 * ty / (1 + tMag2);
    const sz = 2 * tz / (1 + tMag2);

    const vPrimeX = vMinusX + (vMinusY * tz - vMinusZ * ty);
    const vPrimeY = vMinusY + (vMinusZ * tx - vMinusX * tz);
    const vPrimeZ = vMinusZ + (vMinusX * ty - vMinusY * tx);

    const vPlusX = vMinusX + (vPrimeY * sz - vPrimeZ * sy);
    const vPlusY = vMinusY + (vPrimeZ * sx - vPrimeX * sz);
    const vPlusZ = vMinusZ + (vPrimeX * sy - vPrimeY * sx);

    this.vx = vPlusX + qm * E.x * halfDt;
    this.vy = vPlusY + qm * E.y * halfDt;
    this.vz = vPlusZ + qm * E.z * halfDt;

    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.z += this.vz * dt;

    this.checkBoundary(boundaryHalf);

    if (this.flashTimer > 0) {
      this.flashTimer -= dt;
      if (this.flashTimer < 0) this.flashTimer = 0;
    }
  }

  private checkBoundary(boundaryHalf: number): void {
    const bounce = 0.85;
    let collided = false;

    if (this.x > boundaryHalf) {
      this.x = boundaryHalf;
      this.vx = -this.vx * bounce;
      collided = true;
    } else if (this.x < -boundaryHalf) {
      this.x = -boundaryHalf;
      this.vx = -this.vx * bounce;
      collided = true;
    }

    if (this.y > boundaryHalf) {
      this.y = boundaryHalf;
      this.vy = -this.vy * bounce;
      collided = true;
    } else if (this.y < -boundaryHalf) {
      this.y = -boundaryHalf;
      this.vy = -this.vy * bounce;
      collided = true;
    }

    if (this.z > boundaryHalf) {
      this.z = boundaryHalf;
      this.vz = -this.vz * bounce;
      collided = true;
    } else if (this.z < -boundaryHalf) {
      this.z = -boundaryHalf;
      this.vz = -this.vz * bounce;
      collided = true;
    }

    if (collided) {
      this.flashTimer = 0.3;
    }
  }

  get speed(): number {
    return Math.sqrt(this.vx * this.vx + this.vy * this.vy + this.vz * this.vz);
  }

  get kineticEnergy(): number {
    return 0.5 * this.mass * (this.vx * this.vx + this.vy * this.vy + this.vz * this.vz);
  }
}
