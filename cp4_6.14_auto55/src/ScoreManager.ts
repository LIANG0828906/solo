export interface ComboEffect {
  comboCount: number;
  startTime: number;
  duration: number;
}

export class ScoreManager {
  private score = 0;
  private combo = 0;
  private maxCombo = 0;
  private comboThreshold = 5;
  private baseScore = 100;
  private perfectBonus = 50;
  private comboEffects: ComboEffect[] = [];
  private lastComboMilestone = 0;

  public reset(): void {
    this.score = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.lastComboMilestone = 0;
    this.comboEffects = [];
  }

  public onHit(type: 'perfect' | 'good', currentTime: number): void {
    this.score += this.baseScore;
    if (type === 'perfect') {
      this.score += this.perfectBonus;
    }

    this.combo++;
    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    if (this.combo >= this.comboThreshold) {
      const currentMilestone = Math.floor(this.combo / 10);
      if (currentMilestone > this.lastComboMilestone && this.combo % 10 === 0) {
        this.lastComboMilestone = currentMilestone;
        this.comboEffects.push({
          comboCount: this.combo,
          startTime: currentTime,
          duration: 1000
        });
      }
    }
  }

  public onMiss(): void {
    this.combo = 0;
    this.lastComboMilestone = 0;
  }

  public update(currentTime: number): void {
    this.comboEffects = this.comboEffects.filter(effect =>
      currentTime - effect.startTime < effect.duration
    );
  }

  public getScore(): number {
    return this.score;
  }

  public getCombo(): number {
    return this.combo;
  }

  public getMaxCombo(): number {
    return this.maxCombo;
  }

  public getComboEffects(): ComboEffect[] {
    return this.comboEffects;
  }

  public shouldShowCombo(): boolean {
    return this.combo >= this.comboThreshold;
  }

  public addScore(points: number): void {
    this.score += points;
  }
}
