import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { meetingsStore, getAllItems, getItem, setItem, deleteItem } from '@/utils/db';
import type { TodoItem, TaskStore } from '../task/TaskStore';

export interface Meeting {
  id: string;
  title: string;
  content: string;
  conclusions: string[];
  date: string;
  createdAt: number;
  updatedAt: number;
}

interface MeetingState {
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  currentTodos: TodoItem[];
  loading: boolean;
  searchKeyword: string;
  dateFrom: string;
  dateTo: string;
}

interface MeetingActions {
  fetchMeetings: () => Promise<void>;
  getMeetingById: (id: string) => Promise<Meeting | null>;
  createMeeting: (data: {
    title: string;
    content: string;
    conclusions: string[];
    todos: Omit<TodoItem, 'id' | 'meetingId' | 'status' | 'createdAt'>[];
  }) => Promise<Meeting>;
  updateMeeting: (id: string, data: Partial<Meeting> & {
    todos?: Omit<TodoItem, 'id' | 'meetingId' | 'status' | 'createdAt'>[];
  }) => Promise<void>;
  deleteMeeting: (id: string) => Promise<void>;
  setCurrentMeeting: (meeting: Meeting | null) => void;
  setCurrentTodos: (todos: TodoItem[]) => void;
  setSearchKeyword: (keyword: string) => void;
  setDateFilter: (from: string, to: string) => void;
  getFilteredMeetings: () => Meeting[];
  getTodoCountForMeeting: (meetingId: string) => number;
}

export type MeetingStore = MeetingState & MeetingActions;

let taskStoreRef: TaskStore | null = null;

export function setTaskStoreRef(store: TaskStore) {
  taskStoreRef = store;
}

export const useMeetingStore = create<MeetingStore>((set, get) => ({
  meetings: [],
  currentMeeting: null,
  currentTodos: [],
  loading: false,
  searchKeyword: '',
  dateFrom: '',
  dateTo: '',

  fetchMeetings: async () => {
    set({ loading: true });
    try {
      const meetings = await getAllItems<Meeting>(meetingsStore);
      meetings.sort((a, b) => b.createdAt - a.createdAt);
      set({ meetings, loading: false });
    } catch (e) {
      console.error('Failed to fetch meetings:', e);
      set({ loading: false });
    }
  },

  getMeetingById: async (id: string) => {
    const meeting = await getItem<Meeting>(id, meetingsStore);
    return meeting || null;
  },

  createMeeting: async (data) => {
    const now = Date.now();
    const meeting: Meeting = {
      id: uuidv4(),
      title: data.title,
      content: data.content,
      conclusions: data.conclusions,
      date: format(new Date(), 'yyyy-MM-dd'),
      createdAt: now,
      updatedAt: now,
    };

    await setItem(meeting.id, meeting, meetingsStore);

    if (taskStoreRef) {
      for (const todo of data.todos) {
        await taskStoreRef.createTodo({
          ...todo,
          meetingId: meeting.id,
        });
      }
    }

    set((state) => ({
      meetings: [meeting, ...state.meetings],
    }));

    return meeting;
  },

  updateMeeting: async (id, data) => {
    const existing = await getItem<Meeting>(id, meetingsStore);
    if (!existing) return;

    const updated: Meeting = {
      ...existing,
      ...data,
      updatedAt: Date.now(),
    };

    await setItem(id, updated, meetingsStore);

    if (taskStoreRef && data.todos !== undefined) {
      await taskStoreRef.deleteTodosByMeetingId(id);
      for (const todo of data.todos) {
        await taskStoreRef.createTodo({
          ...todo,
          meetingId: id,
        });
      }
      const updatedTodos = await taskStoreRef.getTodosByMeetingId(id);
      set({ currentTodos: updatedTodos });
    }

    set((state) => ({
      meetings: state.meetings.map((m) => (m.id === id ? updated : m)),
      currentMeeting: state.currentMeeting?.id === id ? updated : state.currentMeeting,
    }));
  },

  deleteMeeting: async (id) => {
    await deleteItem(id, meetingsStore);

    if (taskStoreRef) {
      await taskStoreRef.deleteTodosByMeetingId(id);
    }

    set((state) => ({
      meetings: state.meetings.filter((m) => m.id !== id),
      currentMeeting: state.currentMeeting?.id === id ? null : state.currentMeeting,
    }));
  },

  setCurrentMeeting: (meeting) => set({ currentMeeting: meeting }),

  setCurrentTodos: (todos) => set({ currentTodos: todos }),

  setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),

  setDateFilter: (from, to) => set({ dateFrom: from, dateTo: to }),

  getFilteredMeetings: () => {
    const { meetings, searchKeyword, dateFrom, dateTo } = get();
    let result = [...meetings];

    if (searchKeyword.trim()) {
      const kw = searchKeyword.trim().toLowerCase();
      result = result.filter((m) =>
        m.title.toLowerCase().includes(kw) ||
        m.content.toLowerCase().includes(kw)
      );
    }

    if (dateFrom) {
      result = result.filter((m) => {
        try {
          const meetingDate = parseISO(m.date);
          const fromDate = parseISO(dateFrom);
          return meetingDate >= fromDate;
        } catch {
          return true;
        }
      });
    }

    if (dateTo) {
      result = result.filter((m) => {
        try {
          const meetingDate = parseISO(m.date);
          const toDate = parseISO(dateTo);
          return meetingDate <= toDate;
        } catch {
          return true;
        }
      });
    }

    return result;
  },

  getTodoCountForMeeting: (meetingId) => {
    if (!taskStoreRef) return 0;
    return taskStoreRef.todos.filter((t: TodoItem) => t.meetingId === meetingId).length;
  },
}));
