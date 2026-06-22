import { create } from 'zustand';

interface ConfigStoreState {
  selectedProductId: string | null;
  selectedLeatherId: string | null;
  selectedThreadId: string | null;
  selectedHardwareId: string | null;
  engraving: string;
  transitionKey: number;
  setSelectedProductId: (id: string | null) => void;
  setSelectedLeatherId: (id: string | null) => void;
  setSelectedThreadId: (id: string | null) => void;
  setSelectedHardwareId: (id: string | null) => void;
  setEngraving: (text: string) => void;
  resetConfig: () => void;
}

export const useConfigStore = create<ConfigStoreState>((set) => ({
  selectedProductId: null,
  selectedLeatherId: null,
  selectedThreadId: null,
  selectedHardwareId: null,
  engraving: '',
  transitionKey: 0,

  setSelectedProductId: (id) =>
    set((state) => ({
      selectedProductId: id,
      transitionKey: state.transitionKey + 1,
    })),

  setSelectedLeatherId: (id) =>
    set({
      selectedLeatherId: id,
    }),

  setSelectedThreadId: (id) =>
    set({
      selectedThreadId: id,
    }),

  setSelectedHardwareId: (id) =>
    set({
      selectedHardwareId: id,
    }),

  setEngraving: (text) =>
    set({
      engraving: text,
    }),

  resetConfig: () =>
    set({
      selectedProductId: null,
      selectedLeatherId: null,
      selectedThreadId: null,
      selectedHardwareId: null,
      engraving: '',
    }),
}));
