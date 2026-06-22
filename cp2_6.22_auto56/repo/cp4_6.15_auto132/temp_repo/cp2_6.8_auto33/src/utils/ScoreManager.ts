import Phaser from 'phaser';

export interface ScoreUpdatedEvent {
  score: number;
  combo: number;
  pointsGained: number;
}

export class ScoreManager {
  private scene: Phaser.Scene;
  private score: number = 0;
  private combo: number = 0;
  private comboTimer: Phaser.Time.TimerEvent | null = null;
  private comboTimeout: number = 2000;
  public onScoreUpdated: Phaser.Events.EventEmitter;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.onScoreUpdated = new Phaser.Events.EventEmitter();
  }

  addBrickScore(): number {
    this.combo++;
    const points = this.combo === 1 ? 10 : 10 * Math.pow(2, this.combo - 1);
    this.score += points;

    this.resetComboTimer();
    this.onScoreUpdated.emit('update', {
      score: this.score,
      combo: this.combo,
      pointsGained: points
    } as ScoreUpdatedEvent);

    return points;
  }

  private resetComboTimer(): void {
    if (this.comboTimer) {
      this.comboTimer.remove();
    }
    this.comboTimer = this.scene.time.delayedCall(this.comboTimeout, () => {
      this.combo = 0;
      this.onScoreUpdated.emit('comboReset');
    });
  }

  getScore(): number {
    return this.score;
  }

  getCombo(): number {
    return this.combo;
  }

  reset(): void {
    this.score = 0;
    this.combo = 0;
    if (this.comboTimer) {
      this.comboTimer.remove();
      this.comboTimer = null;
    }
    this.onScoreUpdated.emit('update', {
      score: 0,
      combo: 0,
      pointsGained: 0
    } as ScoreUpdatedEvent);
  }
}
