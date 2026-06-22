import { create } from 'zustand';
import type { Project, Milestone, Task, Asset, TaskStatus, WsMessage } from './types';

interface Toast {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'success';
}

interface AppState {
  projects: Project[];
  milestones: Milestone[];
  tasks: Task[];
  assets: Asset[];
  toasts: Toast[];
  sidebarOpen: boolean;
  filterEngine: string;
  filterPlatform: string;
  ws: WebSocket | null;

  setProjects: (projects: Project[]) => void;
  setMilestones: (milestones: Milestone[]) => void;
  setTasks: (tasks: Task[]) => void;
  setAssets: (assets: Asset[]) => void;
  addProject: (project: Project) => void;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  addMilestone: (milestone: Milestone) => void;
  updateMilestone: (id: string, data: Partial<Milestone>) => void;
  deleteMilestone: (id: string) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, data: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addAsset: (asset: Asset) => void;
  updateAsset: (id: string, data: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;
  addToast: (message: string, type?: Toast['type']) => void;
  removeToast: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setFilterEngine: (engine: string) => void;
  setFilterPlatform: (platform: string) => void;
  initWebSocket: () => void;
  handleWsMessage: (message: WsMessage) => void;
  fetchProjectData: (projectId: string) => Promise<void>;
  fetchProjects: () => Promise<void>;
  updateTaskStatus: (taskId: string, newStatus: TaskStatus) => Promise<void>;
}

let toastCounter = 0;

export const useStore = create<AppState>((set, get) => ({
  projects: [],
  milestones: [],
  tasks: [],
  assets: [],
  toasts: [],
  sidebarOpen: true,
  filterEngine: '',
  filterPlatform: '',
  ws: null,

  setProjects: (projects) => set({ projects }),
  setMilestones: (milestones) => set({ milestones }),
  setTasks: (tasks) => set({ tasks }),
  setAssets: (assets) => set({ assets }),

  addProject: (project) => set((s) => ({ projects: [...s.projects, project] })),
  updateProject: (id, data) => set((s) => ({
    projects: s.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
  })),
  deleteProject: (id) => set((s) => ({
    projects: s.projects.filter((p) => p.id !== id),
    milestones: s.milestones.filter((m) => m.projectId !== id),
    tasks: s.tasks.filter((t) => t.projectId !== id),
    assets: s.assets.filter((a) => a.projectId !== id),
  })),

  addMilestone: (milestone) => set((s) => ({ milestones: [...s.milestones, milestone] })),
  updateMilestone: (id, data) => set((s) => ({
    milestones: s.milestones.map((m) => (m.id === id ? { ...m, ...data } : m)),
  })),
  deleteMilestone: (id) => set((s) => ({
    milestones: s.milestones.filter((m) => m.id !== id),
    tasks: s.tasks.filter((t) => t.milestoneId !== id),
  })),

  addTask: (task) => set((s) => ({ tasks: [...s.tasks, task] })),
  updateTask: (id, data) => set((s) => ({
    tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...data } : t)),
  })),
  deleteTask: (id) => set((s) => ({ tasks: s.tasks.filter((t) => t.id !== id) })),

  addAsset: (asset) => set((s) => ({ assets: [...s.assets, asset] })),
  updateAsset: (id, data) => set((s) => ({
    assets: s.assets.map((a) => (a.id === id ? { ...a, ...data } : a)),
  })),
  deleteAsset: (id) => set((s) => ({
    assets: s.assets.filter((a) => a.id !== id),
    tasks: s.tasks.map((t) => ({
      ...t,
      assetIds: t.assetIds.filter((aid) => aid !== id),
    })),
  })),

  addToast: (message, type = 'info') => {
    const id = `toast-${++toastCounter}`;
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }));
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }));
    }, 5000);
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setFilterEngine: (filterEngine) => set({ filterEngine }),
  setFilterPlatform: (filterPlatform) => set({ filterPlatform }),

  initWebSocket: () => {
    const existing = get().ws;
    if (existing && existing.readyState === WebSocket.OPEN) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.hostname}:3001/ws`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const message: WsMessage = JSON.parse(event.data);
        get().handleWsMessage(message);
      } catch (e) {
        console.error('WebSocket message parse error:', e);
      }
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected, reconnecting in 3s...');
      setTimeout(() => {
        if (!get().ws || get().ws!.readyState === WebSocket.CLOSED) {
          get().initWebSocket();
        }
      }, 3000);
    };

    ws.onerror = (err) => {
      console.error('WebSocket error:', err);
    };

    set({ ws });
  },

  handleWsMessage: (message) => {
    const { type, payload } = message;

    if (type === 'task:status_changed') {
      const taskData = payload.task as Task;
      if (taskData) {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskData.id ? taskData : t)),
        }));
        get().addToast(
          `任务「${taskData.title}」状态已更新为${taskData.status === 'completed' ? '已完成' : taskData.status === 'in_progress' ? '进行中' : taskData.status === 'testing' ? '测试中' : '待分配'}`,
          'info'
        );
      }
    }

    if (type === 'asset:status_changed') {
      const assetData = payload.asset as Asset;
      const affectedTaskIds = payload.affectedTaskIds as string[];
      if (assetData) {
        set((s) => ({
          assets: s.assets.map((a) => (a.id === assetData.id ? assetData : a)),
        }));
        const statusText = assetData.status === 'completed' ? '已完成' : '制作中';
        get().addToast(
          `资产「${assetData.name}」状态变更为${statusText}，影响 ${affectedTaskIds?.length || 0} 个关联任务`,
          assetData.status === 'completed' ? 'success' : 'warning'
        );
      }
    }

    if (type === 'milestone:updated') {
      const msData = payload as Milestone & { deleted?: string };
      if (msData.deleted) {
        set((s) => ({
          milestones: s.milestones.filter((m) => m.id !== msData.deleted),
        }));
      } else if (msData.id) {
        set((s) => ({
          milestones: s.milestones.map((m) => (m.id === msData.id ? { ...m, ...msData } : m)),
        }));
      }
    }
  },

  fetchProjectData: async (projectId) => {
    try {
      const [milestonesRes, tasksRes, assetsRes] = await Promise.all([
        fetch(`/api/projects/${projectId}/milestones`),
        fetch(`/api/projects/${projectId}/tasks`),
        fetch(`/api/projects/${projectId}/assets`),
      ]);
      const milestones = await milestonesRes.json();
      const tasks = await tasksRes.json();
      const assets = await assetsRes.json();
      set({ milestones, tasks, assets });
    } catch (e) {
      console.error('Failed to fetch project data:', e);
    }
  },

  fetchProjects: async () => {
    try {
      const res = await fetch('/api/projects');
      const projects = await res.json();
      set({ projects });
    } catch (e) {
      console.error('Failed to fetch projects:', e);
    }
  },

  updateTaskStatus: async (taskId, newStatus) => {
    const task = get().tasks.find((t) => t.id === taskId);
    if (!task) return;

    set((s) => ({
      tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)),
    }));

    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) {
        set((s) => ({
          tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: task.status } : t)),
        }));
        get().addToast('任务状态更新失败', 'warning');
      }
    } catch {
      set((s) => ({
        tasks: s.tasks.map((t) => (t.id === taskId ? { ...t, status: task.status } : t)),
      }));
      get().addToast('任务状态更新失败', 'warning');
    }
  },
}));
