export interface Commodity {
  id: string;
  name: string;
  basePrice: number;
  currentPrice: number;
}

export interface Planet {
  id: string;
  name: string;
  x: number;
  y: number;
  commodities: Commodity[];
  refusesTrade: boolean;
}

export interface CargoItem {
  commodityId: string;
  name: string;
  quantity: number;
}

export interface Ship {
  x: number;
  y: number;
  fuel: number;
  maxFuel: number;
  credits: number;
  reputation: number;
  cargoCapacity: number;
  cargo: CargoItem[];
  currentPlanetId: string;
}

export interface EventOption {
  text: string;
  effectType: 'loseCargo' | 'loseFuel' | 'loseCredits' | 'gainCredits' | 'gainReputation' | 'loseReputation' | 'gainFuel';
  effectValue: number;
  isPositive: boolean;
}

export interface GameEvent {
  id: string;
  name: string;
  description: string;
  type: 'pirate' | 'fuel' | 'market' | 'discovery' | 'distress';
  options: EventOption[];
}

export interface EventLog {
  id: string;
  message: string;
  isPositive: boolean;
  timestamp: number;
}

export interface SaveData {
  planets: Planet[];
  ship: Ship;
  turn: number;
  savedAt: string;
}

export type EventCallback = (event: GameEvent) => void;

export interface EventBus {
  subscribe(callback: EventCallback): () => void;
  publish(event: GameEvent): void;
}

export interface GameState {
  planets: Planet[];
  ship: Ship;
  currentPlanet: Planet | null;
  eventLogs: EventLog[];
  turn: number;
  activeEvent: GameEvent | null;
  selectedCommodity: Commodity | null;
  tradeQuantity: number;
  lastSaveTime: string | null;
  isMoving: boolean;
  mapZoom: number;
}
