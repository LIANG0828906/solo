import {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  ReactNode,
  useEffect,
} from 'react';
import type {
  InterestTag,
  Itinerary,
  ThemeName,
  Attraction,
  DayItineraryItem,
} from '../types';
import {
  generateItinerary as apiGenerateItinerary,
  recalculateDuration as apiRecalculate,
  fetchAttractions,
  exportPdf as apiExportPdf,
} from '../services/api';

interface AppState {
  theme: ThemeName;
  city: string;
  days: number;
  interests: InterestTag[];
  itinerary: Itinerary | null;
  attractions: Attraction[];
  selectedAttractionId: string | null;
  modalAttraction: Attraction | null;
  isLoading: boolean;
  isGenerating: boolean;
  isExporting: boolean;
  highlightAttractionId: string | null;
  error: string | null;
}

type AppAction =
  | { type: 'SET_THEME'; payload: ThemeName }
  | { type: 'SET_CITY'; payload: string }
  | { type: 'SET_DAYS'; payload: number }
  | { type: 'TOGGLE_INTEREST'; payload: InterestTag }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_GENERATING'; payload: boolean }
  | { type: 'SET_EXPORTING'; payload: boolean }
  | { type: 'SET_ATTRACTION_LIST'; payload: Attraction[] }
  | { type: 'SET_ITINERARY'; payload: Itinerary | null }
  | { type: 'SET_SELECTED_ATTRACTION'; payload: string | null }
  | { type: 'SET_MODAL_ATTRACTION'; payload: Attraction | null }
  | { type: 'SET_HIGHLIGHT'; payload: string | null }
  | { type: 'REORDER_ITEM'; payload: { dayIndex: number; fromIndex: number; toIndex: number } }
  | { type: 'MOVE_ITEM'; payload: { fromDay: number; fromIdx: number; toDay: number; toIdx: number } }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: AppState = {
  theme: 'coast',
  city: '北京',
  days: 3,
  interests: ['culture', 'food'],
  itinerary: null,
  attractions: [],
  selectedAttractionId: null,
  modalAttraction: null,
  isLoading: false,
  isGenerating: false,
  isExporting: false,
  highlightAttractionId: null,
  error: null,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_THEME':
      return { ...state, theme: action.payload };
    case 'SET_CITY':
      return { ...state, city: action.payload };
    case 'SET_DAYS':
      return { ...state, days: action.payload };
    case 'TOGGLE_INTEREST': {
      const has = state.interests.includes(action.payload);
      return {
        ...state,
        interests: has
          ? state.interests.filter((i) => i !== action.payload)
          : [...state.interests, action.payload],
      };
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_GENERATING':
      return { ...state, isGenerating: action.payload };
    case 'SET_EXPORTING':
      return { ...state, isExporting: action.payload };
    case 'SET_ATTRACTION_LIST':
      return { ...state, attractions: action.payload };
    case 'SET_ITINERARY':
      return { ...state, itinerary: action.payload };
    case 'SET_SELECTED_ATTRACTION':
      return { ...state, selectedAttractionId: action.payload };
    case 'SET_MODAL_ATTRACTION':
      return { ...state, modalAttraction: action.payload };
    case 'SET_HIGHLIGHT':
      return { ...state, highlightAttractionId: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'REORDER_ITEM': {
      if (!state.itinerary) return state;
      const newItinerary = JSON.parse(JSON.stringify(state.itinerary)) as Itinerary;
      const dayPlan = newItinerary.dayPlans[action.payload.dayIndex];
      if (!dayPlan) return state;
      const [removed] = dayPlan.items.splice(action.payload.fromIndex, 1);
      dayPlan.items.splice(action.payload.toIndex, 0, removed);
      return { ...state, itinerary: newItinerary };
    }
    case 'MOVE_ITEM': {
      if (!state.itinerary) return state;
      const newItinerary = JSON.parse(JSON.stringify(state.itinerary)) as Itinerary;
      const fromDay = newItinerary.dayPlans[action.payload.fromDay];
      const toDay = newItinerary.dayPlans[action.payload.toDay];
      if (!fromDay || !toDay) return state;
      const [removed] = fromDay.items.splice(action.payload.fromIdx, 1);
      toDay.items.splice(action.payload.toIdx, 0, removed);
      return { ...state, itinerary: newItinerary };
    }
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  setTheme: (t: ThemeName) => void;
  setCity: (c: string) => void;
  setDays: (d: number) => void;
  toggleInterest: (i: InterestTag) => void;
  handleGenerate: () => Promise<void>;
  handleReorder: (dayIndex: number, fromIndex: number, toIndex: number) => void;
  handleMoveItem: (fromDay: number, fromIdx: number, toDay: number, toIdx: number) => void;
  handleSelectAttraction: (id: string | null) => void;
  handleOpenModal: (attr: Attraction | null) => void;
  handleHighlight: (id: string | null) => void;
  handleExportPdf: () => Promise<void>;
  findItemIndex: (attrId: string) => { dayIndex: number; itemIndex: number } | null;
  findAttractionById: (id: string) => Attraction | undefined;
  getAllItems: () => (DayItineraryItem & { dayNumber: number })[];
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', state.theme);
  }, [state.theme]);

  const setTheme = useCallback((t: ThemeName) => {
    dispatch({ type: 'SET_THEME', payload: t });
  }, []);

  const setCity = useCallback((c: string) => {
    dispatch({ type: 'SET_CITY', payload: c });
  }, []);

  const setDays = useCallback((d: number) => {
    dispatch({ type: 'SET_DAYS', payload: d });
  }, []);

  const toggleInterest = useCallback((i: InterestTag) => {
    dispatch({ type: 'TOGGLE_INTEREST', payload: i });
  }, []);

  const handleGenerate = useCallback(async () => {
    if (state.interests.length === 0) {
      dispatch({ type: 'SET_ERROR', payload: '请至少选择一个兴趣偏好' });
      return;
    }
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'SET_GENERATING', payload: true });
    try {
      const [attractions, itinerary] = await Promise.all([
        fetchAttractions(state.city),
        apiGenerateItinerary({
          city: state.city,
          days: state.days,
          interests: state.interests,
        }),
      ]);
      dispatch({ type: 'SET_ATTRACTION_LIST', payload: attractions });
      dispatch({ type: 'SET_ITINERARY', payload: itinerary });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '生成失败';
      dispatch({ type: 'SET_ERROR', payload: msg });
    } finally {
      dispatch({ type: 'SET_GENERATING', payload: false });
    }
  }, [state.city, state.days, state.interests]);

  const triggerRecalculate = useCallback(async (it: Itinerary) => {
    try {
      const updated = await apiRecalculate(it);
      dispatch({ type: 'SET_ITINERARY', payload: updated });
    } catch (err) {
      console.warn('recalculate failed', err);
    }
  }, []);

  const handleReorder = useCallback(
    (dayIndex: number, fromIndex: number, toIndex: number) => {
      if (fromIndex === toIndex) return;
      dispatch({
        type: 'REORDER_ITEM',
        payload: { dayIndex, fromIndex, toIndex },
      });
      setTimeout(() => {
        if (state.itinerary) {
          const cloned = JSON.parse(JSON.stringify(state.itinerary)) as Itinerary;
          const day = cloned.dayPlans[dayIndex];
          if (day) {
            const [removed] = day.items.splice(fromIndex, 1);
            day.items.splice(toIndex, 0, removed);
            triggerRecalculate(cloned);
          }
        }
      }, 420);
    },
    [state.itinerary, triggerRecalculate]
  );

  const handleMoveItem = useCallback(
    (fromDay: number, fromIdx: number, toDay: number, toIdx: number) => {
      dispatch({
        type: 'MOVE_ITEM',
        payload: { fromDay, fromIdx, toDay, toIdx },
      });
      setTimeout(() => {
        if (state.itinerary) {
          const cloned = JSON.parse(JSON.stringify(state.itinerary)) as Itinerary;
          const f = cloned.dayPlans[fromDay];
          const t = cloned.dayPlans[toDay];
          if (f && t) {
            const [removed] = f.items.splice(fromIdx, 1);
            t.items.splice(toIdx, 0, removed);
            triggerRecalculate(cloned);
          }
        }
      }, 420);
    },
    [state.itinerary, triggerRecalculate]
  );

  const handleSelectAttraction = useCallback((id: string | null) => {
    dispatch({ type: 'SET_SELECTED_ATTRACTION', payload: id });
  }, []);

  const handleOpenModal = useCallback((attr: Attraction | null) => {
    dispatch({ type: 'SET_MODAL_ATTRACTION', payload: attr });
  }, []);

  const handleHighlight = useCallback((id: string | null) => {
    dispatch({ type: 'SET_HIGHLIGHT', payload: id });
    if (id) {
      setTimeout(() => {
        dispatch({ type: 'SET_HIGHLIGHT', payload: null });
      }, 1300);
    }
  }, []);

  const handleExportPdf = useCallback(async () => {
    if (!state.itinerary) return;
    dispatch({ type: 'SET_EXPORTING', payload: true });
    try {
      const result = await apiExportPdf({ itinerary: state.itinerary });
      if (result.success) {
        window.open(result.downloadUrl, '_blank');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : '导出失败';
      dispatch({ type: 'SET_ERROR', payload: msg });
    } finally {
      dispatch({ type: 'SET_EXPORTING', payload: false });
    }
  }, [state.itinerary]);

  const findItemIndex = useCallback(
    (attrId: string): { dayIndex: number; itemIndex: number } | null => {
      if (!state.itinerary) return null;
      for (let di = 0; di < state.itinerary.dayPlans.length; di++) {
        const day = state.itinerary.dayPlans[di];
        const ii = day.items.findIndex((x) => x.attractionId === attrId);
        if (ii >= 0) return { dayIndex: di, itemIndex: ii };
      }
      return null;
    },
    [state.itinerary]
  );

  const findAttractionById = useCallback(
    (id: string) => state.attractions.find((a) => a.id === id),
    [state.attractions]
  );

  const getAllItems = useCallback(() => {
    if (!state.itinerary) return [];
    const result: (DayItineraryItem & { dayNumber: number })[] = [];
    state.itinerary.dayPlans.forEach((day) => {
      day.items.forEach((item) => {
        result.push({ ...item, dayNumber: day.day });
      });
    });
    return result;
  }, [state.itinerary]);

  const value = useMemo<AppContextValue>(
    () => ({
      state,
      setTheme,
      setCity,
      setDays,
      toggleInterest,
      handleGenerate,
      handleReorder,
      handleMoveItem,
      handleSelectAttraction,
      handleOpenModal,
      handleHighlight,
      handleExportPdf,
      findItemIndex,
      findAttractionById,
      getAllItems,
    }),
    [
      state,
      setTheme,
      setCity,
      setDays,
      toggleInterest,
      handleGenerate,
      handleReorder,
      handleMoveItem,
      handleSelectAttraction,
      handleOpenModal,
      handleHighlight,
      handleExportPdf,
      findItemIndex,
      findAttractionById,
      getAllItems,
    ]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
