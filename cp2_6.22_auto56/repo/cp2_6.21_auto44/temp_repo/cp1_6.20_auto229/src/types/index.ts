export interface CoffeeBean {
  id: string;
  name: string;
  origin: string;
  roastLevel: 'light' | 'medium' | 'medium-dark' | 'dark';
  processMethod: string;
  latitude: number;
  longitude: number;
  createdAt: string;
  userId: string;
}

export interface FlavorProfile {
  acidity: number;
  bitterness: number;
  sweetness: number;
  body: number;
  aftertaste: number;
  cleanliness: number;
}

export interface BrewParams {
  waterTemp: number;
  grindSize: number;
  waterRatio: number;
  pourTime: number;
}

export interface BrewRecord {
  id: string;
  beanId: string;
  beanName: string;
  params: BrewParams;
  flavor: FlavorProfile;
  overallScore: number;
  notes?: string;
  likes: number;
  isPublic: boolean;
  createdAt: string;
  userId: string;
}

export const flavorDimensions = [
  { key: 'acidity', label: '酸度' },
  { key: 'bitterness', label: '苦度' },
  { key: 'sweetness', label: '甜度' },
  { key: 'body', label: '醇厚度' },
  { key: 'aftertaste', label: '余韵' },
  { key: 'cleanliness', label: '干净度' },
] as const;

export type FlavorKey = typeof flavorDimensions[number]['key'];
