import { create } from 'zustand';

export interface Meeting {
  id: string;
  title: string;
  agenda: string;
  attendees: string[];
  dateTime: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export interface Todo {
  id: string;
  meetingId: string;
  description: string;
  status: 'todo' | 'in-progress' | 'done';
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMeetingRequest {
  title: string;
  agenda: string;
  attendees: string[];
  dateTime: string;
}

export interface UpdateTodoRequest {
  status?: 'todo' | 'in-progress' | 'done';
  order?: number;
}

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface MeetingState {
  meetings: Meeting[];
  currentMeeting: Meeting | null;
  todos: Todo[];
  loading: boolean;
  error: string | null;
  saveStatus: SaveStatus;
  fetchMeetings: () => Promise<void>;
  fetchMeeting: (id: string) => Promise<void>;
  createMeeting: (data: CreateMeetingRequest) => Promise<Meeting | null>;
  updateNotes: (id: string, notes: string) => Promise<void>;
  fetchTodos: () => Promise<void>;
  updateTodo: (id: string, data: UpdateTodoRequest) => Promise<void>;
  setCurrentMeeting: (meeting: Meeting | null) => void;
  setSaveStatus: (status: SaveStatus) => void;
}

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const mockMeetings: Meeting[] = [
  {
    id: '1',
    title: '第一季度规划会议',
    agenda: '讨论Q1目标、团队分工和里程碑',
    attendees: ['zhangsan@example.com', 'lisi@example.com', 'wangwu@example.com'],
    dateTime: '2026-01-15T10:00:00',
    notes: '# Q1 规划会议\n\n## 目标\n- 完成产品v2.0发布\n- 新增用户10万\n\n## 待办事项\n- [ ] 完成需求文档\n- [ ] 设计UI原型\n- [ ] 后端接口开发',
    createdAt: '2026-01-10T09:00:00',
    updatedAt: '2026-01-15T11:00:00',
  },
  {
    id: '2',
    title: '产品迭代讨论',
    agenda: '评审新功能需求，确定优先级',
    attendees: ['product@example.com', 'dev@example.com'],
    dateTime: '2026-01-20T14:00:00',
    notes: '',
    createdAt: '2026-01-18T10:00:00',
    updatedAt: '2026-01-18T10:00:00',
  },
];

const mockTodos: Todo[] = [
  {
    id: 't1',
    meetingId: '1',
    description: '完成需求文档',
    status: 'in-progress',
    order: 0,
    createdAt: '2026-01-15T10:30:00',
    updatedAt: '2026-01-16T09:00:00',
  },
  {
    id: 't2',
    meetingId: '1',
    description: '设计UI原型',
    status: 'todo',
    order: 1,
    createdAt: '2026-01-15T10:30:00',
    updatedAt: '2026-01-15T10:30:00',
  },
  {
    id: 't3',
    meetingId: '1',
    description: '后端接口开发',
    status: 'todo',
    order: 2,
    createdAt: '2026-01-15T10:30:00',
    updatedAt: '2026-01-15T10:30:00',
  },
];

export const useMeetingStore = create<MeetingState>((set, get) => ({
  meetings: [],
  currentMeeting: null,
  todos: [],
  loading: false,
  error: null,
  saveStatus: 'idle',

  fetchMeetings: async () => {
    set({ loading: true, error: null });
    try {
      await delay(300);
      set({ meetings: mockMeetings, loading: false });
    } catch (_err) {
      set({ error: '获取会议列表失败', loading: false });
    }
  },

  fetchMeeting: async (id: string) => {
    set({ loading: true, error: null });
    try {
      await delay(200);
      const meeting = get().meetings.find(m => m.id === id) || mockMeetings.find(m => m.id === id);
      set({ currentMeeting: meeting || null, loading: false });
    } catch (_err) {
      set({ error: '获取会议详情失败', loading: false });
    }
  },

  createMeeting: async (data: CreateMeetingRequest): Promise<Meeting | null> => {
    set({ loading: true, error: null });
    try {
      await delay(300);
      const newMeeting: Meeting = {
        id: crypto.randomUUID(),
        ...data,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set(state => ({
        meetings: [...state.meetings, newMeeting],
        currentMeeting: newMeeting,
        loading: false,
      }));
      return newMeeting;
    } catch (_err) {
      set({ error: '创建会议失败', loading: false });
      return null;
    }
  },

  updateNotes: async (id: string, notes: string) => {
    set({ saveStatus: 'saving' });
    try {
      await delay(200);
      set(state => ({
        meetings: state.meetings.map(m =>
          m.id === id ? { ...m, notes, updatedAt: new Date().toISOString() } : m
        ),
        currentMeeting: state.currentMeeting?.id === id
          ? { ...state.currentMeeting, notes, updatedAt: new Date().toISOString() }
          : state.currentMeeting,
        saveStatus: 'saved',
      }));
      setTimeout(() => set({ saveStatus: 'idle' }), 1500);
    } catch (_err) {
      set({ saveStatus: 'error' });
    }
  },

  fetchTodos: async () => {
    set({ loading: true, error: null });
    try {
      await delay(200);
      set({ todos: mockTodos, loading: false });
    } catch (_err) {
      set({ error: '获取待办列表失败', loading: false });
    }
  },

  updateTodo: async (id: string, data: UpdateTodoRequest) => {
    try {
      await delay(150);
      set(state => ({
        todos: state.todos.map(t =>
          t.id === id ? { ...t, ...data, updatedAt: new Date().toISOString() } : t
        ),
      }));
    } catch (_err) {
      set({ error: '更新待办失败' });
    }
  },

  setCurrentMeeting: (meeting: Meeting | null) => {
    set({ currentMeeting: meeting });
  },

  setSaveStatus: (status: SaveStatus) => {
    set({ saveStatus: status });
  },
}));
