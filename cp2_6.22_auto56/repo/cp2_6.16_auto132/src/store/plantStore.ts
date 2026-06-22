import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { get, set } from 'idb-keyval';
import { getPlantInfo, getWateringInterval, getLightRequirement, getPlantEmoji } from '../utils/plantData';

export interface Plant {
  id: string;
  name: string;
  species: string;
  purchaseDate: string;
  avatar: string | null;
  emoji: string;
  wateringInterval: number;
  lightRequirement: string;
  notes: string;
  createdAt: string;
}

export interface CareRecord {
  id: string;
  plantId: string;
  type: 'watering' | 'fertilizing' | 'repotting';
  date: string;
  notes: string;
  completed: boolean;
  createdAt: string;
}

interface PlantStore {
  plants: Plant[];
  careRecords: CareRecord[];
  isLoading: boolean;
  initialized: boolean;
  
  initStore: () => Promise<void>;
  savePlantsToDB: () => Promise<void>;
  saveRecordsToDB: () => Promise<void>;
  
  addPlant: (plant: Omit<Plant, 'id' | 'createdAt' | 'wateringInterval' | 'lightRequirement' | 'emoji'>) => void;
  updatePlant: (id: string, updates: Partial<Plant>) => void;
  deletePlant: (id: string) => void;
  getPlantById: (id: string) => Plant | undefined;
  
  addCareRecord: (record: Omit<CareRecord, 'id' | 'createdAt'>) => void;
  updateCareRecord: (id: string, updates: Partial<CareRecord>) => void;
  deleteCareRecord: (id: string) => void;
  getRecordsByPlantId: (plantId: string) => CareRecord[];
  getRecordsByType: (plantId: string, type: 'watering' | 'fertilizing' | 'repotting') => CareRecord[];
  getLastWateringDate: (plantId: string) => string | null;
  
  toggleRecordCompletion: (id: string) => void;
  
  generateMockData: () => void;
}

export const usePlantStore = create<PlantStore>((set, get) => ({
  plants: [],
  careRecords: [],
  isLoading: false,
  initialized: false,

  initStore: async () => {
    if (get().initialized) return;
    
    set({ isLoading: true });
    try {
      const savedPlants = await get<Plant[]>('plants');
      const savedRecords = await get<CareRecord[]>('careRecords');
      
      if (savedPlants && savedPlants.length > 0) {
        set({ plants: savedPlants });
      }
      if (savedRecords && savedRecords.length > 0) {
        set({ careRecords: savedRecords });
      }
      
      if ((!savedPlants || savedPlants.length === 0) && (!savedRecords || savedRecords.length === 0)) {
        get().generateMockData();
      }
      
      set({ initialized: true });
    } catch (error) {
      console.error('Failed to init store:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  savePlantsToDB: async () => {
    try {
      await set('plants', get().plants);
    } catch (error) {
      console.error('Failed to save plants:', error);
    }
  },

  saveRecordsToDB: async () => {
    try {
      await set('careRecords', get().careRecords);
    } catch (error) {
      console.error('Failed to save records:', error);
    }
  },

  addPlant: (plantData) => {
    const speciesInfo = getPlantInfo(plantData.species);
    const newPlant: Plant = {
      ...plantData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      wateringInterval: getWateringInterval(plantData.species),
      lightRequirement: getLightRequirement(plantData.species),
      emoji: getPlantEmoji(plantData.species)
    };
    
    set((state) => ({ plants: [...state.plants, newPlant] }));
    get().savePlantsToDB();
  },

  updatePlant: (id, updates) => {
    set((state) => ({
      plants: state.plants.map((plant) =>
        plant.id === id ? { ...plant, ...updates } : plant
      )
    }));
    get().savePlantsToDB();
  },

  deletePlant: (id) => {
    set((state) => ({
      plants: state.plants.filter((plant) => plant.id !== id),
      careRecords: state.careRecords.filter((record) => record.plantId !== id)
    }));
    get().savePlantsToDB();
    get().saveRecordsToDB();
  },

  getPlantById: (id) => {
    return get().plants.find((plant) => plant.id === id);
  },

  addCareRecord: (recordData) => {
    const newRecord: CareRecord = {
      ...recordData,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    };
    
    set((state) => ({ careRecords: [...state.careRecords, newRecord] }));
    get().saveRecordsToDB();
  },

  updateCareRecord: (id, updates) => {
    set((state) => ({
      careRecords: state.careRecords.map((record) =>
        record.id === id ? { ...record, ...updates } : record
      )
    }));
    get().saveRecordsToDB();
  },

  deleteCareRecord: (id) => {
    set((state) => ({
      careRecords: state.careRecords.filter((record) => record.id !== id)
    }));
    get().saveRecordsToDB();
  },

  getRecordsByPlantId: (plantId) => {
    return get().careRecords
      .filter((record) => record.plantId === plantId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getRecordsByType: (plantId, type) => {
    return get().careRecords
      .filter((record) => record.plantId === plantId && record.type === type)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  },

  getLastWateringDate: (plantId) => {
    const wateringRecords = get()
      .getRecordsByType(plantId, 'watering')
      .filter((r) => r.completed);
    
    if (wateringRecords.length === 0) return null;
    return wateringRecords[0].date;
  },

  toggleRecordCompletion: (id) => {
    set((state) => ({
      careRecords: state.careRecords.map((record) =>
        record.id === id ? { ...record, completed: !record.completed } : record
      )
    }));
    get().saveRecordsToDB();
  },

  generateMockData: () => {
    const mockPlants: Plant[] = [
      {
        id: uuidv4(),
        name: '小绿',
        species: '绿萝',
        purchaseDate: '2026-03-15',
        avatar: null,
        emoji: '🌿',
        wateringInterval: 7,
        lightRequirement: '散射光',
        notes: '放在客厅角落',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: '肉肉',
        species: '多肉',
        purchaseDate: '2026-02-20',
        avatar: null,
        emoji: '🌵',
        wateringInterval: 14,
        lightRequirement: '充足阳光',
        notes: '阳台养护',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: '小龟',
        species: '龟背竹',
        purchaseDate: '2026-01-10',
        avatar: null,
        emoji: '🍃',
        wateringInterval: 10,
        lightRequirement: '散射光',
        notes: '书房装饰',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: '琴琴',
        species: '琴叶榕',
        purchaseDate: '2026-04-05',
        avatar: null,
        emoji: '🌳',
        wateringInterval: 7,
        lightRequirement: '明亮散射光',
        notes: '客厅C位',
        createdAt: new Date().toISOString()
      },
      {
        id: uuidv4(),
        name: '小兰',
        species: '吊兰',
        purchaseDate: '2026-03-28',
        avatar: null,
        emoji: '🌱',
        wateringInterval: 5,
        lightRequirement: '半阴',
        notes: '厨房窗台',
        createdAt: new Date().toISOString()
      }
    ];

    const today = new Date();
    const mockRecords: CareRecord[] = [];

    mockPlants.forEach((plant) => {
      for (let i = 0; i < 8; i++) {
        const daysAgo = Math.floor(Math.random() * 60) + 1;
        const recordDate = new Date(today);
        recordDate.setDate(recordDate.getDate() - daysAgo);
        
        const types: Array<'watering' | 'fertilizing' | 'repotting'> = ['watering', 'watering', 'watering', 'fertilizing', 'repotting'];
        const type = types[Math.floor(Math.random() * types.length)];
        
        mockRecords.push({
          id: uuidv4(),
          plantId: plant.id,
          type,
          date: recordDate.toISOString().split('T')[0],
          notes: type === 'watering' ? '正常浇水' : type === 'fertilizing' ? '施加有机肥' : '更换营养土',
          completed: true,
          createdAt: new Date().toISOString()
        });
      }
      
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      mockRecords.push({
        id: uuidv4(),
        plantId: plant.id,
        type: 'watering',
        date: tomorrow.toISOString().split('T')[0],
        notes: '计划浇水',
        completed: false,
        createdAt: new Date().toISOString()
      });
      
      const dayAfter = new Date(today);
      dayAfter.setDate(dayAfter.getDate() + 2);
      mockRecords.push({
        id: uuidv4(),
        plantId: plant.id,
        type: 'fertilizing',
        date: dayAfter.toISOString().split('T')[0],
        notes: '计划施肥',
        completed: false,
        createdAt: new Date().toISOString()
      });
    });

    set({ plants: mockPlants, careRecords: mockRecords });
    get().savePlantsToDB();
    get().saveRecordsToDB();
  }
}));
