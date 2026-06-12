import { create } from 'zustand';
import axios from 'axios';
import type {
  Plant,
  CareLog,
  SensorData,
  AddPlantPayload,
  UpdateLogPayload,
} from '../types';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001',
  timeout: 10000,
});

interface PlantState {
  plants: Plant[];
  loading: boolean;
  error: string | null;
  sensorCurrent: SensorData | null;
  sensorHistory: SensorData[];
  selectedPlantId: string | null;
  careLogs: CareLog[];

  setSelectedPlantId: (id: string | null) => void;
  fetchPlants: () => Promise<void>;
  addPlant: (payload: AddPlantPayload) => Promise<Plant | null>;
  recordWater: (plantId: string, amount: number, note?: string) => Promise<void>;
  recordFertilize: (plantId: string, amount: number, note?: string) => Promise<void>;
  fetchLogs: (plantId: string) => Promise<CareLog[]>;
  updateLog: (plantId: string, logId: string, data: UpdateLogPayload) => Promise<void>;
  deleteLog: (plantId: string, logId: string) => Promise<void>;
  fetchSensorCurrent: () => Promise<void>;
  fetchSensorHistory: () => Promise<void>;
  clearError: () => void;
}

export const usePlantStore = create<PlantState>((set, get) => ({
  plants: [],
  loading: false,
  error: null,
  sensorCurrent: null,
  sensorHistory: [],
  selectedPlantId: null,
  careLogs: [],

  setSelectedPlantId: (id: string | null) => {
    set({ selectedPlantId: id });
  },

  clearError: () => {
    set({ error: null });
  },

  fetchPlants: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get<Plant[]>('/api/plants');
      set({ plants: res.data, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取植物列表失败';
      set({ error: message, loading: false });
      console.error('[fetchPlants] error:', err);
    }
  },

  addPlant: async (payload: AddPlantPayload) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post<Plant>('/api/plants', payload);
      set({ loading: false });
      await get().fetchPlants();
      return res.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : '添加植物失败';
      set({ error: message, loading: false });
      console.error('[addPlant] error:', err);
      return null;
    }
  },

  recordWater: async (plantId: string, amount: number, note?: string) => {
    set({ loading: true, error: null });
    try {
      await api.post(`/api/plants/${plantId}/water`, { amount, note });
      set({ loading: false });
      await get().fetchPlants();
    } catch (err) {
      const message = err instanceof Error ? err.message : '记录浇水失败';
      set({ error: message, loading: false });
      console.error('[recordWater] error:', err);
    }
  },

  recordFertilize: async (plantId: string, amount: number, note?: string) => {
    set({ loading: true, error: null });
    try {
      await api.post(`/api/plants/${plantId}/fertilize`, { amount, note });
      set({ loading: false });
      await get().fetchPlants();
    } catch (err) {
      const message = err instanceof Error ? err.message : '记录施肥失败';
      set({ error: message, loading: false });
      console.error('[recordFertilize] error:', err);
    }
  },

  fetchLogs: async (plantId: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get<CareLog[]>(`/api/plants/${plantId}/logs`);
      set({ careLogs: res.data, loading: false });
      return res.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取养护日志失败';
      set({ error: message, loading: false });
      console.error('[fetchLogs] error:', err);
      return [];
    }
  },

  updateLog: async (plantId: string, logId: string, data: UpdateLogPayload) => {
    set({ loading: true, error: null });
    try {
      await api.put(`/api/plants/${plantId}/logs/${logId}`, data);
      set({ loading: false });
      await get().fetchLogs(plantId);
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新日志失败';
      set({ error: message, loading: false });
      console.error('[updateLog] error:', err);
    }
  },

  deleteLog: async (plantId: string, logId: string) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/api/plants/${plantId}/logs/${logId}`);
      set({ loading: false });
      await get().fetchLogs(plantId);
    } catch (err) {
      const message = err instanceof Error ? err.message : '删除日志失败';
      set({ error: message, loading: false });
      console.error('[deleteLog] error:', err);
    }
  },

  fetchSensorCurrent: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get<SensorData>('/api/sensor/current');
      set({ sensorCurrent: res.data, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取当前传感器数据失败';
      set({ error: message, loading: false });
      console.error('[fetchSensorCurrent] error:', err);
    }
  },

  fetchSensorHistory: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get<SensorData[]>('/api/sensor/history');
      set({ sensorHistory: res.data, loading: false });
    } catch (err) {
      const message = err instanceof Error ? err.message : '获取传感器历史数据失败';
      set({ error: message, loading: false });
      console.error('[fetchSensorHistory] error:', err);
    }
  },
}));
