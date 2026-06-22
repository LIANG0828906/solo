export interface FlavorRatings {
  acidity: number;
  sweetness: number;
  bitterness: number;
  thickness: number;
  aftertaste: number;
}

export interface BrewParams {
  beanName: string;
  grindSize: string;
  waterTemp: number;
  brewTime: number;
  ratio: string;
}

export interface BrewRecord extends BrewParams {
  id: string;
  createdAt: string;
  ratings: FlavorRatings;
  totalScore: number;
}

export interface FilterParams {
  keyword?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
}

export const FLAVOR_KEYS: (keyof FlavorRatings)[] = [
  'acidity',
  'sweetness',
  'bitterness',
  'thickness',
  'aftertaste',
];

export const FLAVOR_LABELS: Record<keyof FlavorRatings, string> = {
  acidity: '酸度',
  sweetness: '甜度',
  bitterness: '苦味',
  thickness: '醇厚度',
  aftertaste: '回甘',
};
