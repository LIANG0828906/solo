import { MazeGenerator, MAZE_WIDTH, MAZE_HEIGHT } from './MazeGenerator';
import { TrapManager } from './TrapManager';
import type {
  GameState,
  PlayerId,
  Direction,
  GameAction,
  PlayerState,
  Position,
  TrapType,
} from './types';
import { v4 as uuidv4 } from 'uuid';

export const TURN_DURATION = 15;
export const WIN_SCORE = 2;
export const MAX_STUCK_TURNS = 5;
export const SLEEP_EFFECT_TURNS = 3;

const DIRECTION_DELTA: Record<Direction, Position> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

export class GameEngine {
  private mazeGenerator: MazeGenerator;
  private trapManager: TrapManager;
  private state: GameState;
  private listeners: Set<(state: GameState) => void> = new Set();
  private turnTimerRef: number | null = null;

  constructor() {
    this.mazeGenerator = new MazeGenerator(MAZE_WIDTH, MAZE_HEIGHT);
    this.trapManager = new TrapManager();
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    const maze = this.mazeGenerator.generate();
    const entrance = this.mazeGenerator.getEntrance();
    const trapManager = new TrapManager();

    const blueTraps = trapManager.assignTraps(3);
    const redTraps = trapManager.assignTraps(3);

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
      lastAction: '游戏开始！蓝方先手',
    };
  }

  public subscribe(listener: (state: GameState) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((l) => l({ ...this.state }));
  }

  public getState(): GameState {
    return { ...this.state };
  }

  public startGame(): void {
    if (this.state.phase === 'waiting') {
      this.state.phase = 'playing';
      this.state.lastAction = '游戏开始！蓝方先手';
      this.startTurnTimer();
      this.notify();
    }
  }

  private startTurnTimer(): void {
    this.stopTurnTimer();
    this.state.turnTimer = TURN_DURATION;

    const tick = () => {
      if (this.state.phase !== 'playing') return;

      this.state.turnTimer -= 0.1;
      if (this.state.turnTimer <= 0) {
        this.state.turnTimer = 0;
        this.handleTimeout();
        return;
      }
      this.notify();
      this.turnTimerRef = window.setTimeout(tick, 100);
    };

    this.turnTimerRef = window.setTimeout(tick, 100);
  }

  private stopTurnTimer(): void {
    if (this.turnTimerRef !== null) {
      clearTimeout(this.turnTimerRef);
      this.turnTimerRef = null;
    }
  }

  private handleTimeout(): void {
    const current = this.state.players[this.state.currentPlayer];
    current.canMove = false;
    this.state.lastAction = `${current.name}超时，跳过回合，下回合只能放置陷阱`;
    this.switchTurn();
  }

  public handleAction(action: GameAction): boolean {
    if (this.state.phase !== 'playing') return false;
    if (action.playerId !== this.state.currentPlayer) return false;

    const player = this.state.players[action.playerId];

    if (action.type === 'move') {
      return this.handleMove(player, action.direction!);
    } else if (action.type === 'trap') {
      return this.handlePlaceTrap(player);
    }

    return false;
  }

  private handleMove(player: PlayerState, direction: Direction): boolean {
    if (!player.canMove) {
      this.state.lastAction = `${player.name}本回合不能移动，只能放置陷阱`;
      this.notify();
      return false;
    }

    if (player.lockedDirection && player.lockedDirection !== direction) {
      this.state.lastAction = `${player.name}方向被锁定，只能向${this.getDirectionName(player.lockedDirection)}移动`;
      this.notify();
      return false;
    }

    if (player.sleepTurns > 0 && this.state.turnCount % 2 === 1) {
      this.state.lastAction = `${player.name}受催眠迷雾影响，本回合无法移动`;
      this.afterMove(player, false);
      return true;
    }

    const delta = DIRECTION_DELTA[direction];
    const newX = player.position.x + delta.x;
    const newY = player.position.y + delta.y;

    if (!this.mazeGenerator.isWalkable(this.state.maze, newX, newY)) {
      player.stuckTurns++;
      this.state.lastAction = `${player.name}撞墙了！`;
      this.checkStuckWin(player);
      this.notify();
      return false;
    }

    player.prevPosition = { ...player.position };
    player.position = { x: newX, y: newY };
    player.stuckTurns = 0;

    this.trapManager.checkSleepEffect(player);
    const triggerResult = this.trapManager.checkTrapTrigger(player, direction);

    if (triggerResult) {
      if (triggerResult.trap.type === 'fence') {
        player.lockedDirection = direction;
        this.state.lastAction = `${player.name}触发静电栅栏！下一回合方向被锁定为${this.getDirectionName(direction)}`;
      }
    }

    this.state.traps = this.trapManager.getTraps();

    const treasure = this.mazeGenerator.getTreasure();
    if (player.position.x === treasure.x && player.position.y === treasure.y) {
      this.handleRoundWin(player.id);
      return true;
    }

    this.afterMove(player, true);
    return true;
  }

  private afterMove(player: PlayerState, moved: boolean): void {
    if (moved && player.sleepTurns > 0) {
      player.sleepTurns--;
    }
    this.switchTurn();
  }

  private handlePlaceTrap(player: PlayerState): boolean {
    if (player.trapsRemaining <= 0) {
      this.state.lastAction = `${player.name}没有剩余陷阱了`;
      this.notify();
      return false;
    }

    const trapType = player.trapTypes.shift()!;
    const trap = this.trapManager.placeTrap(player.position, player.id, trapType);

    if (!trap) {
      player.trapTypes.unshift(trapType);
      this.state.lastAction = `${player.name}当前位置已有陷阱`;
      this.notify();
      return false;
    }

    player.trapsRemaining--;
    this.state.traps = this.trapManager.getTraps();
    this.state.lastAction = `${player.name}放置了${this.getTrapName(trapType)}`;
    this.switchTurn();
    return true;
  }

  private checkStuckWin(player: PlayerState): void {
    if (player.stuckTurns >= MAX_STUCK_TURNS) {
      const winnerId: PlayerId = player.id === 'blue' ? 'red' : 'blue';
      this.state.lastAction = `${player.name}被困${MAX_STUCK_TURNS}回合无法移动，${this.state.players[winnerId].name}获胜！`;
      this.handleRoundWin(winnerId);
    }
  }

  private handleRoundWin(winnerId: PlayerId): void {
    this.stopTurnTimer();
    this.state.winner = winnerId;
    this.state.scores[winnerId]++;
    this.state.phase = 'roundEnd';
    this.state.lastAction = `${this.state.players[winnerId].name}赢得第${this.state.round}局！`;

    if (this.state.scores[winnerId] >= WIN_SCORE) {
      this.state.matchWinner = winnerId;
      this.state.phase = 'matchEnd';
      this.state.lastAction = `${this.state.players[winnerId].name}赢得整场比赛！`;
    }

    this.notify();
  }

  public nextRound(): void {
    if (this.state.phase !== 'roundEnd') return;

    this.state.round++;
    this.state.winner = null;
    const maze = this.mazeGenerator.generate();
    const entrance = this.mazeGenerator.getEntrance();

    this.trapManager = new TrapManager();

    for (const id of ['blue', 'red'] as PlayerId[]) {
      const p = this.state.players[id];
      p.position = { ...entrance };
      p.prevPosition = { ...entrance };
      p.trapsRemaining = 3;
      p.trapTypes = this.trapManager.assignTraps(3);
      p.sleepTurns = 0;
      p.lockedDirection = null;
      p.canMove = true;
      p.stuckTurns = 0;
    }

    this.state.maze = maze;
    this.state.traps = [];
    this.state.currentPlayer = 'blue';
    this.state.turnCount = 0;
    this.state.phase = 'playing';
    this.state.lastAction = `第${this.state.round}局开始！蓝方先手`;

    this.startTurnTimer();
    this.notify();
  }

  public restartMatch(): void {
    this.stopTurnTimer();
    this.trapManager = new TrapManager();
    this.state = this.createInitialState();
    this.state.phase = 'playing';
    this.startTurnTimer();
    this.notify();
  }

  private switchTurn(): void {
    const current = this.state.players[this.state.currentPlayer];

    if (current.lockedDirection && this.state.currentPlayer === current.id) {
      current.lockedDirection = null;
    }

    current.canMove = true;
    if (current.sleepTurns > 0) {
      current.sleepTurns--;
    }

    const sleepTrigger = this.trapManager.checkSleepEffect(current);
    if (sleepTrigger) {
      current.sleepTurns = SLEEP_EFFECT_TURNS;
    }

    this.state.currentPlayer = this.state.currentPlayer === 'blue' ? 'red' : 'blue';
    this.state.turnCount++;
    this.state.traps = this.trapManager.getTraps();

    this.startTurnTimer();
    this.notify();
  }

  private getDirectionName(d: Direction): string {
    const map: Record<Direction, string> = {
      up: '上',
      down: '下',
      left: '左',
      right: '右',
    };
    return map[d];
  }

  private getTrapName(t: TrapType): string {
    return t === 'sleep' ? '催眠迷雾' : '静电栅栏';
  }

  public getMazeGenerator(): MazeGenerator {
    return this.mazeGenerator;
  }

  public destroy(): void {
    this.stopTurnTimer();
    this.listeners.clear();
  }
}
