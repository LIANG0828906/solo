export interface MindMapNode {
  id: string;
  text: string;
  x: number;
  y: number;
  parentId: string | null;
}

export interface MindMapDocument {
  id: string;
  title: string;
  theme: ThemeType;
  nodes: MindMapNode[];
  createdAt: number;
  updatedAt: number;
}

export type ThemeType = 'forest' | 'ocean' | 'sunset';

export interface ThemeConfig {
  name: string;
  primary: string;
  primaryLight: string;
  accent: string;
  bgColor: string;
}

export const THEMES: Record<ThemeType, ThemeConfig> = {
  forest: {
    name: '森林绿',
    primary: '#2e7d32',
    primaryLight: '#e8f5e9',
    accent: '#4caf50',
    bgColor: '#f1f8e9',
  },
  ocean: {
    name: '海洋蓝',
    primary: '#1976d2',
    primaryLight: '#e3f2fd',
    accent: '#2196f3',
    bgColor: '#e8f4fc',
  },
  sunset: {
    name: '日落橙',
    primary: '#f57c00',
    primaryLight: '#fff3e0',
    accent: '#ff9800',
    bgColor: '#fff8e1',
  },
};

export interface UserCursor {
  userId: string;
  userName: string;
  color: string;
  x: number;
  y: number;
}

export type OperationType = 'add' | 'delete' | 'move' | 'edit';

export interface Operation {
  type: OperationType;
  nodeId: string;
  payload: any;
  timestamp: number;
  userId?: string;
}

export interface HistoryState {
  nodes: MindMapNode[];
}
