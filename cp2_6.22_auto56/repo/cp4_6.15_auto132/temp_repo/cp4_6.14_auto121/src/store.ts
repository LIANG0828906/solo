import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  ModuleType,
  ModuleInstance,
  ModuleProps,
  LayoutData,
  SearchBarProps,
  UserCardProps,
  DataTableProps,
} from './types';

const DEFAULT_DIMENSIONS: Record<ModuleType, { width: number; height: number }> = {
  searchBar: { width: 400, height: 60 },
  userCard: { width: 280, height: 160 },
  dataTable: { width: 600, height: 300 },
};

const getDefaultProps = (type: ModuleType): ModuleProps => {
  switch (type) {
    case 'searchBar':
      return {
        placeholder: '请输入搜索内容...',
        borderRadius: 8,
        backgroundColor: '#ffffff',
      } as SearchBarProps;
    case 'userCard':
      return {
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
        name: '用户名',
        role: '角色',
        tagColor: '#3b82f6',
      } as UserCardProps;
    case 'dataTable':
      return {
        columns: ['列1', '列2', '列3'],
        rows: [
          ['数据1', '数据2', '数据3'],
          ['数据4', '数据5', '数据6'],
        ],
      } as DataTableProps;
  }
};

interface StoreState {
  modules: ModuleInstance[];
  zoom: number;
  selectedId: string | null;
  addModule: (type: ModuleType, x: number, y: number) => void;
  updateModule: (id: string, updates: Partial<ModuleInstance>) => void;
  updateModuleProps: (id: string, props: Partial<ModuleProps>) => void;
  deleteModule: (id: string) => void;
  setZoom: (zoom: number) => void;
  selectModule: (id: string | null) => void;
  clearAll: () => void;
  exportLayout: () => LayoutData;
  importLayout: (data: LayoutData) => void;
}

export const useStore = create<StoreState>((set, get) => ({
  modules: [],
  zoom: 1.0,
  selectedId: null,

  addModule: (type, x, y) => {
    const dims = DEFAULT_DIMENSIONS[type];
    const newModule: ModuleInstance = {
      id: uuidv4(),
      type,
      x,
      y,
      width: dims.width,
      height: dims.height,
      props: getDefaultProps(type),
    };
    set((state) => ({ modules: [...state.modules, newModule] }));
  },

  updateModule: (id, updates) => {
    set((state) => ({
      modules: state.modules.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    }));
  },

  updateModuleProps: (id, props) => {
    set((state) => ({
      modules: state.modules.map((m) =>
        m.id === id ? { ...m, props: { ...m.props, ...props } } : m
      ),
    }));
  },

  deleteModule: (id) => {
    set((state) => ({
      modules: state.modules.filter((m) => m.id !== id),
      selectedId: state.selectedId === id ? null : state.selectedId,
    }));
  },

  setZoom: (zoom) => {
    const clamped = Math.min(2.0, Math.max(0.5, zoom));
    set({ zoom: clamped });
  },

  selectModule: (id) => {
    set({ selectedId: id });
  },

  clearAll: () => {
    set({ modules: [], selectedId: null });
  },

  exportLayout: () => {
    const { modules, zoom } = get();
    return { modules, zoom };
  },

  importLayout: (data) => {
    set({ modules: data.modules, zoom: data.zoom, selectedId: null });
  },
}));
