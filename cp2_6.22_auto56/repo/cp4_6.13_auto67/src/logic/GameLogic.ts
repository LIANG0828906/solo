import { create } from 'zustand';

export type Position = { x: number; y: number };
export type CellType = 'wall' | 'floor' | 'exit';
export type TrapType = 'spike' | 'fire';
export type MonsterType = 'slime' | 'skeleton';
export type GameStatus = 'idle' | 'playing' | 'gameover' | 'win';

export interface Monster {
  id: number;
  position: Position;
  type: MonsterType;
  patrolPath: Position[];
  patrolIndex: number;
  isChasing: boolean;
  direction: Position;
}

export interface Chest {
  id: number;
  position: Position;
  collected: boolean;
}

export interface Trap {
  id: number;
  position: Position;
  type: TrapType;
}

interface GameState {
  maze: CellType[][];
  player: Position;
  playerHP: number;
  coins: number;
  floor: number;
  monsters: Monster[];
  chests: Chest[];
  traps: Trap[];
  message: string;
  isDamageFlash: boolean;
  gameStatus: GameStatus;
  frameCount: number;
  initGame: () => void;
  movePlayer: (dx: number, dy: number) => void;
  nextFloor: () => void;
  updateGame: () => void;
}

const MAZE_SIZE = 8;

const directions = [
  { x: 0, y: -1 },
  { x: 1, y: 0 },
  { x: 0, y: 1 },
  { x: -1, y: 0 },
];

function generateMaze(): CellType[][] {
  const maze: CellType[][] = [];
  for (let y = 0; y < MAZE_SIZE; y++) {
    maze[y] = [];
    for (let x = 0; x < MAZE_SIZE; x++) {
      maze[y][x] = 'wall';
    }
  }

  function carve(x: number, y: number) {
    maze[y][x] = 'floor';
    const dirs = [...directions].sort(() => Math.random() - 0.5);
    for (const dir of dirs) {
      const nx = x + dir.x * 2;
      const ny = y + dir.y * 2;
      if (nx >= 0 && nx < MAZE_SIZE && ny >= 0 && ny < MAZE_SIZE && maze[ny][nx] === 'wall') {
        maze[y + dir.y][x + dir.x] = 'floor';
        carve(nx, ny);
      }
    }
  }

  carve(0, 0);

  const exitCandidates: Position[] = [];
  for (let y = MAZE_SIZE / 2; y < MAZE_SIZE; y++) {
    for (let x = MAZE_SIZE / 2; x < MAZE_SIZE; x++) {
      if (maze[y][x] === 'floor') {
        exitCandidates.push({ x, y });
      }
    }
  }
  if (exitCandidates.length > 0) {
    const exit = exitCandidates[Math.floor(Math.random() * exitCandidates.length)];
    maze[exit.y][exit.x] = 'exit';
  }

  return maze;
}

function getFloorPositions(maze: CellType[][]): Position[] {
  const positions: Position[] = [];
  for (let y = 0; y < MAZE_SIZE; y++) {
    for (let x = 0; x < MAZE_SIZE; x++) {
      if (maze[y][x] === 'floor') {
        positions.push({ x, y });
      }
    }
  }
  return positions;
}

function randomPick<T>(arr: T[], count: number): T[] {
  const result: T[] = [];
  const copy = [...arr];
  for (let i = 0; i < count && copy.length > 0; i++) {
    const index = Math.floor(Math.random() * copy.length);
    result.push(copy.splice(index, 1)[0]);
  }
  return result;
}

function manhattanDistance(a: Position, b: Position): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

function generatePatrolPath(start: Position, maze: CellType[][]): Position[] {
  const path: Position[] = [{ ...start }];
  let current = { ...start };
  const pathLength = 3 + Math.floor(Math.random() * 3);

  for (let i = 0; i < pathLength; i++) {
    const validDirs = directions.filter((dir) => {
      const nx = current.x + dir.x;
      const ny = current.y + dir.y;
      return nx >= 0 && nx < MAZE_SIZE && ny >= 0 && ny < MAZE_SIZE && maze[ny][nx] !== 'wall';
    });
    if (validDirs.length === 0) break;
    const dir = validDirs[Math.floor(Math.random() * validDirs.length)];
    current = { x: current.x + dir.x, y: current.y + dir.y };
    path.push({ ...current });
  }
  return path;
}

export const useGameLogic = create<GameState>((set, get) => ({
  maze: [],
  player: { x: 0, y: 0 },
  playerHP: 3,
  coins: 0,
  floor: 1,
  monsters: [],
  chests: [],
  traps: [],
  message: '',
  isDamageFlash: false,
  gameStatus: 'idle',
  frameCount: 0,

  initGame: () => {
    const maze = generateMaze();
    const floorPositions = getFloorPositions(maze).filter(
      (p) => !(p.x === 0 && p.y === 0) && maze[p.y][p.x] !== 'exit'
    );

    const chestCount = 3 + Math.floor(Math.random() * 3);
    const trapCount = 2 + Math.floor(Math.random() * 2);
    const monsterCount = 2 + Math.floor(Math.random() * 2);

    const chestPositions = randomPick(floorPositions, chestCount);
    const remainingAfterChests = floorPositions.filter(
      (p) => !chestPositions.some((c) => c.x === p.x && c.y === p.y)
    );
    const trapPositions = randomPick(remainingAfterChests, trapCount);
    const remainingAfterTraps = remainingAfterChests.filter(
      (p) => !trapPositions.some((t) => t.x === p.x && t.y === p.y)
    );
    const monsterPositions = randomPick(remainingAfterTraps, monsterCount);

    const chests: Chest[] = chestPositions.map((pos, i) => ({
      id: i,
      position: pos,
      collected: false,
    }));

    const traps: Trap[] = trapPositions.map((pos, i) => ({
      id: i,
      position: pos,
      type: Math.random() > 0.5 ? 'spike' : 'fire',
    }));

    const monsters: Monster[] = monsterPositions.map((pos, i) => {
      const patrolPath = generatePatrolPath(pos, maze);
      return {
        id: i,
        position: { ...pos },
        type: Math.random() > 0.5 ? 'slime' : 'skeleton',
        patrolPath,
        patrolIndex: 0,
        isChasing: false,
        direction: { x: 0, y: 0 },
      };
    });

    set({
      maze,
      player: { x: 0, y: 0 },
      playerHP: 3,
      coins: 0,
      floor: 1,
      monsters,
      chests,
      traps,
      message: '欢迎来到像素遗迹！使用方向键移动。',
      isDamageFlash: false,
      gameStatus: 'playing',
      frameCount: 0,
    });
  },

  movePlayer: (dx: number, dy: number) => {
    const state = get();
    if (state.gameStatus !== 'playing') return;

    const newX = state.player.x + dx;
    const newY = state.player.y + dy;

    if (newX < 0 || newX >= MAZE_SIZE || newY < 0 || newY >= MAZE_SIZE) return;
    if (state.maze[newY][newX] === 'wall') return;

    const newPlayer = { x: newX, y: newY };
    let newMessage = '';
    let newCoins = state.coins;
    let newHP = state.playerHP;
    let newDamageFlash = false;
    let newGameStatus: GameStatus = state.gameStatus;
    let newChests = [...state.chests];

    const chest = newChests.find(
      (c) => !c.collected && c.position.x === newX && c.position.y === newY
    );
    if (chest) {
      chest.collected = true;
      const coinGain = 10 + Math.floor(Math.random() * 20);
      newCoins += coinGain;
      newMessage = `发现宝箱！获得 ${coinGain} 金币。`;
    }

    const trap = state.traps.find((t) => t.position.x === newX && t.position.y === newY);
    if (trap) {
      newHP -= 1;
      newDamageFlash = true;
      newMessage = `踩到${trap.type === 'spike' ? '尖刺' : '火焰'}陷阱！受到1点伤害。`;
      if (newHP <= 0) {
        newGameStatus = 'gameover';
        newMessage = '游戏结束！你被陷阱击败了。';
      }
    }

    if (state.maze[newY][newX] === 'exit') {
      newMessage = '找到了出口！按空格键进入下一层。';
    }

    const monsterCollision = state.monsters.find(
      (m) => m.position.x === newX && m.position.y === newY
    );
    if (monsterCollision) {
      newHP -= 1;
      newDamageFlash = true;
      newMessage = `被${monsterCollision.type === 'slime' ? '史莱姆' : '骷髅'}攻击！受到1点伤害。`;
      if (newHP <= 0) {
        newGameStatus = 'gameover';
        newMessage = '游戏结束！你被怪物击败了。';
      }
    }

    set({
      player: newPlayer,
      coins: newCoins,
      playerHP: newHP,
      message: newMessage || state.message,
      isDamageFlash: newDamageFlash,
      gameStatus: newGameStatus,
      chests: newChests,
    });

    if (newDamageFlash) {
      setTimeout(() => {
        set({ isDamageFlash: false });
      }, 200);
    }
  },

  nextFloor: () => {
    const state = get();
    if (state.gameStatus !== 'playing') return;

    const cell = state.maze[state.player.y][state.player.x];
    if (cell !== 'exit') return;

    const newFloor = state.floor + 1;

    if (newFloor > 5) {
      set({
        gameStatus: 'win',
        message: '恭喜通关！你成功探索了所有遗迹层。',
      });
      return;
    }

    const maze = generateMaze();
    const floorPositions = getFloorPositions(maze).filter(
      (p) => !(p.x === 0 && p.y === 0) && maze[p.y][p.x] !== 'exit'
    );

    const chestCount = 3 + Math.floor(Math.random() * 3);
    const trapCount = 2 + Math.floor(Math.random() * 2);
    const monsterCount = Math.min(2 + Math.floor(newFloor / 2), 5);

    const chestPositions = randomPick(floorPositions, chestCount);
    const remainingAfterChests = floorPositions.filter(
      (p) => !chestPositions.some((c) => c.x === p.x && c.y === p.y)
    );
    const trapPositions = randomPick(remainingAfterChests, trapCount);
    const remainingAfterTraps = remainingAfterChests.filter(
      (p) => !trapPositions.some((t) => t.x === p.x && t.y === p.y)
    );
    const monsterPositions = randomPick(remainingAfterTraps, monsterCount);

    const chests: Chest[] = chestPositions.map((pos, i) => ({
      id: i,
      position: pos,
      collected: false,
    }));

    const traps: Trap[] = trapPositions.map((pos, i) => ({
      id: i,
      position: pos,
      type: Math.random() > 0.5 ? 'spike' : 'fire',
    }));

    const monsters: Monster[] = monsterPositions.map((pos, i) => {
      const patrolPath = generatePatrolPath(pos, maze);
      return {
        id: i,
        position: { ...pos },
        type: Math.random() > 0.5 ? 'slime' : 'skeleton',
        patrolPath,
        patrolIndex: 0,
        isChasing: false,
        direction: { x: 0, y: 0 },
      };
    });

    set({
      maze,
      player: { x: 0, y: 0 },
      floor: newFloor,
      monsters,
      chests,
      traps,
      message: `进入第 ${newFloor} 层！`,
      frameCount: 0,
    });
  },

  updateGame: () => {
    const state = get();
    if (state.gameStatus !== 'playing') return;

    const newFrameCount = state.frameCount + 1;

    if (newFrameCount % 3 !== 0) {
      set({ frameCount: newFrameCount });
      return;
    }

    const newMonsters = state.monsters.map((monster) => {
      const dist = manhattanDistance(monster.position, state.player);
      const isChasing = dist <= 2;

      let nextPos = { ...monster.position };
      let newPatrolIndex = monster.patrolIndex;
      let direction = { ...monster.direction };

      if (isChasing) {
        const dx = state.player.x - monster.position.x;
        const dy = state.player.y - monster.position.y;

        const possibleMoves: Position[] = [];
        if (Math.abs(dx) > 0) {
          possibleMoves.push({ x: Math.sign(dx), y: 0 });
        }
        if (Math.abs(dy) > 0) {
          possibleMoves.push({ x: 0, y: Math.sign(dy) });
        }

        for (const move of possibleMoves) {
          const nx = monster.position.x + move.x;
          const ny = monster.position.y + move.y;
          if (
            nx >= 0 &&
            nx < MAZE_SIZE &&
            ny >= 0 &&
            ny < MAZE_SIZE &&
            state.maze[ny][nx] !== 'wall'
          ) {
            nextPos = { x: nx, y: ny };
            direction = move;
            break;
          }
        }
      } else {
        if (monster.patrolPath.length > 1) {
          const target = monster.patrolPath[newPatrolIndex];
          const dx = target.x - monster.position.x;
          const dy = target.y - monster.position.y;

          if (dx === 0 && dy === 0) {
            newPatrolIndex = (newPatrolIndex + 1) % monster.patrolPath.length;
          } else {
            const moveX = dx !== 0 ? Math.sign(dx) : 0;
            const moveY = dy !== 0 ? Math.sign(dy) : 0;
            const nx = monster.position.x + moveX;
            const ny = monster.position.y + moveY;
            if (
              nx >= 0 &&
              nx < MAZE_SIZE &&
              ny >= 0 &&
              ny < MAZE_SIZE &&
              state.maze[ny][nx] !== 'wall'
            ) {
              nextPos = { x: nx, y: ny };
              direction = { x: moveX, y: moveY };
            } else {
              newPatrolIndex = (newPatrolIndex + 1) % monster.patrolPath.length;
            }
          }
        }
      }

      return {
        ...monster,
        position: nextPos,
        isChasing,
        patrolIndex: newPatrolIndex,
        direction,
      };
    });

    let newHP = state.playerHP;
    let newMessage = state.message;
    let newDamageFlash = state.isDamageFlash;
    let newGameStatus: GameStatus = state.gameStatus;

    for (const monster of newMonsters) {
      if (monster.position.x === state.player.x && monster.position.y === state.player.y) {
        newHP -= 1;
        newDamageFlash = true;
        newMessage = `被${monster.type === 'slime' ? '史莱姆' : '骷髅'}攻击！受到1点伤害。`;
        if (newHP <= 0) {
          newGameStatus = 'gameover';
          newMessage = '游戏结束！你被怪物击败了。';
        }
        break;
      }
    }

    set({
      monsters: newMonsters,
      frameCount: newFrameCount,
      playerHP: newHP,
      message: newMessage,
      isDamageFlash: newDamageFlash,
      gameStatus: newGameStatus,
    });

    if (newDamageFlash && state.gameStatus === 'playing') {
      setTimeout(() => {
        set({ isDamageFlash: false });
      }, 200);
    }
  },
}));
