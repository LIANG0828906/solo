import type { SeedType } from '../types';

export function romanNumeral(num: number): string {
  const romanMap: [number, string][] = [
    [10, 'X'],
    [9, 'IX'],
    [5, 'V'],
    [4, 'IV'],
    [1, 'I'],
  ];

  let result = '';
  let remaining = Math.max(1, Math.min(10, num));

  for (const [value, symbol] of romanMap) {
    while (remaining >= value) {
      result += symbol;
      remaining -= value;
    }
  }

  return result;
}

export function getSeedColor(type: SeedType): string {
  const colors: Record<SeedType, string> = {
    normal: '#6B8E23',
    rare: '#4169E1',
    magic: '#9932CC',
  };
  return colors[type];
}

export function getCropValue(type: SeedType): number {
  const values: Record<SeedType, number> = {
    normal: 10,
    rare: 25,
    magic: 50,
  };
  return values[type];
}

export function generateParticleColors(seedType: SeedType): string[] {
  const baseColor = getSeedColor(seedType);
  const colors: string[] = [baseColor];

  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  const lighter = `rgb(${Math.min(255, r + 40)}, ${Math.min(255, g + 40)}, ${Math.min(255, b + 40)})`;
  const darker = `rgb(${Math.max(0, r - 30)}, ${Math.max(0, g - 30)}, ${Math.max(0, b - 30)})`;

  colors.push(lighter, darker);
  return colors;
}
