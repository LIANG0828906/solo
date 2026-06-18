import { create } from 'zustand';
import { AppState, AppActions, Note, User } from '../types';

const initialState: AppState = {
  user: null,
  notes: [],
  selectedNotes: [],
  filterFamily: null,
  isOnline: navigator.onLine,
  mapZoom: 1,
  mapOffset: { x: 0, y: 0 },
  sidebarOpen: true,
  comparePanelOpen: false,
};

export const useAppStore = create<AppState & AppActions>((set) => ({
  ...initialState,

  setUser: (user: User | null) => set({ user }),

  setNotes: (notes: Note[]) => set({ notes }),

  addNote: (note: Note) =>
    set((state) => ({
      notes: [note, ...state.notes],
    })),

  removeNote: (id: number) =>
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      selectedNotes: state.selectedNotes.filter((nid) => nid !== id),
    })),

  toggleNoteSelection: (id: number) =>
    set((state) => {
      const isSelected = state.selectedNotes.includes(id);
      let newSelected = isSelected
        ? state.selectedNotes.filter((nid) => nid !== id)
        : [...state.selectedNotes, id];
      
      if (newSelected.length > 2) {
        newSelected = newSelected.slice(-2);
      }
      
      return {
        selectedNotes: newSelected,
        comparePanelOpen: newSelected.length === 2,
      };
    }),

  clearSelection: () =>
    set({
      selectedNotes: [],
      comparePanelOpen: false,
    }),

  setFilterFamily: (family: string | null) => set({ filterFamily: family }),

  setIsOnline: (online: boolean) => set({ isOnline: online }),

  setMapZoom: (zoom: number) => set({ mapZoom: zoom }),

  setMapOffset: (offset: { x: number; y: number }) => set({ mapOffset: offset }),

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  toggleComparePanel: () =>
    set((state) => ({ comparePanelOpen: !state.comparePanelOpen })),
}));
