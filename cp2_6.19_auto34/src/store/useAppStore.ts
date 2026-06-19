import { create } from 'zustand';
import type { Task, Sprint, TeamMember, BurndownPoint } from '@/types';
import {
  fetchTasks,
  createTask as apiCreateTask,
  updateTask as apiUpdateTask,
  deleteTask as apiDeleteTask,
  fetchSprints,
  createSprint as apiCreateSprint,
  fetchTeamMembers,
} from '@/services/mockApi';

interface AppState {
  tasks: Task[];
  sprints: Sprint[];
  currentSprintId: string | null;
  teamMembers: TeamMember[];
  isLoading: boolean;
  selectedTaskId: string | null;
  isTaskModalOpen: boolean;

  loadInitialData: () => Promise<void>;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => Promise<Task>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<Task>;
  deleteTask: (id: string) => Promise<void>;
  assignTaskToSprint: (taskId: string, sprintId: string | null) => Promise<Task>;
  addSprint: (sprint: Omit<Sprint, 'id'>) => Promise<Sprint>;
  setCurrentSprint: (id: string | null) => void;
  getSprintTasks: (sprintId: string) => Task[];
  getTasksBySprintId: (sprintId: string) => Task[];
  getBacklogTasks: () => Task[];
  getBurndownData: (sprintId: string, assigneeId?: string | null) => BurndownPoint[];
  openTaskModal: (taskId: string | null) => void;
  closeTaskModal: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  tasks: [],
  sprints: [],
  currentSprintId: null,
  teamMembers: [],
  isLoading: false,
  selectedTaskId: null,
  isTaskModalOpen: false,

  loadInitialData: async () => {
    set({ isLoading: true });
    try {
      const [tasks, sprints, teamMembers] = await Promise.all([
        fetchTasks(),
        fetchSprints(),
        fetchTeamMembers(),
      ]);
      set({
        tasks,
        sprints,
        teamMembers,
        currentSprintId: sprints.length > 0 ? sprints[0].id : null,
      });
    } finally {
      set({ isLoading: false });
    }
  },

  addTask: async (task) => {
    const newTask = await apiCreateTask(task);
    set((state) => ({ tasks: [...state.tasks, newTask] }));
    return newTask;
  },

  updateTask: async (id, updates) => {
    const updatedTask = await apiUpdateTask(id, updates);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
    }));
    return updatedTask;
  },

  deleteTask: async (id) => {
    await apiDeleteTask(id);
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
  },

  assignTaskToSprint: async (taskId, sprintId) => {
    const updatedTask = await apiUpdateTask(taskId, { sprintId });
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === taskId ? updatedTask : t)),
    }));
    return updatedTask;
  },

  addSprint: async (sprint) => {
    const newSprint = await apiCreateSprint(sprint);
    set((state) => ({ sprints: [...state.sprints, newSprint] }));
    return newSprint;
  },

  setCurrentSprint: (id) => {
    set({ currentSprintId: id });
  },

  getSprintTasks: (sprintId) => {
    return get().tasks.filter((t) => t.sprintId === sprintId);
  },

  getTasksBySprintId: (sprintId) => {
    return get().tasks.filter((t) => t.sprintId === sprintId);
  },

  getBacklogTasks: () => {
    return get().tasks.filter((t) => t.sprintId === null);
  },

  getBurndownData: (sprintId, assigneeId = null) => {
    const sprint = get().sprints.find((s) => s.id === sprintId);
    if (!sprint) return [];

    let tasks = get().getSprintTasks(sprintId);
    if (assigneeId) {
      tasks = tasks.filter((t) => t.assignee === assigneeId);
    }

    const totalEstimate = tasks.reduce((sum, t) => sum + t.estimate, 0);

    const start = new Date(sprint.startDate);
    const end = new Date(sprint.endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    const data: BurndownPoint[] = [];
    for (let i = 0; i <= days; i++) {
      const date = new Date(start);
      date.setDate(date.getDate() + i);
      const ideal = totalEstimate - (totalEstimate * i) / Math.max(days, 1);

      const doneEstimate = tasks
        .filter((t) => t.status === 'done')
        .reduce((sum, t) => sum + t.estimate, 0);
      const actual = Math.max(0, totalEstimate - doneEstimate);

      data.push({
        date: date.toISOString().split('T')[0],
        ideal: Math.round(ideal * 10) / 10,
        actual: Math.round(actual * 10) / 10,
      });
    }

    return data;
  },

  openTaskModal: (taskId) => {
    set({ selectedTaskId: taskId, isTaskModalOpen: true });
  },

  closeTaskModal: () => {
    set({ selectedTaskId: null, isTaskModalOpen: false });
  },
}));
