export type ItemCategory = '家具' | '电器' | '书籍' | '服装' | '其他';

export type Area = '东区' | '西区' | '南区' | '北区';

export interface User {
  id: string;
  name: string;
  avatar: string;
  registerDate: string;
}

export interface Item {
  id: string;
  name: string;
  category: ItemCategory;
  description: string;
  price: number;
  images: string[];
  sellerId: string;
  sellerName: string;
  sellerAvatar: string;
  sellerRegisterDate: string;
  distance: number;
  area: Area;
  createdAt: string;
}

export interface HeatMapData {
  day: string;
  area: Area;
  count: number;
}

export interface FilterParams {
  keyword: string;
  category: ItemCategory | '全部';
  minPrice: number;
  maxPrice: number;
}
