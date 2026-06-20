import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';
import axios from 'axios';
import type { Project, Task, Milestone, Notification, User } from '../shared/types';

interface AppState {
  socket: Socket | null;
  user: User;
  projects: (Project & { taskCount: number; completedCount: number })[];
  currentProject: Project | null;
  tasks: Task[];
  milestones: Milestone[];
  notifications: Notification[];
  selectedTaskId: string | null;
  dependencyMode: boolean;
  firstDependencyTaskId: string | null;
  highlightedTaskId: string | null;

  initSocket: () => void;
  fetchProjects: () => Promise<void>;
  fetchProjectTasks: (projectId: string) => Promise<void>;
  fetchProjectMilestones: (projectId: string) => Promise<void>;
  selectProject: (projectId: string | null) => void;
  createTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  addDependency: (taskId: string, depTaskId: string) => Promise<void>;
  setSelectedTask: (taskId: string | null) => void;
  setDependencyMode: (mode: boolean) => void;
  setFirstDependencyTask: (taskId: string | null) => void;
  setHighlightedTask: (taskId: string | null) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;
}

const AVATAR_COLORS = ['#e57373', '#64b5f6', '#81c784', '#ffb74d', '#ba68c8', '#4db6ac'];

export const useStore = create<AppState>((set, get) => ({
  socket: null,
  user: {
    id: 'user-1',
    name: '张三',
    role: 'PM',
    avatarColor: AVATAR_COLORS[0]
  },
  projects: [],
  currentProject: null,
  tasks: [],
  milestones: [],
  notifications: [],
  selectedTaskId: null,
  dependencyMode: false,
  firstDependencyTaskId: null,
  highlightedTaskId: null,

  initSocket: () => {
    if (get().socket) return;

    const socket = io('http://localhost:3002', {
      transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
      console.log('Connected to server');
    });

    socket.on('task:created', (task: Task) => {
      const state = get();
      if (task.projectId === state.currentProject?.id) {
        set({ tasks: [...state.tasks, task] });
      }
    });

    socket.on('task:updated', (task: Task) => {
      const state = get();
      if (task.projectId === state.currentProject?.id) {
        set({
          tasks: state.tasks.map(t => (t.id === task.id ? task : t))
        });
      }
    });

    socket.on('task:deleted', (taskId: string) => {
      const state = get();
      set({
        tasks: state.tasks.filter(t => t.id !== taskId)
      });
    });

    socket.on('task:dependency-added', (data: { taskId: string; depTaskId: string }) => {
      const state = get();
      const updatedTasks = state.tasks.map(t => {
        if (t.id === data.taskId) {
          return { ...t, dependencies: [...t.dependencies, data.depTaskId] };
        }
        if (t.id === data.depTaskId) {
          return { ...t, dependents: [...t.dependents, data.taskId] };
        }
        return t;
      });
      set({ tasks: updatedTasks });
    });

    socket.on('notification', (notification: Notification) => {
      get().addNotification(notification);
    });

    set({ socket });
  },

  fetchProjects: async () => {
    try {
      const response = await axios.get('/api/projects');
      set({ projects: response.data });
    } catch (error) {
      console.error('Failed to fetch projects:', error);
    }
  },

  fetchProjectTasks: async (projectId: string) => {
    try {
      const response = await axios.get(`/api/projects/${projectId}/tasks`);
      set({ tasks: response.data });
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
    }
  },

  fetchProjectMilestones: async (projectId: string) => {
    try {
      const response = await axios.get(`/api/projects/${projectId}/milestones`);
      set({ milestones: response.data });
    } catch (error) {
      console.error('Failed to fetch milestones:', error);
    }
  },

  selectProject: (projectId: string | null) => {
    if (!projectId) {
      set({ currentProject: null, tasks: [], milestones: [] });
      return;
    }
    const project = get().projects.find(p => p.id === projectId);
    if (project) {
      set({ currentProject: project as Project });
    }
  },

  createTask: async (taskData: Partial<Task>) => {
    const state = get();
    const { user, currentProject, socket } = state;
    if (!currentProject) return;

    try {
      const response = await axios.post('/api/tasks', {
        ...taskData,
        projectId: currentProject.id,
        assignee: user.id,
        assigneeName: user.name
      });
      const newTask = response.data;
      socket?.emit('task:created', newTask);
    } catch (error) {
      console.error('Failed to create task:', error);
    }
  },

  updateTask: async (taskId: string, updates: Partial<Task>) => {
    const state = get();
    const { socket, tasks } = state;

    try {
      const response = await axios.put(`/api/tasks/${taskId}`, updates);
      const updatedTask = response.data;
      socket?.emit('task:updated', updatedTask);
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  },

  deleteTask: async (taskId: string) => {
    const { socket } = get();
    try {
      await axios.delete(`/api/tasks/${taskId}`);
      socket?.emit('task:deleted', taskId);
    } catch (error) {
      console.error('Failed to delete task:', error);
    }
  },

  addDependency: async (taskId: string, depTaskId: string) => {
    const { socket } = get();
    try {
      await axios.post(`/api/tasks/${taskId}/dependencies/${depTaskId}`);
      socket?.emit('task:dependency-added', { taskId, depTaskId });
    } catch (error) {
      console.error('Failed to add dependency:', error);
    }
  },

  setSelectedTask: (taskId: string | null) => {
    set({ selectedTaskId: taskId });
  },

  setDependencyMode: (mode: boolean) => {
    set({ dependencyMode: mode, firstDependencyTaskId: null });
  },

  setFirstDependencyTask: (taskId: string | null) => {
    set({ firstDependencyTaskId: taskId });
  },

  setHighlightedTask: (taskId: string | null) => {
    set({ highlightedTaskId: taskId });
  },

  addNotification: (notification: Notification) => {
    set(state => ({
      notifications: [...state.notifications, notification]
    }));

    setTimeout(() => {
      get().removeNotification(notification.id);
    }, 3000);
  },

  removeNotification: (id: string) => {
    set(state => ({
      notifications: state.notifications.filter(n => n.id !== id)
    }));
  }
}));
