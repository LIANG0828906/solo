export type FoodCategory = 'vegetable' | 'meat' | 'seasoning';

export interface FoodItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: FoodCategory;
  purchaseDate: string;
  shelfLifeDays: number;
}

export type SortOption = 'name-asc' | 'expiry-asc' | 'added-desc';
