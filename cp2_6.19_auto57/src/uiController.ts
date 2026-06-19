import { eventBus, LevelUpData } from './gameEngine';

export class UIController {
  private scoreElement: HTMLElement;
  private highScoreElement: HTMLElement;
  private progressFill: HTMLElement;
  private levelNumElement: HTMLElement;
  private resetButton: HTMLElement;
  private levelUpElement: HTMLElement;

  constructor() {
    this.scoreElement = document.getElementById('score')!;
    this.highScoreElement = document.getElementById('high-score')!;
    this.progressFill = document.getElementById('progress-fill')!;
    this.levelNumElement = document.getElementById('level-num')!;
    this.resetButton = document.getElementById('reset-btn')!;
    this.levelUpElement = document.getElementById('level-up')!;

    this.setupEventListeners();
    this.setupEventBusListeners();
  }

  private setupEventListeners(): void {
    this.resetButton.addEventListener('click', this.onResetClick.bind(this));
  }

  private setupEventBusListeners(): void {
    eventBus.on('score-updated', this.onScoreUpdated.bind(this));
    eventBus.on('progress-updated', this.onProgressUpdated.bind(this));
    eventBus.on('level-up', this.onLevelUp.bind(this));
  }

  private onScoreUpdated(data: { score: number; highScore: number }): void {
    this.scoreElement.textContent = data.score.toString();
    this.highScoreElement.textContent = data.highScore.toString();

    this.scoreElement.style.transform = 'scale(1.2)';
    setTimeout(() => {
      this.scoreElement.style.transform = 'scale(1)';
    }, 150);
  }

  private onProgressUpdated(data: { progress: number; level: number }): void {
    const percentage = Math.min(100, data.progress * 100);
    this.progressFill.style.width = `${percentage}%`;
    this.levelNumElement.textContent = data.level.toString();
  }

  private onLevelUp(_data: LevelUpData): void {
    const app = document.getElementById('app');
    if (app) {
      setTimeout(() => {
        app.classList.add('level-2');
      }, 100);
    }

    this.levelUpElement.classList.remove('show');
    void this.levelUpElement.offsetWidth;
    this.levelUpElement.classList.add('show');
  }

  private onResetClick(): void {
    const app = document.getElementById('app');
    if (app) {
      app.classList.remove('level-2');
    }
    eventBus.emit('game-reset');
  }

  public setInitialState(score: number, highScore: number, level: number): void {
    this.scoreElement.textContent = score.toString();
    this.highScoreElement.textContent = highScore.toString();
    this.levelNumElement.textContent = level.toString();
    this.progressFill.style.width = '0%';
  }

  public dispose(): void {
    this.resetButton.removeEventListener('click', this.onResetClick.bind(this));
  }
}
