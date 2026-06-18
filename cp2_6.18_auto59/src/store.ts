import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type {
  DayBriefStore,
  Task,
  TaskStatus,
  TemplateType,
  CustomTemplateConfig,
} from './types';

const defaultCustomTemplate: CustomTemplateConfig = {
  sections: [
    { key: 'title', title: '今日工作汇报', enabled: true, order: 0 },
    { key: 'workHours', title: '今日总工时', enabled: true, order: 1 },
    { key: 'completedTasks', title: '已完成任务', enabled: true, order: 2 },
    { key: 'pendingTasks', title: '待完成任务', enabled: true, order: 3 },
    { key: 'notes', title: '备注', enabled: true, order: 4 },
  ],
};

export const useDayBriefStore = create<DayBriefStore>((set, get) => ({
  tasks: [],
  draftNotes: '',
  templateType: 'detailed' as TemplateType,
  customTemplate: defaultCustomTemplate,

  addTask: (taskData) =>
    set((state) => {
      const pendingTasks = state.tasks.filter((t) => t.status !== 'completed');
      const newTask: Task = {
        id: uuidv4(),
        createdAt: Date.now(),
        order: pendingTasks.length,
        ...taskData,
      };
      return { tasks: [...state.tasks, newTask] };
    }),

  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),

  updateTask: (id, updates) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, ...updates } : task
      ),
    })),

  toggleTaskStatus: (id) =>
    set((state) => {
      const tasks = state.tasks.map((task) => {
        if (task.id !== id) return task;
        const newStatus: TaskStatus = task.status === 'completed' ? 'todo' : 'completed';
        return {
          ...task,
          status: newStatus,
          completedAt: newStatus === 'completed' ? Date.now() : undefined,
        };
      });

      const pendingTasks = tasks
        .filter((t) => t.status !== 'completed')
        .sort((a, b) => a.order - b.order)
        .map((t, idx) => ({ ...t, order: idx }));

      const completedTasks = tasks
        .filter((t) => t.status === 'completed')
        .sort((a, b) => a.order - b.order)
        .map((t, idx) => ({ ...t, order: idx }));

      return { tasks: [...pendingTasks, ...completedTasks] };
    }),

  reorderTasks: (fromId, toId, scope) =>
    set((state) => {
      if (fromId === toId) return { tasks: state.tasks };

      const tasks = [...state.tasks];
      let sourceList: Task[];
      let otherList: Task[];

      if (scope === 'pending') {
        sourceList = tasks.filter((t) => t.status !== 'completed');
        otherList = tasks.filter((t) => t.status === 'completed');
      } else if (scope === 'completed') {
        sourceList = tasks.filter((t) => t.status === 'completed');
        otherList = tasks.filter((t) => t.status !== 'completed');
      } else {
        sourceList = tasks;
        otherList = [];
      }

      sourceList.sort((a, b) => a.order - b.order);

      const fromIndex = sourceList.findIndex((t) => t.id === fromId);
      const toIndex = sourceList.findIndex((t) => t.id === toId);

      if (fromIndex === -1 || toIndex === -1) return { tasks: state.tasks };

      const [movedItem] = sourceList.splice(fromIndex, 1);
      sourceList.splice(toIndex, 0, movedItem);

      const reorderedSource = sourceList.map((t, idx) => ({ ...t, order: idx }));
      const finalTasks =
        scope === 'all'
          ? reorderedSource
          : scope === 'pending'
          ? [...reorderedSource, ...otherList]
          : [...otherList, ...reorderedSource];

      return { tasks: finalTasks };
    }),

  updateDraftNotes: (notes) => set({ draftNotes: notes }),

  setTemplateType: (type) => set({ templateType: type }),

  updateCustomTemplate: (config) =>
    set((state) => ({
      customTemplate: { ...state.customTemplate, ...config },
    })),

  getPendingTasks: () => {
    const state = get();
    return state.tasks
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => a.order - b.order);
  },

  getCompletedTasks: () => {
    const state = get();
    return state.tasks
      .filter((t) => t.status === 'completed')
      .sort((a, b) => a.order - b.order);
  },

  getTotalCompletedMinutes: () => {
    const state = get();
    return state.tasks
      .filter((t) => t.status === 'completed')
      .reduce((sum, t) => sum + t.estimatedMinutes, 0);
  },
}));
