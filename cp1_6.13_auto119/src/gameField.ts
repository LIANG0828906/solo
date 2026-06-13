export type ParticleColor = 'red' | 'yellow' | 'blue';

export interface Position {
  row: number;
  col: number;
}

export interface DualColorRenderData {
  color1: ParticleColor;
  color2: ParticleColor;
  alpha1: number;
  alpha2: number;
  splitRatio: number;
  floatPhase: number;
  glowPhase: number;
}

export interface SuperpositionParticle {
  id: string;
  color1: ParticleColor;
  color2: ParticleColor;
  pos1: Position;
  pos2: Position;
  state: 'superposition' | 'collapsing' | 'collapsed' | 'shattered';
  collapsedColor?: ParticleColor;
  collapsedPos?: Position;
  owner: number;
  animProgress?: number;
  renderData: DualColorRenderData;
}

export interface ShockwaveResult {
  type: 'annihilate' | 'entangle';
  target: SuperpositionParticle;
  newColor?: ParticleColor;
  damage: number;
}

export interface MeasureResult {
  particle: SuperpositionParticle;
  collapsedPos: Position;
  collapsedColor: ParticleColor;
  shockwaveResults: ShockwaveResult[];
  totalDamage: number;
}

const GRID_SIZE = 5;

let particleIdCounter = 0;
let grid: (SuperpositionParticle | null)[][] = [];
let particles: SuperpositionParticle[] = [];

export function initField(): void {
  grid = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      grid[r][c] = null;
    }
  }
  particles = [];
  particleIdCounter = 0;
}

export function getGrid(): (SuperpositionParticle | null)[][] {
  return grid;
}

export function getParticles(): SuperpositionParticle[] {
  return particles;
}

export function getGridSize(): number {
  return GRID_SIZE;
}

export function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
}

export function getNeighbors(row: number, col: number): Position[] {
  const neighbors: Position[] = [];
  const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (const [dr, dc] of dirs) {
    const nr = row + dr;
    const nc = col + dc;
    if (isInBounds(nr, nc)) {
      neighbors.push({ row: nr, col: nc });
    }
  }
  return neighbors;
}

export function getParticlesAt(row: number, col: number): SuperpositionParticle[] {
  return particles.filter(p => {
    if (p.state === 'collapsed' || p.state === 'shattered') {
      return p.collapsedPos?.row === row && p.collapsedPos?.col === col;
    }
    return (p.pos1.row === row && p.pos1.col === col) ||
           (p.pos2.row === row && p.pos2.col === col);
  });
}

export function hasAnyParticleAt(row: number, col: number): boolean {
  return getParticlesAt(row, col).length > 0;
}

function hasSuperpositionAt(row: number, col: number): boolean {
  return particles.some(p =>
    p.state === 'superposition' && (
      (p.pos1.row === row && p.pos1.col === col) ||
      (p.pos2.row === row && p.pos2.col === col)
    )
  );
}

function findAdjacentPair(row: number, col: number): Position[] | null {
  const neighbors = getNeighbors(row, col);
  for (const n of neighbors) {
    if (!hasSuperpositionAt(n.row, n.col)) {
      return [{ row, col }, n];
    }
  }
  return null;
}

export function placeParticle(
  row: number,
  col: number,
  color1: ParticleColor,
  color2: ParticleColor,
  owner: number
): SuperpositionParticle | null {
  if (!isInBounds(row, col)) return null;
  if (hasSuperpositionAt(row, col)) return null;

  const pair = findAdjacentPair(row, col);
  if (!pair) return null;

  const particle: SuperpositionParticle = {
    id: `p_${particleIdCounter++}`,
    color1,
    color2,
    pos1: pair[0],
    pos2: pair[1],
    state: 'superposition',
    owner,
    animProgress: 0,
    renderData: {
      color1,
      color2,
      alpha1: 0.6,
      alpha2: 0.6,
      splitRatio: 0.5,
      floatPhase: Math.random() * Math.PI * 2,
      glowPhase: Math.random() * Math.PI * 2
    }
  };

  particles.push(particle);
  return particle;
}

function mixColors(c1: ParticleColor, c2: ParticleColor): ParticleColor {
  if (c1 === c2) return c1;
  const set = new Set([c1, c2]);
  if (set.has('red') && set.has('yellow')) return 'red';
  if (set.has('red') && set.has('blue')) return 'blue';
  if (set.has('yellow') && set.has('blue')) return 'yellow';
  return c1;
}

export function measureParticle(particleId: string): MeasureResult | null {
  const particle = particles.find(p => p.id === particleId);
  if (!particle || particle.state !== 'superposition') return null;

  const choosePos1 = Math.random() < 0.5;
  const collapsedPos = choosePos1 ? particle.pos1 : particle.pos2;
  const collapsedColor = Math.random() < 0.5 ? particle.color1 : particle.color2;

  particle.state = 'collapsing';
  particle.collapsedPos = collapsedPos;
  particle.collapsedColor = collapsedColor;

  const shockwaveResults: ShockwaveResult[] = [];
  let totalDamage = 0;

  const neighbors = getNeighbors(collapsedPos.row, collapsedPos.col);

  for (const n of neighbors) {
    const targets = getParticlesAt(n.row, n.col).filter(
      p => p.id !== particleId && p.state !== 'shattered'
    );
    for (const target of targets) {
      if (target.state === 'superposition') {
        const targetColor = target.color1;
        if (targetColor === collapsedColor) {
          target.state = 'shattered';
          target.collapsedColor = targetColor;
          target.collapsedPos = target.pos1;
          shockwaveResults.push({
            type: 'annihilate',
            target,
            damage: 10
          });
          totalDamage += 10;
        } else {
          const newColor = mixColors(collapsedColor, targetColor);
          const oldColor1 = target.color1;
          const oldColor2 = target.color2;
          target.color1 = newColor;
          target.color2 = newColor;
          target.animProgress = 0;
          shockwaveResults.push({
            type: 'entangle',
            target,
            newColor,
            damage: 0
          });
        }
      } else if (target.state === 'collapsed' || target.state === 'collapsing') {
        const targetColor = target.collapsedColor!;
        if (targetColor === collapsedColor) {
          target.state = 'shattered';
          shockwaveResults.push({
            type: 'annihilate',
            target,
            damage: 10
          });
          totalDamage += 10;
        } else {
          const newColor = mixColors(collapsedColor, targetColor);
          target.collapsedColor = newColor;
          target.animProgress = 0;
          shockwaveResults.push({
            type: 'entangle',
            target,
            newColor,
            damage: 0
          });
        }
      }
    }
  }

  setTimeout(() => {
    if (particle.state === 'collapsing') {
      particle.state = 'collapsed';
    }
  }, 500);

  return {
    particle,
    collapsedPos,
    collapsedColor,
    shockwaveResults,
    totalDamage
  };
}

export function removeShatteredParticles(): void {
  particles = particles.filter(p => p.state !== 'shattered');
}

export function getRandomSuperpositionParticle(): SuperpositionParticle | null {
  const sp = particles.filter(p => p.state === 'superposition');
  if (sp.length === 0) return null;
  return sp[Math.floor(Math.random() * sp.length)];
}

export function getRandomEmptyCell(): Position | null {
  const empty: Position[] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (!hasSuperpositionAt(r, c)) {
        const neighbors = getNeighbors(r, c);
        if (neighbors.some(n => !hasSuperpositionAt(n.row, n.col))) {
          empty.push({ row: r, col: c });
        }
      }
    }
  }
  if (empty.length === 0) return null;
  return empty[Math.floor(Math.random() * empty.length)];
}
