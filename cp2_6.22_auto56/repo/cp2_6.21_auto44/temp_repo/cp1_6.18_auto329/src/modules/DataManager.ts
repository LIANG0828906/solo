export interface GameState {
  score: number;
  lives: number;
  maxLives: number;
  shield: number;
  maxShield: number;
  weaponLevel: number;
  maxWeaponLevel: number;
  fragmentCount: number;
  safeZoneRadius: number;
  initialSafeZoneRadius: number;
  minSafeZoneRadius: number;
  gameTime: number;
  isBossActive: boolean;
  isGameOver: boolean;
  shieldFlashTime: number;
}

export class DataManager {
  private state: GameState;
  private listeners: Set<() => void> = new Set();

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): GameState {
    return {
      score: 0,
      lives: 100,
      maxLives: 100,
      shield: 20,
      maxShield: 20,
      weaponLevel: 0,
      maxWeaponLevel: 3,
      fragmentCount: 0,
      safeZoneRadius: 400,
      initialSafeZoneRadius: 400,
      minSafeZoneRadius: 50,
      gameTime: 0,
      isBossActive: false,
      isGameOver: false,
      shieldFlashTime: 0
    };
  }

  public getState(): Readonly<GameState> {
    return this.state;
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach(l => l());
  }

  public reset(): void {
    this.state = this.createInitialState();
    this.notify();
  }

  public addScore(points: number): void {
    this.state.score += points;
    this.notify();
  }

  public takeDamage(amount: number): void {
    if (this.state.shield > 0) {
      const shieldDamage = Math.min(this.state.shield, amount);
      this.state.shield -= shieldDamage;
      amount -= shieldDamage;
      this.state.shieldFlashTime = 0.2;
    }
    if (amount > 0) {
      this.state.lives = Math.max(0, this.state.lives - amount);
      if (this.state.lives <= 0) {
        this.state.isGameOver = true;
      }
    }
    this.notify();
  }

  public pickupFragment(count: number = 1): void {
    for (let i = 0; i < count; i++) {
      this.state.fragmentCount++;

      if (this.state.fragmentCount % 2 === 0) {
        this.state.shield = Math.min(this.state.maxShield, this.state.shield + 5);
      }

      if (this.state.fragmentCount % 4 === 0 && this.state.weaponLevel < this.state.maxWeaponLevel) {
        this.state.weaponLevel++;
      }
    }
    this.notify();
  }

  public updateGameTime(delta: number): void {
    this.state.gameTime += delta / 1000;

    if (!this.state.isBossActive) {
      const shrinkRate = 5 / 2;
      this.state.safeZoneRadius = Math.max(
        this.state.minSafeZoneRadius,
        this.state.safeZoneRadius - shrinkRate * (delta / 1000)
      );
      if (this.state.safeZoneRadius <= this.state.minSafeZoneRadius) {
        this.state.isBossActive = true;
      }
    }

    if (this.state.shieldFlashTime > 0) {
      this.state.shieldFlashTime = Math.max(0, this.state.shieldFlashTime - delta / 1000);
    }

    this.notify();
  }

  public getBulletSize(): number {
    return 5 + this.state.weaponLevel * 2;
  }

  public getFireRate(): number {
    return Math.max(0.05, 0.15 - this.state.weaponLevel * 0.02);
  }

  public getEnemyRatio(): { normal: number; tracker: number; heavy: number } {
    const time = this.state.gameTime;
    if (time < 30) {
      return { normal: 5, tracker: 3, heavy: 2 };
    } else if (time < 60) {
      return { normal: 3, tracker: 4, heavy: 3 };
    } else {
      return { normal: 2, tracker: 3, heavy: 5 };
    }
  }
}
