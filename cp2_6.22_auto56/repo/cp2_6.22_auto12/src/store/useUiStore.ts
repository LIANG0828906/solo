import { create } from 'zustand';

interface UiState {
  showCreateTripModal: boolean;
  showActivityForm: boolean;
  editingActivityId: string | null;
  selectedDayIndex: number;
  selectedLocationId: string | null;
  isAnimating: boolean;
  
  setShowCreateTripModal: (show: boolean) => void;
  setShowActivityForm: (show: boolean) => void;
  setEditingActivityId: (id: string | null) => void;
  setSelectedDayIndex: (index: number) => void;
  setSelectedLocationId: (id: string | null) => void;
  setIsAnimating: (animating: boolean) => void;
  
  reset: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  showCreateTripModal: false,
  showActivityForm: false,
  editingActivityId: null,
  selectedDayIndex: 0,
  selectedLocationId: null,
  isAnimating: false,

  setShowCreateTripModal: (show) => set({ showCreateTripModal: show }),
  setShowActivityForm: (show) => set({ showActivityForm: show }),
  setEditingActivityId: (id) => set({ editingActivityId: id }),
  setSelectedDayIndex: (index) => set({ selectedDayIndex: index }),
  setSelectedLocationId: (id) => set({ selectedLocationId: id }),
  setIsAnimating: (animating) => set({ isAnimating: animating }),

  reset: () => set({
    showCreateTripModal: false,
    showActivityForm: false,
    editingActivityId: null,
    selectedDayIndex: 0,
    selectedLocationId: null,
    isAnimating: false,
  }),
}));
