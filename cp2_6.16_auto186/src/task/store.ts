import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Task, TaskStatus } from './types';
import { useBoardStore } from '../board/store';

interface TaskState {
  tasks: Task[];
  addTask: (task: Omit<Task, 'id' | 'order'>) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  reorderTasks: (cardId: string, status: TaskStatus, tasks: Task[]) => void;
  updateTaskDates: (id: string, startDate: string, dueDate: string) => void;
  addDependency: (taskId: string, dependencyId: string) => void;
  removeDependency: (taskId: string, dependencyId: string) => void;
  getTasksByCardId: (cardId: string) => Task[];
  getStats: () => {
    pendingCards: number;
    adoptedCards: number;
    inProgressTasks: number;
    completionRate: number;
  };
}

export const useTaskStore = create<TaskState>()(
  persist(
    (set, get) => ({
      tasks: [],

      addTask: (taskData) => {
        const statusTasks = get()
          .tasks.filter((t) => t.cardId === taskData.cardId && t.status === taskData.status)
          .sort((a, b) => a.order - b.order);
        const newTask: Task = {
          ...taskData,
          id: crypto.randomUUID(),
          order: statusTasks.length,
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },

      updateTask: (id, updates) => {
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        }));
      },

      deleteTask: (id) => {
        set((state) => {
          const deletedTask = state.tasks.find((t) => t.id === id);
          if (!deletedTask) return state;
          const remainingTasks = state.tasks
            .filter((t) => t.id !== id)
            .map((t) =>
              t.cardId === deletedTask.cardId &&
              t.status === deletedTask.status &&
              t.order > deletedTask.order
                ? { ...t, order: t.order - 1 }
                : t
            )
            .map((t) => ({
              ...t,
              dependencies: t.dependencies.filter((depId) => depId !== id),
            }));
          return { tasks: remainingTasks };
        });
      },

      updateTaskStatus: (id, status) => {
        set((state) => {
          const task = state.tasks.find((t) => t.id === id);
          if (!task || task.status === status) return state;

          const toStatusTasks = state.tasks.filter(
            (t) => t.cardId === task.cardId && t.status === status
          );

          const updatedTasks = state.tasks.map((t) => {
            if (t.id === id) {
              return { ...t, status, order: toStatusTasks.length };
            }
            if (
              t.cardId === task.cardId &&
              t.status === task.status &&
              t.order > task.order
            ) {
              return { ...t, order: t.order - 1 };
            }
            return t;
          });

          return { tasks: updatedTasks };
        });
      },

      reorderTasks: (cardId, status, tasks) => {
        set((state) => {
          const updatedTasks = state.tasks.map((t) => {
            if (t.cardId === cardId && t.status === status) {
              const newIndex = tasks.findIndex((task) => task.id === t.id);
              if (newIndex !== -1) {
                return { ...t, order: newIndex };
              }
            }
            return t;
          });
          return { tasks: updatedTasks };
        });
      },

      updateTaskDates: (id, startDate, dueDate) => {
        get().updateTask(id, { startDate, dueDate });
      },

      addDependency: (taskId, dependencyId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId && !t.dependencies.includes(dependencyId)
              ? { ...t, dependencies: [...t.dependencies, dependencyId] }
              : t
          ),
        }));
      },

      removeDependency: (taskId, dependencyId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId
              ? { ...t, dependencies: t.dependencies.filter((id) => id !== dependencyId) }
              : t
          ),
        }));
      },

      getTasksByCardId: (cardId) => {
        return get().tasks.filter((t) => t.cardId === cardId);
      },

      getStats: () => {
        const { cards } = useBoardStore.getState();
        const { tasks } = get();

        const pendingCards = cards.filter((c) => c.status === 'pending').length;
        const adoptedCards = cards.filter((c) => c.status === 'adopted').length;
        const inProgressTasks = tasks.filter((t) => t.status === 'in-progress').length;
        const totalTasks = tasks.length;
        const doneTasks = tasks.filter((t) => t.status === 'done').length;
        const completionRate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

        return {
          pendingCards,
          adoptedCards,
          inProgressTasks,
          completionRate,
        };
      },
    }),
    {
      name: 'idea-flow-tasks',
    }
  )
);
