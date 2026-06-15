import { eventBus, EVENTS } from './eventBus';

export interface WindDataPoint {
  longitude: number;
  latitude: number;
  windDirection: number;
  windSpeed: number;
  temperature: number;
}

export interface WindDataset {
  altitude: number;
  points: WindDataPoint[];
}

class DataManager {
  private datasets: Map<number, WindDataset> = new Map();
  private particleCount: number = 5000;

  constructor() {
    this.generateAllData();
  }

  private generateAllData(): void {
    const altitudes = [1000, 5000];
    altitudes.forEach((alt) => {
      this.datasets.set(alt, this.generateWindData(alt));
    });
  }

  private generateWindData(altitude: number): WindDataset {
    const points: WindDataPoint[] = [];

    for (let i = 0; i < this.particleCount; i++) {
      const longitude = (Math.random() * 360 - 180) * (Math.PI / 180);
      const latitude = (Math.random() * 180 - 90) * (Math.PI / 180);

      const latFactor = Math.cos(latitude);
      const baseWindSpeed = altitude === 1000 ? 8 : 20;
      const windSpeedVariation = Math.random() * (altitude === 1000 ? 6 : 15);
      const windSpeed = baseWindSpeed + windSpeedVariation;

      const prevailingWind = Math.sin(latitude * 3) * 0.5 + Math.random() * 0.3;
      const windDirection = prevailingWind * Math.PI * 2;

      const baseTemp = altitude === 1000 ? 15 : -5;
      const latTempEffect = Math.cos(latitude) * 20;
      const randomTemp = (Math.random() - 0.5) * 10;
      const temperature = baseTemp + latTempEffect + randomTemp;

      points.push({
        longitude,
        latitude,
        windDirection,
        windSpeed,
        temperature,
      });
    }

    return { altitude, points };
  }

  getWindData(altitude: number): WindDataset | undefined {
    return this.datasets.get(altitude);
  }

  getAvailableAltitudes(): number[] {
    return Array.from(this.datasets.keys()).sort((a, b) => a - b);
  }

  getStats(altitude: number): { avgWindSpeed: number; maxTemperature: number } | null {
    const dataset = this.datasets.get(altitude);
    if (!dataset) return null;

    const totalSpeed = dataset.points.reduce((sum, p) => sum + p.windSpeed, 0);
    const maxTemp = dataset.points.reduce((max, p) => Math.max(max, p.temperature), -Infinity);

    return {
      avgWindSpeed: totalSpeed / dataset.points.length,
      maxTemperature: maxTemp,
    };
  }

  updateData(): void {
    this.datasets.forEach((dataset, altitude) => {
      dataset.points.forEach((point) => {
        point.windDirection += (Math.random() - 0.5) * 0.02;
        point.windSpeed = Math.max(1, point.windSpeed + (Math.random() - 0.5) * 0.5);
        point.temperature += (Math.random() - 0.5) * 0.3;
      });
      eventBus.emit(EVENTS.WIND_DATA_UPDATED, altitude, dataset);
    });
  }

  getParticleCount(): number {
    return this.particleCount;
  }
}

export const dataManager = new DataManager();
