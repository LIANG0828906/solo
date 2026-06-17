import { GameState } from '../types';

export class ScoringEngine {
  private state: GameState;

  constructor(state: GameState) {
    this.state = state;
  }

  addStarPoints(basePoints: number): number {
    let points = basePoints;
    
    if (this.state.comboBonusActive) {
      points *= 2;
    }

    this.state.score += points;
    this.state.combo++;
    
    if (this.state.combo > this.state.maxCombo) {
      this.state.maxCombo = this.state.combo;
    }

    if (this.state.combo >= 3 && !this.state.comboBonusActive) {
      this.state.comboBonusActive = true;
      this.state.comboBonusTimer = 5000;
    }

    const newLevel = Math.floor(this.state.score / 100) + 1;
    if (newLevel > this.state.level) {
      this.levelUp(newLevel);
    }

    return points;
  }

  addMeteorPenalty(points: number): void {
    this.state.score -= points;
    this.state.combo = 0;
    this.state.comboBonusActive = false;
    this.state.comboBonusTimer = 0;
  }

  private levelUp(newLevel: number): void {
    const levelDiff = newLevel - this.state.level;
    this.state.level = newLevel;
    this.state.trackSpeed += levelDiff * 1;
  }

  update(deltaTime: number): void {
    if (this.state.comboBonusActive) {
      this.state.comboBonusTimer -= deltaTime;
      if (this.state.comboBonusTimer <= 0) {
        this.state.comboBonusActive = false;
        this.state.comboBonusTimer = 0;
      }
    }

    this.state.throwRecoveryTimer += deltaTime;
    if (this.state.throwRecoveryTimer >= 30000 && this.state.throwCount < this.state.maxThrows) {
      this.state.throwCount++;
      this.state.throwRecoveryTimer = 0;
    }
  }

  canThrow(): boolean {
    return this.state.throwCount > 0;
  }

  useThrow(): void {
    if (this.state.throwCount > 0) {
      this.state.throwCount--;
    }
  }

  recoverThrow(): void {
    if (this.state.throwCount < this.state.maxThrows) {
      this.state.throwCount++;
    }
  }

  checkGameOver(boomerangFlying: boolean): boolean {
    if (this.state.score < -10) {
      this.state.gameOver = true;
      return true;
    }
    if (this.state.throwCount <= 0 && !boomerangFlying) {
      this.state.gameOver = true;
      return true;
    }
    return false;
  }

  triggerScreenShake(duration: number = 300): void {
    this.state.screenShakeDuration = duration;
    this.state.screenShake = 1;
  }

  updateScreenShake(deltaTime: number): void {
    if (this.state.screenShakeDuration > 0) {
      this.state.screenShakeDuration -= deltaTime;
      if (this.state.screenShakeDuration <= 0) {
        this.state.screenShake = 0;
      } else {
        this.state.screenShake = this.state.screenShakeDuration / 300;
      }
    }
  }

  getState(): GameState {
    return this.state;
  }

  reset(): void {
    this.state.score = 0;
    this.state.level = 1;
    this.state.combo = 0;
    this.state.maxCombo = 0;
    this.state.comboBonusActive = false;
    this.state.comboBonusTimer = 0;
    this.state.throwCount = 3;
    this.state.maxThrows = 5;
    this.state.throwRecoveryTimer = 0;
    this.state.trackSpeed = 5;
    this.state.trackOffset = 0;
    this.state.trackCurvature = 0;
    this.state.curvaturePhase = 0;
    this.state.screenShake = 0;
    this.state.screenShakeDuration = 0;
    this.state.gameOver = false;
    this.state.gameTime = 0;
  }
}
