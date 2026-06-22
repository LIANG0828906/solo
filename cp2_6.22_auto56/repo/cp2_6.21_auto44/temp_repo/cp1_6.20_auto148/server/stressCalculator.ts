export type WallType = 'point-supported' | 'frame-supported' | 'unit-type';

export interface CalculationParams {
  wallType: WallType;
  windPressure: number;
  windDirection: number;
}

export interface CalculationResult {
  displacements: number[];
  stresses: number[];
  nodeCountX: number;
  nodeCountY: number;
}

function getSupports(wallType: WallType, nx: number, ny: number): [number, number][] {
  const supports: [number, number][] = [];
  switch (wallType) {
    case 'point-supported':
      supports.push([0, 0], [nx - 1, 0], [0, ny - 1], [nx - 1, ny - 1]);
      supports.push([Math.floor(nx / 2), 0], [0, Math.floor(ny / 2)]);
      supports.push([nx - 1, Math.floor(ny / 2)], [Math.floor(nx / 2), ny - 1]);
      supports.push([Math.floor(nx / 2), Math.floor(ny / 2)]);
      supports.push([Math.floor(nx / 4), Math.floor(ny / 4)]);
      supports.push([Math.floor(3 * nx / 4), Math.floor(ny / 4)]);
      supports.push([Math.floor(nx / 4), Math.floor(3 * ny / 4)]);
      supports.push([Math.floor(3 * nx / 4), Math.floor(3 * ny / 4)]);
      break;
    case 'frame-supported':
      for (let i = 0; i < nx; i++) {
        supports.push([i, 0], [i, ny - 1]);
      }
      for (let j = 1; j < ny - 1; j++) {
        supports.push([0, j], [nx - 1, j]);
      }
      break;
    case 'unit-type':
      for (let i = 0; i < nx; i += 2) {
        supports.push([i, 0], [i, ny - 1]);
      }
      for (let j = 0; j < ny; j += 2) {
        supports.push([0, j], [nx - 1, j]);
      }
      for (let i = 2; i < nx; i += 2) {
        for (let j = 2; j < ny; j += 2) {
          supports.push([i, j]);
        }
      }
      break;
  }
  return supports;
}

export function calculateStress(params: CalculationParams): CalculationResult {
  const { wallType, windPressure, windDirection } = params;

  let nx: number, ny: number;
  switch (wallType) {
    case 'point-supported': nx = 20; ny = 20; break;
    case 'frame-supported': nx = 30; ny = 30; break;
    case 'unit-type': nx = 10; ny = 10; break;
  }

  const supports = getSupports(wallType, nx, ny);

  const windRad = (windDirection * Math.PI) / 180;
  const dirX = Math.cos(windRad);
  const dirY = Math.sin(windRad);

  const maxDisplacement = windPressure * 5.0;
  const halfDiag = Math.sqrt(((nx - 1) / 2) ** 2 + ((ny - 1) / 2) ** 2);

  const displacements: number[] = [];
  const stresses: number[] = [];
  let maxStress = 0;

  const cx = (nx - 1) / 2;
  const cy = (ny - 1) / 2;

  for (let j = 0; j < ny; j++) {
    for (let i = 0; i < nx; i++) {
      let minDist = Infinity;
      for (const [sx, sy] of supports) {
        const dx = i - sx;
        const dy = j - sy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDist) minDist = dist;
      }

      const normalizedDist = Math.min(minDist / halfDiag, 1);

      const relX = cx > 0 ? (i - cx) / cx : 0;
      const relY = cy > 0 ? (j - cy) / cy : 0;
      const windProjection = relX * dirX + relY * dirY;
      const directionFactor = 0.3 + 0.7 * Math.max(0, Math.min(1, windProjection));

      const displacement = maxDisplacement * normalizedDist * normalizedDist * directionFactor;
      displacements.push(displacement);

      const stress = normalizedDist * directionFactor;
      stresses.push(stress);
      if (stress > maxStress) maxStress = stress;
    }
  }

  if (maxStress > 0) {
    for (let i = 0; i < stresses.length; i++) {
      stresses[i] /= maxStress;
    }
  }

  return { displacements, stresses, nodeCountX: nx, nodeCountY: ny };
}
