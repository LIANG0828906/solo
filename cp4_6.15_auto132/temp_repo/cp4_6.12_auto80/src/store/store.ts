import { create } from 'zustand';
import { calculateSunPosition, DateTimeInput, SunPosition } from '../data/sunCalculator';

interface AppState {
  dateTime: DateTimeInput;
  sunPosition: SunPosition;
  selectedBuildingId: string | null;
  setDateTime: (dateTime: DateTimeInput) => void;
  setSelectedBuildingId: (id: string | null) => void;
}

const initialDateTime: DateTimeInput = {
  dayOfYear: 15,
  hours: 10.5,
};

const initialSunPosition = calculateSunPosition(initialDateTime);

export const useAppStore = create<AppState>((set) => ({
  dateTime: initialDateTime,
  sunPosition: initialSunPosition,
  selectedBuildingId: null,
  setDateTime: (dateTime) =>
    set(() => ({
      dateTime,
      sunPosition: calculateSunPosition(dateTime),
    })),
  setSelectedBuildingId: (id) => set(() => ({ selectedBuildingId: id })),
}));
