import type {
  Player,
  GridNode,
  LightPath,
  EntangleEffect,
  GameState,
  GameStateSnapshot,
  Particle,
} from './types';

export const GRID_SIZE = 8;
export const CELL_SIZE = 60;
export const CELL_SIZE_MOBILE = 40;
export const NODE_RADIUS = 18;
export const GAME_DURATION = 90;
export const MAX_UNDO = 5;
export const INITIAL_NODES_PER_PLAYER = 3;

export const COLORS = {
  background: '#0A0A1A',
  boardBg: '#1E1135',
  gridBorder: '#4A3B6B',
  player1: '#00BFFF',
  player2: '#FF4500',
  selected: '#FFD700',
  pathStart: '#00BFFF',
  pathEnd: '#9932CC',
  text: '#FFFFFF',
  countdown: '#FF0000',
  overlay: '#00000080',
  deepPurple: '#1E1135',
  lightPurple: '#4A3B6B',
  gold: '#FFD700',
  brightBlue: '#00BFFF',
  brightPurple: '#9932CC',
} as const;

const ENTANGLEMENT_SUCCESS_RATE = 0.7;

export class GameEngine {
  private state: GameState;

  constructor() {
    this.state = {
      grid: this.createInitialGrid(),
      currentPlayer: 'player1',
      scores: { player1: INITIAL_NODES_PER_PLAYER, player2: INITIAL_NODES_PER_PLAYER },
      timeRemaining: GAME_DURATION,
      undoCount: { player1: MAX_UNDO, player2: MAX_UNDO },
      selectedNode: null,
      lightPaths: [],
      entangleEffects: [],
      gameOver: false,
      winner: null,
      history: [],
    };
  }

  private createInitialGrid(): (GridNode | null)[][] {
    const grid: (GridNode | null)[][] = Array(GRID_SIZE)
      .fill(null)
      .map(() => Array(GRID_SIZE).fill(null));

    const player1Positions: Array<[number, number]> = [
      [0, 0],
      [0, 1],
      [1, 0],
    ];
    const player2Positions: Array<[number, number]> = [
      [GRID_SIZE - 1, GRID_SIZE - 1],
      [GRID_SIZE - 1, GRID_SIZE - 2],
      [GRID_SIZE - 2, GRID_SIZE - 1],
    ];

    let nodeIdCounter = 0;

    player1Positions.forEach(([row, col]) => {
      grid[row][col] = {
        id: `node-${nodeIdCounter++}`,
        row,
        col,
        owner: 'player1',
        rotation: Math.random() * 360,
      };
    });

    player2Positions.forEach(([row, col]) => {
      grid[row][col] = {
        id: `node-${nodeIdCounter++}`,
        row,
        col,
        owner: 'player2',
        rotation: Math.random() * 360,
      };
    });

    return grid;
  }

  private isAdjacent(
    row1: number,
    col1: number,
    row2: number,
    col2: number
  ): boolean {
    const rowDiff = Math.abs(row1 - row2);
    const colDiff = Math.abs(col1 - col2);
    return rowDiff <= 1 && colDiff <= 1 && !(rowDiff === 0 && colDiff === 0);
  }

  selectNode(row: number, col: number): boolean {
    if (this.state.gameOver) return false;

    const node = this.state.grid[row][col];
    if (!node || node.owner !== this.state.currentPlayer) {
      this.state.selectedNode = null;
      return false;
    }

    this.state.selectedNode = { row, col };
    return true;
  }

  executeAction(targetRow: number, targetCol: number): boolean {
    if (this.state.gameOver) return false;
    if (!this.state.selectedNode) return false;

    const { row: fromRow, col: fromCol } = this.state.selectedNode;
    const fromNode = this.state.grid[fromRow][fromCol];
    const toNode = this.state.grid[targetRow][targetCol];

    if (!fromNode) return false;
    if (!this.isAdjacent(fromRow, fromCol, targetRow, targetCol)) return false;

    this.saveHistory();

    if (!toNode) {
      this.createLightPath(fromRow, fromCol, targetRow, targetCol, this.state.currentPlayer);
      this.state.grid[targetRow][targetCol] = {
        id: `node-${Date.now()}`,
        row: targetRow,
        col: targetCol,
        owner: this.state.currentPlayer,
        rotation: Math.random() * 360,
      };
      this.updateScores();
      this.switchPlayer();
      this.state.selectedNode = null;
      return true;
    }

    if (toNode.owner !== this.state.currentPlayer && toNode.owner !== null) {
      this.createLightPath(fromRow, fromCol, targetRow, targetCol, this.state.currentPlayer);
      const success = this.attemptEntanglement(fromNode, toNode);
      if (success) {
        const oldColor = toNode.owner === 'player1' ? COLORS.player1 : COLORS.player2;
        const newColor = this.state.currentPlayer === 'player1' ? COLORS.player1 : COLORS.player2;
        this.createEntangleEffect(targetRow, targetCol, oldColor, newColor);
        toNode.owner = this.state.currentPlayer;
        this.updateScores();
      }
      this.switchPlayer();
      this.state.selectedNode = null;
      return true;
    }

    return false;
  }

  private attemptEntanglement(fromNode: GridNode, toNode: GridNode): boolean {
    return Math.random() < ENTANGLEMENT_SUCCESS_RATE;
  }

  private createLightPath(
    fromRow: number,
    fromCol: number,
    toRow: number,
    toCol: number,
    owner: Player
  ): void {
    const lightPath: LightPath = {
      id: `path-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      fromRow,
      fromCol,
      toRow,
      toCol,
      owner,
      progress: 0,
      createdAt: Date.now(),
    };
    this.state.lightPaths.push(lightPath);
  }

  private createEntangleEffect(
    row: number,
    col: number,
    oldColor: string,
    newColor: string
  ): void {
    const particles: Particle[] = [];
    const particleCount = 12;

    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount;
      const speed = 1.5 + Math.random() * 1.5;
      particles.push({
        x: 0,
        y: 0,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
      });
    }

    const effect: EntangleEffect = {
      id: `effect-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      row,
      col,
      progress: 0,
      oldColor,
      newColor,
      particles,
    };
    this.state.entangleEffects.push(effect);
  }

  private switchPlayer(): void {
    this.state.currentPlayer = this.state.currentPlayer === 'player1' ? 'player2' : 'player1';
  }

  private updateScores(): void {
    let player1Count = 0;
    let player2Count = 0;

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const node = this.state.grid[row][col];
        if (node?.owner === 'player1') player1Count++;
        if (node?.owner === 'player2') player2Count++;
      }
    }

    this.state.scores = {
      player1: player1Count,
      player2: player2Count,
    };
  }

  undo(): boolean {
    if (this.state.gameOver) return false;
    if (this.state.undoCount[this.state.currentPlayer] <= 0) return false;
    if (this.state.history.length === 0) return false;

    const snapshot = this.state.history.pop()!;
    this.state.grid = this.deepCloneGrid(snapshot.grid);
    this.state.currentPlayer = snapshot.currentPlayer;
    this.state.scores = { ...snapshot.scores };
    this.state.undoCount[this.state.currentPlayer]--;
    this.state.selectedNode = null;

    return true;
  }

  private deepCloneGrid(grid: (GridNode | null)[][]): (GridNode | null)[][] {
    return grid.map(row =>
      row.map(node => (node ? { ...node } : null))
    );
  }

  checkGameOver(): boolean {
    if (this.state.timeRemaining <= 0) {
      this.finalizeGame();
      return true;
    }

    let emptyCount = 0;
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (!this.state.grid[row][col]) {
          emptyCount++;
        }
      }
    }

    if (emptyCount === 0) {
      this.finalizeGame();
      return true;
    }

    return false;
  }

  private finalizeGame(): void {
    this.state.gameOver = true;
    const { player1, player2 } = this.state.scores;
    if (player1 > player2) {
      this.state.winner = 'player1';
    } else if (player2 > player1) {
      this.state.winner = 'player2';
    } else {
      this.state.winner = 'draw';
    }
  }

  tick(): void {
    if (this.state.gameOver) return;
    this.state.timeRemaining--;
    this.checkGameOver();
  }

  private saveHistory(): void {
    const snapshot: GameStateSnapshot = {
      grid: this.deepCloneGrid(this.state.grid),
      currentPlayer: this.state.currentPlayer,
      scores: { ...this.state.scores },
      undoCount: { ...this.state.undoCount },
    };
    this.state.history.push(snapshot);
  }

  getState(): Readonly<GameState> {
    return this.state;
  }

  updateAnimations(deltaTime: number): void {
    const pathAnimationSpeed = 2;
    const effectAnimationSpeed = 1.5;

    this.state.lightPaths = this.state.lightPaths.filter(path => {
      path.progress += deltaTime * pathAnimationSpeed;
      return path.progress < 1;
    });

    this.state.entangleEffects = this.state.entangleEffects.filter(effect => {
      effect.progress += deltaTime * effectAnimationSpeed;
      effect.particles.forEach(particle => {
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.life -= deltaTime * 2;
      });
      return effect.progress < 1;
    });

    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const node = this.state.grid[row][col];
        if (node) {
          node.rotation += deltaTime * 30;
        }
      }
    }
  }
}
