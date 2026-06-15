export interface WoodGrade {
  id: string;
  name: string;
  priceMultiplier: number;
}

export interface CarvingComplexity {
  id: string;
  name: string;
  priceAddition: number;
}

export interface Accessory {
  id: string;
  name: string;
  price: number;
}

export interface Dimension {
  label: string;
  value: string;
}

export interface Work {
  id: string;
  name: string;
  description: string;
  material: string;
  materials: string[];
  dimensions: Dimension[];
  images: string[];
  basePrice: number;
  hours: number;
  woodGrades: WoodGrade[];
  carvingComplexity: CarvingComplexity[];
  accessories: Accessory[];
}

export interface QuoteRequest {
  workId: string;
  woodGradeId: string;
  carvingComplexityId: string;
  accessoryIds: string[];
  urgent: boolean;
}
