export interface Commodity {
  id: string;
  name: string;
  basePrice: number;
  currentPrice: number;
  targetPrice: number;
  priceVelocity: number;
  supply: number;
  icon: string;
}

export interface Planet {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  color: number;
  size: number;
  isStation: boolean;
  commodities: Map<string, Commodity>;
  connectedPlanets: string[];
  glowIntensity: number;
}

export interface CargoItem {
  commodityId: string;
  quantity: number;
  purchasePrice: number;
}

export interface ShipState {
  position: { x: number; y: number; z: number };
  currentPlanetId: string | null;
  targetPlanetId: string | null;
  isFlying: boolean;
  fuel: number;
  maxFuel: number;
  cargoCapacity: number;
  baseCargoCapacity: number;
  engineSpeed: number;
  baseEngineSpeed: number;
  shieldLevel: number;
  baseShieldLevel: number;
  cargo: CargoItem[];
}

export interface TransportMission {
  id: string;
  commodityId: string;
  commodityName: string;
  quantity: number;
  originPlanetId: string;
  originPlanetName: string;
  targetPlanetId: string;
  targetPlanetName: string;
  reward: number;
  timeLimit: number;
  startTime: number;
  completed: boolean;
  accepted: boolean;
}

export interface NewsEvent {
  id: string;
  title: string;
  description: string;
  affectedCommodity: string;
  affectedPlanetId: string;
  priceModifier: number;
  duration: number;
  startTime: number;
}

export interface ShipUpgrade {
  id: string;
  name: string;
  description: string;
  type: 'cargo' | 'engine' | 'shield';
  multiplier: number;
  cost: number;
  purchased: boolean;
  icon: string;
}

export interface GameStateData {
  credits: number;
  ship: ShipState;
  planets: Map<string, Planet>;
  missions: TransportMission[];
  newsEvents: NewsEvent[];
  upgrades: ShipUpgrade[];
  eventQueue: Array<() => void>;
  selectedPlanetId: string | null;
  gameTime: number;
}

export interface TradeResult {
  success: boolean;
  message: string;
  newCredits?: number;
  newCargo?: CargoItem[];
}

export interface MissionResult {
  success: boolean;
  reward?: number;
  message: string;
}
