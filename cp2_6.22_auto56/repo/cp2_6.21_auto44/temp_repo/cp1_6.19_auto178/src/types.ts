export interface Crop {
  id: string;
  name: string;
  family: string;
  color: string;
  nutrientConsumption: {
    n: number;
    p: number;
    k: number;
  };
  growthMonths: number;
  baseYield: number;
}

export interface Plot {
  id: string;
  name: string;
  nutrients: {
    n: number;
    p: number;
    k: number;
  };
}

export interface PlantingPlan {
  plotId: string;
  month: number;
  cropId: string | null;
}

export interface ForecastResult {
  month: number;
  cropId: string;
  estimatedYield: number;
  confidenceLower: number;
  confidenceUpper: number;
}

export interface YieldHistory {
  plotId: string;
  cropId: string;
  month: number;
  year: number;
  yield: number;
}

export type EventType =
  | 'planting:changed'
  | 'yield:updated'
  | 'nutrient:warning'
  | 'recommendation:updated'
  | 'nutrients:updated';

export interface PlantingChangedPayload {
  plotId: string;
  month: number;
  cropId: string | null;
}

export interface RecommendationUpdatedPayload {
  plotId: string;
  month: number;
  recommendations: Crop[];
  incompatible: string[];
}

export interface NutrientWarningPayload {
  plotId: string;
  nutrient: 'n' | 'p' | 'k';
  currentValue: number;
  threshold: number;
  recommendedFertilizer: string;
}

export interface YieldUpdatedPayload {
  forecasts: ForecastResult[];
}

export interface NutrientsUpdatedPayload {
  plotId: string;
  nutrients: { n: number; p: number; k: number };
}

export type EventPayloadMap = {
  'planting:changed': PlantingChangedPayload;
  'yield:updated': YieldUpdatedPayload;
  'nutrient:warning': NutrientWarningPayload;
  'recommendation:updated': RecommendationUpdatedPayload;
  'nutrients:updated': NutrientsUpdatedPayload;
};
