import {
  GameState,
  MazeData,
  PlayerData,
  RuneData,
  RuneType,
  PortalData,
  CellPosition,
  RUNE_TYPES,
  MOVE_DURATION,
} from '../types';
import { MazeGenerator } from './maze-generator';

export type GameEventType =
  | 'runeCollected'
  | 'portalActivated'
  | 'playerMoved'
  | 'victory'
  | 'stateChanged';

export interface GameEvent {
  type: GameEventType;
  data?: unknown;
}

type EventCallback = (event: GameEvent) => void;

export class GameManager {
  private state: GameState;
  private listeners: Map<GameEventType, EventCallback[]> = new Map();
  private lastFrameTime: number = 0;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    const emptyMaze: MazeData = {
      grid: [],
      size: 0,
      start: { x: 0, y: 0 },
      exit: { x: 0, y: 0 },
    };

    return {
      maze: emptyMaze,
      player: {
        position: { x: 0, y: 0 },
        targetPosition: { x: 0, y: 0 },
        moveProgress: 1,
        isMoving: false,
      },
      runes: [],
      portal: {
        position: { x: 0, y: 0 },
        activated: false,
      },
      collectedRunes: new Set(),
      startTime: 0,
      elapsedTime: 0,
      isRunning: false,
      isVictory: false,
    };
  }

  public initNewGame(): void {
    const generator = new MazeGenerator(8, 12);
    const maze = generator.generate();

    const emptyCells = generator.getEmptyCells().filter(
      (cell) =>
        !(cell.x === maze.start.x && cell.y === maze.start.y) &&
        !(cell.x === maze.exit.x && cell.y === maze.exit.y)
    );

    const shuffledEmpty = this.shuffle(emptyCells);
    const runePositions = shuffledEmpty.slice(0, 4);

    const runes: RuneData[] = RUNE_TYPES.map((type, i) => ({
      id: `rune-${type}`,
      type,
      position: runePositions[i] || this.getRandomEmpty(shuffledEmpty, i),
      collected: false,
    }));

    const player: PlayerData = {
      position: { ...maze.start },
      targetPosition: { ...maze.start },
      moveProgress: 1,
      isMoving: false,
    };

    const portal: PortalData = {
      position: { ...maze.exit },
      activated: false,
    };

    this.state = {
      maze,
      player,
      runes,
      portal,
      collectedRunes: new Set(),
      startTime: performance.now(),
      elapsedTime: 0,
      isRunning: true,
      isVictory: false,
    };

    this.lastFrameTime = performance.now();
    this.emit('stateChanged');
  }

  private getRandomEmpty(cells: CellPosition[], fallback: number): CellPosition {
    return cells[fallback % cells.length] || { x: 2, y: 2 };
  }

  private shuffle<T>(arr: T[]): T[] {
    const result = [...arr];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }

  public update(): void {
    if (!this.state.isRunning || this.state.isVictory) return;

    const now = performance.now();
    const deltaMs = now - this.lastFrameTime;
    const delta = deltaMs / 1000;
    this.lastFrameTime = now;

    this.state.elapsedTime = (now - this.state.startTime) / 1000;

    if (this.state.player.isMoving) {
      this.state.player.moveProgress += delta / MOVE_DURATION;

      if (this.state.player.moveProgress >= 1) {
        this.state.player.moveProgress = 1;
        this.state.player.isMoving = false;
        this.state.player.position = { ...this.state.player.targetPosition };

        this.checkRuneCollection();
        this.checkPortalEntry();

        this.emit('playerMoved');
        this.emit('stateChanged');
      }
    }
  }

  public movePlayer(dx: number, dy: number): boolean {
    if (!this.state.isRunning || this.state.isVictory) return false;
    if (this.state.player.isMoving) return false;

    const current = this.state.player.position;
    const targetX = current.x + dx;
    const targetY = current.y + dy;

    if (this.isWall(targetX, targetY)) return false;

    this.state.player.targetPosition = { x: targetX, y: targetY };
    this.state.player.moveProgress = 0;
    this.state.player.isMoving = true;

    return true;
  }

  private isWall(x: number, y: number): boolean {
    const { grid, size } = this.state.maze;
    if (x < 0 || x >= size || y < 0 || y >= size) return true;
    return grid[y][x] === 1;
  }

  private checkRuneCollection(): void {
    const { position } = this.state.player;

    for (const rune of this.state.runes) {
      if (rune.collected) continue;

      const dist = Math.abs(position.x - rune.position.x) + Math.abs(position.y - rune.position.y);
      if (dist <= 0) {
        rune.collected = true;
        this.state.collectedRunes.add(rune.type);

        this.emit('runeCollected', { rune });

        if (this.state.collectedRunes.size === 4) {
          this.state.portal.activated = true;
          this.emit('portalActivated');
        }

        this.emit('stateChanged');
        break;
      }
    }
  }

  private checkPortalEntry(): void {
    if (!this.state.portal.activated) return;

    const { position } = this.state.player;
    const { position: portalPos } = this.state.portal;

    if (position.x === portalPos.x && position.y === portalPos.y) {
      this.state.isVictory = true;
      this.state.isRunning = false;
      this.emit('victory', {
        elapsedTime: this.state.elapsedTime,
        collectedRunes: this.state.collectedRunes.size,
        mazeSize: this.state.maze.size,
      });
      this.emit('stateChanged');
    }
  }

  public getState(): GameState {
    return this.state;
  }

  public getRuneByType(type: RuneType): RuneData | undefined {
    return this.state.runes.find((r) => r.type === type);
  }

  public on(event: GameEventType, callback: EventCallback): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }

  public off(event: GameEventType, callback: EventCallback): void {
    const callbacks = this.listeners.get(event);
    if (!callbacks) return;
    const idx = callbacks.indexOf(callback);
    if (idx >= 0) callbacks.splice(idx, 1);
  }

  private emit(type: GameEventType, data?: unknown): void {
    const callbacks = this.listeners.get(type);
    if (!callbacks) return;
    const event: GameEvent = { type, data };
    for (const cb of callbacks) cb(event);
  }

  public getElapsedTime(): number {
    return this.state.elapsedTime;
  }

  public getPlayerRenderPosition(): { x: number; y: number } {
    const { position, targetPosition, moveProgress, isMoving } = this.state.player;
    const t = isMoving ? this.easeInOut(moveProgress) : 1;
    return {
      x: position.x + (targetPosition.x - position.x) * t,
      y: position.y + (targetPosition.y - position.y) * t,
    };
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  }
}
