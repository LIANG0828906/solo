export interface ScoreState {
  score: number;
  lives: number;
  level: number;
  combo: number;
}

export class ScoreManager {
  private score: number = 0;
  private lives: number = 3;
  private level: number = 1;
  private combo: number = 0;
  private maxLives: number = 3;

  private scorePerBrick: number = 10;
  private comboBonus: number = 5;

  private onScoreChange: ((state: ScoreState) => void) | null = null;
  private onLivesChange: ((state: ScoreState) => void) | null = null;
  private onLevelChange: ((state: ScoreState) => void) | null = null;
  private onGameOver: (() => void) | null = null;
  private onLevelComplete: (() => void) | null = null;

  constructor() {
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.combo = 0;
  }

  public addScore(isCombo: boolean = false): void {
    if (isCombo) {
      this.combo++;
    } else {
      this.combo = 1;
    }

    const points = this.scorePerBrick + (this.combo > 1 ? this.comboBonus : 0);
    this.score += points;

    if (this.onScoreChange) {
      this.onScoreChange(this.getState());
    }
  }

  public resetCombo(): void {
    this.combo = 0;
  }

  public loseLife(): boolean {
    this.lives--;
    this.combo = 0;

    if (this.onLivesChange) {
      this.onLivesChange(this.getState());
    }

    if (this.lives <= 0) {
      if (this.onGameOver) {
        this.onGameOver();
      }
      return true;
    }
    return false;
  }

  public nextLevel(): void {
    this.level++;
    this.combo = 0;

    if (this.onLevelChange) {
      this.onLevelChange(this.getState());
    }

    if (this.onLevelComplete) {
      this.onLevelComplete();
    }
  }

  public getScore(): number {
    return this.score;
  }

  public getLives(): number {
    return this.lives;
  }

  public getLevel(): number {
    return this.level;
  }

  public getCombo(): number {
    return this.combo;
  }

  public getState(): ScoreState {
    return {
      score: this.score,
      lives: this.lives,
      level: this.level,
      combo: this.combo,
    };
  }

  public reset(): void {
    this.score = 0;
    this.lives = this.maxLives;
    this.level = 1;
    this.combo = 0;
  }

  public setOnScoreChange(callback: (state: ScoreState) => void): void {
    this.onScoreChange = callback;
  }

  public setOnLivesChange(callback: (state: ScoreState) => void): void {
    this.onLivesChange = callback;
  }

  public setOnLevelChange(callback: (state: ScoreState) => void): void {
    this.onLevelChange = callback;
  }

  public setOnGameOver(callback: () => void): void {
    this.onGameOver = callback;
  }

  public setOnLevelComplete(callback: () => void): void {
    this.onLevelComplete = callback;
  }
}
