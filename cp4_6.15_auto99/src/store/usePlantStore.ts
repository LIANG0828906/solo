import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Plant, PlantPhoto, GrowthRecord, WateringReminder, LightRequirement, WateringFrequency } from '@/types/plant';
import { resetReminder, registerPlantReminder, cancelPlantReminder, updatePlantInReminder } from '@/services/reminderService';

interface PlantStore {
  plants: Plant[];
  currentView: 'home' | 'detail';
  selectedPlantId: string | null;
  wateringReminders: WateringReminder[];
  showAddForm: boolean;
  editingPlant: Plant | null;
  
  addPlant: (data: {
    name: string;
    species?: string;
    wateringFrequency: WateringFrequency;
    customDays?: number;
    lightRequirement: LightRequirement;
    photoUrl?: string;
  }) => void;
  
  updatePlant: (id: string, data: Partial<Plant>) => void;
  
  deletePlant: (id: string) => void;
  
  waterPlant: (id: string) => void;
  
  addGrowthRecord: (plantId: string, record: Omit<GrowthRecord, 'id' | 'date'>) => void;
  
  addPhoto: (plantId: string, photo: Omit<PlantPhoto, 'id' | 'date'>) => void;
  
  setCurrentView: (view: 'home' | 'detail', plantId?: string) => void;
  
  setShowAddForm: (show: boolean) => void;
  
  setEditingPlant: (plant: Plant | null) => void;
  
  addWateringReminder: (reminder: WateringReminder) => void;
  
  removeWateringReminder: (plantId: string) => void;
  
  loadFromStorage: () => void;
}

const STORAGE_KEY = 'plant-reminder-data';

export const usePlantStore = create<PlantStore>((set, get) => ({
  plants: [],
  currentView: 'home',
  selectedPlantId: null,
  wateringReminders: [],
  showAddForm: false,
  editingPlant: null,

  addPlant: (data) => {
    const now = new Date().toISOString();
    const newPlant: Plant = {
      id: uuidv4(),
      name: data.name,
      species: data.species,
      wateringFrequency: data.wateringFrequency,
      customDays: data.customDays,
      lightRequirement: data.lightRequirement,
      photos: data.photoUrl
        ? [{ id: uuidv4(), url: data.photoUrl, date: now }]
        : [],
      growthRecords: [],
      createdAt: now,
    };

    set((state) => ({
      plants: [...state.plants, newPlant],
      showAddForm: false,
    }));

    registerPlantReminder(newPlant);
  },

  updatePlant: (id, data) => {
    set((state) => ({
      plants: state.plants.map((p) =>
        p.id === id ? { ...p, ...data } : p
      ),
      editingPlant: null,
    }));

    const updatedPlant = get().plants.find((p) => p.id === id);
    if (updatedPlant) {
      updatePlantInReminder(updatedPlant);
    }
  },

  deletePlant: (id) => {
    set((state) => ({
      plants: state.plants.filter((p) => p.id !== id),
      currentView: 'home',
      selectedPlantId: null,
    }));
    cancelPlantReminder(id);
  },

  waterPlant: (id) => {
    const now = new Date().toISOString();
    const waterRecord: GrowthRecord = {
      id: uuidv4(),
      type: 'water',
      date: now,
      note: '浇水',
    };

    set((state) => ({
      plants: state.plants.map((p) =>
        p.id === id
          ? {
              ...p,
              lastWateredAt: now,
              growthRecords: [waterRecord, ...p.growthRecords],
            }
          : p
      ),
      wateringReminders: state.wateringReminders.filter(
        (r) => r.plantId !== id
      ),
    }));

    resetReminder(id);
  },

  addGrowthRecord: (plantId, record) => {
    const newRecord: GrowthRecord = {
      ...record,
      id: uuidv4(),
      date: new Date().toISOString(),
    };

    set((state) => ({
      plants: state.plants.map((p) =>
        p.id === plantId
          ? { ...p, growthRecords: [newRecord, ...p.growthRecords] }
          : p
      ),
    }));
  },

  addPhoto: (plantId, photo) => {
    const newPhoto: PlantPhoto = {
      ...photo,
      id: uuidv4(),
      date: new Date().toISOString(),
    };

    const photoRecord: GrowthRecord = {
      id: uuidv4(),
      type: 'photo',
      date: new Date().toISOString(),
      note: photo.note,
      photoUrl: photo.url,
    };

    set((state) => ({
      plants: state.plants.map((p) =>
        p.id === plantId
          ? {
              ...p,
              photos: [newPhoto, ...p.photos],
              growthRecords: [photoRecord, ...p.growthRecords],
            }
          : p
      ),
    }));
  },

  setCurrentView: (view, plantId) => {
    set({
      currentView: view,
      selectedPlantId: plantId || null,
    });
  },

  setShowAddForm: (show) => {
    set({ showAddForm: show, editingPlant: null });
  },

  setEditingPlant: (plant) => {
    set({ editingPlant: plant, showAddForm: true });
  },

  addWateringReminder: (reminder) => {
    set((state) => {
      if (state.wateringReminders.find((r) => r.plantId === reminder.plantId)) {
        return state;
      }
      return {
        wateringReminders: [...state.wateringReminders, reminder],
      };
    });
  },

  removeWateringReminder: (plantId) => {
    set((state) => ({
      wateringReminders: state.wateringReminders.filter(
        (r) => r.plantId !== plantId
      ),
    }));
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored) as Plant[];
        set({ plants: data });
        data.forEach((plant) => registerPlantReminder(plant));
      }
    } catch {
      console.error('Failed to load plant data from storage');
    }
  },
}));

usePlantStore.subscribe((state) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.plants));
  } catch {
    console.error('Failed to save plant data to storage');
  }
});
