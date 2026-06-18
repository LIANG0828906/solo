import { IPlantState, GrowthStage, LeafStatus } from './plantState';

export class GrowthEngine {
  public state: IPlantState;
  private accumulatedTime: number = 0;
  private readonly DAY_DURATION: number = 10;
  private readonly MAX_DAYS: number = 15;

  constructor() {
    this.state = this.createInitialState();
  }

  private createInitialState(): IPlantState {
    return {
      stemHeight: 0.5,
      leafCount: 0,
      budState: 0,
      growthDay: 0,
      isWilting: false,
      leafYellowing: false
    };
  }

  public update(deltaTime: number, lightIntensity: number, waterAmount: number): void {
    let growthRate = 0.1 * deltaTime;

    if (lightIntensity < 20) {
      growthRate *= 0.5;
    }

    if (waterAmount > 95) {
      this.state.leafYellowing = true;
      this.state.isWilting = true;
    } else if (waterAmount > 80) {
      growthRate *= 1.15;
    } else {
      this.state.leafYellowing = false;
      this.state.isWilting = false;
    }

    this.accumulatedTime += growthRate;

    if (this.accumulatedTime >= this.DAY_DURATION) {
      this.accumulatedTime -= this.DAY_DURATION;
      this.state.growthDay = Math.min(this.state.growthDay + 1, this.MAX_DAYS);
      this.updateMorphology(waterAmount);
    } else {
      this.updateGradualMorphology(waterAmount);
    }

    if (this.state.growthDay >= this.MAX_DAYS) {
      this.reset();
    }
  }

  private updateMorphology(waterAmount: number): void {
    const day = this.state.growthDay;

    if (day <= 0) {
      this.state.stemHeight = 0.5;
      this.state.leafCount = 0;
      this.state.budState = 0;
    } else if (day <= 3) {
      this.state.stemHeight = 0.5 + (day / 3) * 1.0;
      this.state.leafCount = Math.min(2, Math.ceil((day / 3) * 2));
      this.state.budState = 0;
    } else if (day <= 8) {
      const t = (day - 3) / 5;
      this.state.stemHeight = 1.5 + t * 1.5;
      this.state.leafCount = 2 + Math.min(6, Math.ceil(t * 6));
      this.state.budState = 0;
    } else if (day <= 12) {
      const t = (day - 8) / 4;
      this.state.stemHeight = 3.0 + t * 0.3;
      this.state.leafCount = 8 + Math.min(4, Math.ceil(t * 4));
      if (waterAmount > 80) {
        this.state.budState = Math.min(2, Math.ceil(t * 3));
      } else {
        this.state.budState = Math.min(2, Math.ceil(t * 2.5));
      }
    } else if (day <= 15) {
      const t = (day - 12) / 3;
      this.state.stemHeight = 3.3 - t * 0.3;
      this.state.leafCount = Math.max(0, 12 - Math.floor(t * 6));
      this.state.budState = 3;
    }
  }

  private updateGradualMorphology(waterAmount: number): void {
    const day = this.state.growthDay;
    const progress = this.accumulatedTime / this.DAY_DURATION;
    const effectiveDay = day + progress;

    if (effectiveDay <= 0) {
      this.state.stemHeight = 0.5;
      this.state.leafCount = 0;
      this.state.budState = 0;
    } else if (effectiveDay <= 3) {
      this.state.stemHeight = 0.5 + (effectiveDay / 3) * 1.0;
    } else if (effectiveDay <= 8) {
      const t = (effectiveDay - 3) / 5;
      this.state.stemHeight = 1.5 + t * 1.5;
    } else if (effectiveDay <= 12) {
      const t = (effectiveDay - 8) / 4;
      this.state.stemHeight = 3.0 + t * 0.3;
      if (waterAmount > 80 && this.state.budState < 2) {
        if (t > 0.3 && this.state.budState < 1) this.state.budState = 1;
        if (t > 0.7 && this.state.budState < 2) this.state.budState = 2;
      }
    } else if (effectiveDay <= 15) {
      const t = (effectiveDay - 12) / 3;
      this.state.stemHeight = 3.3 - t * 0.3;
      this.state.budState = 3;
    }
  }

  public advanceDay(): void {
    if (this.state.growthDay < this.MAX_DAYS) {
      this.state.growthDay = Math.min(this.state.growthDay + 1, this.MAX_DAYS);
      const waterAmount = 50;
      this.updateMorphology(waterAmount);
      if (this.state.growthDay >= this.MAX_DAYS) {
        this.reset();
      }
    }
  }

  public reset(): void {
    this.state = this.createInitialState();
    this.accumulatedTime = 0;
  }

  public getGrowthStage(): GrowthStage {
    const day = this.state.growthDay;
    if (day <= 0) return GrowthStage.SEED;
    if (day <= 3) return GrowthStage.SEEDLING;
    if (day <= 8) return GrowthStage.ADULT;
    if (day <= 12) return GrowthStage.FLOWERING;
    return GrowthStage.WITHERING;
  }

  public getLeafStatus(lightIntensity: number, waterAmount: number): LeafStatus {
    if (waterAmount > 95) return '水涝';
    if (lightIntensity < 20) return '缺光';
    return '健康';
  }

  public getGrowthProgress(): number {
    return Math.min(this.state.growthDay / this.MAX_DAYS, 1);
  }
}
