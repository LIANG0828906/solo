import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';
import type { Plant, PlantPhoto, GrowthRecord, WateringReminder, LightRequirement, WateringFrequency, RecordType } from '@/types/plant';
import { resetReminder, registerPlantReminder, cancelPlantReminder, updatePlantInReminder } from '@/services/reminderService';

const STORAGE_VERSION = 1;

interface PersistedState {
  plants: Plant[];
  _version?: number;
}

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
  
  addGrowthRecord: (plantId: string, record: { type: RecordType; note?: string }) => void;
  
  addPhoto: (plantId: string, photo: { url: string; note?: string }) => void;
  
  setCurrentView: (view: 'home' | 'detail', plantId?: string) => void;
  
  setShowAddForm: (show: boolean) => void;
  
  setEditingPlant: (plant: Plant | null) => void;
  
  addWateringReminder: (reminder: WateringReminder) => void;
  
  removeWateringReminder: (plantId: string) => void;
  
  initializeReminders: () => void;
}

function migrateState(persisted: PersistedState): PersistedState {
  const version = persisted._version ?? 0;
  let state = persisted;

  if (version < 1) {
    if (state.plants) {
      state.plants = state.plants.map((plant) => ({
        ...plant,
        growthRecords: plant.growthRecords || [],
        photos: plant.photos || [],
      }));
    }
  }

  state._version = STORAGE_VERSION;
  return state;
}

export const usePlantStore = create<PlantStore>()(
  persist(
    (set, get) => ({
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
        const now = new Date().toISOString();
        const newPhoto: PlantPhoto = {
          ...photo,
          id: uuidv4(),
          date: now,
        };

        const photoRecord: GrowthRecord = {
          id: uuidv4(),
          type: 'photo',
          date: now,
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

      initializeReminders: () => {
        const { plants } = get();
        plants.forEach((plant) => registerPlantReminder(plant));
      },
    }),
    {
      name: 'plant-reminder-storage',
      version: STORAGE_VERSION,
      partialize: (state) => ({
        plants: state.plants,
        _version: STORAGE_VERSION,
      } satisfies PersistedState),
      migrate: (persisted, version) => {
        if (version < STORAGE_VERSION) {
          return migrateState(persisted as PersistedState);
        }
        return persisted as PersistedState;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.initializeReminders();
        }
      },
    }
  )
);
