import { create } from 'zustand';
import { BrewingRecord, FlavorRating, PourStage } from '../modules/brewing/BrewingService';
import { CommunityFilters, DEFAULT_FILTERS } from '../modules/community/CommunityService';

type Page = 'brewing' | 'community' | 'profile';

interface AppState {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;

  brewForm: {
    beanName: string;
    origin: string;
    roastLevel: '浅' | '中' | '深' | '';
    grindSize: number;
    waterTemp: number;
    powderWeight: number;
    ratio: string;
    pourStages: PourStage[];
  };
  setBrewForm: (form: Partial<AppState['brewForm']>) => void;
  resetBrewForm: () => void;

  currentExtractionRate: number;
  setCurrentExtractionRate: (rate: number) => void;

  flavorModalOpen: boolean;
  setFlavorModalOpen: (open: boolean) => void;

  currentFlavor: FlavorRating;
  setCurrentFlavor: (flavor: Partial<FlavorRating>) => void;
  resetCurrentFlavor: () => void;

  communityFilters: CommunityFilters;
  setCommunityFilters: (filters: Partial<CommunityFilters>) => void;
  resetCommunityFilters: () => void;

  communityCards: BrewingRecord[];
  setCommunityCards: (cards: BrewingRecord[]) => void;
  appendCommunityCards: (cards: BrewingRecord[]) => void;

  communityPage: number;
  setCommunityPage: (page: number) => void;

  hasMoreCards: boolean;
  setHasMoreCards: (has: boolean) => void;

  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;

  userRecords: BrewingRecord[];
  setUserRecords: (records: BrewingRecord[]) => void;

  lastSavedRecord: BrewingRecord | null;
  setLastSavedRecord: (record: BrewingRecord | null) => void;

  toggleLike: (id: string) => Promise<void> | void;
  likeRecord: (id: string, likes: number, likedByMe: boolean) => void;

  addCommentToRecord: (id: string, comment: { id: string; user: string; text: string; createdAt: string }) => void;
}

const initialBrewForm = {
  beanName: '',
  origin: '',
  roastLevel: '' as '浅' | '中' | '深' | '',
  grindSize: 5,
  waterTemp: 92,
  powderWeight: 15,
  ratio: '1:15',
  pourStages: [
    { time: 30, water: 90 },
    { time: 45, water: 67 },
    { time: 45, water: 67 },
  ],
};

const initialFlavor: FlavorRating = {
  酸度: 0,
  甜度: 0,
  苦度: 0,
  醇厚度: 0,
  干净度: 0,
  余韵: 0,
};

export const useAppStore = create<AppState>((set, get) => ({
  currentPage: 'brewing',
  setCurrentPage: (page) => set({ currentPage: page }),

  brewForm: initialBrewForm,
  setBrewForm: (form) => set(state => ({ brewForm: { ...state.brewForm, ...form } })),
  resetBrewForm: () => set({ brewForm: initialBrewForm }),

  currentExtractionRate: 18.90,
  setCurrentExtractionRate: (rate) => set({ currentExtractionRate: rate }),

  flavorModalOpen: false,
  setFlavorModalOpen: (open) => set({ flavorModalOpen: open }),

  currentFlavor: initialFlavor,
  setCurrentFlavor: (flavor) => set(state => ({ currentFlavor: { ...state.currentFlavor, ...flavor } })),
  resetCurrentFlavor: () => set({ currentFlavor: initialFlavor }),

  communityFilters: DEFAULT_FILTERS,
  setCommunityFilters: (filters) => set(state => ({ communityFilters: { ...state.communityFilters, ...filters } })),
  resetCommunityFilters: () => set({ communityFilters: DEFAULT_FILTERS }),

  communityCards: [],
  setCommunityCards: (cards) => set({ communityCards: cards }),
  appendCommunityCards: (cards) => set(state => ({ communityCards: [...state.communityCards, ...cards] })),

  communityPage: 1,
  setCommunityPage: (page) => set({ communityPage: page }),

  hasMoreCards: true,
  setHasMoreCards: (has) => set({ hasMoreCards: has }),

  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  userRecords: [],
  setUserRecords: (records) => set({ userRecords: records }),

  lastSavedRecord: null,
  setLastSavedRecord: (record) => set({ lastSavedRecord: record }),

  toggleLike: async () => {},
  likeRecord: (id, likes, likedByMe) => set(state => ({
    communityCards: state.communityCards.map(c =>
      c.id === id ? { ...c, likes, likedByMe } : c
    ),
  })),

  addCommentToRecord: (id, comment) => set(state => ({
    communityCards: state.communityCards.map(c =>
      c.id === id ? { ...c, comments: [...(c.comments || []), comment] } : c
    ),
  })),
}));
