import { create } from 'zustand';
import type { User, Board, Task, Comment, TaskStatus, EmotionType, RetroReport, RetroPeriod } from '@/types';
import { api } from '@/api';

interface AppState {
  user: User | null;
  boards: Board[];
  currentBoard: Board | null;
  tasks: Task[];
  comments: Record<string, Comment[]>;
  loading: boolean;
  error: string | null;
  
  setUser: (user: User | null) => void;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, password: string, nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  
  fetchBoards: () => Promise<void>;
  setCurrentBoard: (board: Board | null) => void;
  createBoard: (name: string, description: string) => Promise<Board>;
  
  fetchTasks: (boardId: string) => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTaskState: (taskId: string, status: TaskStatus, index: number) => Promise<void>;
  updateTaskEmotion: (taskId: string, emotion: EmotionType) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  
  fetchComments: (taskId: string) => Promise<void>;
  addComment: (taskId: string, content: string, userId: string) => Promise<void>;
  
  generateReport: (boardId: string, period: RetroPeriod) => Promise<RetroReport>;
  exportReport: (report: RetroReport, boardName: string) => Promise<void>;
  
  clearError: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  user: null,
  boards: [],
  currentBoard: null,
  tasks: [],
  comments: {},
  loading: false,
  error: null,

  setUser: (user) => set({ user }),

  login: async (username, password) => {
    set({ loading: true, error: null });
    try {
      const user = await api.login(username, password);
      set({ user, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '登录失败', loading: false });
      throw err;
    }
  },

  register: async (username, password, nickname) => {
    set({ loading: true, error: null });
    try {
      const user = await api.register(username, password, nickname);
      set({ user, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '注册失败', loading: false });
      throw err;
    }
  },

  logout: async () => {
    await api.logout();
    set({ user: null, boards: [], currentBoard: null, tasks: [], comments: {} });
  },

  checkAuth: async () => {
    set({ loading: true });
    try {
      const user = await api.getCurrentUser();
      set({ user, loading: false });
    } catch {
      set({ user: null, loading: false });
    }
  },

  fetchBoards: async () => {
    const { user } = get();
    if (!user) return;
    
    set({ loading: true });
    try {
      const boards = await api.getBoards(user.id);
      set({ boards, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取看板失败', loading: false });
    }
  },

  setCurrentBoard: (board) => set({ currentBoard: board }),

  createBoard: async (name, description) => {
    const { user } = get();
    if (!user) throw new Error('未登录');
    
    set({ loading: true });
    try {
      const board = await api.createBoard({
        name,
        description,
        ownerId: user.id,
        memberIds: [],
      });
      set((state) => ({ boards: [...state.boards, board], loading: false }));
      return board;
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建看板失败', loading: false });
      throw err;
    }
  },

  fetchTasks: async (boardId) => {
    set({ loading: true });
    try {
      const tasks = await api.getTasks(boardId);
      set({ tasks, loading: false });
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取任务失败', loading: false });
    }
  },

  addTask: async (task) => {
    set({ loading: true });
    try {
      const newTask = await api.createTask(task);
      set((state) => ({ tasks: [...state.tasks, newTask], loading: false }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '创建任务失败', loading: false });
    }
  },

  updateTaskState: async (taskId, status, index) => {
    const { tasks } = get();
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;
    
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, status, updatedAt: new Date().toISOString() } : t
    );
    
    set({ tasks: updatedTasks });
    
    try {
      await api.moveTask(taskId, status, index);
    } catch (err) {
      set({ tasks });
      set({ error: err instanceof Error ? err.message : '移动任务失败' });
    }
  },

  updateTaskEmotion: async (taskId, emotion) => {
    const { tasks } = get();
    const updatedTasks = tasks.map((t) =>
      t.id === taskId ? { ...t, emotion, updatedAt: new Date().toISOString() } : t
    );
    set({ tasks: updatedTasks });
    
    try {
      await api.updateTaskEmotion(taskId, emotion);
    } catch (err) {
      set({ tasks });
      set({ error: err instanceof Error ? err.message : '更新情感失败' });
    }
  },

  deleteTask: async (taskId) => {
    const { tasks } = get();
    const filtered = tasks.filter((t) => t.id !== taskId);
    set({ tasks: filtered });
    
    try {
      await api.deleteTask(taskId);
    } catch (err) {
      set({ tasks });
      set({ error: err instanceof Error ? err.message : '删除任务失败' });
    }
  },

  fetchComments: async (taskId) => {
    try {
      const comments = await api.getComments(taskId);
      set((state) => ({
        comments: { ...state.comments, [taskId]: comments },
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '获取评论失败' });
    }
  },

  addComment: async (taskId, content, userId) => {
    try {
      const comment = await api.createComment({ taskId, userId, content });
      set((state) => ({
        comments: {
          ...state.comments,
          [taskId]: [...(state.comments[taskId] || []), comment],
        },
      }));
    } catch (err) {
      set({ error: err instanceof Error ? err.message : '添加评论失败' });
    }
  },

  generateReport: async (boardId, period) => {
    return await api.generateReport(boardId, period);
  },

  exportReport: async (report, boardName) => {
    const html = await api.exportReportToHtml(report, boardName);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${boardName}-回顾报告-${new Date().toLocaleDateString('zh-CN')}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },

  clearError: () => set({ error: null }),
}));
