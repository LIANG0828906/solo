export type InstrumentCategory = 'guitar' | 'keyboard' | 'wind' | 'string';

export interface Instrument {
  id: string;
  brand: string;
  model: string;
  category: InstrumentCategory;
  purchaseYear: number;
  usageYears: number;
  condition: number;
  images: string[];
  description: string;
  expectedPrice: number;
  createdAt: number;
  seller: { id: string; name: string };
}

export interface Offer {
  id: string;
  instrumentId: string;
  buyerName: string;
  price: number;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

export interface ValuationRequest {
  brand: string;
  model: string;
  usageYears: number;
  condition: number;
}

export interface ValuationResponse {
  suggestedPrice: number;
  priceRangeMin: number;
  priceRangeMax: number;
  basis: string;
  marketReference: number;
  depreciationRate: number;
}

export interface CreateInstrumentDto {
  brand: string;
  model: string;
  category: InstrumentCategory;
  purchaseYear: number;
  usageYears: number;
  condition: number;
  description: string;
  expectedPrice: number;
  image?: File;
}

export type PriceRange = 'all' | '0-2000' | '2000-5000' | '5000-10000' | '10000+';
export type ConditionRange = 'all' | '1-5' | '6-8' | '9-10';
export type FilterState = {
  category: InstrumentCategory | 'all';
  priceRange: PriceRange;
  conditionRange: ConditionRange;
};
