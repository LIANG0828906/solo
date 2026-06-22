import type { MoodEntry, CorrelationResult } from '../types';

function pearson(x: number[], y: number[]): number {
  const n = x.length;
  if (n < 2) return 0;

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const numerator = n * sumXY - sumX * sumY;
  const denominator = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));

  if (denominator === 0) return 0;
  return numerator / denominator;
}

export function calculateCorrelation(moods: MoodEntry[]): CorrelationResult {
  const intensities = moods.map((m) => m.intensity);
  const sleepHours = moods.map((m) => m.sleepHours);
  const exerciseMinutes = moods.map((m) => m.exerciseMinutes);
  const waterCups = moods.map((m) => m.waterCups);

  return {
    sleepHours: Math.round(pearson(sleepHours, intensities) * 100) / 100,
    exerciseMinutes: Math.round(pearson(exerciseMinutes, intensities) * 100) / 100,
    waterCups: Math.round(pearson(waterCups, intensities) * 100) / 100,
  };
}

export function calculateStats(moods: MoodEntry[]): { avg: number; std: number } {
  if (moods.length === 0) return { avg: 0, std: 0 };

  const intensities = moods.map((m) => m.intensity);
  const avg = intensities.reduce((a, b) => a + b, 0) / intensities.length;

  if (intensities.length < 2) return { avg: Math.round(avg * 10) / 10, std: 0 };

  const variance =
    intensities.reduce((sum, val) => sum + (val - avg) * (val - avg), 0) / (intensities.length - 1);
  const std = Math.sqrt(variance);

  return {
    avg: Math.round(avg * 10) / 10,
    std: Math.round(std * 10) / 10,
  };
}
