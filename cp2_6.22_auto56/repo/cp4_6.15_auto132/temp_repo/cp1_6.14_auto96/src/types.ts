export interface Wine {
  id: string;
  name: string;
  chateau: string;
  region: 'bordeaux' | 'napa' | 'tuscany' | 'burgundy' | 'other';
  regionLabel: string;
  variety: string;
  year: number;
  rating: number;
  capacity: string;
  alcohol: string;
  logoColor: string;
  forExchange: boolean;
  exchangeCondition?: string;
  desiredWines?: string[];
  tastingCount: number;
}

export interface TastingRecord {
  id: string;
  wineId: string;
  date: string;
  appearance: string;
  clarity: number;
  aromas: string[];
  tannin: number;
  acidity: number;
  body: number;
  notes: string;
  foodPairing: string;
  rating: number;
}

export type RegionKey = Wine['region'];

export const REGION_CONFIG: Record<RegionKey, { label: string; color: string; tw: string }> = {
  bordeaux: { label: '波尔多', color: '#722F37', tw: 'bg-bordeaux' },
  napa: { label: '纳帕谷', color: '#E67E22', tw: 'bg-napa' },
  tuscany: { label: '托斯卡纳', color: '#2D5016', tw: 'bg-tuscany' },
  burgundy: { label: '勃艮第', color: '#5B2C6F', tw: 'bg-burgundy-region' },
  other: { label: '其他', color: '#6B7280', tw: 'bg-gray-500' },
};

export const AROMA_OPTIONS = ['果香', '橡木', '香料', '花卉', '矿物', '草本', '烟熏', '巧克力', '皮革', '蜂蜜'];
