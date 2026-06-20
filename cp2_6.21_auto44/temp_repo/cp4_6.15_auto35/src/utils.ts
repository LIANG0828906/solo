import type { WineType, CurvePoint } from './types';

export function generateAgingCurve(type: WineType, vintage: number, baseRating: number): CurvePoint[] {
  const points: CurvePoint[] = [];

  for (let age = 0; age <= 20; age++) {
    let score = baseRating;

    if (type === 'red') {
      score = age <= 10
        ? baseRating + (age / 10) * 8
        : baseRating + 8 - ((age - 10) / 10) * 10;
    } else if (type === 'white') {
      score = age <= 5
        ? baseRating + (age / 5) * 5
        : baseRating + 5 - ((age - 5) / 10) * 12;
    } else if (type === 'sparkling') {
      score = age <= 3
        ? baseRating + 2
        : baseRating + 2 - ((age - 3) / 10) * 15;
    } else {
      score = age <= 8
        ? baseRating + (age / 8) * 6
        : baseRating + 6 - ((age - 8) / 15) * 10;
    }

    points.push({
      year: vintage + age,
      rating: Math.max(60, Math.min(100, Math.round(score * 10) / 10)),
    });
  }

  return points;
}

export function formatCurrency(value: number): string {
  return `¥${value.toLocaleString('zh-CN')}`;
}

export function wineTypeLabel(type: WineType): string {
  const map: Record<WineType, string> = {
    red: '红葡萄酒',
    white: '白葡萄酒',
    sparkling: '起泡酒',
    sweet: '甜酒',
  };
  return map[type];
}
