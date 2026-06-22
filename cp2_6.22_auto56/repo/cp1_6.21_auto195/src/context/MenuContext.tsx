import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import axios from 'axios';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  startTime: string;
  endTime: string;
  createdAt: string;
}

interface MenuState {
  items: MenuItem[];
  loading: boolean;
  error: string | null;
}

type MenuAction =
  | { type: 'SET_ITEMS'; payload: MenuItem[] }
  | { type: 'ADD_ITEM'; payload: MenuItem }
  | { type: 'UPDATE_ITEM'; payload: MenuItem }
  | { type: 'DELETE_ITEM'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null };

const initialState: MenuState = {
  items: [],
  loading: false,
  error: null,
};

function menuReducer(state: MenuState, action: MenuAction): MenuState {
  switch (action.type) {
    case 'SET_ITEMS':
      return { ...state, items: action.payload, loading: false, error: null };
    case 'ADD_ITEM':
      return { ...state, items: [...state.items, action.payload] };
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map((item) =>
          item.id === action.payload.id ? action.payload : item
        ),
      };
    case 'DELETE_ITEM':
      return {
        ...state,
        items: state.items.filter((item) => item.id !== action.payload),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

interface MenuContextType {
  state: MenuState;
  fetchItems: () => Promise<void>;
  addItem: (item: Omit<MenuItem, 'id' | 'createdAt'>) => Promise<void>;
  updateItem: (id: string, item: Partial<MenuItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(menuReducer, initialState);

  const fetchItems = async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      const response = await axios.get('/api/menu');
      dispatch({ type: 'SET_ITEMS', payload: response.data });
    } catch (err: any) {
      dispatch({ type: 'SET_ERROR', payload: err.message || '加载菜单失败' });
    }
  };

  const addItem = async (item: Omit<MenuItem, 'id' | 'createdAt'>) => {
    try {
      const response = await axios.post('/api/menu', item);
      dispatch({ type: 'ADD_ITEM', payload: response.data });
    } catch (err: any) {
      throw new Error(err.response?.data?.error || '添加菜品失败');
    }
  };

  const updateItem = async (id: string, item: Partial<MenuItem>) => {
    try {
      const response = await axios.put(`/api/menu/${id}`, item);
      dispatch({ type: 'UPDATE_ITEM', payload: response.data });
    } catch (err: any) {
      throw new Error(err.response?.data?.error || '更新菜品失败');
    }
  };

  const deleteItem = async (id: string) => {
    try {
      await axios.delete(`/api/menu/${id}`);
      dispatch({ type: 'DELETE_ITEM', payload: id });
    } catch (err: any) {
      throw new Error(err.response?.data?.error || '删除菜品失败');
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  return (
    <MenuContext.Provider value={{ state, fetchItems, addItem, updateItem, deleteItem }}>
      {children}
    </MenuContext.Provider>
  );
}

export function useMenu() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error('useMenu must be used within a MenuProvider');
  }
  return context;
}
