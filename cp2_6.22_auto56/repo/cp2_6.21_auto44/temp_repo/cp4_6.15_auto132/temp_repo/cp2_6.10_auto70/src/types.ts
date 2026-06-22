export type Material = 'gold' | 'silver' | 'jade' | 'porcelain' | 'wood';

export type Era = 'ming' | 'qing' | 'song';

export type Condition = 'excellent' | 'good' | 'poor';

export type Liquidity = 'high' | 'medium' | 'low';

export type PawnStatus = 'active' | 'redeemed' | 'dead' | 'sold';

export type GuestType = 'scholar' | 'noble' | 'peddler';

export interface PawnItem {
  id: string;
  guestName: string;
  guestType: GuestType;
  itemName: string;
  itemType: string;
  material: Material;
  era: Era;
  condition: Condition;
  liquidity: Liquidity;
  originalValue: number;
  pawnAmount: number;
  weight?: number;
  description: string;
  flaws: string[];
  pawnDate: string;
  expireDate: string;
  status: PawnStatus;
  monthlyInterest: number;
  pawnTermMonths: number;
  marketPrice?: number;
  sellDate?: string;
}

export interface ValuationWeights {
  material: number;
  era: number;
  condition: number;
  liquidity: number;
}

export interface ValuationResult {
  baseValue: number;
  weightedValue: number;
  pawnAmount: number;
  weights: ValuationWeights;
}

export interface ValuationParams {
  material: Material;
  era: Era;
  condition: Condition;
  liquidity: Liquidity;
  weight?: number;
}

export interface PawnStoreState {
  items: PawnItem[];
  currentItem: PawnItem | null;
  balance: number;
  deadPawnItems: PawnItem[];
  marketItems: PawnItem[];
  currentStep: 'idle' | 'weighing' | 'examining' | 'calculating' | 'complete';
}
