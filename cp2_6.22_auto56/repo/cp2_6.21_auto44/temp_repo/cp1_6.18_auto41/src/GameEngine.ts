import {
  CellState,
  Player,
  RhythmJudgment,
  GamePhase,
  Particle,
  BOARD_SIZE,
  PERFECT_THRESHOLD,
  NORMAL_THRESHOLD,
  PLACEMENTS_PER_TURN,
  COMBO_REQUIREMENT,
  COMBO_BPM_BOOST,
  COMBO_BOOST_DURATION,
  WIN_THRESHOLD,
} from './types';
import { AudioEngine } from './AudioEngine';

export class GameEngine {
  private board: CellState[][];
  private currentPlayer: Player;
  private placementCount: number;
  private phase: GamePhase;
  private selectedCell: { row: number; col: number } | null;
  private combo: number;
  private maxCombo: number;
  private perfectCount: number;
  private totalPlacements: number;
  private isComboActive: boolean;
  private comboEndTime: number;
  private winner: Player | null;
  private finalScore: number;
  private bestCombo: number;
  private averageAccuracy: number;
  private boardRotation: number;
  private isRotating: boolean;
  private rotationStartTime: number;
  private flashPhase: number;
  private flashStartTime: number;
  private borderHue: number;
  private particles: Particle[];
  private audioEngine: AudioEngine;
  private lastUpdateTime: number;
  private listeners: Set<() => void> = new Set();

  constructor(audioEngine: AudioEngine) {
    this.audioEngine = audioEngine;
    this.board = this.createEmptyBoard();
    this.currentPlayer = 'player1';
    this.placementCount = 0;
    this.phase = 'placing';
    this.selectedCell = null;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectCount = 0;
    this.totalPlacements = 0;
    this.isComboActive = false;
    this.comboEndTime = 0;
    this.winner = null;
    this.finalScore = 0;
    this.bestCombo = 0;
    this.averageAccuracy = 0;
    this.boardRotation = 0;
    this.isRotating = false;
    this.rotationStartTime = 0;
    this.flashPhase = 0;
    this.flashStartTime = 0;
    this.borderHue = 0;
    this.particles = [];
    this.lastUpdateTime = 0;
    this.initializeBoard();
  }

  private createEmptyBoard(): CellState[][] {
    const board: CellState[][] = [];
    for (let row = 0; row < BOARD_SIZE; row++) {
      const rowCells: CellState[] = [];
      for (let col = 0; col < BOARD_SIZE; col++) {
        rowCells.push({
          owner: null,
          isTerritory: false,
          territoryOwner: null,
          scale: 1,
          isShaking: false,
          shakeStartTime: 0,
          isFlashing: false,
          flashStartTime: 0,
          flashColor: '',
          pulsePhase: 0,
        });
      }
      board.push(rowCells);
    }
    return board;
  }

  private initializeBoard(): void {
    this.board[0][0].owner = 'player1';
    this.board[0][1].owner = 'player1';
    this.board[1][0].owner = 'player1';
    this.expandTerritory(0, 0, 'player1', 3);
    this.expandTerritory(0, 1, 'player1', 3);
    this.expandTerritory(1, 0, 'player1', 3);

    this.board[BOARD_SIZE - 1][BOARD_SIZE - 1].owner = 'player2';
    this.board[BOARD_SIZE - 1][BOARD_SIZE - 2].owner = 'player2';
    this.board[BOARD_SIZE - 2][BOARD_SIZE - 1].owner = 'player2';
    this.expandTerritory(BOARD_SIZE - 1, BOARD_SIZE - 1, 'player2', 3);
    this.expandTerritory(BOARD_SIZE - 1, BOARD_SIZE - 2, 'player2', 3);
    this.expandTerritory(BOARD_SIZE - 2, BOARD_SIZE - 1, 'player2', 3);
  }

  private expandTerritory(centerRow: number, centerCol: number, player: Player, range: number): void {
    const halfRange = Math.floor(range / 2);
    for (let r = centerRow - halfRange; r <= centerRow + halfRange; r++) {
      for (let c = centerCol - halfRange; c <= centerCol + halfRange; c++) {
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
          if (this.board[r][c].owner === null) {
            this.board[r][c].isTerritory = true;
            this.board[r][c].territoryOwner = player;
          }
        }
      }
    }
  }

  private isAdjacentToOwn(row: number, col: number, player: Player): boolean {
    const directions = [
      [-1, 0], [1, 0], [0, -1], [0, 1],
      [-1, -1], [-1, 1], [1, -1], [1, 1],
    ];
    for (const [dr, dc] of directions) {
      const nr = row + dr;
      const nc = col + dc;
      if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
        if (this.board[nr][nc].owner === player) {
          return true;
        }
      }
    }
    return false;
  }

  canPlace(row: number, col: number): boolean {
    if (this.phase !== 'placing' && this.phase !== 'waitingForSpace') {
      return false;
    }
    if (this.board[row][col].owner !== null) {
      return false;
    }
    return this.isAdjacentToOwn(row, col, this.currentPlayer);
  }

  selectCell(row: number, col: number): boolean {
    if (!this.canPlace(row, col)) {
      return false;
    }
    this.selectedCell = { row, col };
    this.phase = 'waitingForSpace';
    this.notifyListeners();
    return true;
  }

  handleSpacePress(): void {
    if (this.phase !== 'waitingForSpace' || !this.selectedCell) {
      return;
    }

    const beatOffset = this.audioEngine.getBeatOffset();
    const judgment = this.judgeRhythm(beatOffset);

    this.placePiece(this.selectedCell.row, this.selectedCell.col, judgment);
    this.selectedCell = null;
    this.placementCount++;
    this.totalPlacements++;

    if (judgment === 'perfect') {
      this.perfectCount++;
      this.combo++;
      if (this.combo > this.maxCombo) {
        this.maxCombo = this.combo;
      }
      if (this.combo >= COMBO_REQUIREMENT && !this.isComboActive) {
        this.activateCombo();
      }
    } else {
      this.combo = 0;
    }

    if (this.placementCount >= PLACEMENTS_PER_TURN) {
      this.startTurnSwitch();
    } else {
      this.phase = 'placing';
    }

    this.checkWinCondition();
    this.notifyListeners();
  }

  private judgeRhythm(offset: number): RhythmJudgment {
    const absOffset = Math.abs(offset);
    if (absOffset <= PERFECT_THRESHOLD) {
      return 'perfect';
    } else if (absOffset <= NORMAL_THRESHOLD) {
      return 'normal';
    }
    return 'miss';
  }

  private placePiece(row: number, col: number, judgment: RhythmJudgment): void {
    const cell = this.board[row][col];
    cell.owner = this.currentPlayer;
    cell.isTerritory = false;
    cell.territoryOwner = null;

    if (judgment === 'perfect') {
      cell.scale = 1.5;
      cell.isFlashing = true;
      cell.flashStartTime = performance.now();
      cell.flashColor = '#00FF88';
    } else if (judgment === 'miss') {
      cell.scale = 0.8;
      cell.isShaking = true;
      cell.shakeStartTime = performance.now();
    } else {
      cell.scale = 1;
    }

    const range = this.isComboActive ? 4 : 3;
    const speedMultiplier = judgment === 'perfect' ? 2 : 1;
    for (let i = 0; i < speedMultiplier; i++) {
      this.expandTerritory(row, col, this.currentPlayer, range);
    }

    this.spawnParticles(row, col);
  }

  private spawnParticles(row: number, col: number): void {
    const cellSize = 1;
    const centerX = col * cellSize + cellSize / 2;
    const centerY = row * cellSize + cellSize / 2;

    for (let i = 0; i < 20; i++) {
      const angle = (Math.PI * 2 * i) / 20 + Math.random() * 0.5;
      const speed = 0.5 + Math.random() * 1;
      this.particles.push({
        x: centerX,
        y: centerY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 2 + Math.random() * 3,
        life: 1200,
        maxLife: 1200,
        color: '#FFFFFF',
      });
    }
  }

  private activateCombo(): void {
    this.isComboActive = true;
    this.comboEndTime = performance.now() + COMBO_BOOST_DURATION;
    this.audioEngine.applyBpmBoost(COMBO_BPM_BOOST, COMBO_BOOST_DURATION);
  }

  private startTurnSwitch(): void {
    this.phase = 'switching';
    this.isRotating = true;
    this.rotationStartTime = performance.now();
    this.flashStartTime = performance.now();
    this.flashPhase = 0;
  }

  private updateTurnSwitch(now: number): void {
    const rotationDuration = 800;
    const elapsed = now - this.rotationStartTime;
    const progress = Math.min(elapsed / rotationDuration, 1);

    const easeInOut = (t: number): number => {
      return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    };

    this.boardRotation = easeInOut(progress) * 180;

    const flashDuration = 800;
    const flashElapsed = now - this.flashStartTime;
    const flashProgress = Math.min(flashElapsed / flashDuration, 1);
    this.flashPhase = Math.floor(flashProgress * 4);

    if (progress >= 1) {
      this.isRotating = false;
      this.currentPlayer = this.currentPlayer === 'player1' ? 'player2' : 'player1';
      this.placementCount = 0;
      this.boardRotation = 0;
      this.phase = 'placing';
    }
  }

  private checkWinCondition(): void {
    let player1Territory = 0;
    let player2Territory = 0;
    const totalCells = BOARD_SIZE * BOARD_SIZE;

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const cell = this.board[row][col];
        if (cell.owner === 'player1') {
          player1Territory++;
        } else if (cell.owner === 'player2') {
          player2Territory++;
        } else if (cell.isTerritory) {
          if (cell.territoryOwner === 'player1') {
            player1Territory++;
          } else if (cell.territoryOwner === 'player2') {
            player2Territory++;
          }
        }
      }
    }

    const player1Ratio = player1Territory / totalCells;
    const player2Ratio = player2Territory / totalCells;

    if (player1Ratio >= WIN_THRESHOLD) {
      this.winner = 'player1';
      this.averageAccuracy = this.calculateAverageAccuracy();
      this.finalScore = player1Territory * this.averageAccuracy;
      this.bestCombo = this.maxCombo;
      this.phase = 'ended';
    } else if (player2Ratio >= WIN_THRESHOLD) {
      this.winner = 'player2';
      this.averageAccuracy = this.calculateAverageAccuracy();
      this.finalScore = player2Territory * this.averageAccuracy;
      this.bestCombo = this.maxCombo;
      this.phase = 'ended';
    }
  }

  private calculateAverageAccuracy(): number {
    if (this.totalPlacements === 0) return 0;
    return this.perfectCount / this.totalPlacements;
  }

  update(now: number): void {
    if (this.lastUpdateTime === 0) {
      this.lastUpdateTime = now;
    }

    const deltaTime = now - this.lastUpdateTime;
    this.lastUpdateTime = now;

    this.audioEngine.update();

    this.borderHue = (this.borderHue + deltaTime * 0.045) % 360;

    if (this.isComboActive && now >= this.comboEndTime) {
      this.isComboActive = false;
    }

    for (let row = 0; row < BOARD_SIZE; row++) {
      for (let col = 0; col < BOARD_SIZE; col++) {
        const cell = this.board[row][col];

        if (cell.isShaking) {
          const shakeElapsed = now - cell.shakeStartTime;
          if (shakeElapsed > 200) {
            cell.isShaking = false;
          }
        }

        if (cell.isFlashing) {
          const flashElapsed = now - cell.flashStartTime;
          if (flashElapsed > 300) {
            cell.isFlashing = false;
          }
        }

        cell.pulsePhase = this.audioEngine.getBeatProgress();
      }
    }

    this.particles = this.particles.filter((p) => {
      p.x += (p.vx * deltaTime) / 16;
      p.y += (p.vy * deltaTime) / 16;
      p.life -= deltaTime;
      return p.life > 0;
    });

    if (this.phase === 'switching') {
      this.updateTurnSwitch(now);
    }

    this.notifyListeners();
  }

  reset(): void {
    this.board = this.createEmptyBoard();
    this.currentPlayer = 'player1';
    this.placementCount = 0;
    this.phase = 'placing';
    this.selectedCell = null;
    this.combo = 0;
    this.maxCombo = 0;
    this.perfectCount = 0;
    this.totalPlacements = 0;
    this.isComboActive = false;
    this.comboEndTime = 0;
    this.winner = null;
    this.finalScore = 0;
    this.bestCombo = 0;
    this.averageAccuracy = 0;
    this.boardRotation = 0;
    this.isRotating = false;
    this.rotationStartTime = 0;
    this.flashPhase = 0;
    this.flashStartTime = 0;
    this.particles = [];
    this.lastUpdateTime = 0;
    this.initializeBoard();
    this.audioEngine.reset();
    this.audioEngine.start();
    this.notifyListeners();
  }

  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener());
  }

  getBoard(): CellState[][] {
    return this.board;
  }

  getCurrentPlayer(): Player {
    return this.currentPlayer;
  }

  getPhase(): GamePhase {
    return this.phase;
  }

  getSelectedCell(): { row: number; col: number } | null {
    return this.selectedCell;
  }

  getCombo(): number {
    return this.combo;
  }

  getMaxCombo(): number {
    return this.maxCombo;
  }

  getIsComboActive(): boolean {
    return this.isComboActive;
  }

  getWinner(): Player | null {
    return this.winner;
  }

  getFinalScore(): number {
    return this.finalScore;
  }

  getBestCombo(): number {
    return this.bestCombo;
  }

  getAverageAccuracy(): number {
    return this.averageAccuracy;
  }

  getBoardRotation(): number {
    return this.boardRotation;
  }

  getIsRotating(): boolean {
    return this.isRotating;
  }

  getFlashPhase(): number {
    return this.flashPhase;
  }

  getBorderHue(): number {
    return this.borderHue;
  }

  getParticles(): Particle[] {
    return this.particles;
  }

  getPlacementCount(): number {
    return this.placementCount;
  }

  getBeatOffset(): number {
    return this.audioEngine.getBeatOffset();
  }

  getAudioEngine(): AudioEngine {
    return this.audioEngine;
  }
}
