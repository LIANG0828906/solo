import { TrailWithPoints, POI } from '@/shared/types';
import L from 'leaflet';

export interface MapState {
  selectedTrailIds: string[];
  activeTrailId: string | null;
  trails: Map<string, TrailWithPoints>;
  pois: POI[];
  isAddingPOI: boolean;
  selectedPOI: POI | null;
  compareMode: boolean;
  compareTrailIds: [string, string] | null;
  mapCenter: [number, number];
  mapZoom: number;
  fitBoundsTrigger: number;
}

export interface MapActions {
  loadTrail: (trailId: string) => Promise<void>;
  loadAllTrails: () => Promise<void>;
  loadPOIs: (trailId: string | null) => Promise<void>;
  selectTrail: (trailId: string) => void;
  toggleTrailSelection: (trailId: string) => void;
  setActiveTrail: (trailId: string | null) => void;
  addPOI: (poi: Omit<POI, 'id' | 'createdAt'>) => Promise<void>;
  deletePOI: (poiId: string) => Promise<void>;
  updatePOIPosition: (poiId: string, lat: number, lng: number) => Promise<void>;
  setSelectedPOI: (poi: POI | null) => void;
  setAddingPOI: (adding: boolean) => void;
  enableCompareMode: (trail1Id: string, trail2Id: string) => void;
  setCompareTrails: (trail1Id: string, trail2Id: string) => void;
  disableCompareMode: () => void;
  setMapCenter: (center: [number, number]) => void;
  setMapZoom: (zoom: number) => void;
  fitTrailBounds: (trailId: string) => void;
  fitCompareBounds: () => void;
}

export type { L as Leaflet };
