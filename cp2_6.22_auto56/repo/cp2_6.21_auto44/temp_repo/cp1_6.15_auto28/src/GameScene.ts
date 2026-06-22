import { OrderManager } from './OrderManager';
import { UIManager } from './UIManager';
import { SoundManager } from './SoundManager';
import { DishInstance, Order, GameState, LevelConfig } from './types';
import { LEVELS } from './config';

export class GameScene {
  private orderManager: OrderManager;
  private uiManager: UIManager;
  private soundManager: SoundManager;
  private currentLevel: number = 1;
  private levelStartTime: number = 0;
  private levelDuration: number = 60000;
  private isLevelComplete: boolean = false;
  private lastActiveOrderId: string | null = null;
  private lastDishIndex: number = -1;
  private lastStepIndex: number = -1;

  constructor(orderManager: OrderManager, uiManager: UIManager, soundManager: SoundManager) {
    this.orderManager = orderManager;
    this.uiManager = uiManager;
    this.soundManager = soundManager;
    this.setupCallbacks();
  }

  private setupCallbacks(): void {
    this.uiManager.onStartGame = (level: number) => this.startGame(level);
    this.uiManager.onStepComplete = (quality) => this.handleStepComplete(quality);
    this.uiManager.onNextLevel = () => this.goToNextLevel();
    this.uiManager.onRestart = () => this.restartGame();
    this.uiManager.onBackToMenu = () => this.backToMenu();

    this.orderManager.subscribe(() => this.onOrderManagerUpdate());
  }

  startGame(level: number): void {
    this.currentLevel = level;
    this.isLevelComplete = false;
    this.levelStartTime = Date.now();
    this.levelDuration = this.calculateLevelDuration(level);
    this.lastActiveOrderId = null;
    this.lastDishIndex = -1;
    this.lastStepIndex = -1;

    this.orderManager.startGame(level);
    this.uiManager.resetForNewGame();
    this.uiManager.showScreen('playing');
    this.updateUI();
  }

  private calculateLevelDuration(level: number): number {
    const baseDuration = 45000;
    const additionalPerLevel = 15000;
    return baseDuration + (level - 1) * additionalPerLevel;
  }

  private handleStepComplete(quality: 'perfect' | 'good' | 'ok' | 'fail'): void {
    this.orderManager.completeCurrentStep(quality);
  }

  private onOrderManagerUpdate(): void {
    this.updateUI();

    const state = this.orderManager.getGameState();
    if (state.isGameOver) {
      this.uiManager.showGameOver(state.score);
    }
  }

  private updateUI(): void {
    const orders = this.orderManager.getOrders();
    const state = this.orderManager.getGameState();
    const level = this.orderManager.getCurrentLevel();

    this.uiManager.updateOrders(orders);
    this.uiManager.updateGameState(state, level);

    const activeOrder = this.orderManager.getActiveOrder();
    if (activeOrder) {
      const currentDish = activeOrder.dishes[activeOrder.currentDishIndex];
      if (currentDish && !currentDish.isCompleted) {
        const currentStep = currentDish.config.steps[currentDish.currentStepIndex];

        const orderChanged = activeOrder.id !== this.lastActiveOrderId;
        const dishChanged = activeOrder.currentDishIndex !== this.lastDishIndex;
        const stepChanged = currentDish.currentStepIndex !== this.lastStepIndex;

        if (orderChanged || dishChanged || stepChanged) {
          this.uiManager.setCurrentStep(currentStep, currentDish);
          this.lastActiveOrderId = activeOrder.id;
          this.lastDishIndex = activeOrder.currentDishIndex;
          this.lastStepIndex = currentDish.currentStepIndex;
        }
      }
    } else {
      if (this.lastActiveOrderId !== null) {
        this.uiManager.setCurrentStep(null, null);
        this.lastActiveOrderId = null;
        this.lastDishIndex = -1;
        this.lastStepIndex = -1;
      }
    }
  }

  update(deltaTime: number, currentTime: number): void {
    if (this.isLevelComplete) return;

    const state = this.orderManager.getGameState();
    if (!state.isPlaying || state.isGameOver) return;

    this.orderManager.update(deltaTime, currentTime);

    const elapsed = Date.now() - this.levelStartTime;
    if (elapsed >= this.levelDuration) {
      this.completeLevel();
    }
  }

  private completeLevel(): void {
    this.isLevelComplete = true;

    const stats = this.orderManager.getLevelStats();
    const state = this.orderManager.getGameState();

    this.uiManager.showLevelComplete({
      score: stats.score,
      perfectRate: stats.perfectRate,
      avgResponseTime: stats.avgResponseTime,
      maxCombo: state.maxCombo,
    });
  }

  private goToNextLevel(): void {
    const nextLevel = this.currentLevel + 1;
    if (nextLevel <= LEVELS.length) {
      this.startGame(nextLevel);
    } else {
      this.backToMenu();
    }
  }

  private restartGame(): void {
    this.startGame(this.currentLevel);
  }

  private backToMenu(): void {
    this.uiManager.showScreen('menu');
  }

  getCurrentLevel(): number {
    return this.currentLevel;
  }
}
