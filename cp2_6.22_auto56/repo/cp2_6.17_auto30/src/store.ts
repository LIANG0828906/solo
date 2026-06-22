import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Plant, CareRecord, WeatherData, Reminder, CareType, ReminderType } from './types';
import { SPECIES_PRESETS } from './types';
import { getWeather, willRainSoon } from './weather';
import { formatDate, addDays, daysFromToday, today } from './utils/dateUtils';
import { loadPlants, savePlants, loadCareRecords, saveCareRecords } from './utils/idb';

interface StoreState {
  plants: Plant[];
  careRecords: CareRecord[];
  weather: WeatherData;
  reminders: Reminder[];
  isLoading: boolean;
  initData: () => Promise<void>;
  addPlant: (plant: Omit<Plant, 'id' | 'isFavorite'>) => void;
  updatePlant: (id: string, updates: Partial<Plant>) => void;
  deletePlant: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addCareRecord: (plantId: string, type: CareType, note?: string) => void;
  markReminderComplete: (reminderId: string) => void;
  refreshWeather: () => void;
  recalculateReminders: () => void;
}

function generateMockPlants(): Plant[] {
  const names = ['小绿', '萌萌', '球球', '胖胖', '圆圆', '肉肉', '豆豆', '花花', '叶叶', '苗苗'];
  const locations = ['阳台', '客厅', '卧室', '书房', '露台'];
  const plants: Plant[] = [];
  for (let i = 0; i < 100; i++) {
    const preset = SPECIES_PRESETS[i % SPECIES_PRESETS.length];
    const purchaseDate = formatDate(addDays(new Date(), -Math.floor(Math.random() * 365)));
    const offset = preset.wateringInterval - 5 + Math.floor(Math.random() * 10);
    const lastWateringDaysAgo = Math.max(0, offset);
    plants.push({
      id: uuidv4(),
      name: `${names[i % names.length]}${Math.floor(i / names.length) + 1}`,
      species: preset.name,
      photoUrl: '',
      purchaseDate,
      location: locations[i % locations.length],
      isFavorite: i < 10,
      lightPreference: preset.lightPreference,
      wateringInterval: preset.wateringInterval,
      lastWateringDate: formatDate(addDays(new Date(), -lastWateringDaysAgo)),
      lastFertilizingDate: formatDate(addDays(new Date(), -(55 + Math.floor(Math.random() * 20)))),
      lastRepottingDate: formatDate(addDays(new Date(), -(350 + Math.floor(Math.random() * 50)))),
      lastSoilLooseningDate: formatDate(addDays(new Date(), -(80 + Math.floor(Math.random() * 30))))
    });
  }
  return plants;
}

function generateMockRecords(plants: Plant[]): CareRecord[] {
  const records: CareRecord[] = [];
  const types: CareType[] = ['watering', 'fertilizing', 'repotting', 'soilLoosening'];
  for (const plant of plants.slice(0, 30)) {
    for (let i = 0; i < 5; i++) {
      records.push({
        id: uuidv4(),
        plantId: plant.id,
        type: types[i % types.length],
        date: formatDate(addDays(new Date(), -Math.floor(Math.random() * 60)))
      });
    }
  }
  return records;
}

function calculateReminders(plants: Plant[], weather: WeatherData): Reminder[] {
  const reminders: Reminder[] = [];
  const rainComing = willRainSoon(weather);
  const todayStr = today();

  for (const plant of plants) {
    const reminderTypes: { type: ReminderType; lastDate?: string; interval: number }[] = [
      { type: 'watering', lastDate: plant.lastWateringDate, interval: plant.wateringInterval },
      { type: 'fertilizing', lastDate: plant.lastFertilizingDate, interval: 60 },
      { type: 'repotting', lastDate: plant.lastRepottingDate, interval: 365 },
      { type: 'soilLoosening', lastDate: plant.lastSoilLooseningDate, interval: 90 }
    ];

    for (const { type, lastDate, interval } of reminderTypes) {
      const baseDate = lastDate || plant.purchaseDate;
      let dueDate = formatDate(addDays(baseDate, interval));
      let delayedByWeather = false;

      if (type === 'watering' && rainComing && plant.location === '露台') {
        dueDate = formatDate(addDays(dueDate, 2));
        delayedByWeather = true;
      }

      const daysLeft = daysFromToday(dueDate);
      if (daysLeft <= 7) {
        reminders.push({
          id: `${plant.id}-${type}`,
          plantId: plant.id,
          type,
          dueDate,
          status: 'pending',
          daysLeft,
          delayedByWeather
        });
      }
    }
  }

  reminders.sort((a, b) => a.daysLeft - b.daysLeft);
  return reminders;
}

export const useStore = create<StoreState>((set, get) => ({
  plants: [],
  careRecords: [],
  weather: getWeather(),
  reminders: [],
  isLoading: false,

  initData: async () => {
    set({ isLoading: true });
    try {
      let plants = await loadPlants();
      let records = await loadCareRecords();

      const needsReset = plants.length === 0 || !plants[0].lastFertilizingDate;
      if (needsReset) {
        plants = generateMockPlants();
        records = generateMockRecords(plants);
        await savePlants(plants);
        await saveCareRecords(records);
      }

      const weather = getWeather();
      const reminders = calculateReminders(plants, weather);
      set({ plants, careRecords: records, weather, reminders, isLoading: false });
    } catch (error) {
      console.error('Failed to init data:', error);
      const plants = generateMockPlants();
      const records = generateMockRecords(plants);
      const weather = getWeather();
      const reminders = calculateReminders(plants, weather);
      set({ plants, careRecords: records, weather, reminders, isLoading: false });
    }
  },

  addPlant: (plantData) => {
    const newPlant: Plant = {
      ...plantData,
      id: uuidv4(),
      isFavorite: false
    };
    const plants = [...get().plants, newPlant];
    savePlants(plants);
    const reminders = calculateReminders(plants, get().weather);
    set({ plants, reminders });
  },

  updatePlant: (id, updates) => {
    const plants = get().plants.map(p =>
      p.id === id ? { ...p, ...updates } : p
    );
    savePlants(plants);
    const reminders = calculateReminders(plants, get().weather);
    set({ plants, reminders });
  },

  deletePlant: (id) => {
    const plants = get().plants.filter(p => p.id !== id);
    const careRecords = get().careRecords.filter(r => r.plantId !== id);
    savePlants(plants);
    saveCareRecords(careRecords);
    const reminders = calculateReminders(plants, get().weather);
    set({ plants, careRecords, reminders });
  },

  toggleFavorite: (id) => {
    const plants = get().plants.map(p =>
      p.id === id ? { ...p, isFavorite: !p.isFavorite } : p
    );
    savePlants(plants);
    set({ plants });
  },

  addCareRecord: (plantId, type, note) => {
    const record: CareRecord = {
      id: uuidv4(),
      plantId,
      type,
      date: today(),
      note
    };
    const careRecords = [...get().careRecords, record];

    const lastDateKey = `last${type.charAt(0).toUpperCase() + type.slice(1)}Date` as keyof Plant;
    const plants = get().plants.map(p =>
      p.id === plantId ? { ...p, [lastDateKey]: today() } as Plant : p
    );

    saveCareRecords(careRecords);
    savePlants(plants);
    const reminders = calculateReminders(plants, get().weather);
    set({ plants, careRecords, reminders });
  },

  markReminderComplete: (reminderId) => {
    const reminder = get().reminders.find(r => r.id === reminderId);
    if (!reminder) return;

    const lastDateKey = `last${reminder.type.charAt(0).toUpperCase() + reminder.type.slice(1)}Date` as keyof Plant;
    const plants = get().plants.map(p =>
      p.id === reminder.plantId ? { ...p, [lastDateKey]: today() } as Plant : p
    );

    const record: CareRecord = {
      id: uuidv4(),
      plantId: reminder.plantId,
      type: reminder.type,
      date: today()
    };
    const careRecords = [...get().careRecords, record];

    savePlants(plants);
    saveCareRecords(careRecords);
    const reminders = calculateReminders(plants, get().weather);
    set({ plants, careRecords, reminders });
  },

  refreshWeather: () => {
    const weather = getWeather();
    const reminders = calculateReminders(get().plants, weather);
    set({ weather, reminders });
  },

  recalculateReminders: () => {
    const reminders = calculateReminders(get().plants, get().weather);
    set({ reminders });
  }
}));
