import type { PlantLog } from '../types/index.js';

export interface SmartWaterInput {
  currentInterval: number;
  lastWateredAt?: string;
  waterNowAt: string;
  recentWaterLogs: PlantLog[];
  temperature: number;
  humidity: number;
}

export function calculateSmartInterval(input: SmartWaterInput): number {
  const { currentInterval, lastWateredAt, waterNowAt, recentWaterLogs, temperature, humidity } = input;

  let factor = 1;

  if (lastWateredAt) {
    const last = new Date(lastWateredAt).getTime();
    const now = new Date(waterNowAt).getTime();
    const actualDays = (now - last) / (1000 * 60 * 60 * 24);

    if (actualDays < currentInterval * 0.7) {
      factor *= 1.1;
    } else if (actualDays > currentInterval * 1.3) {
      factor *= 0.9;
    }
  }

  if (recentWaterLogs.length >= 2) {
    const sorted = [...recentWaterLogs].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
    const intervals: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const prev = new Date(sorted[i - 1].createdAt).getTime();
      const curr = new Date(sorted[i].createdAt).getTime();
      intervals.push((curr - prev) / (1000 * 60 * 60 * 24));
    }
    if (intervals.length > 0) {
      const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
      const avgFactor = avgInterval / currentInterval;
      factor *= Math.max(0.85, Math.min(1.15, (avgFactor + 1) / 2));
    }
  }

  if (temperature > 28) {
    factor *= 0.92;
  } else if (temperature < 22) {
    factor *= 1.08;
  }

  if (humidity < 40) {
    factor *= 0.9;
  } else if (humidity > 60) {
    factor *= 1.1;
  }

  factor = Math.max(0.7, Math.min(1.3, factor));
  const newInterval = Math.round(currentInterval * factor);

  return Math.max(1, newInterval);
}

export function getRecentWaterLogs(allLogs: PlantLog[], limit: number = 5): PlantLog[] {
  return allLogs
    .filter((log) => log.type === 'water')
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, limit);
}

export function getCurrentSensorConditions(): { temperature: number; humidity: number } {
  const now = new Date();
  const hour = now.getHours();

  const tempBase = 22 + Math.sin(((hour - 6) / 24) * Math.PI * 2) * 6;
  const humidityBase = 55 - Math.sin(((hour - 6) / 24) * Math.PI * 2) * 15;

  const temperature = +(tempBase + (Math.random() - 0.5) * 2).toFixed(1);
  const humidity = Math.round(humidityBase + (Math.random() - 0.5) * 5);

  return {
    temperature: Math.max(20, Math.min(32, temperature)),
    humidity: Math.max(30, Math.min(70, humidity)),
  };
}
