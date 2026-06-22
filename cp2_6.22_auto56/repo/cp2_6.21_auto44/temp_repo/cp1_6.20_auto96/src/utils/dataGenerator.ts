import { v4 as uuidv4 } from 'uuid';
import {
  GRID_SIZE,
  CABINET_SPACING,
  POWER_MIN,
  POWER_MAX,
  TEMP_MIN,
  TEMP_MAX,
  HISTORY_FRAMES,
  FRAME_INTERVAL,
  ZONE_RANGES,
} from './constants';
import type { CabinetData, FrameData } from '../types';

function randomRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function generateHistory(
  basePower: number,
  baseTemp: number
): FrameData[] {
  const history: FrameData[] = [];
  const now = Date.now();

  for (let i = 0; i < HISTORY_FRAMES; i++) {
    const powerVariation = basePower * 0.15;
    const tempVariation = baseTemp * 0.1;

    history.push({
      timestamp: now - (HISTORY_FRAMES - 1 - i) * FRAME_INTERVAL * 1000,
      power: basePower + randomRange(-powerVariation, powerVariation),
      temperature: baseTemp + randomRange(-tempVariation, tempVariation),
    });
  }

  return history;
}

function getZone(cabinetId: number): 'A' | 'B' | 'C' {
  if (cabinetId >= ZONE_RANGES.A.start && cabinetId <= ZONE_RANGES.A.end) {
    return 'A';
  }
  if (cabinetId >= ZONE_RANGES.B.start && cabinetId <= ZONE_RANGES.B.end) {
    return 'B';
  }
  return 'C';
}

export function generateCabinetData(): CabinetData[] {
  const cabinets: CabinetData[] = [];

  const totalWidth = (GRID_SIZE - 1) * CABINET_SPACING;
  const offsetX = -totalWidth / 2;
  const offsetZ = -totalWidth / 2;

  let cabinetId = 1;

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const basePower = randomRange(POWER_MIN, POWER_MAX);
      const baseTemp = randomRange(TEMP_MIN, TEMP_MAX);

      const x = offsetX + col * CABINET_SPACING;
      const z = offsetZ + row * CABINET_SPACING;

      cabinets.push({
        id: uuidv4(),
        cabinetId,
        x,
        z,
        power: basePower,
        temperature: baseTemp,
        zone: getZone(cabinetId),
        history: generateHistory(basePower, baseTemp),
      });

      cabinetId++;
    }
  }

  return cabinets;
}
