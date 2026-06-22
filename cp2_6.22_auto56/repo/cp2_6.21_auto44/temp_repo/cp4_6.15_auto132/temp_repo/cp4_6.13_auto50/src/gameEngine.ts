export type TileType = 'empty' | 'wall' | 'floor' | 'exit';

export type ActionType = 'move' | 'interact' | 'push' | 'none';

export interface Position {
  x: number;
  y: number;
}

export interface Box {
  id: number;
  x: number;
  y: number;
}

export interface PressurePlate {
  id: number;
  x: number;
  y: number;
  activated: boolean;
  doorId: number;
}

export interface Door {
  id: number;
  x: number;
  y: number;
  open: boolean;
}

export interface Teleporter {
  id: number;
  x: number;
  y: number;
  pairId: number;
}

export interface GameState {
  player: Position;
  boxes: Box[];
  plates: PressurePlate[];
  doors: Door[];
  teleporters: Teleporter[];
  map: TileType[][];
  levelIndex: number;
  won: boolean;
}

export interface LevelConfig {
  name: string;
  width: number;
  height: number;
  map: TileType[][];
  playerStart: Position;
  boxes: Omit<Box, 'id'>[];
  plates: Omit<PressurePlate, 'id' | 'activated'>[];
  doors: Omit<Door, 'id' | 'open'>[];
  teleporters: Omit<Teleporter, 'id'>[];
  exit: Position;
}

const LEVELS: LevelConfig[] = [
  {
    name: '第一关：初次尝试',
    width: 12,
    height: 10,
    map: Array(10).fill(null).map((_, y) =>
      Array(12).fill(null).map((_, x) => {
        if (x === 0 || x === 11 || y === 0 || y === 9) return 'wall';
        if (x === 5 && y === 3) return 'wall';
        if (x === 5 && y === 4) return 'wall';
        if (x === 5 && y === 5) return 'wall';
        return 'floor';
      })
    ),
    playerStart: { x: 1, y: 1 },
    boxes: [{ x: 3, y: 4 }],
    plates: [{ x: 8, y: 5, doorId: 0 }],
    doors: [{ x: 10, y: 7 }],
    teleporters: [],
    exit: { x: 10, y: 8 }
  },
  {
    name: '第二关：传送之谜',
    width: 12,
    height: 10,
    map: Array(10).fill(null).map((_, y) =>
      Array(12).fill(null).map((_, x) => {
        if (x === 0 || x === 11 || y === 0 || y === 9) return 'wall';
        if (x === 6 && y >= 1 && y <= 8) return 'wall';
        return 'floor';
      })
    ),
    playerStart: { x: 1, y: 1 },
    boxes: [{ x: 3, y: 5 }, { x: 4, y: 5 }],
    plates: [{ x: 2, y: 8, doorId: 0 }],
    doors: [{ x: 5, y: 4 }],
    teleporters: [
      { x: 2, y: 2, pairId: 1 },
      { x: 9, y: 7, pairId: 0 }
    ],
    exit: { x: 10, y: 8 }
  },
  {
    name: '第三关：机关重重',
    width: 12,
    height: 10,
    map: Array(10).fill(null).map((_, y) =>
      Array(12).fill(null).map((_, x) => {
        if (x === 0 || x === 11 || y === 0 || y === 9) return 'wall';
        if (x === 4 && y >= 1 && y <= 6) return 'wall';
        if (x === 8 && y >= 3 && y <= 8) return 'wall';
        return 'floor';
      })
    ),
    playerStart: { x: 1, y: 1 },
    boxes: [{ x: 2, y: 5 }, { x: 6, y: 2 }],
    plates: [
      { x: 2, y: 8, doorId: 0 },
      { x: 6, y: 7, doorId: 1 }
    ],
    doors: [
      { x: 3, y: 7 },
      { x: 7, y: 5 }
    ],
    teleporters: [
      { x: 1, y: 8, pairId: 1 },
      { x: 10, y: 1, pairId: 0 }
    ],
    exit: { x: 10, y: 8 }
  }
];

export function getLevels(): LevelConfig[] {
  return LEVELS;
}

export function getLevelCount(): number {
  return LEVELS.length;
}

export function createGameState(levelIndex: number): GameState {
  const level = LEVELS[levelIndex % LEVELS.length];
  const map = level.map.map(row => [...row]);
  
  map[level.exit.y][level.exit.x] = 'exit';

  return {
    player: { ...level.playerStart },
    boxes: level.boxes.map((b, i) => ({ ...b, id: i })),
    plates: level.plates.map((p, i) => ({ ...p, id: i, activated: false })),
    doors: level.doors.map((d, i) => ({ ...d, id: i, open: false })),
    teleporters: level.teleporters.map((t, i) => ({ ...t, id: i })),
    map,
    levelIndex,
    won: false
  };
}

export function cloneGameState(state: GameState): GameState {
  return {
    player: { ...state.player },
    boxes: state.boxes.map(b => ({ ...b })),
    plates: state.plates.map(p => ({ ...p })),
    doors: state.doors.map(d => ({ ...d })),
    teleporters: state.teleporters.map(t => ({ ...t })),
    map: state.map.map(row => [...row]),
    levelIndex: state.levelIndex,
    won: state.won
  };
}

export function isWall(state: GameState, x: number, y: number): boolean {
  const level = LEVELS[state.levelIndex % LEVELS.length];
  if (x < 0 || x >= level.width || y < 0 || y >= level.height) return true;
  return state.map[y][x] === 'wall';
}

export function getBoxAt(state: GameState, x: number, y: number): Box | undefined {
  return state.boxes.find(b => b.x === x && b.y === y);
}

export function getDoorAt(state: GameState, x: number, y: number): Door | undefined {
  return state.doors.find(d => d.x === x && d.y === y && !d.open);
}

export function getTeleporterAt(state: GameState, x: number, y: number): Teleporter | undefined {
  return state.teleporters.find(t => t.x === x && t.y === y);
}

export function getLevel(state: GameState): LevelConfig {
  return LEVELS[state.levelIndex % LEVELS.length];
}

export function canMoveTo(state: GameState, x: number, y: number): boolean {
  if (isWall(state, x, y)) return false;
  const door = getDoorAt(state, x, y);
  if (door) return false;
  return true;
}

export function movePlayer(state: GameState, dx: number, dy: number): { state: GameState; action: ActionType } {
  const newState = cloneGameState(state);
  let action: ActionType = 'none';

  if (newState.won) {
    return { state: newState, action };
  }

  const newX = state.player.x + dx;
  const newY = state.player.y + dy;

  if (isWall(state, newX, newY)) {
    return { state: newState, action };
  }

  const door = getDoorAt(state, newX, newY);
  if (door) {
    return { state: newState, action };
  }

  const box = getBoxAt(state, newX, newY);
  if (box) {
    const boxNewX = newX + dx;
    const boxNewY = newY + dy;
    
    if (canMoveTo(state, boxNewX, boxNewY) && !getBoxAt(state, boxNewX, boxNewY)) {
      const boxIdx = newState.boxes.findIndex(b => b.id === box.id);
      newState.boxes[boxIdx].x = boxNewX;
      newState.boxes[boxIdx].y = boxNewY;
      newState.player.x = newX;
      newState.player.y = newY;
      action = 'push';
    } else {
      return { state: newState, action };
    }
  } else {
    newState.player.x = newX;
    newState.player.y = newY;
    action = 'move';
  }

  const teleporter = getTeleporterAt(newState, newState.player.x, newState.player.y);
  if (teleporter) {
    const pair = newState.teleporters.find(t => t.id === teleporter.pairId);
    if (pair) {
      newState.player.x = pair.x;
      newState.player.y = pair.y;
      action = 'move';
    }
  }

  updatePlates(newState);

  const level = getLevel(newState);
  if (newState.player.x === level.exit.x && newState.player.y === level.exit.y) {
    newState.won = true;
    action = 'interact';
  }

  return { state: newState, action };
}

export function interact(state: GameState): { state: GameState; action: ActionType } {
  const newState = cloneGameState(state);
  let action: ActionType = 'none';

  if (newState.won) {
    return { state: newState, action };
  }

  const level = getLevel(newState);
  if (newState.player.x === level.exit.x && newState.player.y === level.exit.y) {
    newState.won = true;
    action = 'interact';
  }

  const onPlate = newState.plates.some(
    p => p.x === newState.player.x && p.y === newState.player.y
  );
  if (onPlate) {
    action = 'interact';
  }

  return { state: newState, action };
}

function updatePlates(state: GameState): void {
  for (const plate of state.plates) {
    const boxOnPlate = state.boxes.some(b => b.x === plate.x && b.y === plate.y);
    const playerOnPlate = state.player.x === plate.x && state.player.y === plate.y;
    plate.activated = boxOnPlate || playerOnPlate;
  }

  for (const door of state.doors) {
    const plate = state.plates.find(p => p.doorId === door.id);
    if (plate) {
      door.open = plate.activated;
    }
  }
}

export function getActionTypeLabel(action: ActionType): string {
  switch (action) {
    case 'move': return '移动';
    case 'interact': return '交互';
    case 'push': return '推箱子';
    case 'none': return '无操作';
  }
}
