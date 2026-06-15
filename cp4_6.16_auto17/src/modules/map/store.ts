import { create } from 'zustand';
import { MapState, MapActions } from './types';
import { getTrailWithPoints, savePOI, deletePOI as dbDeletePOI, updatePOI, getPOIsByTrail, getAllTrails } from '@/shared/db';
import { getBounds } from '@/shared/utils';
import { TrailWithPoints } from '@/shared/types';

const initialState: MapState = {
  selectedTrailIds: [],
  activeTrailId: null,
  trails: new Map(),
  pois: [],
  isAddingPOI: false,
  selectedPOI: null,
  compareMode: false,
  compareTrailIds: null,
  mapCenter: [39.9042, 116.4074],
  mapZoom: 12,
};

export const useMapStore = create<MapState & MapActions>((set, get) => ({
  ...initialState,

  loadTrail: async (trailId: string) => {
    const trail = await getTrailWithPoints(trailId);
    if (trail) {
      set(state => {
        const newTrails = new Map(state.trails);
        newTrails.set(trailId, trail);
        return { trails: newTrails };
      });
    }
  },

  loadAllTrails: async () => {
    const trails = await getAllTrails();
    const trailsMap = new Map<string, TrailWithPoints>();
    for (const trail of trails) {
      const trailWithPoints = await getTrailWithPoints(trail.id);
      if (trailWithPoints) {
        trailsMap.set(trail.id, trailWithPoints);
      }
    }
    set({ trails: trailsMap });
  },

  loadPOIs: async (trailId: string | null) => {
    const pois = await getPOIsByTrail(trailId);
    set({ pois });
  },

  selectTrail: (trailId: string) => {
    set({ selectedTrailIds: [trailId], activeTrailId: trailId });
    const trail = get().trails.get(trailId);
    if (trail && trail.points.length > 0) {
      get().fitTrailBounds(trailId);
    }
  },

  toggleTrailSelection: (trailId: string) => {
    set(state => {
      const isSelected = state.selectedTrailIds.includes(trailId);
      let newSelected: string[];
      if (isSelected) {
        newSelected = state.selectedTrailIds.filter(id => id !== trailId);
      } else {
        newSelected = [...state.selectedTrailIds, trailId];
      }
      return {
        selectedTrailIds: newSelected,
        activeTrailId: newSelected.length > 0 ? newSelected[newSelected.length - 1] : null,
      };
    });
  },

  setActiveTrail: (trailId: string | null) => {
    set({ activeTrailId: trailId });
  },

  addPOI: async (poiData) => {
    const poi = await savePOI(poiData);
    set(state => ({
      pois: [...state.pois, poi],
      isAddingPOI: false,
    }));
  },

  deletePOI: async (poiId: string) => {
    await dbDeletePOI(poiId);
    set(state => ({
      pois: state.pois.filter(p => p.id !== poiId),
      selectedPOI: state.selectedPOI?.id === poiId ? null : state.selectedPOI,
    }));
  },

  updatePOIPosition: async (poiId: string, lat: number, lng: number) => {
    const updated = await updatePOI(poiId, { lat, lng });
    if (updated) {
      set(state => ({
        pois: state.pois.map(p => (p.id === poiId ? updated : p)),
        selectedPOI: state.selectedPOI?.id === poiId ? updated : state.selectedPOI,
      }));
    }
  },

  setSelectedPOI: (poi) => set({ selectedPOI: poi }),

  setAddingPOI: (adding) => set({ isAddingPOI: adding }),

  enableCompareMode: (trail1Id: string, trail2Id: string) => {
    set({
      compareMode: true,
      compareTrailIds: [trail1Id, trail2Id],
      selectedTrailIds: [trail1Id, trail2Id],
    });
    setTimeout(() => {
      get().fitCompareBounds();
    }, 100);
  },

  disableCompareMode: () => {
    set({
      compareMode: false,
      compareTrailIds: null,
    });
  },

  setMapCenter: (center) => set({ mapCenter: center }),

  setMapZoom: (zoom) => set({ mapZoom: zoom }),

  fitTrailBounds: (trailId: string) => {
    const trail = get().trails.get(trailId);
    if (!trail || trail.points.length === 0) return;
    
    const bounds = getBounds(trail.points);
    if (bounds) {
      const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
      const centerLng = (bounds[0][1] + bounds[1][1]) / 2;
      set({ mapCenter: [centerLat, centerLng] });
    }
  },

  fitCompareBounds: () => {
    const { compareTrailIds, trails } = get();
    if (!compareTrailIds) return;
    
    const allPoints: { lat: number; lng: number }[] = [];
    for (const trailId of compareTrailIds) {
      const trail = trails.get(trailId);
      if (trail) {
        allPoints.push(...trail.points);
      }
    }
    
    if (allPoints.length === 0) return;
    
    const bounds = getBounds(allPoints);
    if (bounds) {
      const centerLat = (bounds[0][0] + bounds[1][0]) / 2;
      const centerLng = (bounds[0][1] + bounds[1][1]) / 2;
      set({ mapCenter: [centerLat, centerLng] });
    }
  },
}));
