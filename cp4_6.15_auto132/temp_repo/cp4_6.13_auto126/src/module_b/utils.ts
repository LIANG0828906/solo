export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

export function lerpColor(
  color1: { r: number; g: number; b: number },
  color2: { r: number; g: number; b: number },
  t: number
): { r: number; g: number; b: number } {
  return {
    r: lerp(color1.r, color2.r, t),
    g: lerp(color1.g, color2.g, t),
    b: lerp(color1.b, color2.b, t)
  };
}

export interface GridIndex {
  ix: number;
  iz: number;
  distance: number;
  weight: number;
}

export function calculateCircleIndices(
  centerX: number,
  centerZ: number,
  radius: number,
  gridSize: number
): GridIndex[] {
  const indices: GridIndex[] = [];
  const minX = Math.max(0, Math.floor(centerX - radius));
  const maxX = Math.min(gridSize - 1, Math.ceil(centerX + radius));
  const minZ = Math.max(0, Math.floor(centerZ - radius));
  const maxZ = Math.min(gridSize - 1, Math.ceil(centerZ + radius));

  for (let iz = minZ; iz <= maxZ; iz++) {
    for (let ix = minX; ix <= maxX; ix++) {
      const dx = ix - centerX;
      const dz = iz - centerZ;
      const distance = Math.sqrt(dx * dx + dz * dz);
      if (distance <= radius) {
        const weight = 1 - distance / radius;
        const smoothWeight = weight * weight * (3 - 2 * weight);
        indices.push({ ix, iz, distance, weight: smoothWeight });
      }
    }
  }
  return indices;
}

export function heightToColor(height: number): { r: number; g: number; b: number } {
  const colorStops: { height: number; color: { r: number; g: number; b: number } }[] = [
    { height: -1.0, color: { r: 0.0, g: 0.1, b: 0.4 } },
    { height: -0.5, color: { r: 0.2, g: 0.5, b: 0.8 } },
    { height: 0.0, color: { r: 0.2, g: 0.6, b: 0.2 } },
    { height: 0.3, color: { r: 0.8, g: 0.8, b: 0.2 } },
    { height: 0.6, color: { r: 0.6, g: 0.4, b: 0.2 } },
    { height: 1.0, color: { r: 1.0, g: 1.0, b: 1.0 } }
  ];

  const h = clamp(height, -1, 1);

  for (let i = 0; i < colorStops.length - 1; i++) {
    const stop1 = colorStops[i];
    const stop2 = colorStops[i + 1];
    if (h >= stop1.height && h <= stop2.height) {
      const t = (h - stop1.height) / (stop2.height - stop1.height);
      return lerpColor(stop1.color, stop2.color, t);
    }
  }

  return colorStops[colorStops.length - 1].color;
}
