export interface Ingredient {
  name: string;
  amount: string;
}

export interface Recipe {
  id: string;
  name: string;
  coverImage: string;
  ingredients: Ingredient[];
  steps: string;
  tags: string[];
  cookTime: number;
  createdAt: number;
  isFavorite?: boolean;
}

export interface ShareInfo {
  shareUrl: string;
  qrCodeDataUrl: string;
}

export type CookTimeRange = 'under10' | '10to30' | '30to60' | 'over60';
