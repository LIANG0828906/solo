import cityData from '../data/cityData.json';
import type { BuildingData, BuildingZone } from '../types';
import { MIN_YEAR, MAX_YEAR, MIN_HEIGHT, MAX_HEIGHT } from '../types';

export const getAllBuildings = (): BuildingData[] => {
  return cityData as BuildingData[];
};

export const getBuildingsByYear = (year: number): BuildingData[] => {
  return (cityData as BuildingData[]).filter((b) => b.year <= year);
};

export const getBuildingsByZone = (zone: BuildingZone, year?: number): BuildingData[] => {
  let buildings = (cityData as BuildingData[]).filter((b) => b.zone === zone);
  if (year !== undefined) {
    buildings = buildings.filter((b) => b.year <= year);
  }
  return buildings;
};

export const getHeightScale = (year: number): number => {
  const clampedYear = Math.max(MIN_YEAR, Math.min(MAX_YEAR, year));
  const progress = (clampedYear - MIN_YEAR) / (MAX_YEAR - MIN_YEAR);
  const heightRange = MAX_HEIGHT - MIN_HEIGHT;
  const scaledMax = MIN_HEIGHT + heightRange * progress;
  return scaledMax / MAX_HEIGHT;
};

export const getBuildingHeightAtYear = (building: BuildingData, year: number): number => {
  if (year < building.year) return 0;
  const scale = getHeightScale(year);
  return building.height * scale;
};

export const getBuildingOpacityAtYear = (building: BuildingData, year: number): number => {
  if (year < building.year) return 0;
  return 1;
};

export const getBuildingCountByZone = (year: number): Record<BuildingZone, number> => {
  const buildings = getBuildingsByYear(year);
  const counts: Record<BuildingZone, number> = {
    cbd: 0,
    oldtown: 0,
    waterfront: 0,
    newdistrict: 0,
  };
  buildings.forEach((b) => {
    counts[b.zone]++;
  });
  return counts;
};

export const getHeightDistribution = (year: number, bins: number = 10): number[] => {
  const buildings = getBuildingsByYear(year);
  if (buildings.length === 0) return new Array(bins).fill(0);

  const maxHeight = MAX_HEIGHT;
  const minHeight = 5;
  const binSize = (maxHeight - minHeight) / bins;

  const distribution = new Array(bins).fill(0);
  buildings.forEach((b) => {
    const scaledHeight = b.height * getHeightScale(year);
    const binIndex = Math.min(
      bins - 1,
      Math.max(0, Math.floor((scaledHeight - minHeight) / binSize))
    );
    distribution[binIndex]++;
  });

  return distribution;
};
