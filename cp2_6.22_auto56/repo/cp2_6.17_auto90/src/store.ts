import { create } from 'zustand';
import { openDB, IDBPDatabase } from 'idb';
import { v4 as uuidv4 } from 'uuid';
import type { Timeline, Event } from './types';

interface TimelineStore {
  timelines: Timeline[];
  events: Event[];
  currentTimeline: Timeline | null;
  isLoading: boolean;
  initDB: () => Promise<void>;
  addTimeline: (title: string, description: string) => Promise<Timeline>;
  deleteTimeline: (id: string) => Promise<void>;
  getTimelineById: (id: string) => Timeline | undefined;
  getEventsByTimelineId: (timelineId: string) => Event[];
  addEvent: (timelineId: string, event: Omit<Event, 'id' | 'timelineId' | 'createdAt' | 'updatedAt'>) => Promise<Event>;
  updateEvent: (eventId: string, event: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  exportTimeline: (timelineId: string) => Promise<{ timeline: Timeline; events: Event[] }>;
  importTimeline: (data: { timeline: Timeline; events: Event[] }) => Promise<void>;
  getTimelineCount: () => number;
  getEventCount: () => number;
}

let db: IDBPDatabase | null = null;

const initIndexedDB = async (): Promise<IDBPDatabase> => {
  if (db) return db;

  db = await openDB('TimelineDB', 1, {
    upgrade(database) {
      if (!database.objectStoreNames.contains('timelines')) {
        const timelineStore = database.createObjectStore('timelines', { keyPath: 'id' });
        timelineStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
      if (!database.objectStoreNames.contains('events')) {
        const eventStore = database.createObjectStore('events', { keyPath: 'id' });
        eventStore.createIndex('timelineId', 'timelineId', { unique: false });
        eventStore.createIndex('date', 'date', { unique: false });
      }
    },
  });

  return db;
};

export const useTimelineStore = create<TimelineStore>((set, get) => ({
  timelines: [],
  events: [],
  currentTimeline: null,
  isLoading: true,

  initDB: async () => {
    try {
      const database = await initIndexedDB();

      const timelines = await database.getAll('timelines');
      const events = await database.getAll('events');

      set({
        timelines, events, isLoading: false
      });
    } catch (error) {
      console.error('Failed to initialize database:', error);
      set({ isLoading: false });
    }
  },

  addTimeline: async (title, description) => {
    const database = await initIndexedDB();
    const now = new Date().toISOString();
    const newTimeline: Timeline = {
      id: uuidv4(),
      title,
      description,
      createdAt: now,
      updatedAt: now,
    };

    await database.add('timelines', newTimeline);
    set((state) => ({
      timelines: [...state.timelines, newTimeline],
    }));

    return newTimeline;
  },

  deleteTimeline: async (id) => {
    const database = await initIndexedDB();

    await database.delete('timelines', id);

    const eventsToDelete = get().events.filter((e) => e.timelineId === id);
    for (const event of eventsToDelete) {
      await database.delete('events', event.id);
    }

    set((state) => ({
      timelines: state.timelines.filter((t) => t.id !== id),
      events: state.events.filter((e) => e.timelineId !== id),
      currentTimeline: state.currentTimeline?.id === id ? null : state.currentTimeline,
    }));
  },

  getTimelineById: (id) => {
    return get().timelines.find((t) => t.id === id);
  },

  getEventsByTimelineId: (timelineId) => {
    return get()
      .events.filter((e) => e.timelineId === timelineId)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  },

  addEvent: async (timelineId, eventData) => {
    const database = await initIndexedDB();
    const now = new Date().toISOString();
    const newEvent: Event = {
      id: uuidv4(),
      timelineId,
      ...eventData,
      createdAt: now,
      updatedAt: now,
    };

    await database.add('events', newEvent);
    set((state) => ({
      events: [...state.events, newEvent],
    }));

    return newEvent;
  },

  updateEvent: async (eventId, eventData) => {
    const database = await initIndexedDB();
    const existingEvent = get().events.find((e) => e.id === eventId);
    if (!existingEvent) return;

    const now = new Date().toISOString();
    const updatedEvent: Event = {
      ...existingEvent,
      ...eventData,
      updatedAt: now,
    };

    await database.put('events', updatedEvent);
    set((state) => ({
      events: state.events.map((e) => (e.id === eventId ? updatedEvent : e)),
    }));
  },

  deleteEvent: async (eventId) => {
    const database = await initIndexedDB();
    await database.delete('events', eventId);
    set((state) => ({
      events: state.events.filter((e) => e.id !== eventId),
    }));
  },

  exportTimeline: async (timelineId) => {
    const timeline = get().timelines.find((t) => t.id === timelineId);
    const events = get().getEventsByTimelineId(timelineId);

    if (!timeline) {
      throw new Error('Timeline not found');
    }

    return { timeline, events };
  },

  importTimeline: async (data) => {
    const database = await initIndexedDB();
    const now = new Date().toISOString();
    const newTimelineId = uuidv4();

    const importedTimeline: Timeline = {
      ...data.timeline,
      id: newTimelineId,
      createdAt: now,
      updatedAt: now,
    };

    await database.add('timelines', importedTimeline);

    const importedEvents: Event[] = data.events.map((event) => ({
      ...event,
      id: uuidv4(),
      timelineId: newTimelineId,
      createdAt: now,
      updatedAt: now,
    }));

    for (const event of importedEvents) {
      await database.add('events', event);
    }

    set((state) => ({
      timelines: [...state.timelines, importedTimeline],
      events: [...state.events, ...importedEvents],
    }));
  },

  getTimelineCount: () => get().timelines.length,
  getEventCount: () => get().events.length,
}));
