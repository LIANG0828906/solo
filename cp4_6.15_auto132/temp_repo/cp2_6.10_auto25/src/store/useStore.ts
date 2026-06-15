import { create } from 'zustand';
import type { AppState, Medicine, PrescriptionItem, Prescription, PlaybackFrame, Dosage } from '../types';
import { calculateGrams } from '../utils/conversion';

const initialDecoctionState = {
  isDecocting: false,
  currentPhase: 'idle' as const,
  currentTime: 0,
  totalTime: 1800,
  waterLevel: 0,
  initialWaterLevel: 0,
  soupColor: '#f0d080',
  sedimentLevel: 0,
  playbackFrames: [] as PlaybackFrame[],
};

const initialDosage = {
  liang: 0,
  qian: 0,
  fen: 0,
  li: 0,
};

export const useStore = create<AppState & {
  setMedicines: (medicines: Medicine[]) => void;
  setActiveDrawer: (id: string | null) => void;
  setCurrentWeighingMedicine: (medicine: Medicine | null) => void;
  setCurrentDosage: (dosage: Partial<Omit<Dosage, 'grams'>>) => void;
  addPrescriptionItem: (item: PrescriptionItem) => void;
  removePrescriptionItem: (id: string) => void;
  updatePrescriptionItemConflicts: (conflicts: Array<{ medicineIds: string[]; type: string; description: string }>) => void;
  setIsShaking: (shaking: boolean) => void;
  setDecoctionState: (state: Partial<AppState['decoctionState']>) => void;
  resetDecoctionState: () => void;
  startDecoction: (initialWater: number) => void;
  addPlaybackFrame: (frame: PlaybackFrame) => void;
  setPrescriptions: (prescriptions: Prescription[]) => void;
  addPrescription: (prescription: Prescription) => void;
  setShowHistory: (show: boolean) => void;
  setSelectedPrescription: (prescription: Prescription | null) => void;
  setIsPlaybackMode: (mode: boolean) => void;
  setPlaybackIndex: (index: number) => void;
  resetPrescription: () => void;
  resetAll: () => void;
}>((set) => ({
  medicines: [],
  prescriptionItems: [],
  currentWeighingMedicine: null,
  currentDosage: initialDosage,
  decoctionState: initialDecoctionState,
  prescriptions: [],
  activeDrawer: null,
  isShaking: false,
  showHistory: false,
  selectedPrescription: null,
  isPlaybackMode: false,
  playbackIndex: 0,

  setMedicines: (medicines) => set({ medicines }),
  setActiveDrawer: (id) => set({ activeDrawer: id }),
  setCurrentWeighingMedicine: (medicine) => set({ 
    currentWeighingMedicine: medicine,
    currentDosage: medicine ? initialDosage : initialDosage,
  }),
  setCurrentDosage: (dosage) => set((state) => ({
    currentDosage: { ...state.currentDosage, ...dosage },
  })),
  addPrescriptionItem: (item) => set((state) => ({
    prescriptionItems: [...state.prescriptionItems, item],
    currentWeighingMedicine: null,
    currentDosage: initialDosage,
  })),
  removePrescriptionItem: (id) => set((state) => ({
    prescriptionItems: state.prescriptionItems.filter(item => item.id !== id),
  })),
  updatePrescriptionItemConflicts: (conflicts) => set((state) => {
    const updatedItems = state.prescriptionItems.map(item => {
      const conflict = conflicts.find(c => c.medicineIds.includes(item.medicine.id));
      if (conflict) {
        return {
          ...item,
          hasConflict: true,
          conflictInfo: `${conflict.type}：${conflict.description}`,
          conflictType: conflict.type as '十八反' | '十九畏',
        };
      }
      return { ...item, hasConflict: false, conflictInfo: undefined, conflictType: undefined };
    });
    return { prescriptionItems: updatedItems };
  }),
  setIsShaking: (shaking) => set({ isShaking: shaking }),
  setDecoctionState: (newState) => set((state) => ({
    decoctionState: { ...state.decoctionState, ...newState },
  })),
  resetDecoctionState: () => set({ decoctionState: initialDecoctionState }),
  startDecoction: (initialWater) => set({
    decoctionState: {
      ...initialDecoctionState,
      isDecocting: true,
      currentPhase: '武火',
      waterLevel: initialWater,
      initialWaterLevel: initialWater,
      playbackFrames: [],
    },
  }),
  addPlaybackFrame: (frame) => set((state) => ({
    decoctionState: {
      ...state.decoctionState,
      playbackFrames: [...state.decoctionState.playbackFrames, frame],
    },
  })),
  setPrescriptions: (prescriptions) => set({ prescriptions }),
  addPrescription: (prescription) => set((state) => ({
    prescriptions: [prescription, ...state.prescriptions],
  })),
  setShowHistory: (show) => set({ showHistory: show }),
  setSelectedPrescription: (prescription) => set({ 
    selectedPrescription: prescription,
    isPlaybackMode: false,
    playbackIndex: 0,
  }),
  setIsPlaybackMode: (mode) => set({ isPlaybackMode: mode, playbackIndex: 0 }),
  setPlaybackIndex: (index) => set({ playbackIndex: index }),
  resetPrescription: () => set({
    prescriptionItems: [],
    currentWeighingMedicine: null,
    currentDosage: initialDosage,
  }),
  resetAll: () => set({
    prescriptionItems: [],
    currentWeighingMedicine: null,
    currentDosage: initialDosage,
    decoctionState: initialDecoctionState,
    isShaking: false,
    showHistory: false,
    selectedPrescription: null,
    isPlaybackMode: false,
    playbackIndex: 0,
  }),
}));
