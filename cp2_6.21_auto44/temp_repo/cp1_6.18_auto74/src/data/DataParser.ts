import { v4 as uuidv4 } from 'uuid';
import { datasets, getAllMetas } from './datasets';
import type { WindDataPoint, PressureLayer, DatasetResult, DatasetMeta } from '../shared/types';

export class DataParser {
  static getAvailableDatasets(): DatasetMeta[] {
    return getAllMetas();
  }

  static async parse(key: string): Promise<DatasetResult> {
    await new Promise((resolve) => setTimeout(resolve, 500));

    const raw = datasets[key];
    if (!raw) {
      throw new Error(`Dataset "${key}" not found`);
    }

    const windPoints: WindDataPoint[] = raw.wind.map((entry) => ({
      id: uuidv4(),
      x: entry.x,
      y: entry.y,
      z: entry.z,
      speed: entry.speed,
      direction: entry.direction,
      altitude: entry.altitude,
    }));

    const pressureLayers: PressureLayer[] = raw.pressure.map((entry) => ({
      id: uuidv4(),
      altitude: entry.altitude,
      pressure: entry.pressure,
      points: entry.points.map((p) => ({ x: p.x, y: p.y, z: p.z })),
    }));

    return {
      windPoints,
      pressureLayers,
      meta: raw.meta,
    };
  }
}
