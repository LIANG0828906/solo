import { create } from 'zustand';
import {
  Pet, CareTask, ActivityRecord, ActivityType, TaskFilter,
  TaskStatus, calculateMood,
} from './types';
import * as api from './api';

interface PetStore {
  petList: Pet[];
  selectedPet: Pet | null;
  taskList: CareTask[];
  activities: Record<string, ActivityRecord[]>;
  appliedTasks: Set<string>;
  searchQuery: string;
  searchHistory: string[];
  recentCareSpecies: string[];
  isLoading: boolean;

  fetchPets: () => Promise<void>;
  fetchTasks: (filters?: TaskFilter) => Promise<void>;
  setSelectedPet: (pet: Pet | null) => void;
  applyCare: (taskId: string) => Promise<void>;
  logActivity: (petId: string, activityType: ActivityType) => Promise<void>;
  fetchActivities: (petId: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  addSearchHistory: (query: string) => void;
}

export const usePetStore = create<PetStore>((set, get) => ({
  petList: [],
  selectedPet: null,
  taskList: [],
  activities: {},
  appliedTasks: new Set(),
  searchQuery: '',
  searchHistory: [],
  recentCareSpecies: ['cat', 'dog', 'bird'],
  isLoading: false,

  fetchPets: async () => {
    set({ isLoading: true });
    const pets = await api.getPets();
    set({ petList: pets, isLoading: false });
  },

  fetchTasks: async (filters?: TaskFilter) => {
    set({ isLoading: true });
    const tasks = await api.getTasks(filters);
    set({ taskList: tasks, isLoading: false });
  },

  setSelectedPet: (pet: Pet | null) => {
    set({ selectedPet: pet });
  },

  applyCare: async (taskId: string) => {
    const result = await api.submitCareApplication(taskId);
    if (result.success) {
      const newApplied = new Set(get().appliedTasks);
      newApplied.add(taskId);
      const tasks = get().taskList.map(t =>
        t.id === taskId ? { ...t, applicantCount: t.applicantCount + 1, status: TaskStatus.Pending } : t
      );
      set({ appliedTasks: newApplied, taskList: tasks });

      const task = get().taskList.find(t => t.id === taskId);
      if (task) {
        const pet = get().petList.find(p => p.id === task.petId);
        if (pet) {
          const species = new Set(get().recentCareSpecies);
          species.add(pet.species);
          set({ recentCareSpecies: Array.from(species).slice(-3) });
        }
      }
    }
  },

  logActivity: async (petId: string, activityType: ActivityType) => {
    const record = await api.updateActivityLog(petId, activityType);
    const currentActivities = get().activities[petId] || [];
    const updatedActivities = [...currentActivities, record];

    const { mood, moodScore } = calculateMood(updatedActivities);

    const updatedPetList = get().petList.map(p =>
      p.id === petId ? { ...p, mood, moodScore } : p
    );
    const updatedSelectedPet = get().selectedPet?.id === petId
      ? { ...get().selectedPet!, mood, moodScore }
      : get().selectedPet;

    set({
      activities: { ...get().activities, [petId]: updatedActivities },
      petList: updatedPetList,
      selectedPet: updatedSelectedPet,
    });
  },

  fetchActivities: async (petId: string) => {
    const records = await api.getActivities(petId);
    set({ activities: { ...get().activities, [petId]: records } });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  addSearchHistory: (query: string) => {
    const history = get().searchHistory.filter(h => h !== query);
    history.unshift(query);
    set({ searchHistory: history.slice(0, 5) });
  },
}));
