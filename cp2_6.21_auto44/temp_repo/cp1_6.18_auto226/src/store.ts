import { create } from 'zustand';
import { DayData, MoodRecord, generateWeekData } from './hooks/useColorSpectrum';

interface AppState {
  weekData: DayData[];
  selectedDayIndex: number | null;
  panelOpen: boolean;
  starredView: boolean;
  selectDay: (index: number) => void;
  closePanel: () => void;
  toggleStar: (dayIndex: number, recordId: string) => void;
  toggleStarredView: () => void;
}

export const useStore = create<AppState>((set) => {
  const initialData = generateWeekData();
  return {
    weekData: initialData,
    selectedDayIndex: null,
    panelOpen: false,
    starredView: false,
    selectDay: (index: number) => set({ selectedDayIndex: index, panelOpen: true, starredView: false }),
    closePanel: () => set({ panelOpen: false }),
    toggleStar: (dayIndex: number, recordId: string) =>
      set((state) => {
        const newWeekData = state.weekData.map((day, i) => {
          if (i !== dayIndex) return day;
          return {
            ...day,
            records: day.records.map((r) =>
              r.id === recordId ? { ...r, starred: !r.starred } : r
            ),
          };
        });
        return { weekData: newWeekData };
      }),
    toggleStarredView: () => set((state) => ({ starredView: !state.starredView })),
  };
});
