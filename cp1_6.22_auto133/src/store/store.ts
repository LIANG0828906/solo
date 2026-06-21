import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { v4 as uuidv4 } from 'uuid';

export type ComponentType =
  | 'primary-button'
  | 'secondary-button'
  | 'card'
  | 'modal'
  | 'accordion'
  | 'switch'
  | 'spinner'
  | 'notification';

export type EventType = 'onHover' | 'onClick' | 'onLongPress';

export interface LayoutItem {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  width: number;
  height: number;
  createdAt: number;
}

export interface EventLogEntry {
  id: string;
  componentId: string;
  componentType: ComponentType;
  eventType: EventType;
  timestamp: string;
}

export interface UiState {
  leftPanelOpen: boolean;
  rightPanelOpen: boolean;
}

interface AppState {
  layout: LayoutItem[];
  logs: EventLogEntry[];
  ui: UiState;
}

const initialState: AppState = {
  layout: [],
  logs: [],
  ui: {
    leftPanelOpen: true,
    rightPanelOpen: true,
  },
};

function formatTimestamp(): string {
  const now = new Date();
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

const MAX_LOGS = 100;

export const componentDefaultSize: Record<ComponentType, { width: number; height: number }> = {
  'primary-button': { width: 140, height: 44 },
  'secondary-button': { width: 140, height: 44 },
  card: { width: 240, height: 160 },
  modal: { width: 320, height: 200 },
  accordion: { width: 260, height: 120 },
  switch: { width: 60, height: 32 },
  spinner: { width: 48, height: 48 },
  notification: { width: 260, height: 56 },
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    addComponent: (
      state,
      action: PayloadAction<{
        type: ComponentType;
        x: number;
        y: number;
      }>,
    ) => {
      const { type, x, y } = action.payload;
      const size = componentDefaultSize[type];
      state.layout.push({
        id: uuidv4(),
        type,
        x,
        y,
        width: size.width,
        height: size.height,
        createdAt: Date.now(),
      });
    },
    moveComponent: (
      state,
      action: PayloadAction<{
        id: string;
        x: number;
        y: number;
      }>,
    ) => {
      const { id, x, y } = action.payload;
      const item = state.layout.find((l) => l.id === id);
      if (item) {
        item.x = x;
        item.y = y;
      }
    },
    removeComponent: (state, action: PayloadAction<{ id: string }>) => {
      state.layout = state.layout.filter((l) => l.id !== action.payload.id);
    },
    logEvent: (
      state,
      action: PayloadAction<{
        componentId: string;
        componentType: ComponentType;
        eventType: EventType;
      }>,
    ) => {
      const entry: EventLogEntry = {
        id: uuidv4(),
        componentId: action.payload.componentId,
        componentType: action.payload.componentType,
        eventType: action.payload.eventType,
        timestamp: formatTimestamp(),
      };
      state.logs.unshift(entry);
      if (state.logs.length > MAX_LOGS) {
        state.logs = state.logs.slice(0, MAX_LOGS);
      }
    },
    clearLogs: (state) => {
      state.logs = [];
    },
    resetLayout: (state) => {
      state.layout = [];
      state.logs = [];
    },
    toggleLeftPanel: (state) => {
      state.ui.leftPanelOpen = !state.ui.leftPanelOpen;
    },
    toggleRightPanel: (state) => {
      state.ui.rightPanelOpen = !state.ui.rightPanelOpen;
    },
  },
});

export const {
  addComponent,
  moveComponent,
  removeComponent,
  logEvent,
  clearLogs,
  resetLayout,
  toggleLeftPanel,
  toggleRightPanel,
} = appSlice.actions;

export const store = configureStore({
  reducer: {
    app: appSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
