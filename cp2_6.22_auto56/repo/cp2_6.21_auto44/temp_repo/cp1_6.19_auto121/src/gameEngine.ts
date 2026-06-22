import { generateMaze, getRandomPositions, MazeGrid, MazePosition } from './mazeGenerator';

export type ItemType = 'potion' | 'key' | 'gem';
export type Direction = 'up' | 'down' | 'left' | 'right';

export interface Item {
  id: string;
  type: ItemType;
  position: MazePosition;
  collected: boolean;
}

export interface Trap {
  id: string;
  position: MazePosition;
  triggered: boolean;
}

export interface GameState {
  maze: MazeGrid;
  playerPosition: MazePosition;
  exitPosition: MazePosition;
  health: number;
  maxHealth: number;
  score: number;
  items: Item[];
  traps: Trap[];
  hasShield: boolean;
  inventory: ItemType[];
  gameOver: boolean;
  gameWon: boolean;
}

export interface GameEvents {
  onMove?: (position: MazePosition) => void;
  onCollision?: () => void;
  onItemPickup?: (item: Item) => void;
  onTrapTrigger?: (trap: Trap, blocked: boolean) => void;
  onHealthChange?: (health: number) => void;
  onScoreChange?: (score: number) => void;
  onShieldChange?: (hasShield: boolean) => void;
  onGameOver?: () => void;
  onGameWon?: () => void;
  onReset?: () => void;
}

const MAZE_ROWS = 8;
const MAZE_COLS = 8;
const INITIAL_HEALTH = 3;
const ITEM_COUNT = 3;
const TRAP_COUNT = 5;

export class GameEngine {
  private state: GameState;
  private events: GameEvents;

  constructor(events: GameEvents = {}) {
    this.events = events;
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    const maze = generateMaze(MAZE_ROWS, MAZE_COLS);
    const playerPosition: MazePosition = { row: 0, col: 0 };
    const exitPosition: MazePosition = { row: MAZE_ROWS - 1, col: MAZE_COLS - 1 };

    const excludePositions: MazePosition[] = [playerPosition, exitPosition];
    const itemPositions = getRandomPositions(maze, ITEM_COUNT, excludePositions);
    const itemTypes: ItemType[] = ['potion', 'key', 'gem'];
    
    const items: Item[] = itemPositions.map((pos, index) => ({
      id: `item-${index}`,
      type: itemTypes[index % itemTypes.length],
      position: pos,
      collected: false
    }));

    const itemExcludes = [...excludePositions, ...itemPositions];
    const trapPositions = getRandomPositions(maze, TRAP_COUNT, itemExcludes);
    
    const traps: Trap[] = trapPositions.map((pos, index) => ({
      id: `trap-${index}`,
      position: pos,
      triggered: false
    }));

    return {
      maze,
      playerPosition,
      exitPosition,
      health: INITIAL_HEALTH,
      maxHealth: INITIAL_HEALTH,
      score: 0,
      items,
      traps,
      hasShield: false,
      inventory: [],
      gameOver: false,
      gameWon: false
    };
  }

  getState(): GameState {
    return { ...this.state };
  }

  reset(): void {
    this.state = this.createInitialState();
    this.events.onReset?.();
  }

  move(direction: Direction): boolean {
    if (this.state.gameOver || this.state.gameWon) {
      return false;
    }

    const { row, col } = this.state.playerPosition;
    let newRow = row;
    let newCol = col;

    switch (direction) {
      case 'up':
        newRow = row - 1;
        break;
      case 'down':
        newRow = row + 1;
        break;
      case 'left':
        newCol = col - 1;
        break;
      case 'right':
        newCol = col + 1;
        break;
    }

    if (
      newRow < 0 ||
      newRow >= this.state.maze.length ||
      newCol < 0 ||
      newCol >= this.state.maze[0].length ||
      this.state.maze[newRow][newCol] === 'wall'
    ) {
      this.events.onCollision?.();
      return false;
    }

    const newPosition = { row: newRow, col: newCol };
    this.state.playerPosition = newPosition;
    this.events.onMove?.(newPosition);

    this.checkItemPickup(newPosition);
    this.checkTrap(newPosition);
    this.checkWinCondition(newPosition);

    return true;
  }

  private checkItemPickup(position: MazePosition): void {
    const item = this.state.items.find(
      i => !i.collected && i.position.row === position.row && i.position.col === position.col
    );

    if (item) {
      item.collected = true;
      this.state.inventory.push(item.type);
      this.applyItemEffect(item.type);
      this.events.onItemPickup?.(item);
    }
  }

  private applyItemEffect(type: ItemType): void {
    switch (type) {
      case 'potion':
        if (this.state.health < this.state.maxHealth) {
          this.state.health++;
          this.events.onHealthChange?.(this.state.health);
        }
        break;
      case 'key':
        this.state.hasShield = true;
        this.events.onShieldChange?.(true);
        break;
      case 'gem':
        this.state.score += 10;
        this.events.onScoreChange?.(this.state.score);
        break;
    }
  }

  private checkTrap(position: MazePosition): void {
    const trap = this.state.traps.find(
      t => !t.triggered && t.position.row === position.row && t.position.col === position.col
    );

    if (trap) {
      trap.triggered = true;
      let blocked = false;

      if (this.state.hasShield) {
        this.state.hasShield = false;
        this.events.onShieldChange?.(false);
        blocked = true;
      } else {
        this.state.health--;
        this.events.onHealthChange?.(this.state.health);
        
        if (this.state.health <= 0) {
          this.state.gameOver = true;
          this.events.onGameOver?.();
        }
      }

      this.events.onTrapTrigger?.(trap, blocked);
    }
  }

  private checkWinCondition(position: MazePosition): void {
    if (
      position.row === this.state.exitPosition.row &&
      position.col === this.state.exitPosition.col &&
      this.state.health > 0
    ) {
      this.state.gameWon = true;
      this.events.onGameWon?.();
    }
  }
}
