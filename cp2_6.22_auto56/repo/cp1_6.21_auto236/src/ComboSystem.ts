import type { ComboEffectLevel } from './types';

export class ComboSystem {
  private combo: number = 0;
  private maxCombo: number = 0;
  private multiplier: number = 1;
  private lastHitTime: number = 0;
  private comboTimeout: number = 2000;
  private onEffect: ((level: ComboEffectLevel) => void) | null = null;
  private triggeredEffects: Set<number> = new Set();

  private effectThresholds: { combo: number; level: ComboEffectLevel }[] = [
    { combo: 5, level: 'glow' },
    { combo: 10, level: 'flash' },
    { combo: 20, level: 'slowmo' },
    { combo: 50, level: 'burst' },
  ];

  onHit(): { multiplier: number; effects: ComboEffectLevel[] } {
    const now = Date.now();
    this.combo++;
    this.lastHitTime = now;

    if (this.combo > this.maxCombo) {
      this.maxCombo = this.combo;
    }

    this.multiplier = this.calculateMultiplier();

    const effects: ComboEffectLevel[] = [];
    for (const threshold of this.effectThresholds) {
      if (this.combo >= threshold.combo && !this.triggeredEffects.has(threshold.combo)) {
        this.triggeredEffects.add(threshold.combo);
        effects.push(threshold.level);
        if (this.onEffect) {
          this.onEffect(threshold.level);
        }
      }
    }

    return { multiplier: this.multiplier, effects };
  }

  onMiss(): void {
    this.combo = 0;
    this.multiplier = 1;
    this.triggeredEffects.clear();
  }

  getCombo(): number {
    return this.combo;
  }

  getMaxCombo(): number {
    return this.maxCombo;
  }

  getMultiplier(): number {
    return this.multiplier;
  }

  setOnEffect(callback: (level: ComboEffectLevel) => void): void {
    this.onEffect = callback;
  }

  reset(): void {
    this.combo = 0;
    this.maxCombo = 0;
    this.multiplier = 1;
    this.triggeredEffects.clear();
    this.lastHitTime = 0;
  }

  private calculateMultiplier(): number {
    if (this.combo >= 50) return 4;
    if (this.combo >= 20) return 3;
    if (this.combo >= 10) return 2;
    if (this.combo >= 5) return 1.5;
    return 1;
  }
}
