import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { v4 as uuidv4 } from 'uuid';

export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  estimatedHours: number;
  actualHours: number;
  createdAt: string;
  dueDate: string | null;
}

export interface TaskStatistics {
  totalEstimatedHours: number;
  totalActualHours: number;
  completionRate: number;
  totalTasks: number;
  completedTasks: number;
}

interface TaskStore {
  tasks: Task[];
  addTask: (task: Partial<Task>) => void;
  moveTask: (taskId: string, newStatus: TaskStatus, newIndex: number) => void;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  getStatistics: () => TaskStatistics;
  getTasksByStatus: (status: TaskStatus) => Task[];
}

const createSampleTasks = (): Task[] => {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 30 * 60 * 1000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  return [
    {
      id: uuidv4(),
      title: '设计产品原型图',
      description: '完成首页和用户中心的高保真原型设计，包含响应式布局方案。',
      status: 'todo',
      estimatedHours: 8,
      actualHours: 0,
      createdAt: now.toISOString(),
      dueDate: oneHourLater.toISOString(),
    },
    {
      id: uuidv4(),
      title: '搭建项目脚手架',
      description: '使用 Vite + React + TypeScript 初始化项目，配置开发环境。',
      status: 'in-progress',
      estimatedHours: 2,
      actualHours: 1.5,
      createdAt: now.toISOString(),
      dueDate: tomorrow.toISOString(),
    },
    {
      id: uuidv4(),
      title: '编写 API 接口文档',
      description: '整理后端接口定义，包含请求参数、响应结构和错误码说明。',
      status: 'todo',
      estimatedHours: 4,
      actualHours: 0,
      createdAt: now.toISOString(),
      dueDate: twoHoursAgo.toISOString(),
    },
    {
      id: uuidv4(),
      title: '需求评审会议',
      description: '与产品经理确认本期需求范围，输出会议纪要。',
      status: 'done',
      estimatedHours: 1,
      actualHours: 1,
      createdAt: now.toISOString(),
      dueDate: null,
    },
    {
      id: uuidv4(),
      title: '数据库表结构设计',
      description: '设计用户、任务、项目三张核心表，建立索引和关联关系。',
      status: 'in-progress',
      estimatedHours: 3,
      actualHours: 2,
      createdAt: now.toISOString(),
      dueDate: null,
    },
    {
      id: uuidv4(),
      title: '编写单元测试',
      description: '为核心业务逻辑编写测试用例，覆盖率达到 80% 以上。',
      status: 'done',
      estimatedHours: 5,
      actualHours: 4.5,
      createdAt: now.toISOString(),
      dueDate: null,
    },
  ];
};

export const useTaskStore = create<TaskStore>()(
  persist(
    (set, get) => ({
      tasks: createSampleTasks(),

      addTask: (task) => {
        const newTask: Task = {
          id: uuidv4(),
          title: task.title || '新任务',
          description: task.description || '',
          status: task.status || 'todo',
          estimatedHours: task.estimatedHours || 0,
          actualHours: task.actualHours || 0,
          createdAt: new Date().toISOString(),
          dueDate: task.dueDate || null,
        };
        set((state) => ({ tasks: [...state.tasks, newTask] }));
      },

      moveTask: (taskId, newStatus, newIndex) => {
        set((state) => {
          const tasks = [...state.tasks];
          const taskIndex = tasks.findIndex((t) => t.id === taskId);
          if (taskIndex === -1) return state;

          const [movedTask] = tasks.splice(taskIndex, 1);
          movedTask.status = newStatus;

          const sameStatusTasks = tasks.filter((t) => t.status === newStatus);
          const otherTasks = tasks.filter((t) => t.status !== newStatus);
          sameStatusTasks.splice(newIndex, 0, movedTask);

          return { tasks: [...otherTasks, ...sameStatusTasks] };
        });
      },

      updateTask: (taskId, updates) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, ...updates } : t
          ),
        }));
      },

      deleteTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.filter((t) => t.id !== taskId),
        }));
      },

      completeTask: (taskId) => {
        set((state) => ({
          tasks: state.tasks.map((t) =>
            t.id === taskId ? { ...t, status: 'done' as TaskStatus } : t
          ),
        }));
      },

      getStatistics: () => {
        const tasks = get().tasks;
        const totalTasks = tasks.length;
        const completedTasks = tasks.filter((t) => t.status === 'done').length;
        const totalEstimatedHours = tasks.reduce(
          (sum, t) => sum + t.estimatedHours,
          0
        );
        const totalActualHours = tasks.reduce(
          (sum, t) => sum + t.actualHours,
          0
        );
        const completionRate = totalTasks === 0 ? 0 : completedTasks / totalTasks;

        return {
          totalEstimatedHours,
          totalActualHours,
          completionRate,
          totalTasks,
          completedTasks,
        };
      },

      getTasksByStatus: (status) => {
        return get()
          .tasks.filter((t) => t.status === status);
      },
    }),
    {
      name: 'planiflow-tasks',
    }
  )
);
