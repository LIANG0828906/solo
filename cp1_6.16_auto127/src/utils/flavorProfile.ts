export type FlavorDimension = '清香' | '醇厚' | '回甘' | '鲜爽' | '陈香' | '花香';

export const FLAVOR_DIMENSIONS: FlavorDimension[] = ['清香', '醇厚', '回甘', '鲜爽', '陈香', '花香'];

export interface TeaVariety {
  id: string;
  name: string;
  color: string;
  defaultFlavor: Record<FlavorDimension, number>;
  tempSensitivity: Record<FlavorDimension, number>;
  timeSensitivity: Record<FlavorDimension, number>;
  optimalTemp: number;
  optimalTime: number;
}

export const TEA_VARIETIES: TeaVariety[] = [
  {
    id: 'longjing',
    name: '龙井',
    color: '#2E8B57',
    defaultFlavor: {
      '清香': 8.5,
      '醇厚': 5.0,
      '回甘': 7.0,
      '鲜爽': 9.0,
      '陈香': 2.0,
      '花香': 4.0
    },
    tempSensitivity: {
      '清香': -0.05,
      '醇厚': 0.08,
      '回甘': -0.03,
      '鲜爽': -0.07,
      '陈香': 0.02,
      '花香': -0.04
    },
    timeSensitivity: {
      '清香': -0.008,
      '醇厚': 0.012,
      '回甘': 0.006,
      '鲜爽': -0.010,
      '陈香': 0.003,
      '花香': -0.005
    },
    optimalTemp: 80,
    optimalTime: 120
  },
  {
    id: 'tieguanyin',
    name: '铁观音',
    color: '#8B6914',
    defaultFlavor: {
      '清香': 6.0,
      '醇厚': 8.0,
      '回甘': 7.5,
      '鲜爽': 5.0,
      '陈香': 4.0,
      '花香': 7.0
    },
    tempSensitivity: {
      '清香': -0.04,
      '醇厚': 0.06,
      '回甘': 0.03,
      '鲜爽': -0.05,
      '陈香': 0.04,
      '花香': -0.02
    },
    timeSensitivity: {
      '清香': -0.006,
      '醇厚': 0.010,
      '回甘': 0.008,
      '鲜爽': -0.007,
      '陈香': 0.005,
      '花香': -0.003
    },
    optimalTemp: 95,
    optimalTime: 60
  },
  {
    id: 'puer',
    name: '普洱',
    color: '#6B4423',
    defaultFlavor: {
      '清香': 3.0,
      '醇厚': 9.5,
      '回甘': 6.0,
      '鲜爽': 2.5,
      '陈香': 9.0,
      '花香': 1.5
    },
    tempSensitivity: {
      '清香': -0.02,
      '醇厚': 0.05,
      '回甘': 0.04,
      '鲜爽': -0.03,
      '陈香': 0.06,
      '花香': -0.01
    },
    timeSensitivity: {
      '清香': -0.003,
      '醇厚': 0.015,
      '回甘': 0.010,
      '鲜爽': -0.004,
      '陈香': 0.008,
      '花香': -0.002
    },
    optimalTemp: 100,
    optimalTime: 180
  },
  {
    id: 'hongcha',
    name: '红茶',
    color: '#B22222',
    defaultFlavor: {
      '清香': 5.0,
      '醇厚': 8.5,
      '回甘': 8.0,
      '鲜爽': 4.0,
      '陈香': 5.0,
      '花香': 6.0
    },
    tempSensitivity: {
      '清香': -0.03,
      '醇厚': 0.07,
      '回甘': 0.05,
      '鲜爽': -0.04,
      '陈香': 0.03,
      '花香': -0.02
    },
    timeSensitivity: {
      '清香': -0.005,
      '醇厚': 0.012,
      '回甘': 0.009,
      '鲜爽': -0.006,
      '陈香': 0.004,
      '花香': -0.003
    },
    optimalTemp: 90,
    optimalTime: 150
  },
  {
    id: 'baicha',
    name: '白茶',
    color: '#C0C0C0',
    defaultFlavor: {
      '清香': 7.5,
      '醇厚': 4.0,
      '回甘': 6.5,
      '鲜爽': 7.0,
      '陈香': 3.0,
      '花香': 8.0
    },
    tempSensitivity: {
      '清香': -0.06,
      '醇厚': 0.05,
      '回甘': -0.02,
      '鲜爽': -0.06,
      '陈香': 0.02,
      '花香': -0.05
    },
    timeSensitivity: {
      '清香': -0.007,
      '醇厚': 0.008,
      '回甘': 0.005,
      '鲜爽': -0.008,
      '陈香': 0.002,
      '花香': -0.006
    },
    optimalTemp: 75,
    optimalTime: 90
  },
  {
    id: 'molihuacha',
    name: '茉莉花茶',
    color: '#F0E68C',
    defaultFlavor: {
      '清香': 9.0,
      '醇厚': 4.5,
      '回甘': 6.0,
      '鲜爽': 7.5,
      '陈香': 1.5,
      '花香': 9.5
    },
    tempSensitivity: {
      '清香': -0.04,
      '醇厚': 0.06,
      '回甘': -0.01,
      '鲜爽': -0.05,
      '陈香': 0.01,
      '花香': -0.06
    },
    timeSensitivity: {
      '清香': -0.006,
      '醇厚': 0.009,
      '回甘': 0.004,
      '鲜爽': -0.007,
      '陈香': 0.002,
      '花香': -0.008
    },
    optimalTemp: 85,
    optimalTime: 180
  }
];

export function calculateFlavorProfile(
  tea: TeaVariety,
  temperature: number,
  brewTime: number
): Record<FlavorDimension, number> {
  const tempDiff = temperature - tea.optimalTemp;
  const timeDiff = brewTime - tea.optimalTime;

  const result = {} as Record<FlavorDimension, number>;

  for (const dim of FLAVOR_DIMENSIONS) {
    let value = tea.defaultFlavor[dim];
    value += tea.tempSensitivity[dim] * tempDiff;
    value += tea.timeSensitivity[dim] * timeDiff;
    value = Math.max(0, Math.min(10, value));
    result[dim] = Math.round(value * 10) / 10;
  }

  return result;
}

export function getTeaById(id: string): TeaVariety | undefined {
  return TEA_VARIETIES.find(t => t.id === id);
}
