import { EventBus } from './EventBus';

export interface Cell {
  x: number;
  y: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited: boolean;
  roomId: number;
}

export interface Position {
  x: number;
  y: number;
}

export type ItemType = 'key' | 'potion' | 'torch' | 'map' | 'shield' | 'coin';

export interface InventoryItem {
  type: ItemType;
  name: string;
  description: string;
  quantity: number;
  icon: string;
}

export interface PlayerState {
  hp: number;
  maxHp: number;
  stamina: number;
  maxStamina: number;
  position: Position;
  inventory: Record<ItemType, InventoryItem>;
  explored: Set<string>;
  steps: number;
  eventsEncountered: number;
  keysCollected: number;
  coinsCollected: number;
  alive: boolean;
  won: boolean;
  shieldActive: boolean;
  torchActive: boolean;
  mapActive: boolean;
  pathToExit: Position[];
}

export interface MazeData {
  grid: Cell[][];
  width: number;
  height: number;
  entrance: Position;
  exit: Position;
}

const MAZE_SIZE = 30;
const ITEM_DEFS: Omit<InventoryItem, 'quantity'>[] = [
  { type: 'key', name: '钥匙', description: '打开出口的钥匙，需要3把才能解锁出口', icon: '🔑' },
  { type: 'potion', name: '药水', description: '恢复20点生命值', icon: '🧪' },
  { type: 'torch', name: '火把', description: '照亮周围3x3范围，持续5步', icon: '🔥' },
  { type: 'map', name: '地图', description: '自动标记从当前位置到出口的路径', icon: '🗺️' },
  { type: 'shield', name: '护盾', description: '抵消下一次陷阱伤害', icon: '🛡️' },
  { type: 'coin', name: '金币', description: '与商人交易的货币', icon: '🪙' },
];

function createEmptyGrid(size: number): Cell[][] {
  const grid: Cell[][] = [];
  let roomId = 0;
  for (let y = 0; y < size; y++) {
    grid[y] = [];
    for (let x = 0; x < size; x++) {
      grid[y][x] = {
        x, y,
        walls: { top: true, right: true, bottom: true, left: true },
        visited: false,
        roomId: roomId++,
      };
    }
  }
  return grid;
}

function getUnvisitedNeighbors(grid: Cell[][], cell: Cell): Cell[] {
  const neighbors: Cell[] = [];
  const { x, y } = cell;
  if (y > 0 && !grid[y - 1][x].visited) neighbors.push(grid[y - 1][x]);
  if (x < grid[0].length - 1 && !grid[y][x + 1].visited) neighbors.push(grid[y][x + 1]);
  if (y < grid.length - 1 && !grid[y + 1][x].visited) neighbors.push(grid[y + 1][x]);
  if (x > 0 && !grid[y][x - 1].visited) neighbors.push(grid[y][x - 1]);
  return neighbors;
}

function removeWalls(a: Cell, b: Cell): void {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  if (dx === 1) { a.walls.right = false; b.walls.left = false; }
  if (dx === -1) { a.walls.left = false; b.walls.right = false; }
  if (dy === 1) { a.walls.bottom = false; b.walls.top = false; }
  if (dy === -1) { a.walls.top = false; b.walls.bottom = false; }
}

function generateMaze(size: number): Cell[][] {
  const grid = createEmptyGrid(size);
  const stack: Cell[] = [];
  const start = grid[0][0];
  start.visited = true;
  stack.push(start);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = getUnvisitedNeighbors(grid, current);
    if (neighbors.length === 0) {
      stack.pop();
    } else {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      removeWalls(current, next);
      next.visited = true;
      stack.push(next);
    }
  }

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      grid[y][x].visited = false;
    }
  }

  return grid;
}

function findPath(grid: Cell[][], start: Position, end: Position): Position[] {
  const visited = new Set<string>();
  const queue: { pos: Position; path: Position[] }[] = [{ pos: start, path: [start] }];
  visited.add(`${start.x},${start.y}`);

  while (queue.length > 0) {
    const { pos, path } = queue.shift()!;
    if (pos.x === end.x && pos.y === end.y) return path;

    const cell = grid[pos.y][pos.x];
    const dirs: { dx: number; dy: number; wall: keyof Cell['walls'] }[] = [
      { dx: 0, dy: -1, wall: 'top' },
      { dx: 1, dy: 0, wall: 'right' },
      { dx: 0, dy: 1, wall: 'bottom' },
      { dx: -1, dy: 0, wall: 'left' },
    ];

    for (const { dx, dy, wall } of dirs) {
      if (!cell.walls[wall]) {
        const nx = pos.x + dx;
        const ny = pos.y + dy;
        const key = `${nx},${ny}`;
        if (nx >= 0 && nx < grid[0].length && ny >= 0 && ny < grid.length && !visited.has(key)) {
          visited.add(key);
          queue.push({ pos: { x: nx, y: ny }, path: [...path, { x: nx, y: ny }] });
        }
      }
    }
  }
  return [];
}

function createInitialInventory(): Record<ItemType, InventoryItem> {
  const inv = {} as Record<ItemType, InventoryItem>;
  for (const def of ITEM_DEFS) {
    inv[def.type] = { ...def, quantity: 0 };
  }
  return inv;
}

export class GameLogic {
  maze: MazeData;
  player: PlayerState;
  torchStepsLeft: number = 0;
  private keyPos: Set<string> = new Set();

  constructor() {
    const grid = generateMaze(MAZE_SIZE);
    const entrance: Position = { x: 0, y: 0 };
    const exit: Position = { x: MAZE_SIZE - 1, y: MAZE_SIZE - 1 };

    this.maze = { grid, width: MAZE_SIZE, height: MAZE_SIZE, entrance, exit };

    this.player = {
      hp: 100,
      maxHp: 100,
      stamina: 100,
      maxStamina: 100,
      position: { ...entrance },
      inventory: createInitialInventory(),
      explored: new Set<string>(),
      steps: 0,
      eventsEncountered: 0,
      keysCollected: 0,
      coinsCollected: 0,
      alive: true,
      won: false,
      shieldActive: false,
      torchActive: false,
      mapActive: false,
      pathToExit: [],
    };

    this.player.explored.add(`${entrance.x},${entrance.y}`);
    this.revealAround(entrance);

    this.placeKeyPositions();

    EventBus.emit('maze:generated', this.getMazeInfo());
    EventBus.emit('player:stateChanged', this.getPlayerInfo());
  }

  private placeKeyPositions(): void {
    const placed: Position[] = [];
    while (placed.length < 3) {
      const x = Math.floor(Math.random() * MAZE_SIZE);
      const y = Math.floor(Math.random() * MAZE_SIZE);
      const key = `${x},${y}`;
      if ((x === 0 && y === 0) || (x === MAZE_SIZE - 1 && y === MAZE_SIZE - 1)) continue;
      if (this.keyPos.has(key)) continue;
      const minDist = placed.reduce((min, p) => {
        const d = Math.abs(p.x - x) + Math.abs(p.y - y);
        return d < min ? d : min;
      }, Infinity);
      if (placed.length > 0 && minDist < 8) continue;
      this.keyPos.add(key);
      placed.push({ x, y });
    }
  }

  private revealAround(pos: Position): void {
    const range = this.player.torchActive ? 2 : 1;
    for (let dy = -range; dy <= range; dy++) {
      for (let dx = -range; dx <= range; dx++) {
        const nx = pos.x + dx;
        const ny = pos.y + dy;
        if (nx >= 0 && nx < this.maze.width && ny >= 0 && ny < this.maze.height) {
          this.player.explored.add(`${nx},${ny}`);
        }
      }
    }
  }

  move(dx: number, dy: number): void {
    if (!this.player.alive || this.player.won) return;

    const { x, y } = this.player.position;
    const cell = this.maze.grid[y][x];

    if (dx === 0 && dy === -1 && cell.walls.top) return;
    if (dx === 1 && dy === 0 && cell.walls.right) return;
    if (dx === 0 && dy === 1 && cell.walls.bottom) return;
    if (dx === -1 && dy === 0 && cell.walls.left) return;

    const nx = x + dx;
    const ny = y + dy;
    if (nx < 0 || nx >= this.maze.width || ny < 0 || ny >= this.maze.height) return;

    if (this.player.stamina <= 0) {
      this.player.hp -= 2;
      if (this.player.hp <= 0) {
        this.player.hp = 0;
        this.player.alive = false;
        EventBus.emit('player:stateChanged', this.getPlayerInfo());
        EventBus.emit('player:died', {});
        return;
      }
    }

    this.player.stamina = Math.max(0, this.player.stamina - 1);
    this.player.position = { x: nx, y: ny };
    this.player.steps++;
    this.player.explored.add(`${nx},${ny}`);
    this.revealAround({ x: nx, y: ny });

    if (this.torchStepsLeft > 0) {
      this.torchStepsLeft--;
      if (this.torchStepsLeft === 0) {
        this.player.torchActive = false;
      }
    }

    if (this.player.mapActive) {
      this.player.pathToExit = findPath(this.maze.grid, { x: nx, y: ny }, this.maze.exit);
    }

    EventBus.emit('player:moved', { from: { x, y }, to: { x: nx, y: ny } });
    EventBus.emit('player:stateChanged', this.getPlayerInfo());

    if (nx === this.maze.exit.x && ny === this.maze.exit.y) {
      if (this.player.inventory.key.quantity >= 3) {
        this.player.won = true;
        EventBus.emit('player:won', this.getStats());
        return;
      }
    }

    const roomKey = `${nx},${ny}`;
    if (this.keyPos.has(roomKey)) {
      this.keyPos.delete(roomKey);
      this.player.inventory.key.quantity++;
      this.player.keysCollected++;
      EventBus.emit('event:itemFound', { item: 'key', message: '你发现了一把古老的钥匙！' });
      EventBus.emit('player:stateChanged', this.getPlayerInfo());
    }

    EventBus.emit('room:entered', { x: nx, y: ny, roomId: this.maze.grid[ny][nx].roomId });
  }

  useItem(type: ItemType): void {
    const item = this.player.inventory[type];
    if (item.quantity <= 0) return;

    switch (type) {
      case 'potion':
        item.quantity--;
        this.player.hp = Math.min(this.player.maxHp, this.player.hp + 20);
        EventBus.emit('event:action', { message: '你饮用药水，恢复了20点生命值！' });
        break;
      case 'torch':
        item.quantity--;
        this.player.torchActive = true;
        this.torchStepsLeft = 5;
        this.revealAround(this.player.position);
        EventBus.emit('event:action', { message: '你点燃了火把，周围区域被照亮了！' });
        break;
      case 'map':
        item.quantity--;
        this.player.mapActive = true;
        this.player.pathToExit = findPath(this.maze.grid, this.player.position, this.maze.exit);
        EventBus.emit('event:action', { message: '你查看了地图，出口路径已标记！' });
        break;
      case 'shield':
        item.quantity--;
        this.player.shieldActive = true;
        EventBus.emit('event:action', { message: '你装备了护盾，可以抵消一次陷阱伤害！' });
        break;
      case 'coin':
        EventBus.emit('event:action', { message: '金币需要与商人交易使用。' });
        return;
      case 'key':
        EventBus.emit('event:action', { message: '钥匙用于打开迷宫出口，需收集3把。' });
        return;
    }

    EventBus.emit('player:stateChanged', this.getPlayerInfo());
  }

  applyDamage(amount: number): void {
    if (this.player.shieldActive) {
      this.player.shieldActive = false;
      EventBus.emit('event:action', { message: '护盾抵消了陷阱伤害！' });
      return;
    }
    this.player.hp = Math.max(0, this.player.hp - amount);
    if (this.player.hp <= 0) {
      this.player.alive = false;
      EventBus.emit('player:died', {});
    }
    EventBus.emit('player:stateChanged', this.getPlayerInfo());
  }

  heal(amount: number): void {
    this.player.hp = Math.min(this.player.maxHp, this.player.hp + amount);
    EventBus.emit('player:stateChanged', this.getPlayerInfo());
  }

  addStamina(amount: number): void {
    this.player.stamina = Math.min(this.player.maxStamina, this.player.stamina + amount);
    EventBus.emit('player:stateChanged', this.getPlayerInfo());
  }

  addItem(type: ItemType, amount: number = 1): void {
    this.player.inventory[type].quantity += amount;
    if (type === 'coin') this.player.coinsCollected += amount;
    EventBus.emit('player:stateChanged', this.getPlayerInfo());
  }

  removeItem(type: ItemType, amount: number = 1): boolean {
    if (this.player.inventory[type].quantity < amount) return false;
    this.player.inventory[type].quantity -= amount;
    EventBus.emit('player:stateChanged', this.getPlayerInfo());
    return true;
  }

  getMazeInfo() {
    return {
      grid: this.maze.grid,
      width: this.maze.width,
      height: this.maze.height,
      entrance: this.maze.entrance,
      exit: this.maze.exit,
    };
  }

  getPlayerInfo(): PlayerState {
    return {
      ...this.player,
      explored: new Set(this.player.explored),
      inventory: { ...this.player.inventory },
    };
  }

  getStats() {
    return {
      steps: this.player.steps,
      coins: this.player.coinsCollected,
      events: this.player.eventsEncountered,
      keysCollected: this.player.keysCollected,
    };
  }

  reset(): void {
    const grid = generateMaze(MAZE_SIZE);
    const entrance: Position = { x: 0, y: 0 };
    const exit: Position = { x: MAZE_SIZE - 1, y: MAZE_SIZE - 1 };

    this.maze = { grid, width: MAZE_SIZE, height: MAZE_SIZE, entrance, exit };
    this.keyPos.clear();
    this.torchStepsLeft = 0;

    this.player = {
      hp: 100,
      maxHp: 100,
      stamina: 100,
      maxStamina: 100,
      position: { ...entrance },
      inventory: createInitialInventory(),
      explored: new Set<string>(),
      steps: 0,
      eventsEncountered: 0,
      keysCollected: 0,
      coinsCollected: 0,
      alive: true,
      won: false,
      shieldActive: false,
      torchActive: false,
      mapActive: false,
      pathToExit: [],
    };

    this.player.explored.add(`${entrance.x},${entrance.y}`);
    this.revealAround(entrance);
    this.placeKeyPositions();

    EventBus.emit('maze:generated', this.getMazeInfo());
    EventBus.emit('player:stateChanged', this.getPlayerInfo());
  }
}
