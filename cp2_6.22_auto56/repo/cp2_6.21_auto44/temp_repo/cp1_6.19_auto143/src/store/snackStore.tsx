import React, { createContext, useContext, useReducer, useEffect, useCallback, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';

export enum SnackCategory {
  CHIPS = 'chips',
  CHOCOLATE = 'chocolate',
  DRINK = 'drink',
  NUTS = 'nuts',
}

export interface Snack {
  id: string;
  name: string;
  category: SnackCategory;
  purchaseDate: string;
  expiryDate: string;
  notes: string;
  createdAt: number;
}

export interface SnackState {
  snacks: Snack[];
  selectedSnackId: string | null;
  isModalOpen: boolean;
  highlightedSnackId: string | null;
}

export type SnackAction =
  | { type: 'ADD_SNACK'; payload: Omit<Snack, 'id' | 'createdAt'> }
  | { type: 'DELETE_SNACK'; payload: string }
  | { type: 'MARK_AS_EATEN'; payload: string }
  | { type: 'SELECT_SNACK'; payload: string | null }
  | { type: 'TOGGLE_MODAL'; payload: boolean }
  | { type: 'HIGHLIGHT_SNACK'; payload: string | null }
  | { type: 'UPDATE_NOTES'; payload: { id: string; notes: string } }
  | { type: 'LOAD_SNACKS'; payload: Snack[] };

const STORAGE_KEY = 'snack-inventory-data';

const getInitialState = (): SnackState => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const snacks = JSON.parse(saved);
      return {
        snacks,
        selectedSnackId: null,
        isModalOpen: false,
        highlightedSnackId: null,
      };
    }
  } catch (e) {
    console.error('Failed to load snacks from localStorage:', e);
  }

  const today = new Date();
  const createDate = (daysFromNow: number): string => {
    const date = new Date(today);
    date.setDate(date.getDate() + daysFromNow);
    return date.toISOString().split('T')[0];
  };

  const demoSnacks: Snack[] = [
    {
      id: uuidv4(),
      name: '乐事薯片',
      category: SnackCategory.CHIPS,
      purchaseDate: createDate(-10),
      expiryDate: createDate(5),
      notes: '原味，大包装',
      createdAt: Date.now() - 864000000,
    },
    {
      id: uuidv4(),
      name: '德芙巧克力',
      category: SnackCategory.CHOCOLATE,
      purchaseDate: createDate(-5),
      expiryDate: createDate(25),
      notes: '丝滑牛奶味',
      createdAt: Date.now() - 432000000,
    },
    {
      id: uuidv4(),
      name: '可口可乐',
      category: SnackCategory.DRINK,
      purchaseDate: createDate(-3),
      expiryDate: createDate(60),
      notes: '330ml罐装，冰镇更好喝',
      createdAt: Date.now() - 259200000,
    },
    {
      id: uuidv4(),
      name: '三只松鼠坚果',
      category: SnackCategory.NUTS,
      purchaseDate: createDate(-15),
      expiryDate: createDate(120),
      notes: '混合坚果，每日一袋',
      createdAt: Date.now() - 1296000000,
    },
    {
      id: uuidv4(),
      name: '品客薯片',
      category: SnackCategory.CHIPS,
      purchaseDate: createDate(-2),
      expiryDate: createDate(3),
      notes: '洋葱味，快过期了',
      createdAt: Date.now() - 172800000,
    },
    {
      id: uuidv4(),
      name: '费列罗巧克力',
      category: SnackCategory.CHOCOLATE,
      purchaseDate: createDate(-20),
      expiryDate: createDate(15),
      notes: '金莎T8粒装',
      createdAt: Date.now() - 1728000000,
    },
  ];

  return {
    snacks: demoSnacks,
    selectedSnackId: null,
    isModalOpen: false,
    highlightedSnackId: null,
  };
};

const snackReducer = (state: SnackState, action: SnackAction): SnackState => {
  switch (action.type) {
    case 'LOAD_SNACKS':
      return { ...state, snacks: action.payload };
    case 'ADD_SNACK': {
      const newSnack: Snack = {
        ...action.payload,
        id: uuidv4(),
        createdAt: Date.now(),
      };
      return { ...state, snacks: [newSnack, ...state.snacks] };
    }
    case 'DELETE_SNACK':
    case 'MARK_AS_EATEN':
      return {
        ...state,
        snacks: state.snacks.filter((s) => s.id !== action.payload),
        selectedSnackId: state.selectedSnackId === action.payload ? null : state.selectedSnackId,
      };
    case 'SELECT_SNACK':
      return { ...state, selectedSnackId: action.payload };
    case 'TOGGLE_MODAL':
      return { ...state, isModalOpen: action.payload };
    case 'HIGHLIGHT_SNACK':
      return { ...state, highlightedSnackId: action.payload };
    case 'UPDATE_NOTES':
      return {
        ...state,
        snacks: state.snacks.map((s) =>
          s.id === action.payload.id ? { ...s, notes: action.payload.notes } : s
        ),
      };
    default:
      return state;
  }
};

export const calculateRemainingDays = (expiryDate: string): number => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  expiry.setHours(0, 0, 0, 0);
  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const getProgressColor = (days: number): string => {
  if (days > 30) return '#00B894';
  if (days >= 7) return '#FDCB6E';
  return '#FF7675';
};

export const getCategoryColor = (category: SnackCategory): string => {
  switch (category) {
    case SnackCategory.CHIPS:
      return '#FF7675';
    case SnackCategory.CHOCOLATE:
      return '#74B9FF';
    case SnackCategory.DRINK:
      return '#55E6C1';
    case SnackCategory.NUTS:
      return '#FDCB6E';
    default:
      return '#95A5A6';
  }
};

export const getCategoryLabel = (category: SnackCategory): string => {
  switch (category) {
    case SnackCategory.CHIPS:
      return '薯片';
    case SnackCategory.CHOCOLATE:
      return '巧克力';
    case SnackCategory.DRINK:
      return '饮料';
    case SnackCategory.NUTS:
      return '坚果';
    default:
      return '其他';
  }
};

interface SnackContextType {
  state: SnackState;
  dispatch: React.Dispatch<SnackAction>;
  getSuggestedSnacks: () => Snack[];
  calculateRemainingDays: (expiryDate: string) => number;
  getProgressColor: (days: number) => string;
  getCategoryColor: (category: SnackCategory) => string;
  getCategoryLabel: (category: SnackCategory) => string;
}

const SnackContext = createContext<SnackContextType | null>(null);

export const SnackProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(snackReducer, undefined, getInitialState);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state.snacks));
    } catch (e) {
      console.error('Failed to save snacks to localStorage:', e);
    }
  }, [state.snacks]);

  const getSuggestedSnacks = useCallback((): Snack[] => {
    return [...state.snacks]
      .sort((a, b) => {
        const daysA = calculateRemainingDays(a.expiryDate);
        const daysB = calculateRemainingDays(b.expiryDate);
        return daysA - daysB;
      })
      .slice(0, 3);
  }, [state.snacks]);

  const contextValue = useMemo<SnackContextType>(
    () => ({
      state,
      dispatch,
      getSuggestedSnacks,
      calculateRemainingDays,
      getProgressColor,
      getCategoryColor,
      getCategoryLabel,
    }),
    [state, getSuggestedSnacks]
  );

  return <SnackContext.Provider value={contextValue}>{children}</SnackContext.Provider>;
};

export const useSnackStore = (): SnackContextType => {
  const context = useContext(SnackContext);
  if (!context) {
    throw new Error('useSnackStore must be used within a SnackProvider');
  }
  return context;
};
