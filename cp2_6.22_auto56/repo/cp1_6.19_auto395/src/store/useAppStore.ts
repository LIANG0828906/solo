import { create } from 'zustand';
import { Task, Milestone, Dependency, TaskStatus } from '../types';
import { taskService } from '../services/taskService';

interface AppState {
  tasks: Task[];
  milestones: Milestone[];
  dependencies: Dependency[];
  selectedTaskId: string | null;
  selectedMilestoneId: string | null;
  zoomLevel: number;
  isTaskModalOpen: boolean;
  isMilestoneModalOpen: boolean;
  dependencyStartTaskId: string | null;

  fetchTasks: () => Promise<void>;
  fetchDependencies: () => Promise<void>;
  fetchMilestones: () => Promise<void>;
  addTask: (task: Partial<Task>) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => void;

  addMilestone: (milestone: Partial<Milestone>) => Promise<void>;
  updateMilestone: (id: string, updates: Partial<Milestone>) => Promise<void>;
  deleteMilestone: (id: string) => Promise<void>;

  addDependency: (fromTaskId: string, toTaskId: string) => Promise<void>;
  removeDependency: (id: string) => void;

  setSelectedTaskId: (id: string | null) => void;
  setSelectedMilestoneId: (id: string | null) => void;
  setIsTaskModalOpen: (open: boolean) => void;
  setIsMilestoneModalOpen: (open: boolean) => void;
  setZoomLevel: (level: number) => void;
  setDependencyStartTaskId: (id: string | null) => void;

  updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<void>;
  checkAndTriggerDependencies: (taskId: string) => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  tasks: [],
  milestones: [],
  dependencies: [],
  selectedTaskId: null,
  selectedMilestoneId: null,
  zoomLevel: 1,
  isTaskModalOpen: false,
  isMilestoneModalOpen: false,
  dependencyStartTaskId: null,

  fetchTasks: async () => {
    const tasks = await taskService.getTasks();
    set({ tasks });
  },

  fetchDependencies: async () => {
    const dependencies = await taskService.getDependencies();
    set({ dependencies });
  },

  fetchMilestones: async () => {
    const milestones = await taskService.getMilestones();
    set({ milestones });
  },

  addTask: async (task) => {
    const newTask = await taskService.createTask(task as Partial<Task>);
    set((state) => ({ tasks: [...state.tasks, newTask] }));
  },

  updateTask: async (id, updates) => {
    const updatedTask = await taskService.updateTask(id, updates);
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updatedTask : t)),
    }));
  },

  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      dependencies: state.dependencies.filter(
        (d) => d.fromTaskId !== id && d.toTaskId !== id
      ),
    }));
  },

  addMilestone: async (milestone) => {
    const newMilestone = await taskService.createMilestone(milestone as Partial<Milestone>);
    set((state) => ({ milestones: [...state.milestones, newMilestone] }));
  },

  updateMilestone: async (id, updates) => {
    const updatedMilestone = await taskService.updateMilestone(id, updates);
    set((state) => ({
      milestones: state.milestones.map((m) =>
        m.id === id ? updatedMilestone : m
      ),
    }));
  },

  deleteMilestone: async (id) => {
    await taskService.deleteMilestone(id);
    set((state) => ({
      milestones: state.milestones.filter((m) => m.id !== id),
    }));
  },

  addDependency: async (fromTaskId, toTaskId) => {
    const newDep = await taskService.createDependency(fromTaskId, toTaskId);
    set((state) => ({
      dependencies: [...state.dependencies, newDep],
      dependencyStartTaskId: null,
    }));
  },

  removeDependency: (id) => {
    set((state) => ({
      dependencies: state.dependencies.filter((d) => d.id !== id),
    }));
  },

  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  setSelectedMilestoneId: (id) => set({ selectedMilestoneId: id }),
  setIsTaskModalOpen: (open) => set({ isTaskModalOpen: open }),
  setIsMilestoneModalOpen: (open) => set({ isMilestoneModalOpen: open }),
  setZoomLevel: (level) => set({ zoomLevel: Math.max(0.5, Math.min(2, level)) }),
  setDependencyStartTaskId: (id) => set({ dependencyStartTaskId: id }),

  updateTaskStatus: async (taskId, status) => {
    let progress = 0;
    if (status === 'in-progress') progress = 50;
    if (status === 'done') progress = 100;

    const updates: Partial<Task> = { status, progress };
    if (status === 'done') {
      const task = get().tasks.find((t) => t.id === taskId);
      if (task) {
        const today = new Date().toISOString().split('T')[0];
        updates.endDate = today;
      }
    }

    await get().updateTask(taskId, updates);

    if (status === 'done') {
      await get().checkAndTriggerDependencies(taskId);
    }
  },

  checkAndTriggerDependencies: async (taskId) => {
    const { dependencies, tasks, updateTask } = get();
    const dependentDeps = dependencies.filter((d) => d.fromTaskId === taskId);

    for (const dep of dependentDeps) {
      const toTask = tasks.find((t) => t.id === dep.toTaskId);
      if (!toTask || toTask.status === 'done') continue;

      const prerequisites = dependencies.filter((d) => d.toTaskId === dep.toTaskId);
      const allPrerequisitesDone = prerequisites.every((p) => {
        const fromTask = tasks.find((t) => t.id === p.fromTaskId);
        return fromTask && fromTask.status === 'done';
      });

      if (allPrerequisitesDone) {
        await updateTask(dep.toTaskId, { status: 'in-progress', progress: 50 });
      }
    }
  },
}));
