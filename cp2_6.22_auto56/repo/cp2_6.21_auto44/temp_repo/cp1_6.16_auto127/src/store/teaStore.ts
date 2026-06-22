import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { TEA_VARIETIES, TeaVariety, FlavorDimension, calculateFlavorProfile } from '../utils/flavorProfile';

export interface TeaRecord {
  id: string;
  teaId: string;
  teaName: string;
  teaColor: string;
  temperature: number;
  brewTime: number;
  flavorProfile: Record<FlavorDimension, number>;
  rating: number;
  notes: string;
  thumbnail: string;
  createdAt: number;
}

interface TeaState {
  varieties: TeaVariety[];
  currentTeaId: string;
  temperature: number;
  brewTime: number;
  rating: number;
  notes: string;
  records: TeaRecord[];
  setCurrentTea: (id: string) => void;
  setTemperature: (temp: number) => void;
  setBrewTime: (time: number) => void;
  setRating: (rating: number) => void;
  setNotes: (notes: string) => void;
  saveRecord: (thumbnail: string) => void;
  loadRecord: (record: TeaRecord) => void;
  getCurrentFlavorProfile: () => Record<FlavorDimension, number>;
  getCurrentTea: () => TeaVariety | undefined;
}

const defaultTea = TEA_VARIETIES[0];

export const useTeaStore = create<TeaState>((set, get) => ({
  varieties: TEA_VARIETIES,
  currentTeaId: defaultTea.id,
  temperature: defaultTea.optimalTemp,
  brewTime: defaultTea.optimalTime,
  rating: 0,
  notes: '',
  records: [],

  setCurrentTea: (id: string) => {
    const tea = TEA_VARIETIES.find(t => t.id === id);
    if (tea) {
      set({
        currentTeaId: id,
        temperature: tea.optimalTemp,
        brewTime: tea.optimalTime
      });
    }
  },

  setTemperature: (temp: number) => set({ temperature: Math.max(60, Math.min(100, temp)) }),

  setBrewTime: (time: number) => set({ brewTime: Math.max(30, Math.min(300, time)) }),

  setRating: (rating: number) => set({ rating: Math.max(0, Math.min(5, rating)) }),

  setNotes: (notes: string) => set({ notes }),

  saveRecord: (thumbnail: string) => {
    const state = get();
    const tea = state.getCurrentTea();
    if (!tea) return;

    const newRecord: TeaRecord = {
      id: uuidv4(),
      teaId: tea.id,
      teaName: tea.name,
      teaColor: tea.color,
      temperature: state.temperature,
      brewTime: state.brewTime,
      flavorProfile: state.getCurrentFlavorProfile(),
      rating: state.rating,
      notes: state.notes,
      thumbnail,
      createdAt: Date.now()
    };

    set(state => ({
      records: [newRecord, ...state.records],
      rating: 0,
      notes: ''
    }));
  },

  loadRecord: (record: TeaRecord) => {
    set({
      currentTeaId: record.teaId,
      temperature: record.temperature,
      brewTime: record.brewTime,
      rating: record.rating,
      notes: record.notes
    });
  },

  getCurrentFlavorProfile: () => {
    const state = get();
    const tea = state.getCurrentTea();
    if (!tea) return {} as Record<FlavorDimension, number>;
    return calculateFlavorProfile(tea, state.temperature, state.brewTime);
  },

  getCurrentTea: () => {
    const state = get();
    return TEA_VARIETIES.find(t => t.id === state.currentTeaId);
  }
}));
