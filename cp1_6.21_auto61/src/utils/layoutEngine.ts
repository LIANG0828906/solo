export function generateNodePositions(count: number, radius: number = 5): [number, number, number][] {
  const positions: [number, number, number][] = [];
  for (let i = 0; i < count; i++) {
    const phi = Math.acos(1 - 2 * Math.random());
    const theta = Math.random() * 2 * Math.PI;
    const r = radius * Math.cbrt(Math.random());
    positions.push([
      r * Math.sin(phi) * Math.cos(theta),
      r * Math.sin(phi) * Math.sin(theta),
      r * Math.cos(phi),
    ]);
  }
  return positions;
}

export function generateSinglePosition(radius: number = 5): [number, number, number] {
  const phi = Math.acos(1 - 2 * Math.random());
  const theta = Math.random() * 2 * Math.PI;
  const r = radius * Math.cbrt(Math.random());
  return [
    r * Math.sin(phi) * Math.cos(theta),
    r * Math.sin(phi) * Math.sin(theta),
    r * Math.cos(phi),
  ];
}

export function computeBezierControlPoints(
  start: [number, number, number],
  end: [number, number, number],
  curvature: number = 0.3
): { cp1: [number, number, number]; cp2: [number, number, number] } {
  const dx = end[0] - start[0];
  const dy = end[1] - start[1];
  const dz = end[2] - start[2];
  const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const midX = (start[0] + end[0]) / 2;
  const midY = (start[1] + end[1]) / 2;
  const midZ = (start[2] + end[2]) / 2;
  const perpX = -dz;
  const perpY = 0;
  const perpZ = dx;
  const perpLen = Math.sqrt(perpX * perpX + perpZ * perpZ) || 1;
  const offset = dist * curvature;
  return {
    cp1: [
      start[0] + dx * 0.3 + (perpX / perpLen) * offset,
      start[1] + dy * 0.3,
      start[2] + dz * 0.3 + (perpZ / perpLen) * offset,
    ],
    cp2: [
      end[0] - dx * 0.3 + (perpX / perpLen) * offset,
      end[1] - dy * 0.3,
      end[2] - dz * 0.3 + (perpZ / perpLen) * offset,
    ],
  };
}

export function cubicBezierPoint(
  t: number,
  p0: [number, number, number],
  p1: [number, number, number],
  p2: [number, number, number],
  p3: [number, number, number]
): [number, number, number] {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return [
    uuu * p0[0] + 3 * uu * t * p1[0] + 3 * u * tt * p2[0] + ttt * p3[0],
    uuu * p0[1] + 3 * uu * t * p1[1] + 3 * u * tt * p2[1] + ttt * p3[1],
    uuu * p0[2] + 3 * uu * t * p1[2] + 3 * u * tt * p2[2] + ttt * p3[2],
  ];
}
