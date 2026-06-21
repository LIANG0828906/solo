import { create } from 'zustand';
import axios from 'axios';
import { io, Socket } from 'socket.io-client';

export interface User {
  id: string;
  name: string;
  avatar: string;
}

export interface Project {
  id: string;
  name: string;
  members: { userId: string; role: string }[];
  createdAt: string;
  updatedAt: string;
  totalTasks?: number;
  completedTasks?: number;
  role?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'unassigned' | 'translating' | 'reviewing' | 'completed';
  assigneeId: string;
  assigneeName: string;
  assigneeAvatar: string;
  dueDate: string;
  createdAt: string;
}

export interface Term {
  id: string;
  projectId: string;
  sourceTerm: string;
  targetTerm: string;
  sourceLang: string;
  targetLang: string;
  notes: string;
  updatedAt: string;
}

export type WsStatus = 'connected' | 'reconnecting' | 'disconnected';

interface ProjectState {
  currentUser: User | null;
  users: User[];
  projects: Project[];
  currentProject: Project | null;
  tasks: Task[];
  terms: Term[];
  wsStatus: WsStatus;
  lastSyncTime: number | null;
  socket: Socket | null;

  login: (name: string) => Promise<void>;
  fetchUsers: () => Promise<void>;
  fetchProjects: () => Promise<void>;
  createProject: (name: string) => Promise<void>;
  setCurrentProject: (project: Project | null) => void;
  fetchTasks: (projectId: string) => Promise<void>;
  createTask: (projectId: string, task: Partial<Task>) => Promise<void>;
  updateTaskStatus: (taskId: string, status: Task['status']) => Promise<void>;
  fetchTerms: (projectId: string) => Promise<void>;
  addTerm: (projectId: string, term: Partial<Term>) => Promise<void>;
  updateTerm: (termId: string, term: Partial<Term>) => Promise<void>;
  deleteTerm: (termId: string) => Promise<void>;
  connectSocket: (projectId: string) => void;
  disconnectSocket: () => void;
  reconnectSocket: () => void;
  setWsStatus: (status: WsStatus) => void;
  setLastSyncTime: () => void;
}

const useProjectStore = create<ProjectState>((set, get) => ({
  currentUser: null,
  users: [],
  projects: [],
  currentProject: null,
  tasks: [],
  terms: [],
  wsStatus: 'disconnected',
  lastSyncTime: null,
  socket: null,

  login: async (name: string) => {
    const res = await axios.post('/api/users', { name });
    const user = res.data;
    set({ currentUser: user });
    localStorage.setItem('tc_user', JSON.stringify(user));
  },

  fetchUsers: async () => {
    const res = await axios.get('/api/users');
    set({ users: res.data });
  },

  fetchProjects: async () => {
    const user = get().currentUser;
    const params = user ? { userId: user.id } : {};
    const res = await axios.get('/api/projects', { params });
    set({ projects: res.data });
  },

  createProject: async (name: string) => {
    const user = get().currentUser;
    if (!user) return;
    await axios.post('/api/projects', { name, userId: user.id });
    await get().fetchProjects();
  },

  setCurrentProject: (project: Project | null) => {
    set({ currentProject: project });
  },

  fetchTasks: async (projectId: string) => {
    const res = await axios.get(`/api/projects/${projectId}/tasks`);
    set({ tasks: res.data });
  },

  createTask: async (projectId: string, task: Partial<Task>) => {
    await axios.post(`/api/projects/${projectId}/tasks`, task);
    await get().fetchTasks(projectId);
  },

  updateTaskStatus: async (taskId: string, status: Task['status']) => {
    const task = get().tasks.find(t => t.id === taskId);
    if (!task) return;
    await axios.patch(`/api/tasks/${taskId}`, { status });
    await get().fetchTasks(task.projectId);
  },

  fetchTerms: async (projectId: string) => {
    const res = await axios.get(`/api/projects/${projectId}/terms`);
    set({ terms: res.data });
  },

  addTerm: async (projectId: string, term: Partial<Term>) => {
    await axios.post(`/api/projects/${projectId}/terms`, term);
    await get().fetchTerms(projectId);
  },

  updateTerm: async (termId: string, term: Partial<Term>) => {
    await axios.put(`/api/terms/${termId}`, term);
    const current = get().terms.find(t => t.id === termId);
    if (current) {
      await get().fetchTerms(current.projectId);
    }
  },

  deleteTerm: async (termId: string) => {
    const current = get().terms.find(t => t.id === termId);
    await axios.delete(`/api/terms/${termId}`);
    if (current) {
      await get().fetchTerms(current.projectId);
    }
  },

  connectSocket: (projectId: string) => {
    const existing = get().socket;
    if (existing) {
      existing.disconnect();
    }

    const socket = io({ transports: ['websocket', 'polling'] });

    socket.on('connect', () => {
      set({ wsStatus: 'connected' });
      get().setLastSyncTime();
      socket.emit('join_project', { projectId });
    });

    socket.on('disconnect', () => {
      set({ wsStatus: 'disconnected' });
    });

    socket.on('connect_error', () => {
      set({ wsStatus: 'reconnecting' });
    });

    socket.on('task_updated', (task: Task) => {
      const currentProject = get().currentProject;
      if (currentProject && task.projectId === currentProject.id) {
        set(state => ({
          tasks: state.tasks.map(t => (t.id === task.id ? task : t)),
        }));
        get().setLastSyncTime();
      }
    });

    socket.on('term_updated', (term: Term) => {
      const currentProject = get().currentProject;
      if (currentProject && term.projectId === currentProject.id) {
        set(state => {
          const exists = state.terms.find(t => t.id === term.id);
          return {
            terms: exists
              ? state.terms.map(t => (t.id === term.id ? term : t))
              : [...state.terms, term],
          };
        });
        get().setLastSyncTime();
      }
    });

    socket.on('term_deleted', (data: { id: string }) => {
      set(state => ({
        terms: state.terms.filter(t => t.id !== data.id),
      }));
      get().setLastSyncTime();
    });

    set({ socket });
  },

  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, wsStatus: 'disconnected' });
    }
  },

  reconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      set({ wsStatus: 'reconnecting' });
      socket.disconnect();
      socket.connect();
    }
  },

  setWsStatus: (status: WsStatus) => {
    set({ wsStatus: status });
  },

  setLastSyncTime: () => {
    set({ lastSyncTime: Date.now() });
  },
}));

export default useProjectStore;
