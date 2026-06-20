import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import {
  TimelineEvent,
  Connection,
  TimelineConfig,
  ViewMode,
  EventType,
  Notification,
  NotificationType,
  HOUR_PIXELS,
  SNAP_MINUTES,
  MIN_NODE_SPACING,
  EVENT_NODE_WIDTH,
} from './types';

const STORAGE_KEY_EVENTS = 'timeline_events';
const STORAGE_KEY_CONNECTIONS = 'timeline_connections';
const STORAGE_KEY_CONFIG = 'timeline_config';

const defaultConfig: TimelineConfig = {
  viewMode: 'scroll',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  title: '我的时光织机',
  zoomLevel: 1,
};

interface TimelineState {
  events: TimelineEvent[];
  connections: Connection[];
  config: TimelineConfig;
  notifications: Notification[];
  selectedEventId: string | null;
  selectedConnectionId: string | null;
  editingEvent: TimelineEvent | null;
  editingConnection: Connection | null;
  showEventForm: boolean;
  showConnectionForm: boolean;
  showExportModal: boolean;
  currentSlideIndex: number;
  connectingFromId: string | null;
}

interface TimelineActions {
  addEvent: (event: Partial<TimelineEvent> & { title: string; date: string; type: EventType }) => TimelineEvent;
  removeEvent: (id: string) => void;
  updateEvent: (id: string, updates: Partial<TimelineEvent>) => void;
  getEvent: (id: string) => TimelineEvent | undefined;
  getAllEvents: () => TimelineEvent[];

  addConnection: (conn: Partial<Connection> & { fromEventId: string; toEventId: string }) => Connection;
  removeConnection: (id: string) => void;
  updateConnection: (id: string, updates: Partial<Connection>) => void;

  getConfig: () => TimelineConfig;
  updateConfig: (updates: Partial<TimelineConfig>) => void;
  setViewMode: (mode: ViewMode) => void;

  exportJSON: () => string;
  importJSON: (json: string) => boolean;
  exportMarkdown: () => string;

  saveToStorage: () => void;
  loadFromStorage: () => void;

  selectEvent: (id: string | null) => void;
  selectConnection: (id: string | null) => void;
  setEditingEvent: (event: TimelineEvent | null) => void;
  setEditingConnection: (conn: Connection | null) => void;
  setShowEventForm: (show: boolean) => void;
  setShowConnectionForm: (show: boolean) => void;
  setShowExportModal: (show: boolean) => void;
  setCurrentSlideIndex: (index: number) => void;
  setConnectingFromId: (id: string | null) => void;
  showNotification: (message: string, type: NotificationType) => void;
  removeNotification: (id: string) => void;
  dragUpdatePosition: (id: string, x: number, y: number) => void;
  finalizeDrag: (id: string, rawX: number, rawY: number) => void;
  resolveOverlaps: (afterId: string) => void;
  resetAll: () => void;
}

const loadFromLS = <T,>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw) as T;
  } catch {
    // ignore
  }
  return fallback;
};

const saveToLS = <T,>(key: string, value: T) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
};

let saveTimer: number | null = null;
const debouncedSave = (state: TimelineState) => {
  if (saveTimer) window.clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    saveToLS(STORAGE_KEY_EVENTS, state.events);
    saveToLS(STORAGE_KEY_CONNECTIONS, state.connections);
    saveToLS(STORAGE_KEY_CONFIG, state.config);
  }, 300);
};

const parseISODate = (iso: string): Date => {
  if (iso.startsWith('-')) {
    const match = iso.match(/^-(\d{1,4})-(\d{2})-(\d{2})$/);
    if (match) {
      const year = -parseInt(match[1], 10);
      const month = parseInt(match[2], 10) - 1;
      const day = parseInt(match[3], 10);
      return new Date(year, month, day);
    }
  }
  return new Date(iso);
};

const dateToMinutes = (iso: string, baseIso: string): number => {
  const d = parseISODate(iso).getTime();
  const b = parseISODate(baseIso).getTime();
  return Math.round((d - b) / 60000);
};

const snapToGrid = (minutes: number, snap: number): number => {
  return Math.round(minutes / snap) * snap;
};

export const useTimelineStore = create<TimelineState & TimelineActions>((set, get) => ({
  events: [],
  connections: [],
  config: defaultConfig,
  notifications: [],
  selectedEventId: null,
  selectedConnectionId: null,
  editingEvent: null,
  editingConnection: null,
  showEventForm: false,
  showConnectionForm: false,
  showExportModal: false,
  currentSlideIndex: 0,
  connectingFromId: null,

  addEvent: (input) => {
    const now = Date.now();
    const config = get().config;
    const minutesFromStart = dateToMinutes(input.date, config.startDate);
    const x = (minutesFromStart / 60) * HOUR_PIXELS * config.zoomLevel;
    const existingYCount = get().events.length;
    const y = 100 + (existingYCount % 5) * 90;

    const newEvent: TimelineEvent = {
      id: uuidv4(),
      title: input.title,
      description: input.description ?? '',
      date: input.date,
      type: input.type,
      mediaUrl: input.mediaUrl,
      position: { x, y },
      span: input.span ?? 0,
      collapsed: input.collapsed ?? false,
      createdAt: now,
      updatedAt: now,
    };

    const next: TimelineState = {
      ...get(),
      events: [...get().events, newEvent],
    };
    set(next);
    debouncedSave(next);
    return newEvent;
  },

  removeEvent: (id) => {
    const events = get().events.filter((e) => e.id !== id);
    const connections = get().connections.filter(
      (c) => c.fromEventId !== id && c.toEventId !== id
    );
    const next = {
      ...get(),
      events,
      connections,
      selectedEventId: get().selectedEventId === id ? null : get().selectedEventId,
    };
    set(next);
    debouncedSave(next);
  },

  updateEvent: (id, updates) => {
    const events = get().events.map((e) =>
      e.id === id ? { ...e, ...updates, updatedAt: Date.now() } : e
    );
    const next = { ...get(), events };
    set(next);
    debouncedSave(next);
  },

  getEvent: (id) => get().events.find((e) => e.id === id),

  getAllEvents: () => get().events,

  addConnection: (input) => {
    const newConn: Connection = {
      id: uuidv4(),
      fromEventId: input.fromEventId,
      toEventId: input.toEventId,
      color: input.color ?? '#6B7280',
      width: input.width ?? 2,
      animation: input.animation ?? 'none',
      createdAt: Date.now(),
    };
    const connections = [...get().connections, newConn];
    const next = { ...get(), connections };
    set(next);
    debouncedSave(next);
    return newConn;
  },

  removeConnection: (id) => {
    const connections = get().connections.filter((c) => c.id !== id);
    const next = {
      ...get(),
      connections,
      selectedConnectionId: get().selectedConnectionId === id ? null : get().selectedConnectionId,
    };
    set(next);
    debouncedSave(next);
  },

  updateConnection: (id, updates) => {
    const connections = get().connections.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    );
    const next = { ...get(), connections };
    set(next);
    debouncedSave(next);
  },

  getConfig: () => get().config,

  updateConfig: (updates) => {
    const config = { ...get().config, ...updates };
    const next = { ...get(), config };
    set(next);
    debouncedSave(next);
  },

  setViewMode: (mode) => {
    get().updateConfig({ viewMode: mode });
    set({ currentSlideIndex: 0 });
  },

  exportJSON: () => {
    const { events, connections, config } = get();
    return JSON.stringify(
      {
        version: 1,
        exportedAt: new Date().toISOString(),
        config,
        events,
        connections,
      },
      null,
      2
    );
  },

  importJSON: (raw) => {
    try {
      const data = JSON.parse(raw);
      if (!data.events || !Array.isArray(data.events)) return false;
      const next = {
        ...get(),
        events: data.events as TimelineEvent[],
        connections: (data.connections ?? []) as Connection[],
        config: (data.config ?? defaultConfig) as TimelineConfig,
      };
      set(next);
      debouncedSave(next);
      return true;
    } catch {
      return false;
    }
  },

  exportMarkdown: () => {
    const { events, connections, config } = get();
    const sorted = [...events].sort((a, b) => {
      const ma = dateToMinutes(a.date, config.startDate);
      const mb = dateToMinutes(b.date, config.startDate);
      return ma - mb;
    });

    const lines: string[] = [];
    lines.push(`# ${config.title || '时光织机时间线'}`);
    lines.push('');
    lines.push(`> 导出时间：${new Date().toLocaleString()}`);
    lines.push(`> 事件总数：${events.length} | 关联关系：${connections.length}`);
    lines.push('');

    lines.push('## 事件列表');
    lines.push('');
    sorted.forEach((e, i) => {
      const typeIcon = e.type === 'text' ? '📝' : e.type === 'image' ? '🖼️' : '🎬';
      lines.push(`### ${i + 1}. ${typeIcon} ${e.title}`);
      lines.push('');
      lines.push(`- **日期**：${e.date}`);
      lines.push(`- **类型**：${e.type}`);
      if (e.mediaUrl) lines.push(`- **媒体链接**：${e.mediaUrl}`);
      lines.push('');
      if (e.description) {
        lines.push(e.description);
        lines.push('');
      }
    });

    if (connections.length > 0) {
      lines.push('## 关联关系');
      lines.push('');
      connections.forEach((c) => {
        const from = events.find((e) => e.id === c.fromEventId);
        const to = events.find((e) => e.id === c.toEventId);
        if (from && to) {
          lines.push(`- **${from.title}** → **${to.title}**`);
        }
      });
    }

    return lines.join('\n');
  },

  saveToStorage: () => {
    const s = get();
    saveToLS(STORAGE_KEY_EVENTS, s.events);
    saveToLS(STORAGE_KEY_CONNECTIONS, s.connections);
    saveToLS(STORAGE_KEY_CONFIG, s.config);
  },

  loadFromStorage: () => {
    const events = loadFromLS<TimelineEvent[]>(STORAGE_KEY_EVENTS, []);
    const connections = loadFromLS<Connection[]>(STORAGE_KEY_CONNECTIONS, []);
    const config = loadFromLS<TimelineConfig>(STORAGE_KEY_CONFIG, defaultConfig);
    set({ events, connections, config });
  },

  selectEvent: (id) => set({ selectedEventId: id, selectedConnectionId: null }),
  selectConnection: (id) => set({ selectedConnectionId: id, selectedEventId: null }),
  setEditingEvent: (event) => set({ editingEvent: event }),
  setEditingConnection: (conn) => set({ editingConnection: conn }),
  setShowEventForm: (show) => set({ showEventForm: show }),
  setShowConnectionForm: (show) => set({ showConnectionForm: show }),
  setShowExportModal: (show) => set({ showExportModal: show }),
  setCurrentSlideIndex: (index) => set({ currentSlideIndex: index }),
  setConnectingFromId: (id) => set({ connectingFromId: id }),

  showNotification: (message, type) => {
    const id = uuidv4();
    const notification: Notification = { id, message, type };
    set({ notifications: [...get().notifications, notification] });
    window.setTimeout(() => {
      set({ notifications: get().notifications.filter((n) => n.id !== id) });
    }, 3000);
  },

  removeNotification: (id) => {
    set({ notifications: get().notifications.filter((n) => n.id !== id) });
  },

  dragUpdatePosition: (id, x, y) => {
    const events = get().events.map((e) =>
      e.id === id ? { ...e, position: { x, y }, updatedAt: Date.now() } : e
    );
    set({ events });
  },

  finalizeDrag: (id, rawX, rawY) => {
    const config = get().config;
    const minutesFromStart = (rawX / (HOUR_PIXELS * config.zoomLevel)) * 60;
    const snapped = snapToGrid(minutesFromStart, SNAP_MINUTES);
    const snappedX = (snapped / 60) * HOUR_PIXELS * config.zoomLevel;
    const y = Math.max(20, Math.round(rawY / 10) * 10);

    get().updateEvent(id, { position: { x: snappedX, y } });
    get().resolveOverlaps(id);
  },

  resolveOverlaps: (afterId) => {
    const all = [...get().events].sort((a, b) => a.position.x - b.position.x);
    let changed = false;
    for (let i = 0; i < all.length - 1; i++) {
      const a = all[i];
      const b = all[i + 1];
      const distance = (b.position.x + EVENT_NODE_WIDTH / 2) - (a.position.x - EVENT_NODE_WIDTH / 2);
      if (Math.abs(a.position.y - b.position.y) < 40 && distance < EVENT_NODE_WIDTH + MIN_NODE_SPACING) {
        const overlap = EVENT_NODE_WIDTH + MIN_NODE_SPACING - distance;
        b.position = { ...b.position, x: b.position.x + overlap / 2 + 10 };
        a.position = { ...a.position, x: a.position.x - overlap / 2 - 10 };
        changed = true;
      }
    }
    if (changed) {
      const next = { ...get(), events: all };
      set(next);
      debouncedSave(next);
    }
  },

  resetAll: () => {
    set({
      events: [],
      connections: [],
      config: defaultConfig,
      selectedEventId: null,
      selectedConnectionId: null,
      editingEvent: null,
      editingConnection: null,
    });
    localStorage.removeItem(STORAGE_KEY_EVENTS);
    localStorage.removeItem(STORAGE_KEY_CONNECTIONS);
    localStorage.removeItem(STORAGE_KEY_CONFIG);
  },
}));

export const createDataManager = () => ({
  store: useTimelineStore,
});

export { parseISODate, dateToMinutes, snapToGrid };
