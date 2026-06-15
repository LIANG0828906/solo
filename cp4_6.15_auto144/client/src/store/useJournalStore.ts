import { create } from 'zustand';
import { FoodJournal, CreateJournalDto, RadarData, CalendarDay } from '../types';
import { journalApi, analyticsApi } from '../services/api';

interface JournalState {
  entries: FoodJournal[];
  selectedEntry: FoodJournal | null;
  selectedLocation: { lat: number; lng: number } | null;
  isLoading: boolean;
  isModalOpen: boolean;
  isDetailOpen: boolean;
  radarData: RadarData | null;
  calendarData: CalendarDay[];
  error: string | null;

  fetchAll: () => Promise<void>;
  fetchRadarData: () => Promise<void>;
  fetchCalendarData: (year: number) => Promise<void>;
  addEntry: (dto: CreateJournalDto) => Promise<void>;
  updateEntry: (id: string, dto: Partial<CreateJournalDto>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  selectEntry: (entry: FoodJournal | null) => void;
  setSelectedLocation: (loc: { lat: number; lng: number } | null) => void;
  openModal: () => void;
  closeModal: () => void;
  openDetail: (entry: FoodJournal) => void;
  closeDetail: () => void;
}

export const useJournalStore = create<JournalState>((set, get) => ({
  entries: [],
  selectedEntry: null,
  selectedLocation: null,
  isLoading: false,
  isModalOpen: false,
  isDetailOpen: false,
  radarData: null,
  calendarData: [],
  error: null,

  fetchAll: async () => {
    set({ isLoading: true, error: null });
    try {
      const entries = await journalApi.getAll();
      set({ entries, isLoading: false });
    } catch (error) {
      set({ error: '加载食记失败', isLoading: false });
    }
  },

  fetchRadarData: async () => {
    try {
      const radarData = await analyticsApi.getRadarData();
      set({ radarData });
    } catch (error) {
      set({ error: '加载雷达数据失败' });
    }
  },

  fetchCalendarData: async (year: number) => {
    try {
      const calendarData = await analyticsApi.getCalendarData(year);
      set({ calendarData });
    } catch (error) {
      set({ error: '加载日历数据失败' });
    }
  },

  addEntry: async (dto: CreateJournalDto) => {
    set({ isLoading: true });
    try {
      const newEntry = await journalApi.create(dto);
      set((state) => ({
        entries: [...state.entries, newEntry],
        isModalOpen: false,
        isLoading: false,
        selectedLocation: null,
      }));
      get().fetchRadarData();
    } catch (error) {
      set({ error: '创建食记失败', isLoading: false });
    }
  },

  updateEntry: async (id: string, dto: Partial<CreateJournalDto>) => {
    set({ isLoading: true });
    try {
      const updated = await journalApi.update(id, dto);
      set((state) => ({
        entries: state.entries.map((e) => (e.id === id ? updated : e)),
        selectedEntry: updated,
        isLoading: false,
      }));
      get().fetchRadarData();
    } catch (error) {
      set({ error: '更新食记失败', isLoading: false });
    }
  },

  deleteEntry: async (id: string) => {
    set({ isLoading: true });
    try {
      await journalApi.delete(id);
      set((state) => ({
        entries: state.entries.filter((e) => e.id !== id),
        selectedEntry: null,
        isDetailOpen: false,
        isLoading: false,
      }));
      get().fetchRadarData();
    } catch (error) {
      set({ error: '删除食记失败', isLoading: false });
    }
  },

  selectEntry: (entry) => set({ selectedEntry: entry }),
  setSelectedLocation: (loc) => set({ selectedLocation: loc }),
  openModal: () => set({ isModalOpen: true }),
  closeModal: () => set({ isModalOpen: false, selectedLocation: null }),
  openDetail: (entry) => set({ selectedEntry: entry, isDetailOpen: true }),
  closeDetail: () => set({ isDetailOpen: false }),
}));
