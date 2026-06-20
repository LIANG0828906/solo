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

export interface SelectedMarker {
  id: string;
  type: MarkerType;
}
