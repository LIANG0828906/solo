import { NoteSystem, type Direction } from './NoteSystem';
import { EnemySystem } from './EnemySystem';
import { ScoreManager } from './ScoreManager';
import { Renderer } from './Renderer';

type GameState = 'start' | 'playing' | 'gameover';

class Game {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private noteSystem: NoteSystem;
  private enemySystem: EnemySystem;
  private scoreManager: ScoreManager;
  private renderer: Renderer;
  
  private gameState: GameState = 'start';
  private lastFrameTime = 0;
  private animationFrameId: number | null = null;
  private canvasWidth = 800;
  private canvasHeight = 600;
  private minWidth = 800;
  private minHeight = 600;
  
  private startScreen: HTMLElement | null = null;
  private gameOverScreen: HTMLElement | null = null;
  private finalScoreElement: HTMLElement | null = null;
  private finalComboElement: HTMLElement | null = null;
  private startButton: HTMLElement | null = null;

  constructor() {
    const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
    if (!canvas) {
      throw new Error('Canvas element not found');
    }
    this.canvas = canvas;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('2D context not available');
    }
    this.ctx = ctx;
    
    this.updateCanvasSize();
    
    this.noteSystem = new NoteSystem(this.canvasWidth, this.canvasHeight);
    this.enemySystem = new EnemySystem(this.canvasWidth, this.canvasHeight);
    this.scoreManager = new ScoreManager();
    this.renderer = new Renderer(this.ctx, this.canvasWidth, this.canvasHeight, this.noteSystem);
    
    this.initUI();
    this.bindEvents();
  }

  private initUI(): void {
    this.startScreen = document.getElementById('start-screen');
    this.gameOverScreen = document.getElementById('game-over-screen');
    this.finalScoreElement = document.getElementById('final-score');
    this.finalComboElement = document.getElementById('final-combo');
    this.startButton = document.getElementById('start-btn');
    
    this.showStartScreen();
  }

  private bindEvents(): void {
    window.addEventListener('resize', () => this.handleResize());
    
    document.addEventListener('keydown', (e) => this.handleKeyDown(e));
    
    if (this.startButton) {
      this.startButton.addEventListener('click', () => this.startGame());
    }
  }

  private updateCanvasSize(): void {
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    let newWidth = windowWidth * 0.7;
    let newHeight = windowHeight * 0.7;
    
    newWidth = Math.max(newWidth, this.minWidth);
    newHeight = Math.max(newHeight, this.minHeight);
    
    newWidth = Math.min(newWidth, windowWidth - 40);
    newHeight = Math.min(newHeight, windowHeight - 40);
    
    this.canvasWidth = newWidth;
    this.canvasHeight = newHeight;
    
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;
    
    if (this.noteSystem) {
      this.noteSystem.updateCanvasSize(newWidth, newHeight);
    }
    if (this.enemySystem) {
      this.enemySystem.updateCanvasSize(newWidth, newHeight);
    }
    if (this.renderer) {
      this.renderer.updateCanvasSize(newWidth, newHeight);
    }
  }

  private handleResize(): void {
    this.updateCanvasSize();
  }

  private handleKeyDown(e: KeyboardEvent): void {
    if (this.gameState === 'start') {
      if (e.code === 'Space') {
        e.preventDefault();
        this.startGame();
      }
      return;
    }
    
    if (this.gameState === 'gameover') {
      if (e.code === 'Space') {
        e.preventDefault();
        this.resetGame();
      }
      return;
    }
    
    if (this.gameState !== 'playing') return;
    
    let direction: Direction | null = null;
    
    switch (e.code) {
      case 'ArrowUp':
        direction = 'up';
        break;
      case 'ArrowDown':
        direction = 'down';
        break;
      case 'ArrowLeft':
        direction = 'left';
        break;
      case 'ArrowRight':
        direction = 'right';
        break;
    }
    
    if (direction) {
      e.preventDefault();
      this.handleNoteHit(direction);
    }
  }

  private handleNoteHit(direction: Direction): void {
    const currentTime = performance.now();
    const result = this.noteSystem.checkHit(direction, currentTime);
    
    if (result.hit && result.type) {
      this.scoreManager.onHit(result.type, currentTime);
      this.enemySystem.onNoteHit(direction, currentTime);
    } else {
      this.scoreManager.onMiss();
      this.enemySystem.onNoteMiss(direction);
    }
  }

  private startGame(): void {
    this.gameState = 'playing';
    this.hideStartScreen();
    this.hideGameOverScreen();
    
    const currentTime = performance.now();
    
    this.noteSystem.reset();
    this.enemySystem.reset();
    this.scoreManager.reset();
    
    this.noteSystem.start(currentTime);
    this.enemySystem.start(currentTime);
    
    this.lastFrameTime = currentTime;
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.gameLoop(currentTime);
  }

  private resetGame(): void {
    this.startGame();
  }

  private endGame(): void {
    this.gameState = 'gameover';
    
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    
    if (this.finalScoreElement) {
      this.finalScoreElement.textContent = this.scoreManager.getScore().toString();
    }
    if (this.finalComboElement) {
      this.finalComboElement.textContent = this.scoreManager.getMaxCombo().toString();
    }
    
    this.showGameOverScreen();
  }

  private showStartScreen(): void {
    if (this.startScreen) {
      this.startScreen.classList.remove('hidden');
    }
  }

  private hideStartScreen(): void {
    if (this.startScreen) {
      this.startScreen.classList.add('hidden');
    }
  }

  private showGameOverScreen(): void {
    if (this.gameOverScreen) {
      this.gameOverScreen.classList.remove('hidden');
    }
  }

  private hideGameOverScreen(): void {
    if (this.gameOverScreen) {
      this.gameOverScreen.classList.add('hidden');
    }
  }

  private gameLoop(currentTime: number): void {
    if (this.gameState !== 'playing') return;
    
    const deltaTime = currentTime - this.lastFrameTime;
    this.lastFrameTime = currentTime;
    
    this.update(currentTime, deltaTime);
    this.render(currentTime);
    
    if (this.enemySystem.isGameOver()) {
      this.endGame();
      return;
    }
    
    this.animationFrameId = requestAnimationFrame((time) => this.gameLoop(time));
  }

  private update(currentTime: number, deltaTime: number): void {
    this.noteSystem.update(currentTime, deltaTime);
    this.enemySystem.update(currentTime, deltaTime);
    this.scoreManager.update(currentTime);
    this.renderer.updateStars();
    
    const notes = this.noteSystem.getNotes();
    for (const note of notes) {
      if (note.missed) {
        this.scoreManager.onMiss();
        this.enemySystem.onNoteMiss(note.direction);
        note.missed = false;
      }
    }
  }

  private render(currentTime: number): void {
    this.renderer.clear();
    
    this.renderer.render(
      this.noteSystem.getNotes(),
      this.enemySystem.getEnemies(),
      this.enemySystem.getHp(),
      this.enemySystem.getMaxHp(),
      this.scoreManager.getScore(),
      this.scoreManager.getCombo(),
      this.scoreManager.shouldShowCombo(),
      this.noteSystem.getHitEffects(),
      this.noteSystem.getShatterParticles(),
      this.noteSystem.getHitBurstParticles(),
      this.enemySystem.getKnockbackEffects(),
      this.enemySystem.getScreenFlashEffects(),
      this.scoreManager.getComboEffects(),
      this.noteSystem.getTrackPositions(),
      this.noteSystem.getJudgmentArea(),
      currentTime,
      this.enemySystem.getPlayerPosition(),
      this.enemySystem.getEnemyRadius()
    );
  }

  public start(): void {
    this.render(performance.now());
  }

  public destroy(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    window.removeEventListener('resize', () => this.handleResize());
    document.removeEventListener('keydown', (e) => this.handleKeyDown(e));
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  game.start();
});
