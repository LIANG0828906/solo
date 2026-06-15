import type { ColorSwatch } from './colorPalette';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  g: number;
  b: number;
  alpha: number;
  size: number;
}

const GRID_SCALE = 4;

export class FluidSimulator {
  public width: number;
  public height: number;
  public gridW: number;
  public gridH: number;
  public particles: Particle[] = [];

  private velX: Float32Array;
  private velY: Float32Array;
  private velX0: Float32Array;
  private velY0: Float32Array;
  private densR: Float32Array;
  private densG: Float32Array;
  private densB: Float32Array;
  private densR0: Float32Array;
  private densG0: Float32Array;
  private densB0: Float32Array;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.gridW = Math.floor(width / GRID_SCALE);
    this.gridH = Math.floor(height / GRID_SCALE);
    const size = this.gridW * this.gridH;
    this.velX = new Float32Array(size);
    this.velY = new Float32Array(size);
    this.velX0 = new Float32Array(size);
    this.velY0 = new Float32Array(size);
    this.densR = new Float32Array(size);
    this.densG = new Float32Array(size);
    this.densB = new Float32Array(size);
    this.densR0 = new Float32Array(size);
    this.densG0 = new Float32Array(size);
    this.densB0 = new Float32Array(size);
  }

  private idx(i: number, j: number): number {
    const ci = Math.max(0, Math.min(this.gridW - 1, i));
    const cj = Math.max(0, Math.min(this.gridH - 1, j));
    return ci + cj * this.gridW;
  }

  private addSource(x: Float32Array, s: Float32Array, dt: number): void {
    for (let i = 0; i < x.length; i++) x[i] += s[i] * dt;
  }

  private setBnd(b: number, x: Float32Array): void {
    const N = this.gridW;
    const M = this.gridH;
    for (let i = 1; i < N - 1; i++) {
      x[this.idx(i, 0)] = b === 2 ? -x[this.idx(i, 1)] : x[this.idx(i, 1)];
      x[this.idx(i, M - 1)] = b === 2 ? -x[this.idx(i, M - 2)] : x[this.idx(i, M - 2)];
    }
    for (let j = 1; j < M - 1; j++) {
      x[this.idx(0, j)] = b === 1 ? -x[this.idx(1, j)] : x[this.idx(1, j)];
      x[this.idx(N - 1, j)] = b === 1 ? -x[this.idx(N - 2, j)] : x[this.idx(N - 2, j)];
    }
    x[this.idx(0, 0)] = 0.5 * (x[this.idx(1, 0)] + x[this.idx(0, 1)]);
    x[this.idx(0, M - 1)] = 0.5 * (x[this.idx(1, M - 1)] + x[this.idx(0, M - 2)]);
    x[this.idx(N - 1, 0)] = 0.5 * (x[this.idx(N - 2, 0)] + x[this.idx(N - 1, 1)]);
    x[this.idx(N - 1, M - 1)] = 0.5 * (x[this.idx(N - 2, M - 1)] + x[this.idx(N - 1, M - 2)]);
  }

  private linSolve(b: number, x: Float32Array, x0: Float32Array, a: number, c: number): void {
    const N = this.gridW;
    const M = this.gridH;
    const invC = 1 / c;
    for (let k = 0; k < 4; k++) {
      for (let j = 1; j < M - 1; j++) {
        for (let i = 1; i < N - 1; i++) {
          x[this.idx(i, j)] =
            (x0[this.idx(i, j)] +
              a *
                (x[this.idx(i - 1, j)] +
                  x[this.idx(i + 1, j)] +
                  x[this.idx(i, j - 1)] +
                  x[this.idx(i, j + 1)])) *
            invC;
        }
      }
      this.setBnd(b, x);
    }
  }

  private diffuse(b: number, x: Float32Array, x0: Float32Array, diff: number, dt: number): void {
    const a = dt * diff * (this.gridW - 2) * (this.gridH - 2);
    this.linSolve(b, x, x0, a, 1 + 4 * a);
  }

  private advect(b: number, d: Float32Array, d0: Float32Array, u: Float32Array, v: Float32Array, dt: number): void {
    const N = this.gridW;
    const M = this.gridH;
    const dt0 = dt * (N - 2);
    for (let j = 1; j < M - 1; j++) {
      for (let i = 1; i < N - 1; i++) {
        let x = i - dt0 * u[this.idx(i, j)];
        let y = j - dt0 * v[this.idx(i, j)];
        if (x < 0.5) x = 0.5;
        if (x > N - 1.5) x = N - 1.5;
        const i0 = Math.floor(x);
        const i1 = i0 + 1;
        if (y < 0.5) y = 0.5;
        if (y > M - 1.5) y = M - 1.5;
        const j0 = Math.floor(y);
        const j1 = j0 + 1;
        const s1 = x - i0;
        const s0 = 1 - s1;
        const t1 = y - j0;
        const t0 = 1 - t1;
        d[this.idx(i, j)] =
          s0 * (t0 * d0[this.idx(i0, j0)] + t1 * d0[this.idx(i0, j1)]) +
          s1 * (t0 * d0[this.idx(i1, j0)] + t1 * d0[this.idx(i1, j1)]);
      }
    }
    this.setBnd(b, d);
  }

  private project(u: Float32Array, v: Float32Array, p: Float32Array, div: Float32Array): void {
    const N = this.gridW;
    const M = this.gridH;
    const h = 1.0 / (N - 2);
    for (let j = 1; j < M - 1; j++) {
      for (let i = 1; i < N - 1; i++) {
        div[this.idx(i, j)] =
          (-0.5 *
            h *
            (u[this.idx(i + 1, j)] -
              u[this.idx(i - 1, j)] +
              v[this.idx(i, j + 1)] -
              v[this.idx(i, j - 1)]));
        p[this.idx(i, j)] = 0;
      }
    }
    this.setBnd(0, div);
    this.setBnd(0, p);
    this.linSolve(0, p, div, 1, 4);
    for (let j = 1; j < M - 1; j++) {
      for (let i = 1; i < N - 1; i++) {
        u[this.idx(i, j)] -= 0.5 * (p[this.idx(i + 1, j)] - p[this.idx(i - 1, j)]) / h;
        v[this.idx(i, j)] -= 0.5 * (p[this.idx(i, j + 1)] - p[this.idx(i, j - 1)]) / h;
      }
    }
    this.setBnd(1, u);
    this.setBnd(2, v);
  }

  private velStep(visc: number, dt: number): void {
    this.addSource(this.velX, this.velX0, dt);
    this.addSource(this.velY, this.velY0, dt);
    [this.velX0, this.velX] = [this.velX, this.velX0];
    this.diffuse(1, this.velX, this.velX0, visc, dt);
    [this.velY0, this.velY] = [this.velY, this.velY0];
    this.diffuse(2, this.velY, this.velY0, visc, dt);
    this.project(this.velX, this.velY, this.velX0, this.velY0);
    [this.velX0, this.velX] = [this.velX, this.velX0];
    [this.velY0, this.velY] = [this.velY, this.velY0];
    this.advect(1, this.velX, this.velX0, this.velX0, this.velY0, dt);
    this.advect(2, this.velY, this.velY0, this.velX0, this.velY0, dt);
    this.project(this.velX, this.velY, this.velX0, this.velY0);
    this.velX0.fill(0);
    this.velY0.fill(0);
  }

  private densStep(diff: number, dt: number): void {
    this.addSource(this.densR, this.densR0, dt);
    this.addSource(this.densG, this.densG0, dt);
    this.addSource(this.densB, this.densB0, dt);
    [this.densR0, this.densR] = [this.densR, this.densR0];
    this.diffuse(0, this.densR, this.densR0, diff, dt);
    [this.densG0, this.densG] = [this.densG, this.densG0];
    this.diffuse(0, this.densG, this.densG0, diff, dt);
    [this.densB0, this.densB] = [this.densB, this.densB0];
    this.diffuse(0, this.densB, this.densB0, diff, dt);
    [this.densR0, this.densR] = [this.densR, this.densR0];
    [this.densG0, this.densG] = [this.densG, this.densG0];
    [this.densB0, this.densB] = [this.densB, this.densB0];
    this.advect(0, this.densR, this.densR0, this.velX, this.velY, dt);
    this.advect(0, this.densG, this.densG0, this.velX, this.velY, dt);
    this.advect(0, this.densB, this.densB0, this.velX, this.velY, dt);
    this.densR0.fill(0);
    this.densG0.fill(0);
    this.densB0.fill(0);
    for (let i = 0; i < this.densR.length; i++) {
      this.densR[i] *= 0.995;
      this.densG[i] *= 0.995;
      this.densB[i] *= 0.995;
    }
  }

  public addParticles(x: number, y: number, count: number, color: ColorSwatch): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 6;
      const px = x + Math.cos(angle) * r;
      const py = y + Math.sin(angle) * r;
      this.particles.push({
        x: px,
        y: py,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        r: color.r,
        g: color.g,
        b: color.b,
        alpha: 0.9,
        size: 2 + Math.random() * 3,
      });
      const gi = Math.floor(px / GRID_SCALE);
      const gj = Math.floor(py / GRID_SCALE);
      const index = this.idx(gi, gj);
      this.densR0[index] += color.r * 0.05;
      this.densG0[index] += color.g * 0.05;
      this.densB0[index] += color.b * 0.05;
    }
  }

  public addVelocity(x: number, y: number, dx: number, dy: number, radius: number, vortexStrength: number): void {
    const cgi = Math.floor(x / GRID_SCALE);
    const cgj = Math.floor(y / GRID_SCALE);
    const r2 = (radius / GRID_SCALE) * (radius / GRID_SCALE);
    for (let j = -4; j <= 4; j++) {
      for (let i = -4; i <= 4; i++) {
        const gi = cgi + i;
        const gj = cgj + j;
        const dist2 = i * i + j * j;
        if (dist2 > r2) continue;
        const falloff = 1 - dist2 / r2;
        const idx = this.idx(gi, gj);
        this.velX0[idx] += dx * falloff * 0.5;
        this.velY0[idx] += dy * falloff * 0.5;
        if (vortexStrength > 0) {
          const px = gi - cgi;
          const py = gj - cgj;
          this.velX0[idx] += -py * vortexStrength * falloff * 0.3;
          this.velY0[idx] += px * vortexStrength * falloff * 0.3;
        }
      }
    }
  }

  public step(viscosity: number, diffusion: number, dt: number): void {
    this.velStep(viscosity, dt);
    this.densStep(diffusion, dt);

    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      const gi = Math.floor(p.x / GRID_SCALE);
      const gj = Math.floor(p.y / GRID_SCALE);
      const idx = this.idx(gi, gj);
      const fx = this.velX[idx];
      const fy = this.velY[idx];
      const speed = Math.hypot(p.vx, p.vy);
      const brownAmp = 0.15 + speed * 0.05;
      p.vx += fx * dt * 3 + (Math.random() - 0.5) * brownAmp;
      p.vy += fy * dt * 3 + (Math.random() - 0.5) * brownAmp;
      const damping = Math.max(0.92, 1 - viscosity * 0.02);
      p.vx *= damping;
      p.vy *= damping;
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) { p.x = 0; p.vx *= -0.5; }
      if (p.x > this.width) { p.x = this.width; p.vx *= -0.5; }
      if (p.y < 0) { p.y = 0; p.vy *= -0.5; }
      if (p.y > this.height) { p.y = this.height; p.vy *= -0.5; }
      p.alpha *= 0.997;
      if (p.alpha < 0.05) {
        this.particles.splice(i, 1);
      }
    }
  }

  public render(ctx: CanvasRenderingContext2D): void {
    const imgData = ctx.getImageData(0, 0, this.width, this.height);
    const data = imgData.data;
    for (let j = 0; j < this.gridH; j++) {
      for (let i = 0; i < this.gridW; i++) {
        const idx = this.idx(i, j);
        const dr = Math.min(255, this.densR[idx]);
        const dg = Math.min(255, this.densG[idx]);
        const db = Math.min(255, this.densB[idx]);
        const alpha = Math.min(1, (dr + dg + db) / (3 * 80));
        if (alpha < 0.02) continue;
        const x0 = i * GRID_SCALE;
        const y0 = j * GRID_SCALE;
        for (let py = 0; py < GRID_SCALE; py++) {
          for (let px = 0; px < GRID_SCALE; px++) {
            const xi = x0 + px;
            const yi = y0 + py;
            if (xi >= this.width || yi >= this.height) continue;
            const di = (yi * this.width + xi) * 4;
            const existingA = data[di + 3] / 255;
            const outA = alpha + existingA * (1 - alpha);
            if (outA > 0) {
              data[di] = (dr * alpha + data[di] * existingA * (1 - alpha)) / outA;
              data[di + 1] = (dg * alpha + data[di + 1] * existingA * (1 - alpha)) / outA;
              data[di + 2] = (db * alpha + data[di + 2] * existingA * (1 - alpha)) / outA;
              data[di + 3] = Math.min(255, outA * 255);
            }
          }
        }
      }
    }
    ctx.putImageData(imgData, 0, 0);

    ctx.globalCompositeOperation = 'lighter';
    for (const p of this.particles) {
      ctx.beginPath();
      ctx.fillStyle = `rgba(${p.r|0},${p.g|0},${p.b|0},${p.alpha * 0.5})`;
      const radius = p.size * (1 + p.alpha * 0.5);
      ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
  }

  public clear(): void {
    this.particles = [];
    this.velX.fill(0);
    this.velY.fill(0);
    this.velX0.fill(0);
    this.velY0.fill(0);
    this.densR.fill(0);
    this.densG.fill(0);
    this.densB.fill(0);
    this.densR0.fill(0);
    this.densG0.fill(0);
    this.densB0.fill(0);
  }

  public resize(width: number, height: number): void {
    this.width = width;
    this.height = height;
    this.gridW = Math.floor(width / GRID_SCALE);
    this.gridH = Math.floor(height / GRID_SCALE);
    const size = this.gridW * this.gridH;
    this.velX = new Float32Array(size);
    this.velY = new Float32Array(size);
    this.velX0 = new Float32Array(size);
    this.velY0 = new Float32Array(size);
    this.densR = new Float32Array(size);
    this.densG = new Float32Array(size);
    this.densB = new Float32Array(size);
    this.densR0 = new Float32Array(size);
    this.densG0 = new Float32Array(size);
    this.densB0 = new Float32Array(size);
  }
}
