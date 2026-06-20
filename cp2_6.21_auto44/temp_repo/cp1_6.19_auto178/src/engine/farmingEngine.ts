import type { Crop, Plot, PlantingPlan } from '../types';
import { eventBus } from '../eventBus';
import { CROPS, PLOTS, FERTILIZER_RECOMMENDATIONS } from '../mockData';

const NUTRIENT_THRESHOLD = 20;

export class FarmingEngine {
  private plots: Plot[];
  private plans: PlantingPlan[];
  private crops: Crop[];

  constructor() {
    this.plots = JSON.parse(JSON.stringify(PLOTS));
    this.plans = [];
    this.crops = CROPS;
  }

  setPlans(plans: PlantingPlan[]): void {
    this.plans = plans;
    this.recalculateAllNutrients();
  }

  getPlans(): PlantingPlan[] {
    return this.plans;
  }

  getPlots(): Plot[] {
    return this.plots;
  }

  getPlot(plotId: string): Plot | undefined {
    return this.plots.find(p => p.id === plotId);
  }

  getCrops(): Crop[] {
    return this.crops;
  }

  getCrop(cropId: string): Crop | undefined {
    return this.crops.find(c => c.id === cropId);
  }

  getPlan(plotId: string, month: number): PlantingPlan | undefined {
    return this.plans.find(p => p.plotId === plotId && p.month === month);
  }

  updatePlanting(plotId: string, month: number, cropId: string | null): void {
    const plan = this.getPlan(plotId, month);
    if (plan) {
      plan.cropId = cropId;
    } else {
      this.plans.push({ plotId, month, cropId });
    }

    this.recalculateAllNutrients();
    this.updateRecommendations(plotId, month);
    this.checkNutrientWarnings();
  }

  private recalculateAllNutrients(): void {
    for (const plot of this.plots) {
      const originalPlot = PLOTS.find(p => p.id === plot.id);
      if (originalPlot) {
        plot.nutrients = { ...originalPlot.nutrients };
      }

      const plotPlans = this.plans
        .filter(p => p.plotId === plot.id && p.cropId)
        .sort((a, b) => a.month - b.month);

      for (const plan of plotPlans) {
        const crop = this.getCrop(plan.cropId!);
        if (crop) {
          plot.nutrients.n = Math.max(0, Math.min(100,
            plot.nutrients.n - crop.nutrientConsumption.n));
          plot.nutrients.p = Math.max(0, Math.min(100,
            plot.nutrients.p - crop.nutrientConsumption.p));
          plot.nutrients.k = Math.max(0, Math.min(100,
            plot.nutrients.k - crop.nutrientConsumption.k));
        }
      }

      eventBus.publish('nutrients:updated', {
        plotId: plot.id,
        nutrients: { ...plot.nutrients },
      });
    }
  }

  private getPreviousCropFamily(plotId: string, month: number): string | null {
    for (let m = month - 1; m >= 1; m--) {
      const plan = this.getPlan(plotId, m);
      if (plan?.cropId) {
        const crop = this.getCrop(plan.cropId);
        if (crop) return crop.family;
      }
    }
    return null;
  }

  private checkCropCompatibility(plotId: string, month: number, crop: Crop): boolean {
    const prevFamily = this.getPreviousCropFamily(plotId, month);
    return prevFamily !== crop.family;
  }

  private calculateCropScore(plotId: string, month: number, crop: Crop): number {
    const plot = this.getPlot(plotId);
    if (!plot) return 0;

    const compatibility = this.checkCropCompatibility(plotId, month, crop) ? 1 : 0;
    if (compatibility === 0) return -1;

    const nBalance = plot.nutrients.n - crop.nutrientConsumption.n;
    const pBalance = plot.nutrients.p - crop.nutrientConsumption.p;
    const kBalance = plot.nutrients.k - crop.nutrientConsumption.k;

    const balanceScore = Math.max(0, nBalance) + Math.max(0, pBalance) + Math.max(0, kBalance);
    const nutrientFit = balanceScore / 300;

    const growthBonus = crop.growthMonths <= 2 ? 0.1 : 0;

    return nutrientFit + growthBonus;
  }

  getRecommendations(plotId: string, month: number): { recommendations: Crop[]; incompatible: string[] } {
    const recommendations: Array<{ crop: Crop; score: number }> = [];
    const incompatible: string[] = [];

    for (const crop of this.crops) {
      const compatible = this.checkCropCompatibility(plotId, month, crop);
      if (!compatible) {
        incompatible.push(crop.id);
        continue;
      }
      const score = this.calculateCropScore(plotId, month, crop);
      if (score > 0) {
        recommendations.push({ crop, score });
      }
    }

    recommendations.sort((a, b) => b.score - a.score);

    return {
      recommendations: recommendations.map(r => r.crop),
      incompatible,
    };
  }

  private updateRecommendations(plotId: string, month: number): void {
    const { recommendations, incompatible } = this.getRecommendations(plotId, month);
    eventBus.publish('recommendation:updated', {
      plotId,
      month,
      recommendations,
      incompatible,
    });
  }

  private checkNutrientWarnings(): void {
    for (const plot of this.plots) {
      (['n', 'p', 'k'] as const).forEach(nutrient => {
        if (plot.nutrients[nutrient] < NUTRIENT_THRESHOLD) {
          eventBus.publish('nutrient:warning', {
            plotId: plot.id,
            nutrient,
            currentValue: plot.nutrients[nutrient],
            threshold: NUTRIENT_THRESHOLD,
            recommendedFertilizer: FERTILIZER_RECOMMENDATIONS[nutrient],
          });
        }
      });
    }
  }

  getTotalNutrientConsumption(plotId: string): { n: number; p: number; k: number } {
    const originalPlot = PLOTS.find(p => p.id === plotId);
    const currentPlot = this.getPlot(plotId);
    if (!originalPlot || !currentPlot) {
      return { n: 0, p: 0, k: 0 };
    }
    return {
      n: originalPlot.nutrients.n - currentPlot.nutrients.n,
      p: originalPlot.nutrients.p - currentPlot.nutrients.p,
      k: originalPlot.nutrients.k - currentPlot.nutrients.k,
    };
  }
}

export const farmingEngine = new FarmingEngine();
