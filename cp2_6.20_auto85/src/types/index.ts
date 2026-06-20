export interface SolarTerm {
  id: string;
  name: string;
  month: number;
  icon: string;
  color: string;
  date: string;
  regions: string[];
}

export interface Specialty {
  id: string;
  name: string;
  type: 'fruit' | 'vegetable' | 'craft' | 'food';
  description: string;
  region: string;
  regionId: string;
  bestTime: string;
  lat: number;
  lng: number;
  solarTerms: string[];
  image: string;
}

export interface Activity {
  id: string;
  name: string;
  type: 'sowing' | 'harvest' | 'festival';
  description: string;
  region: string;
  regionId: string;
  date: string;
  lat: number;
  lng: number;
  solarTerms: string[];
  image: string;
}

export interface Region {
  id: string;
  name: string;
  province: string;
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
  center: {
    lat: number;
    lng: number;
  };
  polygon: [number, number][];
  specialties: Specialty[];
  activities: Activity[];
}

export interface ItineraryItem {
  id: string;
  itemId: string;
  itemType: 'specialty' | 'activity';
  name: string;
  region: string;
  date: string;
  image: string;
  addedAt: number;
}

export type FilterType = 'all' | 'harvest' | 'festival' | 'food';

export type MarkerType = 'specialty' | 'activity';

export type SpecialtyType = Specialty['type'];
export type ActivityType = Activity['type'];

export interface SelectedMarker {
  id: string;
  type: MarkerType;
}

export type MarkerIconKey = SpecialtyType | ActivityType;

export interface MarkerIconConfig {
  icon: string;
  bgColor: string;
  label: string;
}
