import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { v4 as uuidv4 } from 'uuid';
import { getSnapshotFromURL, createSnapshot, setSnapshotToURL } from '../utils/snapshot';

export type ThemeMode = 'light' | 'dark';
export type ButtonSize = 'sm' | 'md' | 'lg';
export type ColorTheme = 'primary' | 'secondary' | 'error';
export type ShapeVariant = 'rounded' | 'square' | 'pill';

export interface ComponentAttributes {
  size?: ButtonSize;
  color?: ColorTheme;
  shape?: ShapeVariant;
  label?: string;
  placeholder?: string;
  value?: string | number;
  disabled?: boolean;
  checked?: boolean;
  loading?: boolean;
  min?: number;
  max?: number;
  step?: number;
}

export interface WorkspaceComponent {
  instanceId: string;
  type: string;
  attributes: ComponentAttributes;
  order: number;
}

export interface ComponentDefinition {
  type: string;
  name: string;
  category: string;
  iconColor: string;
  defaultAttributes: ComponentAttributes;
  editableAttributes: string[];
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  components: WorkspaceComponent[];
}

interface AppState {
  components: WorkspaceComponent[];
  theme: ThemeMode;
  history: HistoryEntry[];
  historyIndex: number;
  selectedInstanceId: string | null;
  notification: { id: string; message: string; visible: boolean } | null;
}

type Action =
  | { type: 'ADD_COMPONENT'; payload: { definition: ComponentDefinition } }
  | { type: 'REMOVE_COMPONENT'; payload: { instanceId: string } }
  | { type: 'UPDATE_ATTRIBUTES'; payload: { instanceId: string; attributes: ComponentAttributes } }
  | { type: 'SELECT_COMPONENT'; payload: { instanceId: string | null } }
  | { type: 'REORDER_COMPONENTS'; payload: { components: WorkspaceComponent[] } }
  | { type: 'SET_THEME'; payload: ThemeMode }
  | { type: 'LOAD_SNAPSHOT'; payload: { components: WorkspaceComponent[]; theme: ThemeMode } }
  | { type: 'SHOW_NOTIFICATION'; payload: string }
  | { type: 'HIDE_NOTIFICATION' }
  | { type: 'PUSH_HISTORY' }
  | { type: 'UNDO' }
  | { type: 'REDO' };

const initialState: AppState = {
  components: [],
  theme: 'light',
  history: [],
  historyIndex: -1,
  selectedInstanceId: null,
  notification: null,
};

const COMPONENT_DEFINITIONS: ComponentDefinition[] = [
  { type: 'button', name: '按钮', category: '基础组件', iconColor: '#6366F1', defaultAttributes: { size: 'md', color: 'primary', shape: 'rounded', label: '按钮' }, editableAttributes: ['size', 'color', 'shape', 'label', 'disabled'] },
  { type: 'button-outlined', name: '描边按钮', category: '基础组件', iconColor: '#8B5CF6', defaultAttributes: { size: 'md', color: 'primary', shape: 'rounded', label: '描边按钮' }, editableAttributes: ['size', 'color', 'shape', 'label', 'disabled'] },
  { type: 'button-text', name: '文字按钮', category: '基础组件', iconColor: '#A855F7', defaultAttributes: { size: 'md', color: 'primary', shape: 'rounded', label: '文字按钮' }, editableAttributes: ['size', 'color', 'shape', 'label', 'disabled'] },
  { type: 'input', name: '输入框', category: '基础组件', iconColor: '#10B981', defaultAttributes: { size: 'md', shape: 'rounded', placeholder: '请输入...', value: '' }, editableAttributes: ['size', 'shape', 'placeholder', 'value', 'disabled'] },
  { type: 'textarea', name: '多行文本', category: '基础组件', iconColor: '#059669', defaultAttributes: { size: 'md', placeholder: '请输入内容...', value: '' }, editableAttributes: ['size', 'placeholder', 'value', 'disabled'] },
  { type: 'select', name: '下拉选择', category: '基础组件', iconColor: '#047857', defaultAttributes: { size: 'md', shape: 'rounded', value: '选项1' }, editableAttributes: ['size', 'shape', 'value', 'disabled'] },
  { type: 'checkbox', name: '复选框', category: '基础组件', iconColor: '#F59E0B', defaultAttributes: { size: 'md', checked: false, label: '同意协议' }, editableAttributes: ['size', 'checked', 'label', 'disabled'] },
  { type: 'radio', name: '单选框', category: '基础组件', iconColor: '#D97706', defaultAttributes: { size: 'md', checked: true, label: '选项A' }, editableAttributes: ['size', 'checked', 'label', 'disabled'] },
  { type: 'switch', name: '开关', category: '基础组件', iconColor: '#B45309', defaultAttributes: { size: 'md', checked: true, disabled: false }, editableAttributes: ['size', 'checked', 'disabled'] },
  { type: 'card', name: '卡片', category: '容器组件', iconColor: '#F43F5E', defaultAttributes: { shape: 'rounded', label: '卡片标题' }, editableAttributes: ['shape', 'label'] },
  { type: 'card-elevated', name: '高-卡片', category: '容器组件', iconColor: '#E11D48', defaultAttributes: { shape: 'rounded', label: '高-卡片' }, editableAttributes: ['shape', 'label'] },
  { type: 'card-outlined', name: '描边卡片', category: '容器组件', iconColor: '#BE123C', defaultAttributes: { shape: 'rounded', label: '描边卡片' }, editableAttributes: ['shape', 'label'] },
  { type: 'navbar', name: '导航栏', category: '容器组件', iconColor: '#9F1239', defaultAttributes: { size: 'md', label: '导航栏' }, editableAttributes: ['size', 'label'] },
  { type: 'sidebar', name: '侧边栏', category: '容器组件', iconColor: '#881337', defaultAttributes: { size: 'md', label: '侧边栏' }, editableAttributes: ['size', 'label'] },
  { type: 'container', name: '容器', category: '容器组件', iconColor: '#4C1D95', defaultAttributes: { shape: 'rounded', label: '容器' }, editableAttributes: ['shape', 'label'] },
  { type: 'slider', name: '滑块', category: '交互组件', iconColor: '#6366F1', defaultAttributes: { size: 'md', value: 50, min: 0, max: 100, step: 1 }, editableAttributes: ['size', 'value', 'min', 'max', 'step', 'disabled'] },
  { type: 'progress', name: '进度条', category: '交互组件', iconColor: '#4F46E5', defaultAttributes: { size: 'md', color: 'primary', value: 65 }, editableAttributes: ['size', 'color', 'value'] },
  { type: 'loading-spinner', name: '加载旋转', category: '交互组件', iconColor: '#4338CA', defaultAttributes: { size: 'md', color: 'primary', loading: true }, editableAttributes: ['size', 'color', 'loading'] },
  { type: 'loading-dots', name: '加载圆点', category: '交互组件', iconColor: '#3730A3', defaultAttributes: { size: 'md', color: 'primary', loading: true }, editableAttributes: ['size', 'color', 'loading'] },
  { type: 'loading-bar', name: '加载条', category: '交互组件', iconColor: '#312E81', defaultAttributes: { size: 'md', color: 'primary', loading: true }, editableAttributes: ['size', 'color', 'loading'] },
  { type: 'tooltip', name: '提示气泡', category: '反馈组件', iconColor: '#10B981', defaultAttributes: { size: 'md', label: '这是提示内容' }, editableAttributes: ['size', 'label'] },
  { type: 'badge', name: '徽章', category: '反馈组件', iconColor: '#059669', defaultAttributes: { size: 'md', color: 'primary', label: '新' }, editableAttributes: ['size', 'color', 'label'] },
  { type: 'alert', name: '警告框', category: '反馈组件', iconColor: '#047857', defaultAttributes: { size: 'md', color: 'primary', label: '这是一条提示信息' }, editableAttributes: ['size', 'color', 'label'] },
  { type: 'snackbar', name: '消息条', category: '反馈组件', iconColor: '#065F46', defaultAttributes: { size: 'md', color: 'primary', label: '操作成功' }, editableAttributes: ['size', 'color', 'label'] },
  { type: 'avatar', name: '头像', category: '数据展示', iconColor: '#F59E0B', defaultAttributes: { size: 'md', shape: 'pill', label: 'U' }, editableAttributes: ['size', 'shape', 'label'] },
  { type: 'chip', name: '标签', category: '数据展示', iconColor: '#D97706', defaultAttributes: { size: 'md', color: 'primary', shape: 'pill', label: '标签' }, editableAttributes: ['size', 'color', 'shape', 'label'] },
  { type: 'divider', name: '分割线', category: '数据展示', iconColor: '#B45309', defaultAttributes: { size: 'md' }, editableAttributes: ['size'] },
  { type: 'list', name: '列表项', category: '数据展示', iconColor: '#92400E', defaultAttributes: { size: 'md', label: '列表项文本' }, editableAttributes: ['size', 'label'] },
  { type: 'tabs', name: '标签页', category: '数据展示', iconColor: '#78350F', defaultAttributes: { size: 'md', label: '标签1' }, editableAttributes: ['size', 'label'] },
  { type: 'table', name: '表格行', category: '数据展示', iconColor: '#451A03', defaultAttributes: { size: 'md', label: '单元格内容' }, editableAttributes: ['size', 'label'] },
];

export { COMPONENT_DEFINITIONS };

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
  componentDefinitions: ComponentDefinition[];
  getDefinition: (type: string) => ComponentDefinition | undefined;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_COMPONENT': {
      const { definition } = action.payload;
      const newComponent: WorkspaceComponent = {
        instanceId: uuidv4(),
        type: definition.type,
        attributes: { ...definition.defaultAttributes },
        order: state.components.length,
      };
      return {
        ...state,
        components: [...state.components, newComponent],
        selectedInstanceId: newComponent.instanceId,
      };
    }
    case 'REMOVE_COMPONENT': {
      const remaining = state.components
        .filter((c) => c.instanceId !== action.payload.instanceId)
        .map((c, idx) => ({ ...c, order: idx }));
      return {
        ...state,
        components: remaining,
        selectedInstanceId: state.selectedInstanceId === action.payload.instanceId ? null : state.selectedInstanceId,
      };
    }
    case 'UPDATE_ATTRIBUTES': {
      return {
        ...state,
        components: state.components.map((c) =>
          c.instanceId === action.payload.instanceId
            ? { ...c, attributes: { ...c.attributes, ...action.payload.attributes } }
            : c
        ),
      };
    }
    case 'SELECT_COMPONENT': {
      return { ...state, selectedInstanceId: action.payload.instanceId };
    }
    case 'REORDER_COMPONENTS': {
      const reordered = action.payload.components.map((c, idx) => ({ ...c, order: idx }));
      return { ...state, components: reordered };
    }
    case 'SET_THEME': {
      return { ...state, theme: action.payload };
    }
    case 'LOAD_SNAPSHOT': {
      return {
        ...state,
        components: action.payload.components,
        theme: action.payload.theme,
        selectedInstanceId: null,
      };
    }
    case 'SHOW_NOTIFICATION': {
      return {
        ...state,
        notification: { id: uuidv4(), message: action.payload, visible: true },
      };
    }
    case 'HIDE_NOTIFICATION': {
      return state.notification
        ? { ...state, notification: { ...state.notification, visible: false } }
        : state;
    }
    case 'PUSH_HISTORY': {
      const newEntry: HistoryEntry = {
        id: uuidv4(),
        timestamp: Date.now(),
        components: JSON.parse(JSON.stringify(state.components)),
      };
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(newEntry);
      return {
        ...state,
        history: newHistory,
        historyIndex: newHistory.length - 1,
      };
    }
    case 'UNDO': {
      if (state.historyIndex <= 0) return state;
      const prevIndex = state.historyIndex - 1;
      return {
        ...state,
        historyIndex: prevIndex,
        components: JSON.parse(JSON.stringify(state.history[prevIndex].components)),
      };
    }
    case 'REDO': {
      if (state.historyIndex >= state.history.length - 1) return state;
      const nextIndex = state.historyIndex + 1;
      return {
        ...state,
        historyIndex: nextIndex,
        components: JSON.parse(JSON.stringify(state.history[nextIndex].components)),
      };
    }
    default:
      return state;
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    const snapshot = getSnapshotFromURL();
    if (snapshot) {
      dispatch({
        type: 'LOAD_SNAPSHOT',
        payload: { components: snapshot.components, theme: snapshot.theme },
      });
      dispatch({ type: 'SHOW_NOTIFICATION', payload: '配置已加载' });
      const timer = setTimeout(() => {
        dispatch({ type: 'HIDE_NOTIFICATION' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (state.notification?.visible) {
      const timer = setTimeout(() => {
        dispatch({ type: 'HIDE_NOTIFICATION' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.notification]);

  const getDefinition = useCallback((type: string) => {
    return COMPONENT_DEFINITIONS.find((d) => d.type === type);
  }, []);

  return (
    <AppContext.Provider
      value={{
        state,
        dispatch,
        componentDefinitions: COMPONENT_DEFINITIONS,
        getDefinition,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

export { createSnapshot, setSnapshotToURL };
