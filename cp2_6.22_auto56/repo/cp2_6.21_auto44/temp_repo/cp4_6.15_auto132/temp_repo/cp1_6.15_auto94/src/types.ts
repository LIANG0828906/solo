export type FrondShapeType = 'pinnate' | 'bipinnate' | 'palmate' | 'dichotomous';

export type GrowthStage = 'sprout' | 'unfolding' | 'mature' | 'spore';

export interface PlantBase {
  id: string;
  scientificName: string;
  commonName: string;
  orderInEvolution: number;
  ancestorId: string | null;
}

export interface PlantConfig extends PlantBase {
  frondShape: {
    type: FrondShapeType;
    length: number;
    width: number;
    curvature: number;
    segmentation: number;
  };
  stem: {
    height: number;
    thickness: number;
    branchingAngle: number;
  };
  colors: {
    sprout: string;
    unfolding: string;
    mature: string;
    spore: string;
    sporangium: string;
  };
  growthPeriodDays: number;
}

export interface StageMorphology {
  stemScale: number;
  frondUnfurl: number;
  frondScale: number;
  colorBlend: string;
  hasSporangia: boolean;
  sporangiaDensity: number;
}

export interface EvolutionNode {
  plantId: string;
  position: { x: number; y: number };
}

export interface EvolutionLink {
  from: string;
  to: string;
}

export interface EvolutionGraph {
  nodes: EvolutionNode[];
  links: EvolutionLink[];
}

export interface PlantInfo extends PlantBase {
  habitat: {
    temperatureRange: [number, number];
    humidityRequirement: string;
    typicalEnvironment: string;
  };
  evolutionDescription: string;
  interestingFacts: string[];
}

export interface GrowthActionRequest {
  plantId: string;
  fromStage: GrowthStage;
  action: 'grow' | 'reset';
}

export interface GrowthActionResponse {
  plantId: string;
  currentStage: GrowthStage;
  morphology: StageMorphology;
  message: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export const GROWTH_STAGES: GrowthStage[] = ['sprout', 'unfolding', 'mature', 'spore'];

export const STAGE_LABELS: Record<GrowthStage, string> = {
  sprout: '幼芽期',
  unfolding: '展开期',
  mature: '成熟期',
  spore: '孢子期'
};

export const STAGE_ORDER: Record<GrowthStage, number> = {
  sprout: 0,
  unfolding: 1,
  mature: 2,
  spore: 3
};

export interface LightAngle {
  azimuth: number;
  elevation: number;
}
