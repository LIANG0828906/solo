import { Board } from './Board';
import { RuleEngine } from './RuleEngine';
import { Renderer } from './Renderer';
import { Position } from './types';

const GAME_DURATION = 90000;
const FLASH_SCORE_THRESHOLD = 100;

class Game {
  private canvas: HTMLCanvasElement;
  private board: Board;
  private ruleEngine: RuleEngine;
  private renderer: Renderer;
  
  private score = 0;
  private combo = 1;
  private totalGemsCleared = 0;
  private timeRemaining = GAME_DURATION;
  private lastFlashScore = 0;
  
  private isProcessing = false;
  private animationFrameId: number | null = null;
  private lastTime = 0;
  
  private scoreElement: HTMLElement;
  private comboElement: HTMLElement;
  private timerFillElement: HTMLElement;
  private notificationElement: HTMLElement;
  private flashElement: HTMLElement;
  private gameOverOverlay: HTMLElement;
  private statsList: HTMLElement;
  private restartBtn: HTMLElement;

  constructor() {
    this.canvas = document.getElementById('game') as HTMLCanvasElement;
    const ctx = this.canvas.getContext('2d')!;
    
    this.board = new Board();
    this.ruleEngine = new RuleEngine(this.board);
    this.renderer = new Renderer(ctx, this.board);
    
    this.scoreElement = document.getElementById('score')!;
    this.comboElement = document.getElementById('combo')!;
    this.timerFillElement = document.getElementById('timer-fill')!;
    this.notificationElement = document.getElementById('notification')!;
    this.flashElement = document.getElementById('flash-effect')!;
    this.gameOverOverlay = document.getElementById('game-over-overlay')!;
    this.statsList = document.getElementById('stats-list')!;
    this.restartBtn = document.getElementById('restart-btn')!;
    
    this.setupEventListeners();
    this.startGame();
  }

  private setupEventListeners(): void {
    this.canvas.addEventListener('click', this.handleClick.bind(this));
    this.restartBtn.addEventListener('click', this.restartGame.bind(this));
  }

  private handleClick(event: MouseEvent): void {
    if (this.isProcessing || this.renderer.isAnimatingSwap()) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    const clickedPos = this.board.getGemAtPosition(x, y);
    if (!clickedPos) return;
    
    const selected = this.board.getSelectedGem();
    
    if (!selected) {
      this.board.setSelectedGem(clickedPos);
    } else if (selected.row === clickedPos.row && selected.col === clickedPos.col) {
      this.board.setSelectedGem(null);
    } else if (this.board.isAdjacent(selected, clickedPos)) {
      this.attemptSwap(selected, clickedPos);
    } else {
      this.board.setSelectedGem(clickedPos);
    }
  }

  private async attemptSwap(pos1: Position, pos2: Position): Promise<void> {
    this.isProcessing = true;
    this.board.setSelectedGem(null);
    
    if (this.ruleEngine.canSwap(pos1, pos2)) {
      this.board.swapGems(pos1, pos2);
      this.renderer.setSwapAnimation(pos1, pos2);
      
      await this.waitForSwapAnimation();
      
      await this.processMatches();
    } else {
      this.renderer.setSwapAnimation(pos1, pos2, true);
      await this.waitForSwapAnimation();
    }
    
    this.isProcessing = false;
  }

  private async waitForSwapAnimation(): Promise<void> {
    return new Promise<void>((resolve) => {
      const waitLoop = () => {
        if (this.renderer.updateSwapAnimation(16.67)) {
          resolve();
        } else {
          requestAnimationFrame(waitLoop);
        }
      };
      waitLoop();
    });
  }

  private async processMatches(): Promise<void> {
    let chainCount = 0;
    let lastChainHadMatch = true;
    
    while (chainCount < 5 && lastChainHadMatch) {
      const matches = this.ruleEngine.findMatches();
      
      if (matches.length === 0) {
        lastChainHadMatch = false;
        break;
      }
      
      chainCount++;
      
      for (const pos of matches) {
        const gemType = this.board.getCell(pos.row, pos.col);
        if (gemType) {
          this.renderer.createExplosion(pos.row, pos.col, gemType);
        }
      }
      
      await this.wait(200);
      
      this.board.removeGems(matches);
      this.board.dropGems();
      
      const score = this.ruleEngine.calculateScore(matches.length, chainCount);
      this.score += score;
      this.totalGemsCleared += matches.length;
      
      if (chainCount > 1) {
        this.showNotification(`Combo x${chainCount}!`);
      } else {
        this.showNotification('Great!');
      }
      
      this.updateCombo(chainCount);
      this.updateScoreDisplay();
      this.checkFlashEffect();
      
      await this.wait(150);
    }
    
    if (chainCount === 1) {
      this.combo = 1;
      this.updateComboDisplay();
    }
  }

  private updateCombo(chainCount: number): void {
    if (chainCount > 1) {
      this.combo = chainCount;
    }
    this.updateComboDisplay();
  }

  private updateScoreDisplay(): void {
    this.scoreElement.textContent = `Score: ${this.score}`;
  }

  private updateComboDisplay(): void {
    this.comboElement.textContent = `COMBO x${this.combo}`;
  }

  private checkFlashEffect(): void {
    const flashCount = Math.floor(this.score / FLASH_SCORE_THRESHOLD);
    const lastFlashCount = Math.floor(this.lastFlashScore / FLASH_SCORE_THRESHOLD);
    
    if (flashCount > lastFlashCount) {
      this.flashElement.classList.add('flash');
      setTimeout(() => {
        this.flashElement.classList.remove('flash');
      }, 100);
      this.lastFlashScore = this.score;
    }
  }

  private showNotification(text: string): void {
    this.notificationElement.textContent = text;
    this.notificationElement.classList.remove('show');
    void this.notificationElement.offsetWidth;
    this.notificationElement.classList.add('show');
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private startGame(): void {
    this.lastTime = performance.now();
    this.gameLoop();
    this.startTimer();
  }

  private gameLoop(): void {
    const currentTime = performance.now();
    const deltaTime = currentTime - this.lastTime;
    this.lastTime = currentTime;
    
    this.renderer.updateSwapAnimation(deltaTime);
    this.renderer.draw();
    
    if (this.timeRemaining > 0) {
      this.animationFrameId = requestAnimationFrame(() => this.gameLoop());
    }
  }

  private startTimer(): void {
    const timerInterval = setInterval(() => {
      this.timeRemaining -= 100;
      
      if (this.timeRemaining <= 0) {
        this.timeRemaining = 0;
        clearInterval(timerInterval);
        this.endGame();
      }
      
      this.updateTimerDisplay();
    }, 100);
  }

  private updateTimerDisplay(): void {
    const percentage = this.timeRemaining / GAME_DURATION;
    this.timerFillElement.style.width = `${percentage * 100}%`;
  }

  private endGame(): void {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    this.showNotification('Game Over');
    
    this.statsList.innerHTML = `
      <li>Final Score: ${this.score}</li>
      <li>Total Gems Cleared: ${this.totalGemsCleared}</li>
      <li>Best Combo: x${this.combo}</li>
    `;
    
    setTimeout(() => {
      this.gameOverOverlay.classList.add('show');
    }, 500);
  }

  private restartGame(): void {
    this.gameOverOverlay.classList.remove('show');
    
    this.score = 0;
    this.combo = 1;
    this.totalGemsCleared = 0;
    this.timeRemaining = GAME_DURATION;
    this.lastFlashScore = 0;
    this.isProcessing = false;
    
    this.board = new Board();
    this.ruleEngine = new RuleEngine(this.board);
    this.renderer = new Renderer(this.canvas.getContext('2d')!, this.board);
    
    this.updateScoreDisplay();
    this.updateComboDisplay();
    this.updateTimerDisplay();
    
    this.startGame();
  }
}

new Game();
