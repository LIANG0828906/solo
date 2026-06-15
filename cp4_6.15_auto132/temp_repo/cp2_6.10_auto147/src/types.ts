export interface Cargo {
  id: string;
  name: string;
  icon: string;
  basePrice: number;
  weight: number;
  quantity: number;
  description: string;
}

export interface Town {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'oasis' | 'desert' | 'gobi' | 'fortress';
  description: string;
  priceModifiers: Record<string, number>;
}

export interface Terrain {
  type: 'desert' | 'oasis' | 'gobi' | 'mountain';
  costMultiplier: number;
  speedMultiplier: number;
  riskLevel: number;
}

export interface Risk {
  id: string;
  type: 'sandstorm' | 'bandits' | 'plague' | 'drought';
  x: number;
  y: number;
  radius: number;
  probability: number;
  impact: {
    cost: number;
    delay: number;
    cargoLoss: number;
  };
}

export interface RouteNode {
  townId: string;
  order: number;
  arrivalDay?: number;
}

export interface CostCalculationRequest {
  cargo: Cargo[];
  route: RouteNode[];
  caravanSize: number;
}

export interface CostCalculationResponse {
  totalDistance: number;
  totalDays: number;
  transportationCost: number;
  foodCost: number;
  laborCost: number;
  accommodationCost: number;
  riskCost: number;
  totalCost: number;
  expectedRevenue: number;
  expectedProfit: number;
  profitMargin: number;
  riskIndex: number;
  riskAssessment: string;
  terrainBreakdown: Array<{
    type: string;
    distance: number;
    percentage: number;
  }>;
  ledgerEntries: Array<{
    category: string;
    description: string;
    amount: number;
    type: 'income' | 'expense';
  }>;
}
