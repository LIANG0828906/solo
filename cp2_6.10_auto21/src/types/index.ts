export type EventType = 'dock' | 'unload' | 'lock' | 'collision' | 'sink';

export interface EventLog {
  id: string;
  timestamp: string;
  type: EventType;
  shipId: string;
  description: string;
  impact: number;
  loss: number;
}

export interface Ship {
  id: string;
  name: string;
  x: number;
  y: number;
  isDocked: boolean;
  isMoored: boolean;
  collisionCount: number;
  damage: number;
  hasSunk: boolean;
  cargo: number;
}

export interface WharfState {
  ships: Ship[];
  waterLevel: number;
  gateOpen: boolean;
  grainCount: number;
  events: EventLog[];
  selectedShipId: string | null;
  addShip: (ship: Omit<Ship, 'id'>) => void;
  removeShip: (id: string) => void;
  updateShip: (id: string, updates: Partial<Ship>) => void;
  selectShip: (id: string | null) => void;
  moveShip: (id: string, x: number, y: number) => void;
  dockShip: (id: string) => void;
  undockShip: (id: string) => void;
  moorShip: (id: string) => void;
  unmoorShip: (id: string) => void;
  unloadCargo: (id: string, amount: number) => void;
  setWaterLevel: (level: number) => void;
  openGate: () => void;
  closeGate: () => void;
  recordEvent: (event: Omit<EventLog, 'id' | 'timestamp'>) => void;
  clearEvents: () => void;
  incrementGrain: (amount: number) => void;
  decrementGrain: (amount: number) => void;
}
