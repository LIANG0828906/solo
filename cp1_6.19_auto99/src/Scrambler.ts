export type Axis = 'x' | 'y' | 'z';
export type Layer = -1 | 0 | 1;
export type Direction = 1 | -1;

export interface Move {
  axis: Axis;
  layer: Layer;
  direction: Direction;
}

const AXES: Axis[] = ['x', 'y', 'z'];
const LAYERS: Layer[] = [-1, 0, 1];

export function generateScramble(length: number = 20): Move[] {
  const moves: Move[] = [];
  let lastAxis: Axis | null = null;

  for (let i = 0; i < length; i++) {
    let axis: Axis;
    do {
      axis = AXES[Math.floor(Math.random() * AXES.length)];
    } while (axis === lastAxis);
    lastAxis = axis;

    const layer = LAYERS[Math.floor(Math.random() * LAYERS.length)];
    const direction = (Math.random() > 0.5 ? 1 : -1) as Direction;

    moves.push({ axis, layer, direction });
  }

  return moves;
}
