import { eventBus } from '../eventBus';

export class FluidSolver {
  N: number;
  size: number;
  dt: number;
  diffusion: number;
  viscosity: number;

  u: Float32Array;
  v: Float32Array;
  uPrev: Float32Array;
  vPrev: Float32Array;
  densR: Float32Array;
  densG: Float32Array;
  densB: Float32Array;
  densRPrev: Float32Array;
  densGPrev: Float32Array;
  densBPrev: Float32Array;

  private baseN: number = 40;
  private reducedN: number = 30;
  private reducedMode: boolean = false;
  private resizeDebounceTimer: number | null = null;
  private readonly RESIZE_DEBOUNCE_MS: number = 300;

  constructor() {
    this.N = this.baseN;
    this.size = (this.N + 2) * (this.N + 2);
    this.dt = 0.1;
    this.diffusion = 0.001;
    this.viscosity = 1.0;

    this.u = new Float32Array(this.size);
    this.v = new Float32Array(this.size);
    this.uPrev = new Float32Array(this.size);
    this.vPrev = new Float32Array(this.size);
    this.densR = new Float32Array(this.size);
    this.densG = new Float32Array(this.size);
    this.densB = new Float32Array(this.size);
    this.densRPrev = new Float32Array(this.size);
    this.densGPrev = new Float32Array(this.size);
    this.densBPrev = new Float32Array(this.size);

    eventBus.on('viscosityChange', (val: unknown) => {
      this.viscosity = val as number;
    });
    eventBus.on('clearFluid', () => {
      this.clearAll();
    });
    eventBus.on('particleCountChange', (count: unknown) => {
      const c = count as number;
      const targetReduced = c > 3000;
      if (targetReduced !== this.reducedMode) {
        this.scheduleResize(targetReduced);
      }
    });
  }

  private scheduleResize(toReduced: boolean): void {
    if (this.resizeDebounceTimer !== null) {
      window.clearTimeout(this.resizeDebounceTimer);
      this.resizeDebounceTimer = null;
    }
    this.resizeDebounceTimer = window.setTimeout(() => {
      this.reducedMode = toReduced;
      this.resizeGrid(toReduced ? this.reducedN : this.baseN);
      this.resizeDebounceTimer = null;
    }, this.RESIZE_DEBOUNCE_MS);
  }

  private resizeGrid(newN: number): void {
    if (this.N === newN) return;
    this.N = newN;
    this.size = (this.N + 2) * (this.N + 2);
    this.u = new Float32Array(this.size);
    this.v = new Float32Array(this.size);
    this.uPrev = new Float32Array(this.size);
    this.vPrev = new Float32Array(this.size);
    this.densR = new Float32Array(this.size);
    this.densG = new Float32Array(this.size);
    this.densB = new Float32Array(this.size);
    this.densRPrev = new Float32Array(this.size);
    this.densGPrev = new Float32Array(this.size);
    this.densBPrev = new Float32Array(this.size);
  }

  private IX(i: number, j: number): number {
    return i + (this.N + 2) * j;
  }

  private addSource(x: Float32Array, s: Float32Array, dt: number): void {
    for (let i = 0; i < this.size; i++) {
      x[i] += dt * s[i];
    }
  }

  private setBnd(b: number, x: Float32Array): void {
    for (let i = 1; i <= this.N; i++) {
      x[this.IX(0, i)] = b === 1 ? -x[this.IX(1, i)] : x[this.IX(1, i)];
      x[this.IX(this.N + 1, i)] = b === 1 ? -x[this.IX(this.N, i)] : x[this.IX(this.N, i)];
      x[this.IX(i, 0)] = b === 2 ? -x[this.IX(i, 1)] : x[this.IX(i, 1)];
      x[this.IX(i, this.N + 1)] = b === 2 ? -x[this.IX(i, this.N)] : x[this.IX(i, this.N)];
    }
    x[this.IX(0, 0)] = 0.5 * (x[this.IX(1, 0)] + x[this.IX(0, 1)]);
    x[this.IX(0, this.N + 1)] = 0.5 * (x[this.IX(1, this.N + 1)] + x[this.IX(0, this.N)]);
    x[this.IX(this.N + 1, 0)] = 0.5 * (x[this.IX(this.N, 0)] + x[this.IX(this.N + 1, 1)]);
    x[this.IX(this.N + 1, this.N + 1)] = 0.5 * (x[this.IX(this.N, this.N + 1)] + x[this.IX(this.N + 1, this.N)]);
  }

  private diffuse(b: number, x: Float32Array, x0: Float32Array, diff: number, dt: number): void {
    const a = dt * diff * this.N * this.N;
    const denom = 1 + 4 * a;
    for (let k = 0; k < 20; k++) {
      for (let j = 1; j <= this.N; j++) {
        for (let i = 1; i <= this.N; i++) {
          x[this.IX(i, j)] = (x0[this.IX(i, j)] + a * (
            x[this.IX(i - 1, j)] + x[this.IX(i + 1, j)] +
            x[this.IX(i, j - 1)] + x[this.IX(i, j + 1)]
          )) / denom;
        }
      }
      this.setBnd(b, x);
    }
  }

  private advect(b: number, d: Float32Array, d0: Float32Array, u: Float32Array, v: Float32Array, dt: number): void {
    const dt0 = dt * this.N;
    for (let j = 1; j <= this.N; j++) {
      for (let i = 1; i <= this.N; i++) {
        let x = i - dt0 * u[this.IX(i, j)];
        let y = j - dt0 * v[this.IX(i, j)];

        if (x < 0.5) x = 0.5;
        if (x > this.N + 0.5) x = this.N + 0.5;
        const i0 = Math.floor(x);
        const i1 = i0 + 1;
        const s1 = x - i0;
        const s0 = 1 - s1;

        if (y < 0.5) y = 0.5;
        if (y > this.N + 0.5) y = this.N + 0.5;
        const j0 = Math.floor(y);
        const j1 = j0 + 1;
        const t1 = y - j0;
        const t0 = 1 - t1;

        d[this.IX(i, j)] = s0 * (t0 * d0[this.IX(i0, j0)] + t1 * d0[this.IX(i0, j1)]) +
          s1 * (t0 * d0[this.IX(i1, j0)] + t1 * d0[this.IX(i1, j1)]);
      }
    }
    this.setBnd(b, d);
  }

  private project(u: Float32Array, v: Float32Array, p: Float32Array, div: Float32Array): void {
    const h = 1.0 / this.N;
    for (let j = 1; j <= this.N; j++) {
      for (let i = 1; i <= this.N; i++) {
        div[this.IX(i, j)] = -0.5 * h * (
          u[this.IX(i + 1, j)] - u[this.IX(i - 1, j)] +
          v[this.IX(i, j + 1)] - v[this.IX(i, j - 1)]
        );
        p[this.IX(i, j)] = 0;
      }
    }
    this.setBnd(0, div);
    this.setBnd(0, p);

    for (let k = 0; k < 20; k++) {
      for (let j = 1; j <= this.N; j++) {
        for (let i = 1; i <= this.N; i++) {
          p[this.IX(i, j)] = (div[this.IX(i, j)] +
            p[this.IX(i - 1, j)] + p[this.IX(i + 1, j)] +
            p[this.IX(i, j - 1)] + p[this.IX(i, j + 1)]
          ) / 4;
        }
      }
      this.setBnd(0, p);
    }

    for (let j = 1; j <= this.N; j++) {
      for (let i = 1; i <= this.N; i++) {
        u[this.IX(i, j)] -= 0.5 * (p[this.IX(i + 1, j)] - p[this.IX(i - 1, j)]) * this.N;
        v[this.IX(i, j)] -= 0.5 * (p[this.IX(i, j + 1)] - p[this.IX(i, j - 1)]) * this.N;
      }
    }
    this.setBnd(1, u);
    this.setBnd(2, v);
  }

  velStep(): void {
    this.addSource(this.u, this.uPrev, this.dt);
    this.addSource(this.v, this.vPrev, this.dt);

    let tmp: Float32Array;
    tmp = this.u; this.u = this.uPrev; this.uPrev = tmp;
    this.diffuse(1, this.u, this.uPrev, this.viscosity, this.dt);

    tmp = this.v; this.v = this.vPrev; this.vPrev = tmp;
    this.diffuse(2, this.v, this.vPrev, this.viscosity, this.dt);

    this.project(this.u, this.v, this.uPrev, this.vPrev);

    tmp = this.u; this.u = this.uPrev; this.uPrev = tmp;
    tmp = this.v; this.v = this.vPrev; this.vPrev = tmp;

    this.advect(1, this.u, this.uPrev, this.uPrev, this.vPrev, this.dt);
    this.advect(2, this.v, this.vPrev, this.uPrev, this.vPrev, this.dt);

    this.project(this.u, this.v, this.uPrev, this.vPrev);
  }

  densStep(): void {
    this.addSource(this.densR, this.densRPrev, this.dt);
    this.addSource(this.densG, this.densGPrev, this.dt);
    this.addSource(this.densB, this.densBPrev, this.dt);

    let tmp: Float32Array;
    tmp = this.densR; this.densR = this.densRPrev; this.densRPrev = tmp;
    this.diffuse(0, this.densR, this.densRPrev, this.diffusion, this.dt);

    tmp = this.densG; this.densG = this.densGPrev; this.densGPrev = tmp;
    this.diffuse(0, this.densG, this.densGPrev, this.diffusion, this.dt);

    tmp = this.densB; this.densB = this.densBPrev; this.densBPrev = tmp;
    this.diffuse(0, this.densB, this.densBPrev, this.diffusion, this.dt);

    tmp = this.densR; this.densR = this.densRPrev; this.densRPrev = tmp;
    this.advect(0, this.densR, this.densRPrev, this.u, this.v, this.dt);

    tmp = this.densG; this.densG = this.densGPrev; this.densGPrev = tmp;
    this.advect(0, this.densG, this.densGPrev, this.u, this.v, this.dt);

    tmp = this.densB; this.densB = this.densBPrev; this.densBPrev = tmp;
    this.advect(0, this.densB, this.densBPrev, this.u, this.v, this.dt);
  }

  step(): void {
    this.velStep();
    this.densStep();
    this.uPrev.fill(0);
    this.vPrev.fill(0);
    this.densRPrev.fill(0);
    this.densGPrev.fill(0);
    this.densBPrev.fill(0);
  }

  injectVelocity(gridI: number, gridJ: number, radius: number, du: number, dv: number): void {
    for (let dj = -radius; dj <= radius; dj++) {
      for (let di = -radius; di <= radius; di++) {
        const ni = gridI + di;
        const nj = gridJ + dj;
        if (ni >= 1 && ni <= this.N && nj >= 1 && nj <= this.N) {
          const dist = Math.sqrt(di * di + dj * dj);
          if (dist <= radius) {
            const falloff = 1 - dist / (radius + 1);
            const idx = this.IX(ni, nj);
            this.uPrev[idx] += du * falloff;
            this.vPrev[idx] += dv * falloff;
          }
        }
      }
    }
  }

  injectDensity(gridI: number, gridJ: number, radius: number, r: number, g: number, b: number, strength: number): void {
    for (let dj = -radius; dj <= radius; dj++) {
      for (let di = -radius; di <= radius; di++) {
        const ni = gridI + di;
        const nj = gridJ + dj;
        if (ni >= 1 && ni <= this.N && nj >= 1 && nj <= this.N) {
          const dist = Math.sqrt(di * di + dj * dj);
          if (dist <= radius) {
            const falloff = 1 - dist / (radius + 1);
            const idx = this.IX(ni, nj);
            this.densRPrev[idx] += r * strength * falloff;
            this.densGPrev[idx] += g * strength * falloff;
            this.densBPrev[idx] += b * strength * falloff;
          }
        }
      }
    }
  }

  getVelocityAt(gridI: number, gridJ: number): { vx: number; vy: number } {
    const i = Math.max(1, Math.min(this.N, Math.floor(gridI)));
    const j = Math.max(1, Math.min(this.N, Math.floor(gridJ)));
    const idx = this.IX(i, j);
    return { vx: this.u[idx], vy: this.v[idx] };
  }

  getVelocityInterpolated(nx: number, ny: number): { vx: number; vy: number } {
    const fi = nx * this.N + 1;
    const fj = ny * this.N + 1;
    const i0 = Math.floor(fi);
    const j0 = Math.floor(fj);
    const i1 = Math.min(i0 + 1, this.N + 1);
    const j1 = Math.min(j0 + 1, this.N + 1);
    const si = fi - i0;
    const sj = fj - j0;

    const i0c = Math.max(1, Math.min(this.N, i0));
    const i1c = Math.max(1, Math.min(this.N, i1));
    const j0c = Math.max(1, Math.min(this.N, j0));
    const j1c = Math.max(1, Math.min(this.N, j1));

    const vx = (1 - si) * (1 - sj) * this.u[this.IX(i0c, j0c)] +
      si * (1 - sj) * this.u[this.IX(i1c, j0c)] +
      (1 - si) * sj * this.u[this.IX(i0c, j1c)] +
      si * sj * this.u[this.IX(i1c, j1c)];

    const vy = (1 - si) * (1 - sj) * this.v[this.IX(i0c, j0c)] +
      si * (1 - sj) * this.v[this.IX(i1c, j0c)] +
      (1 - si) * sj * this.v[this.IX(i0c, j1c)] +
      si * sj * this.v[this.IX(i1c, j1c)];

    return { vx, vy };
  }

  getDensityInterpolated(nx: number, ny: number): { r: number; g: number; b: number } {
    const fi = nx * this.N + 1;
    const fj = ny * this.N + 1;
    const i0 = Math.floor(fi);
    const j0 = Math.floor(fj);
    const i1 = Math.min(i0 + 1, this.N + 1);
    const j1 = Math.min(j0 + 1, this.N + 1);
    const si = fi - i0;
    const sj = fj - j0;

    const i0c = Math.max(1, Math.min(this.N, i0));
    const i1c = Math.max(1, Math.min(this.N, i1));
    const j0c = Math.max(1, Math.min(this.N, j0));
    const j1c = Math.max(1, Math.min(this.N, j1));

    const interp = (field: Float32Array) =>
      (1 - si) * (1 - sj) * field[this.IX(i0c, j0c)] +
      si * (1 - sj) * field[this.IX(i1c, j0c)] +
      (1 - si) * sj * field[this.IX(i0c, j1c)] +
      si * sj * field[this.IX(i1c, j1c)];

    return {
      r: interp(this.densR),
      g: interp(this.densG),
      b: interp(this.densB),
    };
  }

  clearAll(): void {
    this.u.fill(0);
    this.v.fill(0);
    this.uPrev.fill(0);
    this.vPrev.fill(0);
    this.densR.fill(0);
    this.densG.fill(0);
    this.densB.fill(0);
    this.densRPrev.fill(0);
    this.densGPrev.fill(0);
    this.densBPrev.fill(0);
  }
}
