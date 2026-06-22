import { create } from 'zustand';
import type { MoodType, DiaryEntry } from './data';
import { getWeekData, getCurrentWeekNumber } from './data';
import type { WeatherElement } from './weather';

interface MoodStore {
  currentWeek: number;
  selectedElement: WeatherElement | null;
  isMoodPickerOpen: boolean;
  flashMood: MoodType | null;
  weekEntries: DiaryEntry[];
  avgMoodScore: number;

  setCurrentWeek: (week: number) => void;
  setSelectedElement: (el: WeatherElement | null) => void;
  setMoodPickerOpen: (open: boolean) => void;
  selectMood: (mood: MoodType) => void;
  clearFlash: () => void;
  goToPrevWeek: () => void;
  goToNextWeek: () => void;
}

const currentWeekNum = getCurrentWeekNumber();
const initialWeekData = getWeekData(currentWeekNum);

export const useMoodStore = create<MoodStore>((set, get) => ({
  currentWeek: currentWeekNum,
  selectedElement: null,
  isMoodPickerOpen: false,
  flashMood: null,
  weekEntries: initialWeekData.entries,
  avgMoodScore: initialWeekData.avgMoodScore,

  setCurrentWeek: (week: number) => {
    const weekData = getWeekData(week);
    set({
      currentWeek: week,
      weekEntries: weekData.entries,
      avgMoodScore: weekData.avgMoodScore,
      selectedElement: null,
    });
  },

  setSelectedElement: (el: WeatherElement | null) => {
    set({ selectedElement: el });
  },

  setMoodPickerOpen: (open: boolean) => {
    set({ isMoodPickerOpen: open });
  },

  selectMood: (mood: MoodType) => {
    set({ flashMood: mood, isMoodPickerOpen: false });
    setTimeout(() => {
      get().clearFlash();
    }, 1000);
  },

  clearFlash: () => {
    set({ flashMood: null });
  },

  goToPrevWeek: () => {
    const { currentWeek } = get();
    const newWeek = currentWeek - 1;
    if (newWeek >= 1) {
      get().setCurrentWeek(newWeek);
    }
  },

  goToNextWeek: () => {
    const { currentWeek } = get();
    const maxWeek = getCurrentWeekNumber();
    const newWeek = currentWeek + 1;
    if (newWeek <= maxWeek) {
      get().setCurrentWeek(newWeek);
    }
  },
}));
