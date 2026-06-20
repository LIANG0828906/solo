export interface GeoCoordinate {
  lat: number;
  lng: number;
}

export type AttackType = 'DDoS' | 'DoS' | 'Scan';
export type FilterType = 'ALL' | AttackType;

export interface AttackEvent {
  id: string;
  source: GeoCoordinate;
  target: GeoCoordinate;
  sourceCountry: string;
  targetCountry: string;
  bandwidth: number;
  type: AttackType;
  timestamp: number;
}

export interface TopCountryEntry {
  country: string;
  count: number;
}

export interface AttackStats {
  totalAttacks: number;
  topTargetCountries: TopCountryEntry[];
  peakBandwidth: number;
}

export interface AttackStore {
  isRunning: boolean;
  filterType: FilterType;
  events: AttackEvent[];
  stats: AttackStats;
  start: () => void;
  stop: () => void;
  setFilter: (type: FilterType) => void;
  addEvents: (events: AttackEvent[]) => void;
}

export interface CountryData {
  name: string;
  lat: number;
  lng: number;
}
