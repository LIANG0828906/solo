import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import toast from 'react-hot-toast';

export type RoastLevel = 'light' | 'medium' | 'dark';

export interface TastingRecord {
  id: string;
  coffeeName: string;
  roastLevel: RoastLevel;
  flavorTags: string[];
  acidity: number;
  bitterness: number;
  mouthfeel: number;
  tasteDate: string;
  rating: number;
}

interface TastingState {
  records: TastingRecord[];
}

type TastingAction =
  | { type: 'ADD_RECORD'; payload: TastingRecord }
  | { type: 'DELETE_RECORD'; payload: string }
  | { type: 'UPDATE_RATING'; payload: { id: string; rating: number } }
  | { type: 'LOAD_RECORDS'; payload: TastingRecord[] };

const STORAGE_KEY = 'coffee-tasting-records';

const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substring(2, 9);
};

const getTodayDate = (): string => {
  return new Date().toISOString().split('T')[0];
};

export const createSampleRecord = (): TastingRecord => {
  return {
    id: generateId(),
    coffeeName: '埃塞俄比亚 耶加雪菲',
    roastLevel: 'light',
    flavorTags: ['citrus', 'jasmine', 'berry'],
    acidity: 4,
    bitterness: 2,
    mouthfeel: 3,
    tasteDate: getTodayDate(),
    rating: 4,
  };
};

const loadFromStorage = (): TastingRecord[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch {
    console.warn('Failed to load records from localStorage');
  }
  return [];
};

const saveToStorage = (records: TastingRecord[]): void => {
  setTimeout(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch {
      console.warn('Failed to save records to localStorage');
    }
  }, 0);
};

const initialState: TastingState = {
  records: [],
};

const tastingReducer = (
  state: TastingState,
  action: TastingAction
): TastingState => {
  switch (action.type) {
    case 'ADD_RECORD': {
      const newRecords = [action.payload, ...state.records];
      saveToStorage(newRecords);
      return { records: newRecords };
    }
    case 'DELETE_RECORD': {
      const newRecords = state.records.filter((r) => r.id !== action.payload);
      saveToStorage(newRecords);
      return { records: newRecords };
    }
    case 'UPDATE_RATING': {
      const newRecords = state.records.map((r) =>
        r.id === action.payload.id ? { ...r, rating: action.payload.rating } : r
      );
      saveToStorage(newRecords);
      return { records: newRecords };
    }
    case 'LOAD_RECORDS': {
      return { records: action.payload };
    }
    default:
      return state;
  }
};

interface TastingContextType {
  records: TastingRecord[];
  addRecord: (record: Omit<TastingRecord, 'id' | 'tasteDate'>) => void;
  deleteRecord: (id: string) => void;
  updateRating: (id: string, rating: number) => void;
  getAllRecords: () => TastingRecord[];
}

const TastingContext = createContext<TastingContextType | undefined>(undefined);

interface TastingProviderProps {
  children: ReactNode;
}

export const TastingProvider: React.FC<TastingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(tastingReducer, initialState);

  useEffect(() => {
    const records = loadFromStorage();
    if (records.length === 0) {
      const sample = createSampleRecord();
      dispatch({ type: 'ADD_RECORD', payload: sample });
    } else {
      dispatch({ type: 'LOAD_RECORDS', payload: records });
    }
  }, []);

  const addRecord = (record: Omit<TastingRecord, 'id' | 'tasteDate'>): void => {
    const newRecord: TastingRecord = {
      ...record,
      id: generateId(),
      tasteDate: getTodayDate(),
    };
    dispatch({ type: 'ADD_RECORD', payload: newRecord });
    toast.success('品鉴记录已保存');
  };

  const deleteRecord = (id: string): void => {
    dispatch({ type: 'DELETE_RECORD', payload: id });
    toast.success('记录已删除');
  };

  const updateRating = (id: string, rating: number): void => {
    dispatch({ type: 'UPDATE_RATING', payload: { id, rating } });
  };

  const getAllRecords = (): TastingRecord[] => {
    return state.records;
  };

  return (
    <TastingContext.Provider
      value={{ records: state.records, addRecord, deleteRecord, updateRating, getAllRecords }}
    >
      {children}
    </TastingContext.Provider>
  );
};

export const useTastingStore = (): TastingContextType => {
  const context = useContext(TastingContext);
  if (!context) {
    throw new Error('useTastingStore must be used within a TastingProvider');
  }
  return context;
};
