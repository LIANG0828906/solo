export interface Tea {
  id: string;
  name: string;
  color: string;
  origin: string;
  year: string;
  aroma: string;
  description: string;
}

export interface Snack {
  id: string;
  name: string;
  description: string;
}

export interface TastingRecord {
  aroma: string;
  taste: string;
  mouthfeel: string;
  rating: number;
}

export interface TeaNote {
  tea: Tea | null;
  snacks: Snack[];
  tasting: TastingRecord;
  timestamp: Date;
  masterName: string;
}

export type BrewingStep = 'idle' | 'heating' | 'ready' | 'whisking' | 'whisked' | 'pouring' | 'done';
