import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Person, Reminder } from '@/types';
import { hashStringToColor } from '@/utils/colorUtils';

interface BirthdayState {
  people: Person[];
  reminders: Reminder[];
  selectedPerson: Person | null;
  isGiftModalOpen: boolean;
  isAddModalOpen: boolean;
  isEditModalOpen: boolean;
  newestPersonId: string | null;

  addPerson: (person: Omit<Person, 'id' | 'createdAt' | 'avatarColor'>) => void;
  updatePerson: (id: string, updates: Partial<Person>) => void;
  deletePerson: (id: string) => void;
  selectPerson: (person: Person | null) => void;
  openGiftModal: (person: Person) => void;
  closeGiftModal: () => void;
  openAddModal: () => void;
  closeAddModal: () => void;
  openEditModal: (person: Person) => void;
  closeEditModal: () => void;
  exportToJSON: () => void;
  loadFromStorage: () => void;
  clearNewestPersonId: () => void;
  saveToStorage: () => void;
}

const STORAGE_KEY = 'birthday-reminder-data';

export const useBirthdayStore = create<BirthdayState>((set, get) => ({
  people: [],
  reminders: [],
  selectedPerson: null,
  isGiftModalOpen: false,
  isAddModalOpen: false,
  isEditModalOpen: false,
  newestPersonId: null,

  addPerson: (personData) => {
    const newPerson: Person = {
      ...personData,
      id: uuidv4(),
      createdAt: Date.now(),
      avatarColor: hashStringToColor(personData.name),
    };

    set((state) => ({
      people: [...state.people, newPerson],
      newestPersonId: newPerson.id,
    }));

    get().saveToStorage();
  },

  updatePerson: (id, updates) => {
    set((state) => ({
      people: state.people.map((p) =>
        p.id === id ? { ...p, ...updates } : p
      ),
    }));
    get().saveToStorage();
  },

  deletePerson: (id) => {
    set((state) => ({
      people: state.people.filter((p) => p.id !== id),
    }));
    get().saveToStorage();
  },

  selectPerson: (person) => {
    set({ selectedPerson: person });
  },

  openGiftModal: (person) => {
    set({ selectedPerson: person, isGiftModalOpen: true });
  },

  closeGiftModal: () => {
    set({ isGiftModalOpen: false });
  },

  openAddModal: () => {
    set({ isAddModalOpen: true });
  },

  closeAddModal: () => {
    set({ isAddModalOpen: false });
  },

  openEditModal: (person) => {
    set({ selectedPerson: person, isEditModalOpen: true });
  },

  closeEditModal: () => {
    set({ isEditModalOpen: false });
  },

  exportToJSON: () => {
    const state = get();
    const data = {
      people: state.people,
      reminders: state.reminders,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `birthday-reminder-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  loadFromStorage: () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        set({
          people: data.people || [],
          reminders: data.reminders || [],
        });
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  },

  clearNewestPersonId: () => {
    set({ newestPersonId: null });
  },

  saveToStorage: () => {
    try {
      const state = get();
      const data = {
        people: state.people,
        reminders: state.reminders,
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  },
}));
