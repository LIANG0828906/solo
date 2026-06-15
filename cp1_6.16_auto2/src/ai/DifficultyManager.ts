export interface DifficultyMetrics {
  playerHealth: number;
  maxPlayerHealth: number;
  killCount: number;
  consecutiveKills: number;
  consecutiveFailures: number;
  levelTime: number;
  currentLevel: number;
  activeEnemies: number;
}

export interface DifficultyConfig {
  level: number;
  spawnInterval: number;
  enemyWeights: Record<string, number>;
}

export class DifficultyManager {
  private currentLevel: number = 1;
  private maxLevel: number = 5;
  private minLevel: number = 1;
  private metrics: DifficultyMetrics;
  private lastKillTime: number = 0;
  private healthThreshold: number = 0;
  private consecutiveKillsForLevelUp: number = 5;
  private healthThresholdForLevelUp: number = 0.8;
  private healthThresholdForLevelDown: number = 0.3;
  private consecutiveFailuresForLevelDown: number = 3;
  private lastHealth: number = 100;
  private onDifficultyChangeCallback: ((level: number) => void) | null = null;

  constructor() {
    this.metrics = {
      playerHealth: 100,
      maxPlayerHealth: 100,
      killCount: 0,
      consecutiveKills: 0,
      consecutiveFailures: 0,
      levelTime: 0,
      currentLevel: 1,
      activeEnemies: 0
    };
  }

  setOnDifficultyChange(callback: (level: number) => void): void {
    this.onDifficultyChangeCallback = callback;
  }

  updateMetrics(partial: Partial<DifficultyMetrics>): void {
    const prevHealth = this.metrics.playerHealth;
    Object.assign(this.metrics, partial);

    if (partial.playerHealth !== undefined) {
      if (partial.playerHealth < prevHealth) {
        this.metrics.consecutiveKills = 0;
        if (partial.playerHealth <= 0) {
          this.metrics.consecutiveFailures++;
        }
      }
      this.lastHealth = partial.playerHealth;
    }

    this.evaluateDifficulty();
  }

  recordKill(): void {
    this.metrics.killCount++;
    this.metrics.consecutiveKills++;
    this.metrics.consecutiveFailures = 0;
    this.lastKillTime = Date.now();
    this.evaluateDifficulty();
  }

  recordPlayerHit(): void {
    this.metrics.consecutiveKills = 0;
  }

  private evaluateDifficulty(): void {
    const healthRatio = this.metrics.playerHealth / this.metrics.maxPlayerHealth;
    let levelChanged = false;
    const oldLevel = this.currentLevel;

    if (
      this.metrics.consecutiveKills >= this.consecutiveKillsForLevelUp &&
      healthRatio >= this.healthThresholdForLevelUp &&
      this.currentLevel < this.maxLevel
    ) {
      this.currentLevel++;
      this.metrics.consecutiveKills = 0;
      levelChanged = true;
    }

    if (
      (healthRatio <= this.healthThresholdForLevelDown ||
        this.metrics.consecutiveFailures >= this.consecutiveFailuresForLevelDown) &&
      this.currentLevel > this.minLevel
    ) {
      this.currentLevel--;
      this.metrics.consecutiveFailures = 0;
      this.metrics.consecutiveKills = 0;
      levelChanged = true;
    }

    this.metrics.currentLevel = this.currentLevel;

    if (levelChanged && this.onDifficultyChangeCallback) {
      this.onDifficultyChangeCallback(this.currentLevel);
    }
  }

  getDifficultyConfig(): DifficultyConfig {
    const spawnInterval = Phaser.Math.Clamp(
      2000 - (this.currentLevel - 1) * 375,
      500,
      2000
    );

    const enemyWeights = this.calculateEnemyWeights();

    return {
      level: this.currentLevel,
      spawnInterval,
      enemyWeights
    };
  }

  private calculateEnemyWeights(): Record<string, number> {
    const baseWeights: Record<string, number> = {
      melee: 60,
      ranged: 30,
      explosive: 10
    };

    const levelMultiplier = (this.currentLevel - 1) * 0.15;

    baseWeights.melee = Math.max(30, baseWeights.melee - this.currentLevel * 4);
    baseWeights.explosive = Math.min(40, baseWeights.explosive + this.currentLevel * 6);
    baseWeights.ranged = 100 - baseWeights.melee - baseWeights.explosive;

    return baseWeights;
  }

  getCurrentLevel(): number {
    return this.currentLevel;
  }

  getMetrics(): DifficultyMetrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.currentLevel = 1;
    this.metrics = {
      playerHealth: 100,
      maxPlayerHealth: 100,
      killCount: 0,
      consecutiveKills: 0,
      consecutiveFailures: 0,
      levelTime: 0,
      currentLevel: 1,
      activeEnemies: 0
    };
  }
}
