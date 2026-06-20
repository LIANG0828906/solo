import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { ZoneId, PlantType, EnvironmentData, Zone } from './types';

interface GardenState {
  zones: Record<ZoneId, Zone>;
  activeZoneId: ZoneId;
  setActiveZone: (zoneId: ZoneId) => void;
  addData: (zoneId: ZoneId, data: Omit<EnvironmentData, 'id' | 'timestamp'>) => void;
  setZonePlant: (zoneId: ZoneId, plant: PlantType) => void;
  getActiveZone: () => Zone;
  getZoneData: (zoneId: ZoneId) => EnvironmentData[];
}

const createInitialZone = (id: ZoneId, name: string): Zone => ({
  id,
  name,
  plant: 'pothos',
  data: generateMockData()
});

function generateMockData(): EnvironmentData[] {
  const data: EnvironmentData[] = [];
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  for (let i = 6; i >= 0; i--) {
    const baseTemp = 22 + Math.random() * 10 - 5;
    const baseHumidity = 55 + Math.random() * 20 - 10;
    const lights: Array<'low' | 'medium' | 'high'> = ['low', 'medium', 'high'];
    const soils: Array<'dry' | 'moist' | 'waterlogged'> = ['dry', 'moist', 'waterlogged'];

    data.push({
      id: uuidv4(),
      timestamp: now - i * oneDay,
      temperature: Math.round(baseTemp * 10) / 10,
      humidity: Math.round(baseHumidity),
      light: lights[Math.floor(Math.random() * 3)],
      soilMoisture: soils[Math.floor(Math.random() * 3)]
    });
  }

  return data;
}

export const useStore = create<GardenState>((set, get) => ({
  zones: {
    balcony: createInitialZone('balcony', '阳台'),
    windowsill: createInitialZone('windowsill', '窗台'),
    terrace: createInitialZone('terrace', '露台')
  },
  activeZoneId: 'balcony',

  setActiveZone: (zoneId: ZoneId) => {
    set({ activeZoneId: zoneId });
  },

  addData: (zoneId: ZoneId, data: Omit<EnvironmentData, 'id' | 'timestamp'>) => {
    set((state) => {
      const zone = state.zones[zoneId];
      const newData: EnvironmentData = {
        ...data,
        id: uuidv4(),
        timestamp: Date.now()
      };

      const updatedData = [...zone.data, newData];
      if (updatedData.length > 30) {
        updatedData.shift();
      }

      return {
        zones: {
          ...state.zones,
          [zoneId]: {
            ...zone,
            data: updatedData
          }
        }
      };
    });
  },

  setZonePlant: (zoneId: ZoneId, plant: PlantType) => {
    set((state) => ({
      zones: {
        ...state.zones,
        [zoneId]: {
          ...state.zones[zoneId],
          plant
        }
      }
    }));
  },

  getActiveZone: () => {
    const state = get();
    return state.zones[state.activeZoneId];
  },

  getZoneData: (zoneId: ZoneId) => {
    return get().zones[zoneId].data;
  }
}));
