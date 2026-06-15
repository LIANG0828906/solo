export interface Tea {
  id: string;
  name: string;
  type: 'brick' | 'loose' | 'cake';
  price: number;
  stock: number;
}

export interface Horse {
  id: string;
  name: string;
  breed: 'hequ' | 'dian' | 'mongolian';
  price: number;
  maxLoad: number;
  speed: number;
  stock: number;
}

export interface PricePoint {
  time: string;
  brickTea: number;
  looseTea: number;
  cakeTea: number;
  hequHorse: number;
  dianHorse: number;
  mongolianHorse: number;
}

export interface TradeRecord {
  id: string;
  time: string;
  itemName: string;
  itemType: 'tea' | 'horse';
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ConvoyHorse {
  id: string;
  horseId: string;
  name: string;
  breed: string;
  maxLoad: number;
  speed: number;
  currentLoad: number;
  cargo: CargoItem[];
}

export interface CargoItem {
  id: string;
  name: string;
  weight: number;
  quantity: number;
}

export interface AvailableHorse {
  id: string;
  name: string;
  breed: string;
  maxLoad: number;
  speed: number;
}

export interface SupplyItem {
  id: string;
  name: string;
  weight: number;
  type: 'tea' | 'iron';
}

export interface RouteNode {
  id: string;
  name: string;
  x: number;
  y: number;
  altitude: number;
  type: 'start' | 'station' | 'end';
}

export interface RouteEdge {
  from: string;
  to: string;
  distance: number;
}

export interface Notification {
  id: string;
  type: 'urgent' | 'warning' | 'info';
  message: string;
  time: string;
}

export interface StationSupply {
  remainingTea: number;
  remainingIron: number;
  damageRate: number;
}

export interface GameState {
  currentTime: string;
  timestamp: number;
  totalStock: number;
  teas: Tea[];
  horses: Horse[];
  priceHistory: PricePoint[];
  tradeRecords: TradeRecord[];
  convoyHorses: ConvoyHorse[];
  availableHorses: AvailableHorse[];
  supplyItems: SupplyItem[];
  currentTab: 'trade' | 'convoy' | 'route';
  notifications: Notification[];
  isJourneyActive: boolean;
  currentNodeIndex: number;
  caravanPosition: { x: number; y: number };
  showSupplyWindow: boolean;
  supplyCountdown: number;
  stationSupply: StationSupply;
}
