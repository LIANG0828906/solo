import { TemperatureData, BASE_YEAR, END_YEAR, MIN_ALPHA, MAX_ALPHA, ALPHA_PEAK_YEAR } from '@/types';
import { emissionSources } from '@/data/emissionSources';

const calculateTemperatureIncrement = (year: number): number => {
  const yearsElapsed = year - BASE_YEAR;
  const baseIncrement = 0.015 * yearsElapsed;
  const acceleration = 0.00008 * yearsElapsed * yearsElapsed;
  return Math.round((baseIncrement + acceleration) * 100) / 100;
};

const generateSourceContributions = (year: number) => {
  const yearsElapsed = year - BASE_YEAR;
  const growthFactors = emissionSources.map((source, index) => {
    const baseGrowth = 1 + 0.003 * yearsElapsed;
    const sectorFactor = source.sector === '能源' ? 1.02 : source.sector === '工业' ? 1.015 : 1.01;
    const randomFactor = 0.98 + (index % 3) * 0.02;
    return baseGrowth * sectorFactor * randomFactor;
  });

  const totalContribution = growthFactors.reduce((sum, f, i) => sum + emissionSources[i].contribution * f, 0);
  
  return emissionSources.map((source, index) => ({
    sourceId: source.id,
    contribution: Math.round((source.contribution * growthFactors[index] / totalContribution) * 10000) / 10000,
  }));
};

export const generateTemperatureData = (): Record<number, TemperatureData> => {
  const data: Record<number, TemperatureData> = {};
  
  for (let year = BASE_YEAR; year <= END_YEAR; year++) {
    data[year] = {
      year,
      increment: calculateTemperatureIncrement(year),
      sourceContributions: generateSourceContributions(year),
    };
  }
  
  return data;
};

export const calculateAlphaForYear = (year: number): number => {
  if (year <= ALPHA_PEAK_YEAR) {
    const progress = (year - BASE_YEAR) / (ALPHA_PEAK_YEAR - BASE_YEAR);
    return MIN_ALPHA + progress * (MAX_ALPHA - MIN_ALPHA);
  }
  return MAX_ALPHA;
};

export const interpolateColor = (color1: string, color2: string, t: number): string => {
  const hex = (x: string) => parseInt(x, 16);
  const r1 = hex(color1.slice(1, 3));
  const g1 = hex(color1.slice(3, 5));
  const b1 = hex(color1.slice(5, 7));
  const r2 = hex(color2.slice(1, 3));
  const g2 = hex(color2.slice(3, 5));
  const b2 = hex(color2.slice(5, 7));
  
  const r = Math.round(r1 + (r2 - r1) * t);
  const g = Math.round(g1 + (g2 - g1) * t);
  const b = Math.round(b1 + (b2 - b1) * t);
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
};

export const generateTemperatureGradient = (steps: number): string[] => {
  const colors: string[] = [];
  for (let i = 0; i < steps; i++) {
    colors.push(interpolateColor('#1B4F72', '#E74C3C', i / (steps - 1)));
  }
  return colors;
};
