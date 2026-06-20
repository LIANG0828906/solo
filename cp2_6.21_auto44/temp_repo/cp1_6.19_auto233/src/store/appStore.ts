import { create } from 'zustand';
import type { Store, Building, FacadeData, ShadowPolygon, SunPosition, BlockStats } from '@/types';
import { PRESET_BLOCKS } from '@/types';
import { buildingManager } from '@/model/buildingManager';
import { shadowSimulator } from '@/model/shadowSimulator';

const initialDate = new Date();
initialDate.setMonth(5);
initialDate.setDate(21);

const getInitialBuildings = (): Building[] => {
  const buildings: Building[] = [];
  PRESET_BLOCKS.forEach((block) => {
    block.buildings.forEach((b) => {
      buildings.push(buildingManager.createBuilding(b));
    });
  });
  return buildings;
};

const initialSunPosition: SunPosition = shadowSimulator.calculateSunPosition(
  initialDate,
  12,
  31,
  121
);

const initialBuildings = getInitialBuildings();
const initialFacadeData: FacadeData[] = shadowSimulator.calculateFacadeData(
  initialBuildings,
  initialDate,
  31,
  121
);
const initialShadowPolygons: ShadowPolygon[] = shadowSimulator.calculateShadowPolygons(
  initialBuildings,
  initialSunPosition
);
const initialBlockStats: BlockStats[] = shadowSimulator.calculateBlockStats(
  initialBuildings,
  initialFacadeData,
  initialShadowPolygons
);

export const useAppStore = create<Store>((set, get) => ({
  buildings: initialBuildings,
  selectedBuildingId: null,
  selectedFacadeId: null,
  date: initialDate,
  time: 12,
  latitude: 31,
  longitude: 121,
  sunPosition: initialSunPosition,
  facadeData: initialFacadeData,
  shadowPolygons: initialShadowPolygons,
  blockStats: initialBlockStats,
  isPlacingMode: false,
  activePreset: null,

  addBuilding: (buildingData) => {
    const { buildings } = get();
    const newBuildings = buildingManager.addBuilding(buildings, buildingData);
    const { date, latitude, longitude, time } = get();
    const sunPos = shadowSimulator.calculateSunPosition(date, time, latitude, longitude);
    const facadeData = shadowSimulator.calculateFacadeData(newBuildings, date, latitude, longitude);
    const shadowPolygons = shadowSimulator.calculateShadowPolygons(newBuildings, sunPos);
    const blockStats = shadowSimulator.calculateBlockStats(newBuildings, facadeData, shadowPolygons);
    set({
      buildings: newBuildings,
      facadeData,
      shadowPolygons,
      blockStats,
      sunPosition: sunPos,
    });
  },

  removeBuilding: (id) => {
    const { buildings, selectedBuildingId, selectedFacadeId } = get();
    const newBuildings = buildingManager.removeBuilding(buildings, id);
    const { date, latitude, longitude, time } = get();
    const sunPos = shadowSimulator.calculateSunPosition(date, time, latitude, longitude);
    const facadeData = shadowSimulator.calculateFacadeData(newBuildings, date, latitude, longitude);
    const shadowPolygons = shadowSimulator.calculateShadowPolygons(newBuildings, sunPos);
    const blockStats = shadowSimulator.calculateBlockStats(newBuildings, facadeData, shadowPolygons);
    set({
      buildings: newBuildings,
      facadeData,
      shadowPolygons,
      blockStats,
      sunPosition: sunPos,
      selectedBuildingId: selectedBuildingId === id ? null : selectedBuildingId,
      selectedFacadeId: selectedFacadeId?.startsWith(id) ? null : selectedFacadeId,
    });
  },

  updateBuildingHeight: (id, height) => {
    const { buildings } = get();
    const newBuildings = buildingManager.updateBuildingHeight(buildings, id, height);
    const { date, latitude, longitude, time } = get();
    const sunPos = shadowSimulator.calculateSunPosition(date, time, latitude, longitude);
    const facadeData = shadowSimulator.calculateFacadeData(newBuildings, date, latitude, longitude);
    const shadowPolygons = shadowSimulator.calculateShadowPolygons(newBuildings, sunPos);
    const blockStats = shadowSimulator.calculateBlockStats(newBuildings, facadeData, shadowPolygons);
    set({
      buildings: newBuildings,
      facadeData,
      shadowPolygons,
      blockStats,
      sunPosition: sunPos,
    });
  },

  selectBuilding: (id) => {
    set({ selectedBuildingId: id, selectedFacadeId: null });
  },

  selectFacade: (buildingId, facadeIndex) => {
    if (buildingId === null || facadeIndex === null) {
      set({ selectedFacadeId: null });
    } else {
      set({
        selectedBuildingId: buildingId,
        selectedFacadeId: `${buildingId}-${facadeIndex}`,
      });
    }
  },

  setDate: (date) => {
    const { latitude, longitude, time, buildings } = get();
    const sunPos = shadowSimulator.calculateSunPosition(date, time, latitude, longitude);
    const facadeData = shadowSimulator.calculateFacadeData(buildings, date, latitude, longitude);
    const shadowPolygons = shadowSimulator.calculateShadowPolygons(buildings, sunPos);
    const blockStats = shadowSimulator.calculateBlockStats(buildings, facadeData, shadowPolygons);
    set({
      date,
      sunPosition: sunPos,
      facadeData,
      shadowPolygons,
      blockStats,
    });
  },

  setTime: (time) => {
    const { date, latitude, longitude, buildings } = get();
    const sunPos = shadowSimulator.calculateSunPosition(date, time, latitude, longitude);
    const shadowPolygons = shadowSimulator.calculateShadowPolygons(buildings, sunPos);
    const blockStats = shadowSimulator.calculateBlockStats(buildings, get().facadeData, shadowPolygons);
    set({
      time,
      sunPosition: sunPos,
      shadowPolygons,
      blockStats,
    });
  },

  setLatitude: (latitude) => {
    const { date, longitude, time, buildings } = get();
    const sunPos = shadowSimulator.calculateSunPosition(date, time, latitude, longitude);
    const facadeData = shadowSimulator.calculateFacadeData(buildings, date, latitude, longitude);
    const shadowPolygons = shadowSimulator.calculateShadowPolygons(buildings, sunPos);
    const blockStats = shadowSimulator.calculateBlockStats(buildings, facadeData, shadowPolygons);
    set({
      latitude,
      sunPosition: sunPos,
      facadeData,
      shadowPolygons,
      blockStats,
    });
  },

  setLongitude: (longitude) => {
    const { date, latitude, time, buildings } = get();
    const sunPos = shadowSimulator.calculateSunPosition(date, time, latitude, longitude);
    const facadeData = shadowSimulator.calculateFacadeData(buildings, date, latitude, longitude);
    const shadowPolygons = shadowSimulator.calculateShadowPolygons(buildings, sunPos);
    const blockStats = shadowSimulator.calculateBlockStats(buildings, facadeData, shadowPolygons);
    set({
      longitude,
      sunPosition: sunPos,
      facadeData,
      shadowPolygons,
      blockStats,
    });
  },

  setPlacingMode: (active) => {
    set({ isPlacingMode: active, selectedBuildingId: null, selectedFacadeId: null });
  },

  setActivePreset: (presetId) => {
    set({ activePreset: presetId });
  },

  loadPreset: (presetId) => {
    const preset = PRESET_BLOCKS.find((p) => p.id === presetId);
    if (!preset) return;

    const { buildings: currentBuildings, date, latitude, longitude, time } = get();
    const otherBuildings = currentBuildings.filter((b) => b.blockId !== presetId);
    const newPresetBuildings = preset.buildings.map((b) => buildingManager.createBuilding(b));
    const newBuildings = [...otherBuildings, ...newPresetBuildings];

    const sunPos = shadowSimulator.calculateSunPosition(date, time, latitude, longitude);
    const facadeData = shadowSimulator.calculateFacadeData(newBuildings, date, latitude, longitude);
    const shadowPolygons = shadowSimulator.calculateShadowPolygons(newBuildings, sunPos);
    const blockStats = shadowSimulator.calculateBlockStats(newBuildings, facadeData, shadowPolygons);

    set({
      buildings: newBuildings,
      facadeData,
      shadowPolygons,
      blockStats,
      sunPosition: sunPos,
      activePreset: presetId,
    });
  },

  recalculateShadows: () => {
    const { buildings, date, time, latitude, longitude } = get();
    const sunPos = shadowSimulator.calculateSunPosition(date, time, latitude, longitude);
    const facadeData = shadowSimulator.calculateFacadeData(buildings, date, latitude, longitude);
    const shadowPolygons = shadowSimulator.calculateShadowPolygons(buildings, sunPos);
    const blockStats = shadowSimulator.calculateBlockStats(buildings, facadeData, shadowPolygons);
    set({
      sunPosition: sunPos,
      facadeData,
      shadowPolygons,
      blockStats,
    });
  },
}));
