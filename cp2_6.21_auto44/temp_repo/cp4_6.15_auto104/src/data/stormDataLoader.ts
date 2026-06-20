import stormRecords from './stormRecords.json';
import type { StormRecord, FilterState } from './types';

const allStorms: StormRecord[] = stormRecords as StormRecord[];

export function getAllStorms(): StormRecord[] {
  return allStorms;
}

export function getStormById(id: string): StormRecord | undefined {
  return allStorms.find(s => s.id === id);
}

export function filterStorms(filters: FilterState): StormRecord[] {
  const { yearRange, category, basin } = filters;
  const [startYear, endYear] = yearRange;

  return allStorms.filter(storm => {
    if (storm.year < startYear || storm.year > endYear) return false;
    if (category !== null && storm.category !== category) return false;
    if (basin !== null && storm.basin !== basin) return false;
    return true;
  });
}

export function getStormFrequencyByYear(storms: StormRecord[]): Map<number, number> {
  const freq = new Map<number, number>();
  for (const storm of storms) {
    freq.set(storm.year, (freq.get(storm.year) || 0) + 1);
  }
  return freq;
}

export function getYearRange(): [number, number] {
  if (allStorms.length === 0) return [1900, 2024];
  const years = allStorms.map(s => s.year);
  return [Math.min(...years), Math.max(...years)];
}
