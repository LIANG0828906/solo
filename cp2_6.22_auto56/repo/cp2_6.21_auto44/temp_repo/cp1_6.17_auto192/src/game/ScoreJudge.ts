import { eventBus } from './EventBus';
import type { Particle } from './types';
import { TARGET_RADIUS } from './types';

export class ScoreJudge {
  private score: number = 0;
  private fusionCount: number = 0;
  private maxRadius: number = 0;
  private won: boolean = false;

  constructor() {
    eventBus.on('particlesFused', (data) => {
      this.onFusion(data.result);
    });

    eventBus.on('particleUpdated', (particles) => {
      this.updateMaxRadius(particles);
    });
  }

  private onFusion(result: Particle): void {
    const sizeScore = Math.round(result.radius * result.radius * 2);
    this.score += sizeScore;
    this.fusionCount += 1;

    this.emitScoreUpdate();
    this.checkWinCondition();
  }

  private updateMaxRadius(particles: Particle[]): void {
    let maxR = 0;
    particles.forEach((p) => {
      if (p.radius > maxR) maxR = p.radius;
    });
    if (maxR !== this.maxRadius) {
      this.maxRadius = maxR;
      this.emitScoreUpdate();
      this.checkWinCondition();
    }
  }

  private emitScoreUpdate(): void {
    const progress = Math.min(1, this.maxRadius / TARGET_RADIUS);
    eventBus.emit('scoreUpdated', {
      score: this.score,
      fusionCount: this.fusionCount,
      progress,
    });
  }

  private checkWinCondition(): void {
    if (!this.won && this.maxRadius >= TARGET_RADIUS) {
      this.won = true;
      eventBus.emit('gameWon', undefined as unknown as void);
    }
  }

  getScore(): number {
    return this.score;
  }

  getFusionCount(): number {
    return this.fusionCount;
  }

  getProgress(): number {
    return Math.min(1, this.maxRadius / TARGET_RADIUS);
  }

  getMaxRadius(): number {
    return this.maxRadius;
  }

  isWon(): boolean {
    return this.won;
  }

  reset(): void {
    this.score = 0;
    this.fusionCount = 0;
    this.maxRadius = 0;
    this.won = false;
    this.emitScoreUpdate();
  }
}

export const scoreJudge = new ScoreJudge();
