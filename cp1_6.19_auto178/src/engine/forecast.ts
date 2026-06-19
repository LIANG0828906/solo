import type { ForecastResult, YieldHistory, PlantingPlan } from '../types';
import { eventBus } from '../eventBus';
import { YIELD_HISTORY, CROPS } from '../mockData';

const CONFIDENCE_INTERVAL = 0.15;
const FORECAST_MONTHS = 3;

function linearRegression(data: Array<{ x: number; y: number }>): { slope: number; intercept: number } {
  const n = data.length;
  if (n === 0) return { slope: 0, intercept: 0 };

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (const point of data) {
    sumX += point.x;
    sumY += point.y;
    sumXY += point.x * point.y;
    sumXX += point.x * point.x;
  }

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

export class YieldForecaster {
  private history: YieldHistory[];
  private plans: PlantingPlan[];

  constructor() {
    this.history = YIELD_HISTORY;
    this.plans = [];
  }

  setPlans(plans: PlantingPlan[]): void {
    this.plans = plans;
  }

  private getHistoricalYields(plotId: string, cropId: string, month: number): number[] {
    return this.history
      .filter(h => h.plotId === plotId && h.cropId === cropId && h.month === month)
      .map(h => h.yield)
      .sort((a, b) => a - b);
  }

  forecastPlot(plotId: string, startMonth: number): ForecastResult[] {
    const results: ForecastResult[] = [];
    const plotPlans = this.plans.filter(p => p.plotId === plotId && p.cropId);

    for (let i = 0; i < FORECAST_MONTHS; i++) {
      const month = ((startMonth - 1 + i) % 12) + 1;
      const plan = plotPlans.find(p => p.month === month);

      if (plan?.cropId) {
        const crop = CROPS.find(c => c.id === plan.cropId);
        if (crop) {
          const historical = this.getHistoricalYields(plotId, plan.cropId, month);
          let estimated: number;

          if (historical.length >= 2) {
            const dataPoints = historical.map((y, idx) => ({ x: idx, y }));
            const { slope, intercept } = linearRegression(dataPoints);
            estimated = Math.round(intercept + slope * (historical.length));
          } else {
            estimated = crop.baseYield;
          }

          estimated = Math.max(0, estimated);

          results.push({
            month,
            cropId: plan.cropId,
            estimatedYield: estimated,
            confidenceLower: Math.round(estimated * (1 - CONFIDENCE_INTERVAL)),
            confidenceUpper: Math.round(estimated * (1 + CONFIDENCE_INTERVAL)),
          });
        }
      }
    }

    return results;
  }

  forecastAll(startMonth: number): ForecastResult[] {
    const allResults: ForecastResult[] = [];
    const plotIds = [...new Set(this.plans.map(p => p.plotId))];

    for (const plotId of plotIds) {
      const plotResults = this.forecastPlot(plotId, startMonth);
      allResults.push(...plotResults);
    }

    return allResults;
  }

  getAnnualForecastByCrop(): Array<{
    month: number;
    [key: string]: number | string;
  }> {
    const monthlyData: Map<number, Record<string, number>> = new Map();
    const cropIds = [...new Set(this.plans.filter(p => p.cropId).map(p => p.cropId!))];

    for (let month = 1; month <= 12; month++) {
      const data: Record<string, number> = {};
      for (const cropId of cropIds) {
        const totalYield = this.plans
          .filter(p => p.month === month && p.cropId === cropId)
          .reduce((sum, plan) => {
            const historical = this.getHistoricalYields(plan.plotId, cropId, month);
            const avg = historical.length > 0
              ? historical.reduce((a, b) => a + b, 0) / historical.length
              : 0;
            return sum + avg;
          }, 0);
        data[cropId] = Math.round(totalYield);
      }
      monthlyData.set(month, data);
    }

    return Array.from(monthlyData.entries()).map(([month, data]) => ({
      month,
      ...data,
    }));
  }

  triggerForecastUpdate(): void {
    const forecasts = this.forecastAll(1);
    eventBus.publish('yield:updated', { forecasts });
  }
}

export const yieldForecaster = new YieldForecaster();
