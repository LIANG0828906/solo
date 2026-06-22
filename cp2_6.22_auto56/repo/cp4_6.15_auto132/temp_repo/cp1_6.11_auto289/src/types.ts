export interface CopperCoin {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isDragging: boolean;
}

export interface SilverIngot {
  id: string;
  x: number;
  y: number;
  valueInTaels: number;
}

export interface BillNote {
  id: string;
  amount: number;
  issuer: '本号' | '他号';
  date: Date;
  sealPosition: { x: number; y: number };
  isUnrolling: boolean;
  unrollProgress: number;
}

export interface LedgerEntry {
  id: string;
  date: Date;
  summary: string;
  copperChange: number;
  silverChange: number;
}

export interface AbacusColumn {
  upperBeads: { position: number; target: number }[];
  lowerBeads: { position: number; target: number }[];
  placeValue: number;
  hovered: boolean;
}

export interface AccountState {
  copperBalance: number;
  silverBalance: number;
  ledger: LedgerEntry[];
  currentTimeIndex: number;
  isPlaying: boolean;
}

export interface ExchangeZone {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AnimatingValue {
  current: number;
  target: number;
  velocity: number;
}
