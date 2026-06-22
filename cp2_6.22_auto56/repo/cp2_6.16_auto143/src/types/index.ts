export interface Market {
  id: string;
  name: string;
  date: string;
  location: string;
  type: 'secondhand' | 'handmade' | 'food' | 'mixed';
  popularity: number;
  description: string;
  image: string;
  booths: Booth[];
  entrance: Point;
}

export interface Booth {
  id: string;
  name: string;
  type: string;
  x: number;
  y: number;
  heat: number;
  size: 'small' | 'medium' | 'large';
  status: 'approved' | 'pending' | 'rejected';
  ownerName?: string;
  description?: string;
}

export interface Point {
  x: number;
  y: number;
}

export type DateFilter = 'all' | 'thisWeekend' | 'nextWeekend' | 'thisMonth';
export type TypeFilter = 'all' | 'secondhand' | 'handmade' | 'food';

export interface AppState {
  markets: Market[];
  favorites: string[];
  selectedMarketId: string | null;
  dateFilter: DateFilter;
  typeFilter: TypeFilter;
  isAdmin: boolean;
  sidebarOpen: boolean;
  routeBooths: string[];
  showRoute: boolean;
}

export interface AppActions {
  toggleFavorite: (marketId: string) => void;
  setSelectedMarket: (marketId: string | null) => void;
  setDateFilter: (filter: DateFilter) => void;
  setTypeFilter: (filter: TypeFilter) => void;
  toggleAdmin: () => void;
  toggleSidebar: () => void;
  addBooth: (marketId: string, booth: Omit<Booth, 'id'>) => void;
  approveBooth: (marketId: string, boothId: string) => void;
  rejectBooth: (marketId: string, boothId: string) => void;
  toggleRouteBooth: (boothId: string) => void;
  setShowRoute: (show: boolean) => void;
  clearRouteBooths: () => void;
}
