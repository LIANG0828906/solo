import { create } from 'zustand';
import {
  GRID_SIZE,
  Direction,
  CellType,
  ToolType,
  Position,
  GridCell,
  MineCart,
  Stats,
  Particle,
  OrePopup,
  OPPOSITE_DIR,
  DIR_OFFSET,
  ALL_DIRS,
  CART_SPEED,
  ORE_LOAD_INTERVAL,
  ORE_LOAD_COUNT,
  UNLOAD_DURATION,
  MAX_CARTS,
  PARTICLE_COUNT_MIN,
  PARTICLE_COUNT_MAX,
  PARTICLE_LIFETIME,
  CartState,
} from './types';

export function createEmptyGrid(): GridCell[][] {
  return Array.from({ length: GRID_SIZE }, (_, row) =>
    Array.from({ length: GRID_SIZE }, (_, col) => ({
      type: 'empty' as CellType,
      connections: [] as Direction[],
      row,
      col,
    }))
  );
}

function isInBounds(row: number, col: number): boolean {
  return row >= 0 && row < GRID_SIZE && col >= 0 && col < GRID_SIZE;
}

function getConnectableNeighbors(grid: GridCell[][], row: number, col: number): Direction[] {
  const connections: Direction[] = [];
  for (const dir of ALL_DIRS) {
    const [dr, dc] = DIR_OFFSET[dir];
    const nr = row + dr;
    const nc = col + dc;
    if (isInBounds(nr, nc) && grid[nr][nc].type !== 'empty') {
      connections.push(dir);
    }
  }
  return connections;
}

export function updateConnections(grid: GridCell[][], row: number, col: number): void {
  const cell = grid[row][col];
  if (cell.type === 'empty') {
    cell.connections = [];
    return;
  }
  const connections = getConnectableNeighbors(grid, row, col);
  cell.connections = connections;
  for (const dir of connections) {
    const [dr, dc] = DIR_OFFSET[dir];
    const nr = row + dr;
    const nc = col + dc;
    const neighbor = grid[nr][nc];
    const opposite = OPPOSITE_DIR[dir];
    if (!neighbor.connections.includes(opposite)) {
      neighbor.connections = [...neighbor.connections, opposite];
    }
  }
}

export function removeConnectionsTo(grid: GridCell[][], row: number, col: number): void {
  const cell = grid[row][col];
  for (const dir of cell.connections) {
    const [dr, dc] = DIR_OFFSET[dir];
    const nr = row + dr;
    const nc = col + dc;
    if (isInBounds(nr, nc)) {
      const neighbor = grid[nr][nc];
      const opposite = OPPOSITE_DIR[dir];
      neighbor.connections = neighbor.connections.filter((d) => d !== opposite);
    }
  }
  cell.connections = [];
}

export function placeTrack(grid: GridCell[][], row: number, col: number): boolean {
  if (grid[row][col].type !== 'empty') return false;
  grid[row][col].type = 'track';
  updateConnections(grid, row, col);
  return true;
}

export function placeMine(grid: GridCell[][], row: number, col: number): boolean {
  if (grid[row][col].type !== 'empty') return false;
  grid[row][col].type = 'mine';
  updateConnections(grid, row, col);
  return true;
}

export function placeUnload(grid: GridCell[][], row: number, col: number): boolean {
  if (grid[row][col].type !== 'empty') return false;
  grid[row][col].type = 'unload';
  updateConnections(grid, row, col);
  return true;
}

export function eraseCell(grid: GridCell[][], row: number, col: number): void {
  removeConnectionsTo(grid, row, col);
  grid[row][col].type = 'empty';
  grid[row][col].connections = [];
  for (const dir of ALL_DIRS) {
    const [dr, dc] = DIR_OFFSET[dir];
    const nr = row + dr;
    const nc = col + dc;
    if (isInBounds(nr, nc) && grid[nr][nc].type !== 'empty') {
      updateConnections(grid, nr, nc);
    }
  }
}

export function findPath(grid: GridCell[][], start: Position, end: Position): Position[] | null {
  if (start.row === end.row && start.col === end.col) return [start];
  const visited = new Set<string>();
  const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [start] }];
  visited.add(`${start.row},${start.col}`);
  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;
    const cell = grid[pos.row][pos.col];
    for (const dir of cell.connections) {
      const [dr, dc] = DIR_OFFSET[dir];
      const nr = pos.row + dr;
      const nc = pos.col + dc;
      const key = `${nr},${nc}`;
      if (isInBounds(nr, nc) && !visited.has(key)) {
        const newPos: Position = { row: nr, col: nc };
        const newPath = [...path, newPos];
        if (nr === end.row && nc === end.col) return newPath;
        visited.add(key);
        queue.push({ pos: newPos, path: newPath });
      }
    }
  }
  return null;
}

export function findNearestPoint(grid: GridCell[][], start: Position, type: CellType): Position | null {
  const visited = new Set<string>();
  const queue: Position[] = [start];
  visited.add(`${start.row},${start.col}`);
  while (queue.length > 0) {
    const pos = queue.shift()!;
    if (grid[pos.row][pos.col].type === type && !(pos.row === start.row && pos.col === start.col)) {
      return pos;
    }
    const cell = grid[pos.row][pos.col];
    for (const dir of cell.connections) {
      const [dr, dc] = DIR_OFFSET[dir];
      const nr = pos.row + dr;
      const nc = pos.col + dc;
      const key = `${nr},${nc}`;
      if (isInBounds(nr, nc) && !visited.has(key)) {
        visited.add(key);
        queue.push({ row: nr, col: nc });
      }
    }
  }
  return null;
}

function getCartCurrentCell(cart: MineCart): Position {
  if (cart.path.length === 0) return cart.position;
  if (cart.pathIndex >= cart.path.length) return cart.path[cart.path.length - 1];
  return cart.path[cart.pathIndex];
}

function isCellOccupiedByOther(carts: MineCart[], cell: Position, excludeId: number): boolean {
  return carts.some((c) => {
    if (c.id === excludeId) return false;
    if (c.state === 'idle' || c.state === 'loading' || c.state === 'unloading') {
      const cPos = c.path.length > 0 ? c.path[c.pathIndex] || c.position : c.position;
      return cPos.row === cell.row && cPos.col === cell.col;
    }
    const currentCell = getCartCurrentCell(c);
    if (currentCell.row === cell.row && currentCell.col === cell.col) return true;
    if (c.pathIndex + 1 < c.path.length) {
      const nextCell = c.path[c.pathIndex + 1];
      if (nextCell.row === cell.row && nextCell.col === cell.col && c.progress > 0.5) return true;
    }
    return false;
  });
}

export function createParticles(x: number, y: number): Particle[] {
  const count = PARTICLE_COUNT_MIN + Math.floor(Math.random() * (PARTICLE_COUNT_MAX - PARTICLE_COUNT_MIN + 1));
  return Array.from({ length: count }, () => {
    const angle = Math.random() * Math.PI * 2;
    const speed = 40 + Math.random() * 80;
    return {
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      opacity: 1,
      size: 2 + Math.random() * 3,
      life: PARTICLE_LIFETIME,
    };
  });
}

export function updateParticles(particles: Particle[], dt: number): Particle[] {
  return particles
    .map((p) => ({
      ...p,
      x: p.x + p.vx * dt,
      y: p.y + p.vy * dt,
      vy: p.vy + 50 * dt,
      opacity: p.opacity - dt / p.life,
      life: p.life - dt,
    }))
    .filter((p) => p.opacity > 0 && p.life > 0);
}

function tryAssignPath(cart: MineCart, grid: GridCell[][], carts: MineCart[]): MineCart {
  const currentPos = getCartCurrentCell(cart);
  if (cart.state === 'idle' || cart.state === 'loading' || cart.state === 'unloading') {
    return cart;
  }
  if (cart.path.length > 0 && cart.pathIndex < cart.path.length) {
    return cart;
  }
  if (!cart.loaded) {
    const minePos = findNearestPoint(grid, currentPos, 'mine');
    if (minePos) {
      const path = findPath(grid, currentPos, minePos);
      if (path && path.length > 1) {
        return {
          ...cart,
          path,
          pathIndex: 0,
          progress: 0,
          state: 'moving_to_mine' as CartState,
          currentTripStart: Date.now(),
        };
      } else if (path && path.length === 1) {
        return {
          ...cart,
          state: 'loading' as CartState,
          loadingTimer: 0,
          loadCount: 0,
        };
      }
    }
  } else {
    const unloadPos = findNearestPoint(grid, currentPos, 'unload');
    if (unloadPos) {
      const path = findPath(grid, currentPos, unloadPos);
      if (path && path.length > 1) {
        return {
          ...cart,
          path,
          pathIndex: 0,
          progress: 0,
          state: 'moving_to_unload' as CartState,
        };
      } else if (path && path.length === 1) {
        return {
          ...cart,
          state: 'unloading' as CartState,
          unloadTimer: 0,
        };
      }
    }
  }
  return cart;
}

export function updateCarts(
  grid: GridCell[][],
  carts: MineCart[],
  dt: number,
  onOreUnload: () => void,
  onOreLoad: (row: number, col: number, count: number) => void,
  onParticlesCreate: (x: number, y: number) => void
): MineCart[] {
  let newCarts = carts.map((c) => ({ ...c }));
  for (let i = 0; i < newCarts.length; i++) {
    let cart = newCarts[i];
    cart = tryAssignPath(cart, grid, newCarts);
    switch (cart.state) {
      case 'idle': {
        const currentPos = cart.position;
        const minePos = findNearestPoint(grid, currentPos, 'mine');
        if (minePos) {
          const path = findPath(grid, currentPos, minePos);
          if (path && path.length >= 1) {
            cart = {
              ...cart,
              path,
              pathIndex: 0,
              progress: 0,
              state: 'moving_to_mine' as CartState,
              currentTripStart: Date.now(),
            };
          }
        }
        break;
      }
      case 'moving_to_mine':
      case 'moving_to_unload': {
        if (cart.path.length === 0 || cart.pathIndex >= cart.path.length - 1) {
          const currentPos = cart.path.length > 0 ? cart.path[cart.path.length - 1] : cart.position;
          if (cart.state === 'moving_to_mine' && grid[currentPos.row][currentPos.col].type === 'mine') {
            cart = { ...cart, state: 'loading', loadingTimer: 0, loadCount: 0 };
          } else if (cart.state === 'moving_to_unload' && grid[currentPos.row][currentPos.col].type === 'unload') {
            cart = { ...cart, state: 'unloading', unloadTimer: 0 };
          } else {
            cart = { ...cart, state: 'idle', path: [], pathIndex: 0, progress: 0 };
          }
          break;
        }
        const nextCell = cart.path[cart.pathIndex + 1];
        const blocked = isCellOccupiedByOther(newCarts, nextCell, cart.id);
        if (blocked) {
          cart = { ...cart, waitingForCart: true };
        } else {
          cart = { ...cart, waitingForCart: false, progress: cart.progress + CART_SPEED * dt };
          while (cart.progress >= 1 && cart.pathIndex < cart.path.length - 1) {
            cart = {
              ...cart,
              progress: cart.progress - 1,
              pathIndex: cart.pathIndex + 1,
            };
            if (cart.pathIndex >= cart.path.length - 1) {
              cart = { ...cart, progress: 0 };
              const arrivedPos = cart.path[cart.path.length - 1];
              if (cart.state === 'moving_to_mine' && grid[arrivedPos.row][arrivedPos.col].type === 'mine') {
                cart = { ...cart, state: 'loading', loadingTimer: 0, loadCount: 0 };
              } else if (cart.state === 'moving_to_unload' && grid[arrivedPos.row][arrivedPos.col].type === 'unload') {
                cart = { ...cart, state: 'unloading', unloadTimer: 0 };
              } else {
                cart = { ...cart, state: 'idle', path: [], pathIndex: 0, progress: 0 };
              }
              break;
            }
            const nextNextCell = cart.path[cart.pathIndex + 1];
            if (isCellOccupiedByOther(newCarts, nextNextCell, cart.id)) {
              cart = { ...cart, waitingForCart: true, progress: Math.min(cart.progress, 0.99) };
              break;
            }
          }
        }
        break;
      }
      case 'loading': {
        const newTimer = cart.loadingTimer + dt * 1000;
        const newLoadCount = Math.floor(newTimer / ORE_LOAD_INTERVAL);
        if (newLoadCount !== cart.loadCount && newLoadCount <= ORE_LOAD_COUNT) {
          const pos = getCartCurrentCell(cart);
          onOreLoad(pos.row, pos.col, newLoadCount);
        }
        if (newLoadCount >= ORE_LOAD_COUNT) {
          cart = {
            ...cart,
            loaded: true,
            state: 'idle',
            path: [],
            pathIndex: 0,
            progress: 0,
            loadingTimer: 0,
            loadCount: ORE_LOAD_COUNT,
          };
        } else {
          cart = { ...cart, loadingTimer: newTimer, loadCount: Math.min(newLoadCount, ORE_LOAD_COUNT) };
        }
        break;
      }
      case 'unloading': {
        const newUnloadTimer = cart.unloadTimer + dt * 1000;
        if (newUnloadTimer >= UNLOAD_DURATION) {
          const pos = getCartCurrentCell(cart);
          onOreUnload();
          onParticlesCreate(pos.col * 60 + 30, pos.row * 60 + 30);
          cart = {
            ...cart,
            loaded: false,
            state: 'idle',
            path: [],
            pathIndex: 0,
            progress: 0,
            unloadTimer: 0,
          };
        } else {
          cart = { ...cart, unloadTimer: newUnloadTimer };
        }
        break;
      }
      case 'waiting':
        break;
    }
    newCarts[i] = cart;
  }
  return newCarts;
}

export function calculateStats(
  grid: GridCell[][],
  carts: MineCart[],
  totalOre: number,
  transportTimes: number[]
): Stats {
  const inTransitCarts = carts.filter(
    (c) => c.state === 'moving_to_mine' || c.state === 'moving_to_unload' || c.state === 'waiting'
  ).length;
  const trackCells = grid.flat().filter((c) => c.type !== 'empty').length;
  const trackUtilization = (trackCells / (GRID_SIZE * GRID_SIZE)) * 100;
  const avgTransportTime =
    transportTimes.length > 0 ? transportTimes.reduce((a, b) => a + b, 0) / transportTimes.length / 1000 : 0;
  return { inTransitCarts, totalOre, avgTransportTime, trackUtilization };
}

interface GameStore {
  grid: GridCell[][];
  carts: MineCart[];
  particles: Particle[];
  orePopups: OrePopup[];
  isRunning: boolean;
  selectedTool: ToolType;
  stats: Stats;
  totalOre: number;
  transportTimes: number[];
  nextCartId: number;

  setTool: (tool: ToolType) => void;
  handleCellClick: (row: number, col: number) => void;
  handleCellDrag: (row: number, col: number) => void;
  toggleRunning: () => void;
  updateGame: (dt: number) => void;
  resetGame: () => void;
  updateStats: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  grid: createEmptyGrid(),
  carts: [],
  particles: [],
  orePopups: [],
  isRunning: false,
  selectedTool: 'track',
  stats: { inTransitCarts: 0, totalOre: 0, avgTransportTime: 0, trackUtilization: 0 },
  totalOre: 0,
  transportTimes: [],
  nextCartId: 1,

  setTool: (tool) => set({ selectedTool: tool }),

  handleCellClick: (row, col) => {
    const { grid, selectedTool, carts, nextCartId, isRunning } = get();
    if (isRunning && selectedTool !== 'cart') return;
    const newGrid = grid.map((r) => r.map((c) => ({ ...c, connections: [...c.connections] })));
    let changed = false;
    switch (selectedTool) {
      case 'track':
        changed = placeTrack(newGrid, row, col);
        break;
      case 'mine':
        changed = placeMine(newGrid, row, col);
        break;
      case 'unload':
        changed = placeUnload(newGrid, row, col);
        break;
      case 'eraser':
        eraseCell(newGrid, row, col);
        changed = true;
        break;
      case 'cart': {
        if (newGrid[row][col].type !== 'empty' && carts.length < MAX_CARTS) {
          const newCart: MineCart = {
            id: nextCartId,
            position: { row, col },
            path: [{ row, col }],
            pathIndex: 0,
            progress: 0,
            loaded: false,
            state: 'idle',
            loadingTimer: 0,
            loadCount: 0,
            waitingForCart: false,
            currentTripStart: 0,
            unloadTimer: 0,
          };
          set({ carts: [...carts, newCart], nextCartId: nextCartId + 1 });
        }
        return;
      }
    }
    if (changed) set({ grid: newGrid });
  },

  handleCellDrag: (row, col) => {
    const { grid, selectedTool, isRunning } = get();
    if (isRunning) return;
    if (selectedTool !== 'track') return;
    const newGrid = grid.map((r) => r.map((c) => ({ ...c, connections: [...c.connections] })));
    if (placeTrack(newGrid, row, col)) {
      set({ grid: newGrid });
    }
  },

  toggleRunning: () => {
    const { isRunning } = get();
    set({ isRunning: !isRunning });
  },

  updateGame: (dt) => {
    const { grid, carts, isRunning, totalOre, particles, orePopups } = get();
    if (!isRunning) return;
    let oreCount = totalOre;
    const newTransportTimes: number[] = [];
    const newParticles = [...particles];
    const newOrePopups = [...orePopups];

    const updatedCarts = updateCarts(
      grid,
      carts,
      dt,
      () => {
        oreCount++;
      },
      (row, col, count) => {
        newOrePopups.push({ row, col, count, timer: 0.6 });
      },
      (x, y) => {
        newParticles.push(...createParticles(x, y));
      }
    );

    const updatedParticles = updateParticles(newParticles, dt);
    const updatedOrePopups = newOrePopups
      .map((p) => ({ ...p, timer: p.timer - dt }))
      .filter((p) => p.timer > 0);

    set({
      carts: updatedCarts,
      particles: updatedParticles,
      orePopups: updatedOrePopups,
      totalOre: oreCount,
    });
  },

  updateStats: () => {
    const { grid, carts, totalOre, transportTimes } = get();
    const stats = calculateStats(grid, carts, totalOre, transportTimes);
    set({ stats });
  },

  resetGame: () => {
    set({
      grid: createEmptyGrid(),
      carts: [],
      particles: [],
      orePopups: [],
      isRunning: false,
      totalOre: 0,
      transportTimes: [],
      nextCartId: 1,
      stats: { inTransitCarts: 0, totalOre: 0, avgTransportTime: 0, trackUtilization: 0 },
    });
  },
}));
