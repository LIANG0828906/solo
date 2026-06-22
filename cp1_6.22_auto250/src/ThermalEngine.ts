import type {
  GridConfig,
  SolutionProperties,
  HeatFluxVec,
  ThermalResult,
} from './types';

type Region = 'chip' | 'substrate' | 'heatSink' | 'void';

interface CellInfo {
  region: Region;
  k: number;
}

const DEFAULT_GRID: GridConfig = {
  chipSize: [20, 20, 2],
  substrateSize: [30, 30, 3],
  heatSinkSize: [40, 40, 10],
  resolution: 0.5,
};

export class ThermalEngine {
  private readonly cfg: GridConfig;
  private nx: number;
  private ny: number;
  private nz: number;
  private dx: number;
  private dy: number;
  private dz: number;
  private xBounds: [number, number];
  private yBounds: [number, number];
  private zBounds: [number, number];
  private zLayers: { chip: [number, number]; substrate: [number, number]; heatSink: [number, number] };
  private cellInfo: CellInfo[][][];
  private cellPos: Array<{ pos: [number, number, number]; region: 'chip' | 'substrate' | 'heatSink' }>;
  private props: SolutionProperties;

  constructor(cfg: GridConfig = DEFAULT_GRID) {
    this.cfg = cfg;
    const [cx, cy, cz] = cfg.chipSize;
    const [sx, sy, sz] = cfg.substrateSize;
    const [hx, hy, hz] = cfg.heatSinkSize;
    this.dx = 1 / cfg.resolution;
    this.dy = 1 / cfg.resolution;
    this.dz = 1 / cfg.resolution;
    const totalX = Math.max(cx, sx, hx);
    const totalY = Math.max(cy, sy, hy);
    const totalZ = cz + sz + hz;
    this.xBounds = [-totalX / 2, totalX / 2];
    this.yBounds = [-totalY / 2, totalY / 2];
    this.zBounds = [-totalZ / 2, totalZ / 2];
    this.nx = Math.max(4, Math.ceil(totalX / this.dx) + 1);
    this.ny = Math.max(4, Math.ceil(totalY / this.dy) + 1);
    this.nz = Math.max(6, Math.ceil(totalZ / this.dz) + 1);
    const z0 = this.zBounds[0];
    this.zLayers = {
      heatSink: [z0, z0 + hz],
      substrate: [z0 + hz, z0 + hz + sz],
      chip: [z0 + hz + sz, z0 + hz + sz + cz],
    };
    this.props = {
      thermalConductivity: 401,
      convectionCoeff: 25,
      particleDensity: 1.0,
      label: '',
      shortLabel: '',
    };
    this.cellInfo = this.buildCellInfo();
    this.cellPos = this.buildCellPositions();
  }

  private idxToPos(i: number, j: number, k: number): [number, number, number] {
    const x = this.xBounds[0] + i * this.dx;
    const y = this.yBounds[0] + j * this.dy;
    const z = this.zBounds[0] + k * this.dz;
    return [x, y, z];
  }

  private posInBox(
    x: number,
    y: number,
    z: number,
    bx: [number, number],
    by: [number, number],
    bz: [number, number],
  ): boolean {
    return x >= bx[0] && x <= bx[1] && y >= by[0] && y <= by[1] && z >= bz[0] && z <= bz[1];
  }

  private regionBox(region: 'chip' | 'substrate' | 'heatSink'): {
    bx: [number, number];
    by: [number, number];
    bz: [number, number];
  } {
    const [cx, cy] = this.cfg.chipSize;
    const [sx, sy] = this.cfg.substrateSize;
    const [hx, hy] = this.cfg.heatSinkSize;
    const [zCh, zSub, zHS] = [this.zLayers.chip, this.zLayers.substrate, this.zLayers.heatSink];
    if (region === 'chip') {
      return { bx: [-cx / 2, cx / 2], by: [-cy / 2, cy / 2], bz: zCh };
    }
    if (region === 'substrate') {
      return { bx: [-sx / 2, sx / 2], by: [-sy / 2, sy / 2], bz: zSub };
    }
    return { bx: [-hx / 2, hx / 2], by: [-hy / 2, hy / 2], bz: zHS };
  }

  private regionAt(x: number, y: number, z: number): Region {
    for (const r of ['heatSink', 'substrate', 'chip'] as const) {
      const b = this.regionBox(r);
      if (this.posInBox(x, y, z, b.bx, b.by, b.bz)) return r;
    }
    return 'void';
  }

  private buildCellInfo(): CellInfo[][][] {
    const info: CellInfo[][][] = [];
    const kChip = 150;
    const kSub = 20;
    for (let i = 0; i < this.nx; i++) {
      info[i] = [];
      for (let j = 0; j < this.ny; j++) {
        info[i][j] = [];
        for (let k = 0; k < this.nz; k++) {
          const [x, y, z] = this.idxToPos(i, j, k);
          const region = this.regionAt(x, y, z);
          let kEff = 0;
          if (region === 'chip') kEff = kChip;
          else if (region === 'substrate') kEff = kSub;
          else if (region === 'heatSink') kEff = this.props.thermalConductivity;
          info[i][j][k] = { region, k: kEff };
        }
      }
    }
    return info;
  }

  private buildCellPositions(): ThermalResult['nodePositions'] {
    const arr: ThermalResult['nodePositions'] = [];
    for (let i = 0; i < this.nx; i++) {
      for (let j = 0; j < this.ny; j++) {
        for (let k = 0; k < this.nz; k++) {
          const cell = this.cellInfo[i][j][k];
          if (cell.region === 'void') continue;
          arr.push({
            pos: this.idxToPos(i, j, k),
            region: cell.region,
          });
        }
      }
    }
    return arr;
  }

  setSolution(props: SolutionProperties): void {
    this.props = props;
    for (let i = 0; i < this.nx; i++) {
      for (let j = 0; j < this.ny; j++) {
        for (let k = 0; k < this.nz; k++) {
          const cell = this.cellInfo[i][j][k];
          if (cell.region === 'heatSink') {
            cell.k = props.thermalConductivity;
          }
        }
      }
    }
  }

  compute(power: number, ambientTemp: number): ThermalResult {
    const N = this.nx * this.ny * this.nz;
    const T = new Float64Array(N);
    const b = new Float64Array(N);
    const A = new Array<Array<{ idx: number; val: number }>>(N);
    for (let n = 0; n < N; n++) A[n] = [];
    const chipBox = this.regionBox('chip');
    const chipVol =
      (chipBox.bx[1] - chipBox.bx[0]) *
      (chipBox.by[1] - chipBox.by[0]) *
      (chipBox.bz[1] - chipBox.bz[0]);
    const qVol = power / Math.max(1e-6, chipVol);
    const h = this.props.convectionCoeff;
    const ddx = this.dx * this.dx;
    const ddy = this.dy * this.dy;
    const ddz = this.dz * this.dz;
    const idx = (i: number, j: number, k: number) => i * this.ny * this.nz + j * this.nz + k;

    for (let i = 0; i < this.nx; i++) {
      for (let j = 0; j < this.ny; j++) {
        for (let k = 0; k < this.nz; k++) {
          const n = idx(i, j, k);
          const cell = this.cellInfo[i][j][k];
          T[n] = ambientTemp;
          if (cell.region === 'void') {
            A[n].push({ idx: n, val: 1 });
            b[n] = ambientTemp;
            continue;
          }
          const k0 = cell.k;
          let diag = 0;
          const neighbors: Array<[number, number, number, number, number]> = [
            [i - 1, j, k, ddx, i > 0 ? this.cellInfo[i - 1][j][k].k : 0],
            [i + 1, j, k, ddx, i < this.nx - 1 ? this.cellInfo[i + 1][j][k].k : 0],
            [i, j - 1, k, ddy, j > 0 ? this.cellInfo[i][j - 1][k].k : 0],
            [i, j + 1, k, ddy, j < this.ny - 1 ? this.cellInfo[i][j + 1][k].k : 0],
            [i, j, k - 1, ddz, k > 0 ? this.cellInfo[i][j][k - 1].k : 0],
            [i, j, k + 1, ddz, k < this.nz - 1 ? this.cellInfo[i][j][k + 1].k : 0],
          ];
          for (const [ni, nj, nk, d2, kn] of neighbors) {
            let knn = kn;
            if (knn <= 0) {
              const bi = h * 1.0;
              const ke = k0;
              const denom = ke + bi * this.dx;
              A[n].push({ idx: n, val: bi * ke / denom });
              b[n] += (bi * ke / denom) * ambientTemp;
              diag += bi * ke / denom;
              continue;
            }
            const kEff = 2 * k0 * knn / (k0 + knn);
            const w = kEff / d2;
            const outOfBounds =
              ni < 0 || ni >= this.nx || nj < 0 || nj >= this.ny || nk < 0 || nk >= this.nz;
            if (outOfBounds) {
              A[n].push({ idx: n, val: w });
              b[n] += w * ambientTemp;
              diag += w;
            } else {
              A[n].push({ idx: idx(ni, nj, nk), val: -w });
              diag += w;
            }
          }
          A[n].push({ idx: n, val: diag });
          if (cell.region === 'chip') {
            const [x, y, z] = this.idxToPos(i, j, k);
            if (this.posInBox(x, y, z, chipBox.bx, chipBox.by, chipBox.bz)) {
              b[n] += qVol;
            }
          }
        }
      }
    }

    const sor = 1.4;
    const maxIter = 60;
    for (let iter = 0; iter < maxIter; iter++) {
      let maxDiff = 0;
      for (let n = 0; n < N; n++) {
        let sum = 0;
        let d = 0;
        for (const e of A[n]) {
          if (e.idx === n) d = e.val;
          else sum += e.val * T[e.idx];
        }
        if (d <= 1e-12) continue;
        const rhs = (b[n] - sum) / d;
        const newT = T[n] + sor * (rhs - T[n]);
        const diff = Math.abs(newT - T[n]);
        if (diff > maxDiff) maxDiff = diff;
        T[n] = newT;
      }
      if (maxDiff < 0.01 && iter > 15) break;
    }

    const temperatures: number[][][] = [];
    for (let i = 0; i < this.nx; i++) {
      temperatures[i] = [];
      for (let j = 0; j < this.ny; j++) {
        temperatures[i][j] = [];
        for (let k = 0; k < this.nz; k++) {
          temperatures[i][j][k] = T[idx(i, j, k)];
        }
      }
    }

    const heatFlux: HeatFluxVec[][][] = [];
    for (let i = 0; i < this.nx; i++) {
      heatFlux[i] = [];
      for (let j = 0; j < this.ny; j++) {
        heatFlux[i][j] = [];
        for (let k = 0; k < this.nz; k++) {
          const cell = this.cellInfo[i][j][k];
          let fx = 0;
          let fy = 0;
          let fz = 0;
          if (cell.region !== 'void') {
            const Tc = temperatures[i][j][k];
            const Ti = i > 0 ? temperatures[i - 1][j][k] : Tc;
            const Ti1 = i < this.nx - 1 ? temperatures[i + 1][j][k] : Tc;
            const Tj = j > 0 ? temperatures[i][j - 1][k] : Tc;
            const Tj1 = j < this.ny - 1 ? temperatures[i][j + 1][k] : Tc;
            const Tk = k > 0 ? temperatures[i][j][k - 1] : Tc;
            const Tk1 = k < this.nz - 1 ? temperatures[i][j][k + 1] : Tc;
            const gx = (Ti1 - Ti) / (2 * this.dx);
            const gy = (Tj1 - Tj) / (2 * this.dy);
            const gz = (Tk1 - Tk) / (2 * this.dz);
            fx = -cell.k * gx;
            fy = -cell.k * gy;
            fz = -cell.k * gz;
          }
          heatFlux[i][j][k] = { x: fx, y: fy, z: fz };
        }
      }
    }

    return {
      temperatures,
      heatFlux,
      gridSize: [this.nx, this.ny, this.nz],
      nodePositions: this.cellPos,
    };
  }

  sampleTemp(pos: [number, number, number], temperatures: number[][][]): number {
    const [x, y, z] = pos;
    const fi = (x - this.xBounds[0]) / this.dx;
    const fj = (y - this.yBounds[0]) / this.dy;
    const fk = (z - this.zBounds[0]) / this.dz;
    const i = Math.max(0, Math.min(this.nx - 2, Math.floor(fi)));
    const j = Math.max(0, Math.min(this.ny - 2, Math.floor(fj)));
    const k = Math.max(0, Math.min(this.nz - 2, Math.floor(fk)));
    const fx = fi - i;
    const fy = fj - j;
    const fz = fk - k;
    const t000 = temperatures[i][j][k];
    const t100 = temperatures[i + 1][j][k];
    const t010 = temperatures[i][j + 1][k];
    const t110 = temperatures[i + 1][j + 1][k];
    const t001 = temperatures[i][j][k + 1];
    const t101 = temperatures[i + 1][j][k + 1];
    const t011 = temperatures[i][j + 1][k + 1];
    const t111 = temperatures[i + 1][j + 1][k + 1];
    const x00 = t000 + (t100 - t000) * fx;
    const x10 = t010 + (t110 - t010) * fx;
    const x01 = t001 + (t101 - t001) * fx;
    const x11 = t011 + (t111 - t011) * fx;
    const y0 = x00 + (x10 - x00) * fy;
    const y1 = x01 + (x11 - x01) * fy;
    return y0 + (y1 - y0) * fz;
  }

  sampleFlux(pos: [number, number, number], heatFlux: HeatFluxVec[][][]): HeatFluxVec {
    const [x, y, z] = pos;
    const fi = (x - this.xBounds[0]) / this.dx;
    const fj = (y - this.yBounds[0]) / this.dy;
    const fk = (z - this.zBounds[0]) / this.dz;
    const i = Math.max(0, Math.min(this.nx - 2, Math.floor(fi)));
    const j = Math.max(0, Math.min(this.ny - 2, Math.floor(fj)));
    const k = Math.max(0, Math.min(this.nz - 2, Math.floor(fk)));
    const avg = (a: HeatFluxVec, b: HeatFluxVec, t: number): HeatFluxVec => ({
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t,
    });
    const fx = fi - i;
    const fy = fj - j;
    const fz = fk - k;
    const x00 = avg(heatFlux[i][j][k], heatFlux[i + 1][j][k], fx);
    const x10 = avg(heatFlux[i][j + 1][k], heatFlux[i + 1][j + 1][k], fx);
    const x01 = avg(heatFlux[i][j][k + 1], heatFlux[i + 1][j][k + 1], fx);
    const x11 = avg(heatFlux[i][j + 1][k + 1], heatFlux[i + 1][j + 1][k + 1], fx);
    const y0 = avg(x00, x10, fy);
    const y1 = avg(x01, x11, fy);
    return avg(y0, y1, fz);
  }

  getGridNodes(): ThermalResult['nodePositions'] {
    return this.cellPos;
  }

  getGridInfo(): { bounds: { x: [number, number]; y: [number, number]; z: [number, number] }; size: [number, number, number] } {
    return {
      bounds: { x: this.xBounds, y: this.yBounds, z: this.zBounds },
      size: [this.nx, this.ny, this.nz],
    };
  }

  getLayerZs(): { chip: [number, number]; substrate: [number, number]; heatSink: [number, number] } {
    return this.zLayers;
  }
}
