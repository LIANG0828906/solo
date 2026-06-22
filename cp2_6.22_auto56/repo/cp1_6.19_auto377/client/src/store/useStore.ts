import { create } from 'zustand';
import axios from 'axios';
import { Device, Reservation, ReservationFormData, DeviceType } from '../types';
import { checkAllOverdue } from '../services/overdueService';

interface AppState {
  devices: Device[];
  reservations: Reservation[];
  loading: boolean;
  currentView: 'devices' | 'reservations';
  selectedDevice: Device | null;
  filterType: DeviceType;
  overdueCount: number;

  setCurrentView: (view: 'devices' | 'reservations') => void;
  setSelectedDevice: (device: Device | null) => void;
  setFilterType: (type: DeviceType) => void;
  fetchDevices: () => Promise<void>;
  submitReservation: (data: ReservationFormData) => Promise<{ success: boolean; message: string }>;
  fetchReservations: () => Promise<void>;
  checkStockAvailability: (deviceId: string, startDate: string, endDate: string, timeSlots: string[]) => Promise<boolean>;
  updateOverdueStatus: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  devices: [],
  reservations: [],
  loading: false,
  currentView: 'devices',
  selectedDevice: null,
  filterType: '全部',
  overdueCount: 0,

  setCurrentView: (view) => set({ currentView: view }),
  setSelectedDevice: (device) => set({ selectedDevice: device }),
  setFilterType: (type) => set({ filterType: type }),

  fetchDevices: async () => {
    set({ loading: true });
    try {
      const response = await axios.get<Device[]>('/api/devices');
      set({ devices: response.data });
    } catch (error) {
      console.error('获取设备列表失败:', error);
    } finally {
      set({ loading: false });
    }
  },

  submitReservation: async (data) => {
    try {
      const response = await axios.post<{ success: boolean; message: string; reservation: Reservation }>(
        '/api/reservations',
        data
      );
      if (response.data.success) {
        set((state) => ({
          reservations: [...state.reservations, response.data.reservation],
        }));
        get().updateOverdueStatus();
      }
      return { success: response.data.success, message: response.data.message };
    } catch (error) {
      console.error('提交预约失败:', error);
      return { success: false, message: '提交失败，请稍后重试' };
    }
  },

  fetchReservations: async () => {
    try {
      const response = await axios.get<Reservation[]>('/api/reservations');
      set({ reservations: response.data });
      get().updateOverdueStatus();
    } catch (error) {
      console.error('获取预约记录失败:', error);
    }
  },

  checkStockAvailability: async (deviceId, startDate, endDate, timeSlots) => {
    try {
      const response = await axios.post<{ available: boolean }>('/api/reservations/check-stock', {
        deviceId,
        startDate,
        endDate,
        timeSlots,
      });
      return response.data.available;
    } catch (error) {
      console.error('检查库存失败:', error);
      return false;
    }
  },

  updateOverdueStatus: () => {
    const { reservations } = get();
    const updated = checkAllOverdue(reservations);
    const overdueCount = updated.filter((r) => r.isOverdue).length;
    set({ reservations: updated, overdueCount });
  },
}));
