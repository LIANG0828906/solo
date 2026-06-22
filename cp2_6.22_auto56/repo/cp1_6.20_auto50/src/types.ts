export interface Medicine {
  id: string;
  name: string;
  specification: string;
  quantity: number;
  expiryDate: string;
  location: string;
  createdAt: string;
  updatedAt: string;
}

export type FilterType = 'all' | 'expiringSoon' | 'lowStock' | 'expired';

export type SortType = 'name' | 'quantityAsc' | 'quantityDesc' | 'expiry';

export type LocationType = '客厅药箱' | '厨房' | '卧室抽屉' | '随身包';

export const LOCATIONS: LocationType[] = ['客厅药箱', '厨房', '卧室抽屉', '随身包'];
