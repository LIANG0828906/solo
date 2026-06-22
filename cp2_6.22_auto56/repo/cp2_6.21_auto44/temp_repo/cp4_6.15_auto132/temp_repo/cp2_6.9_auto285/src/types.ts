export interface Spice {
  id: string;
  name: string;
  color: string;
  property: string;
  aroma: string;
}

export interface WeighedSpice {
  spiceId: string;
  name: string;
  color: string;
  weight: number;
  property: string;
  aroma: string;
}

export interface GroundPowder {
  spices: WeighedSpice[];
  fineness: number;
  totalWeight: number;
}

export interface MoldedProduct {
  id: string;
  moldType: 'plum' | 'ruyi' | 'stick';
  powder: GroundPowder;
  isIgnited: boolean;
  name: string;
}

export interface IncenseRecord {
  id: string;
  name: string;
  recipe: { name: string; weight: number }[];
  burnTime: number;
  timestamp: number;
}

export type AppAction =
  | { type: 'ADD_SPICE'; payload: WeighedSpice }
  | { type: 'GRIND' }
  | { type: 'MOLD'; payload: 'plum' | 'ruyi' | 'stick' }
  | { type: 'IGNITE' }
  | { type: 'RESET' }
  | { type: 'UPDATE_GRIND_PROGRESS'; payload: number }
  | { type: 'CLEAR_SELECTED_SPICES' };

export interface AppState {
  selectedSpices: WeighedSpice[];
  groundPowder: GroundPowder | null;
  moldedProduct: MoldedProduct | null;
  records: IncenseRecord[];
  grindProgress: number;
}
