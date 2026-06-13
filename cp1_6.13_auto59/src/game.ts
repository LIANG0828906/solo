export type CoreColor = 'red' | 'blue' | 'green';

export interface Core {
  color: CoreColor;
  row: number;
  col: number;
  placed: boolean;
  activating: boolean;
  activationProgress: number;
  exploding: boolean;
  explodeProgress: number;
  scale: number;
  glowPhase: number;
}

export interface Shockwave {
  row: number;
  col: number;
  direction: 'up' | 'down' | 'left' | 'right';
  color: CoreColor;
  progress: number;
  active: boolean;
  speed: number;
  sourceRow: number;
  sourceCol: number;
}

export interface Ripple {
  row: number;
  col: number;
  progress: number;
  color: string;
}

export interface ExplosionFragment {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export interface GameState {
  grid: (Core | null)[][];
  selectedColor: CoreColor;
  maxSteps: number;
  remainingSteps: number;
  coresRemaining: Record<CoreColor, number>;
  totalCores: Record<CoreColor, number>;
  shockwaves: Shockwave[];
  ripples: Ripple[];
  fragments: ExplosionFragment[];
  particles: Particle[];
  screenShake: { x: number; y: number; duration: number; elapsed: number };
  gameOver: boolean;
  victory: boolean;
  hoverCell: { row: number; col: number } | null;
  level: number;
  isChainActive: boolean;
  stepCounterDisplay: number;
  stepCounterAnimProgress: number;
}

const GRID_SIZE = 6;

const CORE_COLORS: Record<CoreColor, { main: string; light: string; dark: string; glow: string }> = {
  red: { main: '#ff3b3b', light: '#ff7b7b', dark: '#b01010', glow: 'rgba(255,59,59,0.6)' },
  blue: { main: '#3b8bff', light: '#7bb3ff', dark: '#1040b0', glow: 'rgba(59,139,255,0.6)' },
  green: { main: '#3bff6b', light: '#7bffa3', dark: '#10b030', glow: 'rgba(59,255,107,0.6)' },
};

const CORE_HEX: Record<CoreColor, string> = {
  red: '#ff3b3b',
  blue: '#3b8bff',
  green: '#3bff6b',
};

export function getCoreColors() {
  return CORE_COLORS;
}

export function getCoreHex() {
  return CORE_HEX;
}

export interface LevelConfig {
  maxSteps: number;
  red: number;
  blue: number;
  green: number;
}

const LEVELS: LevelConfig[] = [
  { maxSteps: 8, red: 3, blue: 3, green: 3 },
  { maxSteps: 7, red: 4, blue: 4, green: 3 },
  { maxSteps: 6, red: 5, blue: 4, green: 4 },
];

function createEmptyGrid(): (Core | null)[][] {
  const grid: (Core | null)[][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    grid[r] = [];
    for (let c = 0; c < GRID_SIZE; c++) {
      grid[r][c] = null;
    }
  }
  return grid;
}

let state: GameState;

export function getState(): GameState {
  return state;
}

export function startGame(level: number = 0): GameState {
  const cfg = LEVELS[Math.min(level, LEVELS.length - 1)];
  state = {
    grid: createEmptyGrid(),
    selectedColor: 'red',
    maxSteps: cfg.maxSteps,
    remainingSteps: cfg.maxSteps,
    coresRemaining: { red: cfg.red, blue: cfg.blue, green: cfg.green },
    totalCores: { red: cfg.red, blue: cfg.blue, green: cfg.green },
    shockwaves: [],
    ripples: [],
    fragments: [],
    particles: [],
    screenShake: { x: 0, y: 0, duration: 0, elapsed: 0 },
    gameOver: false,
    victory: false,
    hoverCell: null,
    level,
    isChainActive: false,
    stepCounterDisplay: cfg.maxSteps,
    stepCounterAnimProgress: 0,
  };
  return state;
}

export function placeCore(row: number, col: number): boolean {
  if (state.gameOver || state.isChainActive) return false;
  if (row < 0 || row >= GRID_SIZE || col < 0 || col >= GRID_SIZE) return false;
  if (state.grid[row][col] !== null) return false;
  if (state.coresRemaining[state.selectedColor] <= 0) return false;
  if (state.remainingSteps <= 0) return false;

  const core: Core = {
    color: state.selectedColor,
    row,
    col,
    placed: true,
    activating: true,
    activationProgress: 0,
    exploding: false,
    explodeProgress: 0,
    scale: 0,
    glowPhase: 0,
  };
  state.grid[row][col] = core;
  state.coresRemaining[state.selectedColor]--;
  state.remainingSteps--;
  state.isChainActive = false;
  return true;
}

export function triggerChain(row: number, col: number): boolean {
  if (state.gameOver || state.isChainActive) return false;
  const core = state.grid[row][col];
  if (!core || !core.placed || core.exploding) return false;

  state.isChainActive = true;
  startExplosion(core);
  return true;
}

function startExplosion(core: Core) {
  core.exploding = true;
  core.explodeProgress = 0;

  spawnExplosionFragments(core);
  spawnExplosionParticles(core);
  triggerScreenShake();

  setTimeout(() => {
    if (core.exploding) {
      state.grid[core.row][core.col] = null;
      emitShockwaves(core.row, core.col, core.color, [
        'up', 'down', 'left', 'right'
      ]);
      checkChainComplete();
    }
  }, 400);
}

function emitShockwaves(sourceRow: number, sourceCol: number, color: CoreColor, directions: ('up' | 'down' | 'left' | 'right')[]) {
  for (const dir of directions) {
    let targetRow = sourceRow;
    let targetCol = sourceCol;

    switch (dir) {
      case 'up': targetRow--; break;
      case 'down': targetRow++; break;
      case 'left': targetCol--; break;
      case 'right': targetCol++; break;
    }

    if (targetRow < 0 || targetRow >= GRID_SIZE || targetCol < 0 || targetCol >= GRID_SIZE) continue;

    const sw: Shockwave = {
      row: sourceRow,
      col: sourceCol,
      direction: dir,
      color,
      progress: 0,
      active: true,
      speed: 1 / 0.15,
      sourceRow,
      sourceCol,
    };
    state.shockwaves.push(sw);
  }
}

export function updateShockwaves(dt: number) {
  const toRemove: number[] = [];

  for (let i = 0; i < state.shockwaves.length; i++) {
    const sw = state.shockwaves[i];
    if (!sw.active) { toRemove.push(i); continue; }

    sw.progress += sw.speed * dt;

    if (sw.progress >= 1.0) {
      let targetRow = sw.row;
      let targetCol = sw.col;

      switch (sw.direction) {
        case 'up': targetRow = sw.row - 1; break;
        case 'down': targetRow = sw.row + 1; break;
        case 'left': targetCol = sw.col - 1; break;
        case 'right': targetCol = sw.col + 1; break;
      }

      if (targetRow < 0 || targetRow >= GRID_SIZE || targetCol < 0 || targetCol >= GRID_SIZE) {
        sw.active = false;
        toRemove.push(i);
        continue;
      }

      const target = state.grid[targetRow][targetCol];

      if (target && target.color === sw.color && !target.exploding) {
        sw.active = false;
        toRemove.push(i);
        startExplosion(target);
      } else if (target && target.color !== sw.color && !target.exploding) {
        pushCore(target, sw.direction);
        state.ripples.push({
          row: targetRow,
          col: targetCol,
          progress: 0,
          color: CORE_HEX[sw.color],
        });
        sw.active = false;
        toRemove.push(i);
      } else if (!target) {
        state.ripples.push({
          row: targetRow,
          col: targetCol,
          progress: 0,
          color: CORE_HEX[sw.color],
        });
        sw.row = targetRow;
        sw.col = targetCol;
        sw.progress = 0;
      } else {
        sw.active = false;
        toRemove.push(i);
      }
    }
  }

  for (let i = toRemove.length - 1; i >= 0; i--) {
    state.shockwaves.splice(toRemove[i], 1);
  }
}

function pushCore(core: Core, direction: 'up' | 'down' | 'left' | 'right') {
  let newRow = core.row;
  let newCol = core.col;

  switch (direction) {
    case 'up': newRow--; break;
    case 'down': newRow++; break;
    case 'left': newCol--; break;
    case 'right': newCol++; break;
  }

  if (newRow < 0 || newRow >= GRID_SIZE || newCol < 0 || newCol >= GRID_SIZE) return;
  if (state.grid[newRow][newCol] !== null) return;

  state.grid[core.row][core.col] = null;
  core.row = newRow;
  core.col = newCol;
  state.grid[newRow][newCol] = core;
}

function spawnExplosionFragments(core: Core) {
  const cx = core.col + 0.5;
  const cy = core.row + 0.5;
  const colors = CORE_COLORS[core.color];

  for (let i = 0; i < 12; i++) {
    const angle = (Math.PI * 2 * i) / 12 + Math.random() * 0.3;
    const speed = 2 + Math.random() * 3;
    state.fragments.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: Math.random() > 0.5 ? colors.main : colors.light,
      size: 0.08 + Math.random() * 0.1,
      life: 1.0,
      maxLife: 0.6 + Math.random() * 0.4,
    });
  }
}

function spawnExplosionParticles(core: Core) {
  const cx = core.col + 0.5;
  const cy = core.row + 0.5;
  const colors = CORE_COLORS[core.color];

  for (let i = 0; i < 20; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 1 + Math.random() * 4;
    state.particles.push({
      x: cx,
      y: cy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: Math.random() > 0.3 ? colors.main : colors.light,
      size: 0.03 + Math.random() * 0.06,
      life: 1.0,
      maxLife: 0.8 + Math.random() * 0.6,
    });
  }
}

function triggerScreenShake() {
  state.screenShake = {
    x: (Math.random() - 0.5) * 6,
    y: (Math.random() - 0.5) * 6,
    duration: 0.1,
    elapsed: 0,
  };
}

function checkChainComplete() {
  const colors: CoreColor[] = ['red', 'blue', 'green'];
  for (const c of colors) {
    let found = false;
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (state.grid[r][col] && state.grid[r][col]!.color === c) {
          found = true;
          break;
        }
      }
      if (found) break;
    }
  }

  let allGone = true;
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (state.grid[r][c] !== null) {
        allGone = false;
        break;
      }
    }
    if (!allGone) break;
  }

  if (allGone) {
    state.victory = true;
    state.gameOver = true;
    return;
  }

  if (state.shockwaves.length === 0) {
    state.isChainActive = false;

    if (state.remainingSteps <= 0) {
      let hasCores = false;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          if (state.grid[r][c] !== null) {
            hasCores = true;
            break;
          }
        }
        if (hasCores) break;
      }
      if (hasCores) {
        state.gameOver = true;
      }
    }
  }
}

export function updateFragments(dt: number) {
  for (let i = state.fragments.length - 1; i >= 0; i--) {
    const f = state.fragments[i];
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    f.vy += 3 * dt;
    f.life -= dt / f.maxLife;
    if (f.life <= 0) {
      state.fragments.splice(i, 1);
    }
  }
}

export function updateParticles(dt: number) {
  for (let i = state.particles.length - 1; i >= 0; i--) {
    const p = state.particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vx *= 0.98;
    p.vy *= 0.98;
    p.life -= dt / p.maxLife;
    if (p.life <= 0) {
      state.particles.splice(i, 1);
    }
  }
}

export function updateRipples(dt: number) {
  for (let i = state.ripples.length - 1; i >= 0; i--) {
    state.ripples[i].progress += dt * 2;
    if (state.ripples[i].progress >= 1.0) {
      state.ripples.splice(i, 1);
    }
  }
}

export function updateScreenShake(dt: number) {
  if (state.screenShake.duration > 0) {
    state.screenShake.elapsed += dt;
    if (state.screenShake.elapsed >= state.screenShake.duration) {
      state.screenShake.duration = 0;
      state.screenShake.x = 0;
      state.screenShake.y = 0;
    }
  }
}

export function updateCores(dt: number) {
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      const core = state.grid[r][c];
      if (!core) continue;

      if (core.activating) {
        core.activationProgress += dt / 0.3;
        core.scale = easeOutBack(Math.min(core.activationProgress, 1.0));
        if (core.activationProgress >= 1.0) {
          core.activating = false;
          core.scale = 1.0;
        }
      }

      if (core.exploding) {
        core.explodeProgress += dt / 0.4;
        if (core.explodeProgress < 0.5) {
          core.scale = 1.0 + 0.5 * (core.explodeProgress / 0.5);
        } else {
          core.scale = 1.5 * (1.0 - (core.explodeProgress - 0.5) / 0.5);
        }
      }

      core.glowPhase += dt * 2;
    }
  }
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

export function updateStepCounter(dt: number) {
  if (state.stepCounterDisplay !== state.remainingSteps) {
    state.stepCounterAnimProgress += dt / 0.2;
    if (state.stepCounterAnimProgress >= 1.0) {
      state.stepCounterDisplay = state.remainingSteps;
      state.stepCounterAnimProgress = 0;
    }
  }
}

export function setSelectedColor(color: CoreColor) {
  state.selectedColor = color;
}

export function setHoverCell(row: number | null, col: number | null) {
  if (row === null || col === null) {
    state.hoverCell = null;
  } else {
    state.hoverCell = { row, col };
  }
}

export function restartLevel() {
  startGame(state.level);
}
