import express, { Request, Response } from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

type CellType = 0 | 1;
type MazeGrid = CellType[][];
type PlayerId = 'blue' | 'red';
type Direction = 'up' | 'down' | 'left' | 'right';
type TrapType = 'sleep' | 'fence';
type GamePhase = 'waiting' | 'playing' | 'roundEnd' | 'matchEnd';

interface Position {
  x: number;
  y: number;
}

interface Trap {
  id: string;
  type: TrapType;
  position: Position;
  owner: PlayerId;
  triggered: boolean;
}

interface PlayerState {
  id: PlayerId;
  name: string;
  position: Position;
  prevPosition: Position;
  trapsRemaining: number;
  trapTypes: TrapType[];
  sleepTurns: number;
  lockedDirection: Direction | null;
  canMove: boolean;
  stuckTurns: number;
}

interface GameState {
  gameId: string;
  round: number;
  maze: MazeGrid;
  players: Record<PlayerId, PlayerState>;
  currentPlayer: PlayerId;
  traps: Trap[];
  turnCount: number;
  turnTimer: number;
  scores: Record<PlayerId, number>;
  winner: PlayerId | null;
  matchWinner: PlayerId | null;
  phase: GamePhase;
  lastAction: string;
  createdAt: number;
}

const MAZE_WIDTH = 15;
const MAZE_HEIGHT = 15;
const TURN_DURATION = 15;
const WIN_SCORE = 2;
const MAX_STUCK_TURNS = 5;
const SLEEP_EFFECT_TURNS = 3;

const gameStore = new Map<string, GameState>();

class MazeGeneratorService {
  private width: number;
  private height: number;
  private grid: MazeGrid;

  constructor(width = MAZE_WIDTH, height = MAZE_HEIGHT) {
    this.width = width;
    this.height = height;
    this.grid = this.createFullWalls();
  }

  private createFullWalls(): MazeGrid {
    const grid: MazeGrid = [];
    for (let y = 0; y < this.height; y++) {
      const row: CellType[] = [];
      for (let x = 0; x < this.width; x++) {
        row.push(1);
      }
      grid.push(row);
    }
    return grid;
  }

  public generate(): MazeGrid {
    this.grid = this.createFullWalls();
    this.recursiveBacktrack(1, 1);
    this.grid[1][0] = 0;
    this.grid[this.height - 2][this.width - 1] = 0;
    return JSON.parse(JSON.stringify(this.grid));
  }

  private recursiveBacktrack(x: number, y: number): void {
    this.grid[y][x] = 0;

    const directions = this.shuffle([
      { dx: 0, dy: -2 },
      { dx: 2, dy: 0 },
      { dx: 0, dy: 2 },
      { dx: -2, dy: 0 },
    ]);

    for (const { dx, dy } of directions) {
      const nx = x + dx;
      const ny = y + dy;

      if (
        nx > 0 &&
        nx < this.width - 1 &&
        ny > 0 &&
        ny < this.height - 1 &&
        this.grid[ny][nx] === 1
      ) {
        this.grid[y + dy / 2][x + dx / 2] = 0;
        this.recursiveBacktrack(nx, ny);
      }
    }
  }

  private shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  public isWalkable(maze: MazeGrid, x: number, y: number): boolean {
    return (
      y >= 0 &&
      y < maze.length &&
      x >= 0 &&
      x < maze[0].length &&
      maze[y][x] === 0
    );
  }

  public getEntrance(): Position {
    return { x: 1, y: 1 };
  }

  public getTreasure(): Position {
    return { x: this.width - 2, y: this.height - 2 };
  }
}

function getRandomTrapType(): TrapType {
  return Math.random() > 0.5 ? 'sleep' : 'fence';
}

function assignTraps(count: number): TrapType[] {
  const types: TrapType[] = [];
  for (let i = 0; i < count; i++) {
    types.push(getRandomTrapType());
  }
  return types;
}

function createInitialGameState(): GameState {
  const generator = new MazeGeneratorService();
  const maze = generator.generate();
  const entrance = generator.getEntrance();

  const blueTraps = assignTraps(3);
  const redTraps = assignTraps(3);

  const bluePlayer: PlayerState = {
    id: 'blue',
    name: '蓝方玩家',
    position: { ...entrance },
    prevPosition: { ...entrance },
    trapsRemaining: 3,
    trapTypes: blueTraps,
    sleepTurns: 0,
    lockedDirection: null,
    canMove: true,
    stuckTurns: 0,
  };

  const redPlayer: PlayerState = {
    id: 'red',
    name: '红方玩家',
    position: { ...entrance },
    prevPosition: { ...entrance },
    trapsRemaining: 3,
    trapTypes: redTraps,
    sleepTurns: 0,
    lockedDirection: null,
    canMove: true,
    stuckTurns: 0,
  };

  return {
    gameId: uuidv4(),
    round: 1,
    maze,
    players: { blue: bluePlayer, red: redPlayer },
    currentPlayer: 'blue',
    traps: [],
    turnCount: 0,
    turnTimer: TURN_DURATION,
    scores: { blue: 0, red: 0 },
    winner: null,
    matchWinner: null,
    phase: 'waiting',
    lastAction: '游戏创建成功，等待开始',
    createdAt: Date.now(),
  };
}

function validateGameState(state: GameState): boolean {
  if (!state || !state.gameId) return false;
  if (!state.maze || state.maze.length !== MAZE_HEIGHT) return false;
  if (!state.players || !state.players.blue || !state.players.red) return false;
  if (!['blue', 'red'].includes(state.currentPlayer)) return false;
  if (!['waiting', 'playing', 'roundEnd', 'matchEnd'].includes(state.phase)) return false;
  return true;
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', activeGames: gameStore.size, uptime: process.uptime() });
});

app.post('/api/game/maze', (_req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    const generator = new MazeGeneratorService();
    const maze = generator.generate();
    const elapsed = Date.now() - startTime;

    res.json({
      success: true,
      maze,
      entrance: generator.getEntrance(),
      treasure: generator.getTreasure(),
      generationTime: elapsed,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '迷宫生成失败',
    });
  }
});

app.post('/api/game/create', (_req: Request, res: Response) => {
  try {
    const state = createInitialGameState();
    gameStore.set(state.gameId, state);

    setTimeout(() => {
      const now = Date.now();
      for (const [id, game] of gameStore) {
        if (now - game.createdAt > 2 * 60 * 60 * 1000) {
          gameStore.delete(id);
        }
      }
    }, 60000);

    res.json({
      success: true,
      gameId: state.gameId,
      state: sanitizeState(state),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: '游戏创建失败',
    });
  }
});

app.get('/api/game/:gameId', (req: Request, res: Response) => {
  const { gameId } = req.params;
  const state = gameStore.get(gameId);

  if (!state) {
    res.status(404).json({
      success: false,
      error: '游戏不存在或已过期',
    });
    return;
  }

  res.json({
    success: true,
    state: sanitizeState(state),
  });
});

interface ActionRequest {
  playerId: PlayerId;
  type: 'move' | 'trap';
  direction?: Direction;
}

app.post('/api/game/:gameId/action', (req: Request, res: Response) => {
  const { gameId } = req.params;
  const { playerId, type, direction } = req.body as ActionRequest;

  const state = gameStore.get(gameId);
  if (!state) {
    res.status(404).json({ success: false, error: '游戏不存在' });
    return;
  }

  if (state.phase !== 'playing') {
    res.status(400).json({ success: false, error: '游戏未进行中' });
    return;
  }

  if (playerId !== state.currentPlayer) {
    res.status(400).json({ success: false, error: '不是当前玩家的回合' });
    return;
  }

  const player = state.players[playerId];
  const generator = new MazeGeneratorService();

  if (type === 'move') {
    if (!direction || !['up', 'down', 'left', 'right'].includes(direction)) {
      res.status(400).json({ success: false, error: '无效的移动方向' });
      return;
    }

    if (!player.canMove) {
      res.json({ success: false, state: sanitizeState(state), message: '本回合不能移动' });
      return;
    }

    if (player.lockedDirection && player.lockedDirection !== direction) {
      res.json({ success: false, state: sanitizeState(state), message: '方向被锁定' });
      return;
    }

    if (player.sleepTurns > 0 && state.turnCount % 2 === 1) {
      switchTurn(state);
      res.json({ success: true, state: sanitizeState(state), message: '受催眠影响' });
      return;
    }

    const deltaMap: Record<Direction, Position> = {
      up: { x: 0, y: -1 },
      down: { x: 0, y: 1 },
      left: { x: -1, y: 0 },
      right: { x: 1, y: 0 },
    };
    const delta = deltaMap[direction];
    const newX = player.position.x + delta.x;
    const newY = player.position.y + delta.y;

    if (!generator.isWalkable(state.maze, newX, newY)) {
      player.stuckTurns++;
      if (player.stuckTurns >= MAX_STUCK_TURNS) {
        const winnerId: PlayerId = playerId === 'blue' ? 'red' : 'blue';
        handleRoundWin(state, winnerId);
      }
      res.json({ success: false, state: sanitizeState(state), message: '撞墙' });
      return;
    }

    player.prevPosition = { ...player.position };
    player.position = { x: newX, y: newY };
    player.stuckTurns = 0;

    checkSleepAreaEffect(state, player);
    const fenceTriggered = checkFenceTrap(state, player, direction);
    if (fenceTriggered) {
      player.lockedDirection = direction;
    }
    state.traps = state.traps.filter((t) => !t.triggered);

    const treasure = generator.getTreasure();
    if (player.position.x === treasure.x && player.position.y === treasure.y) {
      handleRoundWin(state, playerId);
      res.json({ success: true, state: sanitizeState(state), message: '到达宝藏点' });
      return;
    }

    if (player.sleepTurns > 0) player.sleepTurns--;
    switchTurn(state);
    res.json({ success: true, state: sanitizeState(state) });
    return;
  }

  if (type === 'trap') {
    if (player.trapsRemaining <= 0) {
      res.json({ success: false, state: sanitizeState(state), message: '没有剩余陷阱' });
      return;
    }

    const existing = state.traps.find(
      (t) =>
        t.position.x === player.position.x &&
        t.position.y === player.position.y &&
        !t.triggered
    );
    if (existing) {
      res.json({ success: false, state: sanitizeState(state), message: '当前位置已有陷阱' });
      return;
    }

    const trapType = player.trapTypes.shift()!;
    const newTrap: Trap = {
      id: uuidv4(),
      type: trapType,
      position: { ...player.position },
      owner: playerId,
      triggered: false,
    };
    state.traps.push(newTrap);
    player.trapsRemaining--;

    switchTurn(state);
    res.json({ success: true, state: sanitizeState(state), trapType });
    return;
  }

  res.status(400).json({ success: false, error: '无效的操作类型' });
});

app.post('/api/game/:gameId/start', (req: Request, res: Response) => {
  const { gameId } = req.params;
  const state = gameStore.get(gameId);

  if (!state) {
    res.status(404).json({ success: false, error: '游戏不存在' });
    return;
  }

  if (state.phase === 'waiting') {
    state.phase = 'playing';
    state.lastAction = '游戏开始！蓝方先手';
  }

  res.json({ success: true, state: sanitizeState(state) });
});

app.post('/api/game/:gameId/next-round', (req: Request, res: Response) => {
  const { gameId } = req.params;
  const state = gameStore.get(gameId);

  if (!state) {
    res.status(404).json({ success: false, error: '游戏不存在' });
    return;
  }

  if (state.phase !== 'roundEnd') {
    res.status(400).json({ success: false, error: '当前不是局间阶段' });
    return;
  }

  state.round++;
  state.winner = null;
  const generator = new MazeGeneratorService();
  const maze = generator.generate();
  const entrance = generator.getEntrance();

  state.traps = [];

  for (const id of ['blue', 'red'] as PlayerId[]) {
    const p = state.players[id];
    p.position = { ...entrance };
    p.prevPosition = { ...entrance };
    p.trapsRemaining = 3;
    p.trapTypes = assignTraps(3);
    p.sleepTurns = 0;
    p.lockedDirection = null;
    p.canMove = true;
    p.stuckTurns = 0;
  }

  state.maze = maze;
  state.currentPlayer = 'blue';
  state.turnCount = 0;
  state.turnTimer = TURN_DURATION;
  state.phase = 'playing';
  state.lastAction = `第${state.round}局开始！蓝方先手`;

  res.json({ success: true, state: sanitizeState(state) });
});

app.post('/api/game/:gameId/restart', (req: Request, res: Response) => {
  const { gameId } = req.params;
  const state = gameStore.get(gameId);

  if (!state) {
    res.status(404).json({ success: false, error: '游戏不存在' });
    return;
  }

  const newState = createInitialGameState();
  newState.gameId = state.gameId;
  newState.phase = 'playing';
  newState.lastAction = '游戏重新开始！蓝方先手';
  gameStore.set(gameId, newState);

  res.json({ success: true, state: sanitizeState(newState) });
});

app.post('/api/game/save', (req: Request, res: Response) => {
  const { state } = req.body as { state: GameState };

  if (!validateGameState(state)) {
    res.status(400).json({ success: false, error: '无效的游戏状态数据' });
    return;
  }

  gameStore.set(state.gameId, { ...state, createdAt: Date.now() });
  res.json({ success: true, gameId: state.gameId });
});

function checkSleepAreaEffect(state: GameState, player: PlayerState): void {
  const pos = player.position;
  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      const trap = state.traps.find(
        (t) =>
          t.type === 'sleep' &&
          !t.triggered &&
          t.owner !== player.id &&
          t.position.x === pos.x + dx &&
          t.position.y === pos.y + dy
      );
      if (trap) {
        trap.triggered = true;
        player.sleepTurns = SLEEP_EFFECT_TURNS;
      }
    }
  }
}

function checkFenceTrap(state: GameState, player: PlayerState, _direction: Direction): boolean {
  const pos = player.position;
  const trap = state.traps.find(
    (t) =>
      t.type === 'fence' &&
      !t.triggered &&
      t.owner !== player.id &&
      t.position.x === pos.x &&
      t.position.y === pos.y
  );
  if (trap) {
    trap.triggered = true;
    return true;
  }
  return false;
}

function switchTurn(state: GameState): void {
  const current = state.players[state.currentPlayer];

  if (current.lockedDirection) {
    current.lockedDirection = null;
  }
  current.canMove = true;
  if (current.sleepTurns > 0) current.sleepTurns--;

  checkSleepAreaEffect(state, current);

  state.currentPlayer = state.currentPlayer === 'blue' ? 'red' : 'blue';
  state.turnCount++;
  state.turnTimer = TURN_DURATION;
  state.traps = state.traps.filter((t) => !t.triggered);
}

function handleRoundWin(state: GameState, winnerId: PlayerId): void {
  state.winner = winnerId;
  state.scores[winnerId]++;
  state.phase = 'roundEnd';
  state.lastAction = `${state.players[winnerId].name}赢得第${state.round}局！`;

  if (state.scores[winnerId] >= WIN_SCORE) {
    state.matchWinner = winnerId;
    state.phase = 'matchEnd';
    state.lastAction = `${state.players[winnerId].name}赢得整场比赛！`;
  }
}

function sanitizeState(state: GameState): Omit<GameState, 'createdAt'> {
  const { createdAt, ...rest } = state;
  return JSON.parse(JSON.stringify(rest));
}

app.listen(PORT, () => {
  console.log(`[EchoMaze Server] 运行在 http://localhost:${PORT}`);
  console.log(`[EchoMaze Server] 迷宫生成算法：递归回溯 ${MAZE_WIDTH}x${MAZE_HEIGHT}`);
});
