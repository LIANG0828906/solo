import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';

export type Priority = 'high' | 'medium' | 'low';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
  timeSpent: number;
}

export interface Task {
  id: string;
  title: string;
  priority: Priority;
  estimatedDuration: number;
  column: 'todo' | 'inProgress' | 'done';
  subTasks: SubTask[];
  completedPomodoros: number;
  totalTimeSpent: number;
  createdAt: string;
  completedAt?: string;
}

interface BoardState {
  tasks: Task[];
  expandedTaskId: string | null;
  showAddModal: boolean;
  flyingTaskId: string | null;
  toggleExpand: (taskId: string | null) => void;
  setShowAddModal: (show: boolean) => void;
  setFlyingTaskId: (id: string | null) => void;
  addTask: (task: Omit<Task, 'id' | 'column' | 'subTasks' | 'completedPomodoros' | 'totalTimeSpent' | 'createdAt'>) => void;
  moveTask: (taskId: string, targetColumn: 'todo' | 'inProgress' | 'done', targetIndex: number) => void;
  reorderTask: (column: 'todo' | 'inProgress' | 'done', sourceIndex: number, targetIndex: number) => void;
  toggleSubTask: (taskId: string, subTaskId: string) => void;
  addSubTask: (taskId: string, title: string) => void;
  removeSubTask: (taskId: string, subTaskId: string) => void;
  incrementCompletedPomodoros: (taskId: string) => void;
  getTasksByColumn: (column: 'todo' | 'inProgress' | 'done') => Task[];
  getCompletedTasksByDate: (date: string) => Task[];
  getCompletedPomodorosByDate: (date: string) => number;
  getTotalFocusTimeByDate: (date: string) => number;
}

const getTodayString = () => {
  return new Date().toISOString().split('T')[0];
};

const initialTasks: Task[] = [
  {
    id: uuidv4(),
    title: '完成项目需求文档',
    priority: 'high',
    estimatedDuration: 120,
    column: 'todo',
    subTasks: [
      { id: uuidv4(), title: '梳理功能模块', completed: true, timeSpent: 25 },
      { id: uuidv4(), title: '编写用例说明', completed: false, timeSpent: 0 },
      { id: uuidv4(), title: '绘制流程图', completed: false, timeSpent: 0 },
    ],
    completedPomodoros: 1,
    totalTimeSpent: 25,
    createdAt: getTodayString(),
  },
  {
    id: uuidv4(),
    title: '设计系统架构',
    priority: 'high',
    estimatedDuration: 180,
    column: 'inProgress',
    subTasks: [
      { id: uuidv4(), title: '技术选型', completed: true, timeSpent: 50 },
      { id: uuidv4(), title: '模块划分', completed: true, timeSpent: 30 },
      { id: uuidv4(), title: '接口定义', completed: false, timeSpent: 0 },
    ],
    completedPomodoros: 3,
    totalTimeSpent: 80,
    createdAt: getTodayString(),
  },
  {
    id: uuidv4(),
    title: '搭建开发环境',
    priority: 'medium',
    estimatedDuration: 60,
    column: 'done',
    subTasks: [
      { id: uuidv4(), title: '安装依赖', completed: true, timeSpent: 15 },
      { id: uuidv4(), title: '配置构建工具', completed: true, timeSpent: 25 },
      { id: uuidv4(), title: '编写示例代码', completed: true, timeSpent: 20 },
    ],
    completedPomodoros: 2,
    totalTimeSpent: 60,
    createdAt: getTodayString(),
    completedAt: getTodayString(),
  },
  {
    id: uuidv4(),
    title: '代码审查',
    priority: 'low',
    estimatedDuration: 45,
    column: 'todo',
    subTasks: [
      { id: uuidv4(), title: '检查代码规范', completed: false, timeSpent: 0 },
      { id: uuidv4(), title: '验证功能逻辑', completed: false, timeSpent: 0 },
    ],
    completedPomodoros: 0,
    totalTimeSpent: 0,
    createdAt: getTodayString(),
  },
];

export const useBoardStore = create<BoardState>((set, get) => ({
  tasks: initialTasks,
  expandedTaskId: null,
  showAddModal: false,
  flyingTaskId: null,

  toggleExpand: (taskId) => set({ expandedTaskId: taskId }),
  setShowAddModal: (show) => set({ showAddModal: show }),
  setFlyingTaskId: (id) => set({ flyingTaskId: id }),

  addTask: (taskData) => {
    const newTask: Task = {
      ...taskData,
      id: uuidv4(),
      column: 'todo',
      subTasks: [],
      completedPomodoros: 0,
      totalTimeSpent: 0,
      createdAt: getTodayString(),
    };
    set((state) => ({ tasks: [...state.tasks, newTask], flyingTaskId: newTask.id }));
    setTimeout(() => set({ flyingTaskId: null }), 600);
  },

  moveTask: (taskId, targetColumn, targetIndex) => {
    set((state) => {
      const task = state.tasks.find((t) => t.id === taskId);
      if (!task) return state;

      const otherTasks = state.tasks.filter((t) => t.id !== taskId);
      const columnTasks = otherTasks
        .filter((t) => t.column === targetColumn)
        .sort((a, b) => state.tasks.indexOf(a) - state.tasks.indexOf(b));
      
      const updatedTask = {
        ...task,
        column: targetColumn,
        completedAt: targetColumn === 'done' ? getTodayString() : task.completedAt,
      };

      columnTasks.splice(targetIndex, 0, updatedTask);

      const remainingTasks = otherTasks.filter((t) => t.column !== targetColumn);
      
      return {
        tasks: [...remainingTasks, ...columnTasks],
      };
    });
  },

  reorderTask: (column, sourceIndex, targetIndex) => {
    set((state) => {
      const columnTasks = state.tasks
        .filter((t) => t.column === column)
        .sort((a, b) => state.tasks.indexOf(a) - state.tasks.indexOf(b));
      
      const [removed] = columnTasks.splice(sourceIndex, 1);
      columnTasks.splice(targetIndex, 0, removed);

      const otherTasks = state.tasks.filter((t) => t.column !== column);
      
      return {
        tasks: [...otherTasks, ...columnTasks],
      };
    });
  },

  toggleSubTask: (taskId, subTaskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id !== taskId) return task;
        
        const updatedSubTasks = task.subTasks.map((st) => {
          if (st.id !== subTaskId) return st;
          return {
            ...st,
            completed: !st.completed,
            timeSpent: !st.completed ? st.timeSpent + 25 : Math.max(0, st.timeSpent - 25),
          };
        });

        const totalTimeSpent = updatedSubTasks.reduce((sum, st) => sum + st.timeSpent, 0);
        
        return {
          ...task,
          subTasks: updatedSubTasks,
          totalTimeSpent,
        };
      }),
    }));
  },

  addSubTask: (taskId, title) => {
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id !== taskId || task.subTasks.length >= 10) return task;
        return {
          ...task,
          subTasks: [...task.subTasks, {
            id: uuidv4(),
            title,
            completed: false,
            timeSpent: 0,
          }],
        };
      }),
    }));
  },

  removeSubTask: (taskId, subTaskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id !== taskId) return task;
        const updatedSubTasks = task.subTasks.filter((st) => st.id !== subTaskId);
        const totalTimeSpent = updatedSubTasks.reduce((sum, st) => sum + st.timeSpent, 0);
        return {
          ...task,
          subTasks: updatedSubTasks,
          totalTimeSpent,
        };
      }),
    }));
  },

  incrementCompletedPomodoros: (taskId) => {
    set((state) => ({
      tasks: state.tasks.map((task) => {
        if (task.id !== taskId) return task;
        return {
          ...task,
          completedPomodoros: task.completedPomodoros + 1,
        };
      }),
    }));
  },

  getTasksByColumn: (column) => {
    const state = get();
    return state.tasks
      .filter((t) => t.column === column)
      .sort((a, b) => state.tasks.indexOf(a) - state.tasks.indexOf(b));
  },

  getCompletedTasksByDate: (date) => {
    return get().tasks.filter((t) => t.column === 'done' && t.completedAt === date);
  },

  getCompletedPomodorosByDate: (date) => {
    return get()
      .getCompletedTasksByDate(date)
      .reduce((sum, t) => sum + t.completedPomodoros, 0);
  },

  getTotalFocusTimeByDate: (date) => {
    return get()
      .getCompletedTasksByDate(date)
      .reduce((sum, t) => sum + t.totalTimeSpent, 0);
  },
}));
