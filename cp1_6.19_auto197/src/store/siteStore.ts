import { create } from 'zustand';
import type { Facility, FacilityType, PersonPoint, HeatGrid, MapBounds } from '../types';
import { FACILITY_CONFIGS } from '../types';
import { v4 as uuidv4 } from 'uuid';
import {
  generatePersonPoints,
  updatePersonPoints,
  generateHeatGrid,
  getDensityAtPoint,
} from '../utils/heatmapEngine';

interface SiteState {
  facilities: Facility[];
  personPoints: PersonPoint[];
  heatGrid: HeatGrid | null;
  densityFactor: number;
  isSimulating: boolean;
  selectedFacilityType: FacilityType;
  isPlacingMode: boolean;

  addFacility: (type: FacilityType, lat: number, lng: number) => void;
  removeFacility: (id: string) => void;
  moveFacility: (id: string, lat: number, lng: number) => void;
  clearFacilities: () => void;
  setDensityFactor: (value: number) => void;
  setSelectedFacilityType: (type: FacilityType) => void;
  setPlacingMode: (mode: boolean) => void;
  startSimulation: () => void;
  stopSimulation: () => void;
  updateSimulation: (bounds: MapBounds) => void;
  getFacilityDensity: (facilityId: string) => number;
  getAverageDensity: () => number;
  getTypeCounts: () => Record<FacilityType, number>;
  getMaxHeatPoint: () => { lat: number; lng: number; value: number } | null;
}

const initialFacilities: Facility[] = [
  {
    id: uuidv4(),
    type: FacilityType.STAGE,
    name: '主舞台',
    lat: 31.2304,
    lng: 121.4737,
    color: FACILITY_CONFIGS[FacilityType.STAGE].color,
    icon: FACILITY_CONFIGS[FacilityType.STAGE].icon,
  },
  {
    id: uuidv4(),
    type: FacilityType.FOOD,
    name: '餐饮区 A',
    lat: 31.2290,
    lng: 121.4750,
    color: FACILITY_CONFIGS[FacilityType.FOOD].color,
    icon: FACILITY_CONFIGS[FacilityType.FOOD].icon,
  },
  {
    id: uuidv4(),
    type: FacilityType.RESTROOM,
    name: '卫生间 1',
    lat: 31.2315,
    lng: 121.4720,
    color: FACILITY_CONFIGS[FacilityType.RESTROOM].color,
    icon: FACILITY_CONFIGS[FacilityType.RESTROOM].icon,
  },
];

export const useSiteStore = create<SiteState>((set, get) => ({
  facilities: initialFacilities,
  personPoints: [],
  heatGrid: null,
  densityFactor: 100,
  isSimulating: false,
  selectedFacilityType: FacilityType.STAGE,
  isPlacingMode: false,

  addFacility: (type: FacilityType, lat: number, lng: number) => {
    const config = FACILITY_CONFIGS[type];
    const existingCount = get().facilities.filter((f) => f.type === type).length;
    const newFacility: Facility = {
      id: uuidv4(),
      type,
      name: `${config.name} ${existingCount + 1}`,
      lat,
      lng,
      color: config.color,
      icon: config.icon,
    };
    set((state) => ({
      facilities: [...state.facilities, newFacility],
      isPlacingMode: false,
    }));
  },

  removeFacility: (id: string) => {
    set((state) => ({
      facilities: state.facilities.filter((f) => f.id !== id),
    }));
  },

  moveFacility: (id: string, lat: number, lng: number) => {
    set((state) => ({
      facilities: state.facilities.map((f) =>
        f.id === id ? { ...f, lat, lng } : f
      ),
    }));
  },

  clearFacilities: () => {
    set({ facilities: [], personPoints: [], heatGrid: null });
  },

  setDensityFactor: (value: number) => {
    set({ densityFactor: value });
  },

  setSelectedFacilityType: (type: FacilityType) => {
    set({ selectedFacilityType: type });
  },

  setPlacingMode: (mode: boolean) => {
    set({ isPlacingMode: mode });
  },

  startSimulation: () => {
    const { facilities, densityFactor } = get();
    const newPoints = generatePersonPoints(facilities, densityFactor);
    set({ isSimulating: true, personPoints: newPoints });
  },

  stopSimulation: () => {
    set({ isSimulating: false, personPoints: [], heatGrid: null });
  },

  updateSimulation: (bounds: MapBounds) => {
    const state = get();
    if (!state.isSimulating) return;

    const updatedPoints = updatePersonPoints(state.personPoints);

    const now = Date.now();
    const activePoints = updatedPoints.filter(
      (p) => now - p.createdAt < p.lifespan
    );

    const replenishThreshold = state.facilities.length * state.densityFactor * 0.8;
    let finalPoints = activePoints;
    if (activePoints.length < replenishThreshold) {
      const newPoints = generatePersonPoints(state.facilities, state.densityFactor * 0.3);
      finalPoints = [...activePoints, ...newPoints];
    }

    const heatGrid = generateHeatGrid(finalPoints, bounds);

    set({ personPoints: finalPoints, heatGrid });
  },

  getFacilityDensity: (facilityId: string) => {
    const facility = get().facilities.find((f) => f.id === facilityId);
    if (!facility) return 0;
    return getDensityAtPoint(get().heatGrid, facility.lat, facility.lng);
  },

  getAverageDensity: () => {
    const grid = get().heatGrid;
    if (!grid || grid.maxValue === 0) return 0;
    return grid.avgValue / grid.maxValue;
  },

  getTypeCounts: () => {
    const counts: Record<FacilityType, number> = {
      [FacilityType.STAGE]: 0,
      [FacilityType.FOOD]: 0,
      [FacilityType.RESTROOM]: 0,
      [FacilityType.REST]: 0,
      [FacilityType.MEDICAL]: 0,
    };
    for (const f of get().facilities) {
      counts[f.type]++;
    }
    return counts;
  },

  getMaxHeatPoint: () => {
    return get().heatGrid?.maxPoint ?? null;
  },
}));
