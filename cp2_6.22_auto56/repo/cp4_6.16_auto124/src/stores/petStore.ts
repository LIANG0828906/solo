import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { get, set } from 'idb-keyval';
import { v4 as uuidv4 } from 'uuid';
import type { Pet, VaccineRecord, DietRecord, WalkRecord } from '@/types';

interface PetState {
  pets: Pet[];
  vaccines: VaccineRecord[];
  dietRecords: DietRecord[];
  walkRecords: WalkRecord[];
  loading: boolean;
  addPet: (pet: Omit<Pet, 'id' | 'colorScheme'> & { colorScheme?: string }) => void;
  updatePet: (id: string, data: Partial<Pet>) => void;
  deletePet: (id: string) => void;
  addVaccine: (vaccine: Omit<VaccineRecord, 'id'>) => void;
  updateVaccine: (id: string, data: Partial<VaccineRecord>) => void;
  addDietRecord: (record: Omit<DietRecord, 'id'>) => void;
  addWalkRecord: (record: Omit<WalkRecord, 'id'>) => void;
  checkDueVaccines: (days?: number) => VaccineRecord[];
  getPetVaccines: (petId: string) => VaccineRecord[];
  getPetDietRecords: (petId: string) => DietRecord[];
  getPetWalkRecords: (petId: string) => WalkRecord[];
}

const idbStorage = {
  getItem: async (name: string) => {
    const value = await get(name);
    return value ? JSON.stringify(value) : null;
  },
  setItem: async (name: string, value: string) => {
    await set(name, JSON.parse(value));
  },
  removeItem: async (_name: string) => {
    // idb-keyval doesn't have a direct remove, we'll skip for now
  },
};

const breedColorSchemes: Record<string, string> = {
  '橘猫': '#FF9800',
  '橘': '#FF9800',
  'orange': '#FF9800',
  '哈士奇': '#607D8B',
  'husk': '#607D8B',
  '金毛': '#FFB74D',
  'golden': '#FFB74D',
  '柯基': '#FFCC80',
  'corgi': '#FFCC80',
  '布偶': '#E1BEE7',
  'ragdoll': '#E1BEE7',
  '英短': '#90CAF9',
  'british': '#90CAF9',
  '美短': '#A5D6A7',
  'american': '#A5D6A7',
  '泰迪': '#BCAAA4',
  'teddy': '#BCAAA4',
  '比熊': '#F5F5F5',
  'bichon': '#F5F5F5',
  '边牧': '#7986CB',
  'border': '#7986CB',
  '法斗': '#FFCCBC',
  'french': '#FFCCBC',
};

function getColorSchemeForBreed(breed: string): string {
  const lowerBreed = breed.toLowerCase();
  for (const [key, color] of Object.entries(breedColorSchemes)) {
    if (lowerBreed.includes(key.toLowerCase())) {
      return color;
    }
  }
  return '#BCAAA4';
}

export const usePetStore = create<PetState>()(
  persist(
    (set, get) => ({
      pets: [],
      vaccines: [],
      dietRecords: [],
      walkRecords: [],
      loading: false,

      addPet: (pet) => {
        const newPet: Pet = {
          ...pet,
          id: uuidv4(),
          colorScheme: pet.colorScheme || getColorSchemeForBreed(pet.breed),
        };
        set((state) => ({ pets: [...state.pets, newPet] }));
      },

      updatePet: (id, data) => {
        set((state) => ({
          pets: state.pets.map((pet) =>
            pet.id === id ? { ...pet, ...data } : pet
          ),
        }));
      },

      deletePet: (id) => {
        set((state) => ({
          pets: state.pets.filter((pet) => pet.id !== id),
          vaccines: state.vaccines.filter((v) => v.petId !== id),
          dietRecords: state.dietRecords.filter((r) => r.petId !== id),
          walkRecords: state.walkRecords.filter((r) => r.petId !== id),
        }));
      },

      addVaccine: (vaccine) => {
        const newVaccine: VaccineRecord = {
          ...vaccine,
          id: uuidv4(),
        };
        set((state) => ({ vaccines: [...state.vaccines, newVaccine] }));
      },

      updateVaccine: (id, data) => {
        set((state) => ({
          vaccines: state.vaccines.map((v) =>
            v.id === id ? { ...v, ...data } : v
          ),
        }));
      },

      addDietRecord: (record) => {
        const newRecord: DietRecord = {
          ...record,
          id: uuidv4(),
        };
        set((state) => ({ dietRecords: [...state.dietRecords, newRecord] }));
      },

      addWalkRecord: (record) => {
        const newRecord: WalkRecord = {
          ...record,
          id: uuidv4(),
        };
        set((state) => ({ walkRecords: [...state.walkRecords, newRecord] }));
      },

      checkDueVaccines: (days = 3) => {
        const { vaccines } = get();
        const now = new Date();
        const thresholdDate = new Date();
        thresholdDate.setDate(now.getDate() + days);

        return vaccines.filter((v) => {
          if (v.isDone) return false;
          const dueDate = new Date(v.nextDueDate);
          return dueDate <= thresholdDate && dueDate >= now;
        });
      },

      getPetVaccines: (petId) => {
        return get().vaccines.filter((v) => v.petId === petId);
      },

      getPetDietRecords: (petId) => {
        return get().dietRecords.filter((r) => r.petId === petId);
      },

      getPetWalkRecords: (petId) => {
        return get().walkRecords.filter((r) => r.petId === petId);
      },
    }),
    {
      name: 'pet-care-storage',
      storage: createJSONStorage(() => idbStorage),
    }
  )
);
