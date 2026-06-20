import { Order, DishInstance, DishConfig, GameState, LevelConfig } from './types';
import { DISHES, LEVELS, GAME_CONFIG } from './config';

export class OrderManager {
  private orders: Order[] = [];
  private gameState: GameState;
  private currentLevel: LevelConfig;
  private lastOrderTime: number = 0;
  private orderIdCounter: number = 0;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.gameState = {
      score: 0,
      perfectCount: 0,
      totalDishes: 0,
      satisfaction: GAME_CONFIG.initialSatisfaction,
      level: 1,
      isPlaying: false,
      isPaused: false,
      isGameOver: false,
      combo: 0,
      maxCombo: 0,
      totalResponseTime: 0,
      responseCount: 0,
    };
    this.currentLevel = LEVELS[0];
  }

  subscribe(callback: () => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  private notify(): void {
    this.listeners.forEach(cb => cb());
  }

  getOrders(): Order[] {
    return this.orders;
  }

  getGameState(): GameState {
    return { ...this.gameState };
  }

  getCurrentLevel(): LevelConfig {
    return { ...this.currentLevel };
  }

  getActiveOrder(): Order | null {
    return this.orders.find(o => o.status === 'active') || null;
  }

  startGame(level: number = 1): void {
    this.gameState = {
      score: 0,
      perfectCount: 0,
      totalDishes: 0,
      satisfaction: GAME_CONFIG.initialSatisfaction,
      level,
      isPlaying: true,
      isPaused: false,
      isGameOver: false,
      combo: 0,
      maxCombo: 0,
      totalResponseTime: 0,
      responseCount: 0,
    };
    this.currentLevel = LEVELS[Math.min(level - 1, LEVELS.length - 1)];
    this.orders = [];
    this.lastOrderTime = 0;
    this.orderIdCounter = 0;
    this.notify();
  }

  pauseGame(): void {
    this.gameState.isPaused = true;
    this.notify();
  }

  resumeGame(): void {
    this.gameState.isPaused = false;
    this.notify();
  }

  update(deltaTime: number, currentTime: number): void {
    if (!this.gameState.isPlaying || this.gameState.isPaused || this.gameState.isGameOver) {
      return;
    }

    this.gameState.satisfaction -= GAME_CONFIG.satisfactionDecayPerSecond * (deltaTime / 1000);
    this.gameState.satisfaction = Math.max(
      GAME_CONFIG.satisfactionMin,
      Math.min(GAME_CONFIG.satisfactionMax, this.gameState.satisfaction)
    );

    if (this.gameState.satisfaction <= GAME_CONFIG.gameOverSatisfaction) {
      this.gameState.isGameOver = true;
      this.gameState.isPlaying = false;
      this.notify();
      return;
    }

    const pendingOrders = this.orders.filter(o => o.status === 'pending' || o.status === 'active');
    if (pendingOrders.length < this.currentLevel.maxOrders) {
      if (currentTime - this.lastOrderTime >= this.currentLevel.orderInterval) {
        this.generateOrder(currentTime);
        this.lastOrderTime = currentTime;
      }
    }

    let hasActiveOrder = false;
    for (const order of this.orders) {
      if (order.status === 'pending' || order.status === 'active') {
        order.timeRemaining -= deltaTime;
        if (order.status === 'active') {
          hasActiveOrder = true;
        }
        if (order.timeRemaining <= 0) {
          this.failOrder(order);
        }
      }
    }

    if (!hasActiveOrder) {
      const pending = this.orders.find(o => o.status === 'pending');
      if (pending) {
        pending.status = 'active';
      }
    }

    this.notify();
  }

  private generateOrder(currentTime: number): void {
    const [minDishes, maxDishes] = this.currentLevel.dishCount;
    const dishCount = Math.floor(Math.random() * (maxDishes - minDishes + 1)) + minDishes;
    const shuffledDishes = [...DISHES].sort(() => Math.random() - 0.5);
    const selectedDishes = shuffledDishes.slice(0, dishCount);

    const dishes: DishInstance[] = selectedDishes.map(dish => ({
      config: dish,
      currentStepIndex: 0,
      stepsCompleted: dish.steps.map(() => false),
      isCompleted: false,
    }));

    const totalStepDuration = dishes.reduce(
      (sum, d) => sum + d.config.steps.reduce((s, step) => s + step.duration * this.currentLevel.stepsMultiplier, 0),
      0
    );
    const maxTime = totalStepDuration * this.currentLevel.timeMultiplier * 1.5;

    const order: Order = {
      id: `order_${++this.orderIdCounter}`,
      dishes,
      currentDishIndex: 0,
      timeRemaining: maxTime,
      maxTime,
      createdAt: currentTime,
      status: this.orders.length === 0 ? 'active' : 'pending',
      customerId: `customer_${this.orderIdCounter}`,
    };

    this.orders.push(order);
  }

  private failOrder(order: Order): void {
    order.status = 'failed';
    order.timeRemaining = 0;
    this.gameState.satisfaction += GAME_CONFIG.satisfactionOnTimeout;
    this.gameState.satisfaction = Math.max(GAME_CONFIG.satisfactionMin, this.gameState.satisfaction);
    this.gameState.combo = 0;

    const nextPending = this.orders.find(o => o.status === 'pending');
    if (nextPending) {
      nextPending.status = 'active';
    }
  }

  completeCurrentStep(quality: 'perfect' | 'good' | 'ok' | 'fail'): void {
    const activeOrder = this.getActiveOrder();
    if (!activeOrder) return;

    const currentDish = activeOrder.dishes[activeOrder.currentDishIndex];
    if (!currentDish || currentDish.isCompleted) return;

    const currentStep = currentDish.config.steps[currentDish.currentStepIndex];
    if (!currentStep) return;

    if (quality === 'fail') {
      this.gameState.combo = 0;
      this.gameState.satisfaction += GAME_CONFIG.satisfactionOnWrong;
      this.gameState.satisfaction = Math.max(GAME_CONFIG.satisfactionMin, this.gameState.satisfaction);
      this.notify();
      return;
    }

    let scoreMultiplier = GAME_CONFIG.scorePerOk;
    let satisfactionGain = 0;

    if (quality === 'perfect') {
      scoreMultiplier = GAME_CONFIG.scorePerPerfect;
      satisfactionGain = GAME_CONFIG.satisfactionOnPerfect;
      this.gameState.perfectCount++;
    } else if (quality === 'good') {
      scoreMultiplier = GAME_CONFIG.scorePerGood;
      satisfactionGain = GAME_CONFIG.satisfactionOnCorrect;
    }

    this.gameState.combo++;
    this.gameState.maxCombo = Math.max(this.gameState.maxCombo, this.gameState.combo);

    const comboBonus = Math.min(
      1 + this.gameState.combo * GAME_CONFIG.comboBonus,
      GAME_CONFIG.maxComboBonus
    );
    const stepScore = Math.floor(currentDish.config.baseScore / currentDish.config.steps.length * scoreMultiplier * comboBonus);
    this.gameState.score += stepScore;

    this.gameState.satisfaction += satisfactionGain;
    this.gameState.satisfaction = Math.min(GAME_CONFIG.satisfactionMax, this.gameState.satisfaction);

    this.gameState.totalResponseTime += currentStep.duration;
    this.gameState.responseCount++;

    currentDish.stepsCompleted[currentDish.currentStepIndex] = true;
    currentDish.currentStepIndex++;

    if (currentDish.currentStepIndex >= currentDish.config.steps.length) {
      currentDish.isCompleted = true;
      this.gameState.totalDishes++;
      activeOrder.currentDishIndex++;

      if (activeOrder.currentDishIndex >= activeOrder.dishes.length) {
        this.completeOrder(activeOrder);
      }
    }

    this.notify();
  }

  private completeOrder(order: Order): void {
    order.status = 'completed';

    const nextPending = this.orders.find(o => o.status === 'pending');
    if (nextPending) {
      nextPending.status = 'active';
    }
  }

  removeCompletedOrders(): void {
    this.orders = this.orders.filter(o => o.status !== 'completed' && o.status !== 'failed');
  }

  setLevel(level: number): void {
    this.gameState.level = level;
    this.currentLevel = LEVELS[Math.min(level - 1, LEVELS.length - 1)];
    this.notify();
  }

  getLevelStats(): { score: number; perfectRate: number; avgResponseTime: number } {
    const totalSteps = this.gameState.responseCount;
    const perfectRate = totalSteps > 0 ? this.gameState.perfectCount / totalSteps : 0;
    const avgResponseTime = totalSteps > 0 ? this.gameState.totalResponseTime / totalSteps : 0;
    return {
      score: this.gameState.score,
      perfectRate,
      avgResponseTime,
    };
  }
}
