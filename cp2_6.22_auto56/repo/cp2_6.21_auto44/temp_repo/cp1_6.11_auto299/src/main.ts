import { Board, Stone, LadderPath } from './board';
import { Renderer } from './renderer';
import { AudioManager } from './audio';

class Game {
  private board: Board;
  private renderer: Renderer;
  private audio: AudioManager;
  private canvas: HTMLCanvasElement;
  private ladderPath: LadderPath | null;
  private isAutoPlaying: boolean;
  private autoPlayTimer: number | null;
  private autoPlaySteps: [number, number][];
  private autoPlayIndex: number;

  private moveCountEl: HTMLElement;
  private currentTurnEl: HTMLElement;
  private blackCapturesEl: HTMLElement;
  private whiteCapturesEl: HTMLElement;
  private autoPlayBtn: HTMLButtonElement;
  private undoBtn: HTMLButtonElement;

  constructor() {
    this.board = new Board();
    this.audio = new AudioManager();
    this.ladderPath = null;
    this.isAutoPlaying = false;
    this.autoPlayTimer = null;
    this.autoPlaySteps = [];
    this.autoPlayIndex = 0;

    this.canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
    this.moveCountEl = document.getElementById('moveCount') as HTMLElement;
    this.currentTurnEl = document.getElementById('currentTurn') as HTMLElement;
    this.blackCapturesEl = document.getElementById('blackCaptures') as HTMLElement;
    this.whiteCapturesEl = document.getElementById('whiteCaptures') as HTMLElement;
    this.autoPlayBtn = document.getElementById('autoPlayBtn') as HTMLButtonElement;
    this.undoBtn = document.getElementById('undoBtn') as HTMLButtonElement;

    const cellSize = this.getInitialCellSize();
    this.renderer = new Renderer(this.canvas, cellSize);

    this.bindEvents();
    this.updateUI();
    this.render();
    this.renderer.startAnimationLoop(this.board.getGrid(), this.board.getLastMove());
  }

  private getInitialCellSize(): number {
    return window.innerWidth < 768 ? 36 : 48;
  }

  private bindEvents(): void {
    this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    this.autoPlayBtn.addEventListener('click', () => this.handleAutoPlay());
    this.undoBtn.addEventListener('click', () => this.handleUndo());
    window.addEventListener('resize', () => this.handleResize());
  }

  private handleCanvasClick(e: MouseEvent): void {
    if (this.isAutoPlaying) return;

    const pos = this.renderer.screenToGrid(e.clientX, e.clientY);
    if (!pos) return;

    const [x, y] = pos;
    if (this.board.placeStone(x, y)) {
      this.renderer.addStoneAnimation(x, y, this.board.getCurrentPlayer() === Stone.Black ? Stone.White : Stone.Black);
      this.audio.playStoneSound();
      this.detectAndUpdateLadder();
      this.updateUI();
      this.updateButtons();
    }
  }

  private detectAndUpdateLadder(): void {
    this.ladderPath = this.board.detectLadder();
    this.renderer.setLadderPath(this.ladderPath);
  }

  private handleAutoPlay(): void {
    if (this.isAutoPlaying) {
      this.stopAutoPlay();
      return;
    }

    if (!this.ladderPath || this.ladderPath.points.length < 2) {
      return;
    }

    this.startAutoPlay();
  }

  private startAutoPlay(): void {
    if (!this.ladderPath) return;

    this.isAutoPlaying = true;
    this.autoPlaySteps = [...this.ladderPath.points.slice(1)];
    this.autoPlayIndex = 0;
    this.autoPlayBtn.textContent = '停止推演';

    this.playNextStep();
  }

  private stopAutoPlay(): void {
    this.isAutoPlaying = false;
    if (this.autoPlayTimer !== null) {
      clearTimeout(this.autoPlayTimer);
      this.autoPlayTimer = null;
    }
    this.autoPlayBtn.textContent = '自动推演';
    this.updateButtons();
  }

  private playNextStep(): void {
    if (!this.isAutoPlaying || this.autoPlayIndex >= this.autoPlaySteps.length) {
      this.stopAutoPlay();
      return;
    }

    const [x, y] = this.autoPlaySteps[this.autoPlayIndex];
    
    if (this.board.canPlace(x, y)) {
      const currentPlayer = this.board.getCurrentPlayer();
      if (this.board.placeStone(x, y)) {
        this.renderer.addStoneAnimation(x, y, currentPlayer);
        this.audio.playStoneSound();
        this.detectAndUpdateLadder();
        this.updateUI();
      }
    }

    this.autoPlayIndex++;

    this.autoPlayTimer = window.setTimeout(() => {
      this.playNextStep();
    }, 500);
  }

  private handleUndo(): void {
    if (this.isAutoPlaying) {
      this.stopAutoPlay();
    }

    if (this.board.undo()) {
      this.detectAndUpdateLadder();
      this.updateUI();
      this.updateButtons();
    }
  }

  private handleResize(): void {
    const cellSize = window.innerWidth < 768 ? 36 : 48;
    this.renderer.resize(cellSize);
    this.render();
  }

  private updateUI(): void {
    const moveCount = this.board.getMoveCount();
    const captures = this.board.getCaptures();
    const currentPlayer = this.board.getCurrentPlayer();

    this.moveCountEl.textContent = `第 ${moveCount} 手`;
    this.currentTurnEl.textContent = currentPlayer === Stone.Black ? '黑方落子' : '白方落子';
    this.blackCapturesEl.textContent = captures.black.toString();
    this.whiteCapturesEl.textContent = captures.white.toString();
  }

  private updateButtons(): void {
    const history = this.board.getHistory();
    this.undoBtn.disabled = history.length === 0;

    if (!this.isAutoPlaying) {
      this.autoPlayBtn.disabled = !this.ladderPath || this.ladderPath.points.length < 2;
    }
  }

  private render(): void {
    this.renderer.render(this.board.getGrid(), this.board.getLastMove());
  }

  public start(): void {
    this.updateButtons();
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
});
