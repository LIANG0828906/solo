import { create } from 'zustand';
import { User, Task, TimeLog, Member, BurndownPoint, WeeklyReportData } from '../types';

const mockMembers: Member[] = [
  { id: '1', name: '张三', avatarColor: '#7C3AED', weeklyHours: 32.5 },
  { id: '2', name: '李四', avatarColor: '#06B6D4', weeklyHours: 28 },
  { id: '3', name: '王五', avatarColor: '#F59E0B', weeklyHours: 35 },
  { id: '4', name: '赵六', avatarColor: '#10B981', weeklyHours: 25 },
  { id: '5', name: 'admin', avatarColor: '#EF4444', weeklyHours: 40 },
];

const mockTasks: Task[] = [
  {
    id: 't1',
    title: '设计系统架构',
    description: '完成整体系统架构设计文档，包括前端、后端、数据库设计',
    status: 'done',
    assigneeId: '5',
    dueDate: '2026-06-15',
    estimatedHours: 16,
    remainingHours: 0,
    createdAt: '2026-06-10'
  },
  {
    id: 't2',
    title: '前端基础搭建',
    description: '搭建React + TypeScript + Vite项目框架，配置路由、状态管理',
    status: 'done',
    assigneeId: '1',
    dueDate: '2026-06-16',
    estimatedHours: 12,
    remainingHours: 0,
    createdAt: '2026-06-11'
  },
  {
    id: 't3',
    title: '登录页面开发',
    description: '实现登录页面UI和登录逻辑，JWT token管理',
    status: 'in-progress',
    assigneeId: '1',
    dueDate: '2026-06-18',
    estimatedHours: 8,
    remainingHours: 2,
    createdAt: '2026-06-12'
  },
  {
    id: 't4',
    title: '看板页面开发',
    description: '实现三列看板、任务卡片拖拽、燃尽图展示',
    status: 'in-progress',
    assigneeId: '2',
    dueDate: '2026-06-20',
    estimatedHours: 24,
    remainingHours: 10,
    createdAt: '2026-06-13'
  },
  {
    id: 't5',
    title: '周报页面开发',
    description: '实现工时汇总表格、任务耗时柱状图、计时片段展开',
    status: 'todo',
    assigneeId: '3',
    dueDate: '2026-06-22',
    estimatedHours: 16,
    remainingHours: 16,
    createdAt: '2026-06-14'
  },
  {
    id: 't6',
    title: '任务详情模态框',
    description: '实现任务详情展示、工时记录、开始/结束计时功能',
    status: 'todo',
    assigneeId: '4',
    dueDate: '2026-06-21',
    estimatedHours: 12,
    remainingHours: 12,
    createdAt: '2026-06-15'
  },
  {
    id: 't7',
    title: '后端API开发',
    description: '实现Express API服务器，包括认证、任务、工时记录接口',
    status: 'in-progress',
    assigneeId: '5',
    dueDate: '2026-06-19',
    estimatedHours: 20,
    remainingHours: 5,
    createdAt: '2026-06-12'
  },
  {
    id: 't8',
    title: '单元测试编写',
    description: '为核心模块编写单元测试，确保代码质量',
    status: 'todo',
    assigneeId: '2',
    dueDate: '2026-06-25',
    estimatedHours: 16,
    remainingHours: 16,
    createdAt: '2026-06-16'
  },
  {
    id: 't9',
    title: '代码审查与优化',
    description: '进行代码审查，性能优化和代码重构',
    status: 'todo',
    assigneeId: '1',
    dueDate: '2026-06-26',
    estimatedHours: 8,
    remainingHours: 8,
    createdAt: '2026-06-17'
  }
];

const generateBurndownData = (): BurndownPoint[] => {
  const startDate = new Date('2026-06-13');
  const totalHours = 132;
  const data: BurndownPoint[] = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);
    const idealHours = Math.max(0, totalHours - (totalHours / 6) * i);
    const actualHours = i === 0 ? totalHours : Math.max(0, totalHours - (totalHours / 6) * (i - 0.5) + (Math.random() - 0.5) * 10);
    data.push({
      date: date.toISOString().split('T')[0],
      idealHours: Math.round(idealHours * 10) / 10,
      actualHours: Math.round(actualHours * 10) / 10
    });
  }
  return data;
};

const generateWeeklyData = (): WeeklyReportData => {
  const today = new Date('2026-06-19');
  const dayOfWeek = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const days: string[] = [];
  const dayNames = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    days.push(`${d.toISOString().split('T')[0]} (${dayNames[i]})`);
  }

  const weeklyTasks = mockTasks.filter(t => t.id !== 't8' && t.id !== 't9');
  const tasks = weeklyTasks.map(t => ({ id: t.id, title: t.title }));

  const dailyHours: (number | null)[][] = [];
  const taskTotals: number[] = [];
  const timeLogsByTask: Record<string, TimeLog[]> = {};

  for (let i = 0; i < tasks.length; i++) {
    const taskRow: (number | null)[] = [];
    let taskTotal = 0;
    const logs: TimeLog[] = [];

    for (let j = 0; j < 7; j++) {
      if (Math.random() > 0.35 || (j >= 0 && j <= 4 && tasks[i].id !== 't5' && tasks[i].id !== 't6')) {
        const hours = Math.round((Math.random() * 4 + 1) * 10) / 10;
        taskRow.push(hours);
        taskTotal += hours;

        const logDate = new Date(monday);
        logDate.setDate(monday.getDate() + j);
        const startTime = new Date(logDate);
        startTime.setHours(9 + Math.floor(Math.random() * 4), Math.floor(Math.random() * 60));
        const endTime = new Date(startTime.getTime() + hours * 3600 * 1000);

        logs.push({
          id: `log-${tasks[i].id}-${j}`,
          taskId: tasks[i].id,
          userId: '5',
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: hours,
          createdAt: logDate.toISOString()
        });
      } else {
        taskRow.push(null);
      }
    }
    dailyHours.push(taskRow);
    taskTotals.push(Math.round(taskTotal * 10) / 10);
    timeLogsByTask[tasks[i].id] = logs;
  }

  return { days, tasks, dailyHours, taskTotals, timeLogsByTask };
};

interface AppState {
  token: string | null;
  user: User | null;
  tasks: Task[];
  members: Member[];
  burndownData: BurndownPoint[];
  weeklyData: WeeklyReportData;
  selectedTask: Task | null;
  isModalOpen: boolean;
  sidebarCollapsed: boolean;
  expandedTaskId: string | null;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  setTasks: (tasks: Task[]) => void;
  updateTask: (task: Task) => void;
  setSelectedTask: (task: Task | null) => void;
  setModalOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  toggleExpandedTask: (taskId: string | null) => void;
  login: (username: string, password: string) => boolean;
  logout: () => void;
}

const useStore = create<AppState>((set) => ({
  token: localStorage.getItem('token'),
  user: localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!) : null,
  tasks: mockTasks,
  members: mockMembers,
  burndownData: generateBurndownData(),
  weeklyData: generateWeeklyData(),
  selectedTask: null,
  isModalOpen: false,
  sidebarCollapsed: false,
  expandedTaskId: null,

  setToken: (token) => {
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
    set({ token });
  },
  setUser: (user) => {
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
    set({ user });
  },
  setTasks: (tasks) => set({ tasks }),
  updateTask: (task) => set((state) => ({
    tasks: state.tasks.map(t => t.id === task.id ? task : t)
  })),
  setSelectedTask: (task) => set({ selectedTask: task }),
  setModalOpen: (open) => set({ isModalOpen: open }),
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  toggleExpandedTask: (taskId) => set((state) => ({
    expandedTaskId: state.expandedTaskId === taskId ? null : taskId
  })),
  login: (username, password) => {
    if (username === 'admin' && password === '123456') {
      const mockUser: User = {
        id: '5',
        username: 'admin',
        name: 'admin',
        avatarColor: '#EF4444',
        role: 'admin'
      };
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-token';
      localStorage.setItem('token', mockToken);
      localStorage.setItem('user', JSON.stringify(mockUser));
      set({ token: mockToken, user: mockUser });
      return true;
    }
    return false;
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null });
  }
}));

export default useStore;
