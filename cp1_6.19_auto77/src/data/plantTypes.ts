export type PlantType = 'succulent' | 'fern' | 'mint';

export interface EnvironmentParams {
  light: number;
  water: number;
  temperature: number;
}

export interface GrowthLogEntry {
  timestamp: number;
  params: EnvironmentParams;
}

export interface PlantConfig {
  type: PlantType;
  name: string;
  initialParams: EnvironmentParams;
  optimalRange: {
    light: [number, number];
    water: [number, number];
    temperature: [number, number];
  };
  growthRules: {
    lightEffect: number;
    waterEffect: number;
    temperatureEffect: number;
  };
  appearance: {
    baseColor: string;
    stressColor: string;
  };
}

export const plantTypes: Record<PlantType, PlantConfig> = {
  succulent: {
    type: 'succulent',
    name: '多肉',
    initialParams: {
      light: 60,
      water: 40,
      temperature: 55,
    },
    optimalRange: {
      light: [50, 80],
      water: [30, 50],
      temperature: [40, 70],
    },
    growthRules: {
      lightEffect: 0.8,
      waterEffect: 0.6,
      temperatureEffect: 0.7,
    },
    appearance: {
      baseColor: '#66BB6A',
      stressColor: '#FF7043',
    },
  },
  fern: {
    type: 'fern',
    name: '蕨类',
    initialParams: {
      light: 40,
      water: 70,
      temperature: 50,
    },
    optimalRange: {
      light: [30, 50],
      water: [60, 85],
      temperature: [40, 65],
    },
    growthRules: {
      lightEffect: 0.7,
      waterEffect: 0.9,
      temperatureEffect: 0.6,
    },
    appearance: {
      baseColor: '#81C784',
      stressColor: '#FFE082',
    },
  },
  mint: {
    type: 'mint',
    name: '薄荷',
    initialParams: {
      light: 55,
      water: 65,
      temperature: 60,
    },
    optimalRange: {
      light: [45, 70],
      water: [55, 80],
      temperature: [50, 75],
    },
    growthRules: {
      lightEffect: 0.6,
      waterEffect: 0.8,
      temperatureEffect: 0.9,
    },
    appearance: {
      baseColor: '#4CAF50',
      stressColor: '#8D6E63',
    },
  },
};

export const getRandomPlantType = (): PlantType => {
  const types: PlantType[] = ['succulent', 'fern', 'mint'];
  return types[Math.floor(Math.random() * types.length)];
};

export const lerp = (start: number, end: number, t: number): number => {
  return start + (end - start) * t;
};

export const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};
