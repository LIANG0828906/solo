import { create } from 'zustand';
import type { Project, Task, TaskStatus, User } from '@/types';
import { loadData, saveData } from '@/utils/storage';

interface TaskStore {
  projects: Project[];
  tasks: Task[];
  users: User[];
  currentProjectId: string | null;
  addProject: (name: string) => void;
  removeProject: (id: string) => void;
  deleteProject: (id: string) => void;
  addTask: (task: Omit<Task, 'id' | 'createdAt'>) => void;
  removeTask: (id: string) => void;
  deleteTask: (id: string) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  moveTask: (taskId: string, status: TaskStatus) => void;
  setCurrentProject: (id: string | null) => void;
  getProjectTasks: (projectId: string) => Task[];
}

const defaultUsers: User[] = [
  { id: 'user-1', name: '张三' },
  { id: 'user-2', name: '李四' },
  { id: 'user-3', name: '王五' },
  { id: 'user-4', name: '赵六' },
];

const defaultProjects: Project[] = [
  { id: 'project-1', name: '演示项目', createdAt: new Date().toISOString() },
];

const defaultTasks: Task[] = [
  {
    id: 'task-1',
    title: '设计首页原型',
    description: '完成产品首页的UI设计稿',
    status: 'todo',
    projectId: 'project-1',
    assignee: 'user-1',
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  {
    id: 'task-2',
    title: '搭建开发环境',
    description: '配置 React + TypeScript + Vite 开发环境',
    status: 'in-progress',
    projectId: 'project-1',
    assignee: 'user-2',
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
  {
    id: 'task-3',
    title: '需求评审',
    description: '产品需求文档评审会议',
    status: 'done',
    projectId: 'project-1',
    assignee: 'user-3',
    createdAt: new Date().toISOString(),
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  },
];

export const useTaskStore = create<TaskStore>((set, get) => ({
  projects: loadData<Project[]>('projects', defaultProjects),
  tasks: loadData<Task[]>('tasks', defaultTasks),
  users: loadData<User[]>('users', defaultUsers),
  currentProjectId: loadData<string | null>('currentProjectId', 'project-1'),

  addProject: (name) => {
    const newProject: Project = {
      id: `project-${Date.now()}`,
      name,
      createdAt: new Date().toISOString(),
    };
    const projects = [...get().projects, newProject];
    set({ projects });
    saveData('projects', projects);
  },

  removeProject: (id) => {
    const projects = get().projects.filter((p) => p.id !== id);
    const tasks = get().tasks.filter((t) => t.projectId !== id);
    set({ projects, tasks });
    saveData('projects', projects);
    saveData('tasks', tasks);
  },

  deleteProject: (id) => {
    get().removeProject(id);
  },

  addTask: (task) => {
    const newTask: Task = {
      ...task,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const tasks = [...get().tasks, newTask];
    set({ tasks });
    saveData('tasks', tasks);
  },

  removeTask: (id) => {
    const tasks = get().tasks.filter((t) => t.id !== id);
    set({ tasks });
    saveData('tasks', tasks);
  },

  deleteTask: (id) => {
    get().removeTask(id);
  },

  updateTask: (id, updates) => {
    const tasks = get().tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    set({ tasks });
    saveData('tasks', tasks);
  },

  moveTask: (taskId, status) => {
    const tasks = get().tasks.map((t) => (t.id === taskId ? { ...t, status } : t));
    set({ tasks });
    saveData('tasks', tasks);
  },

  setCurrentProject: (id) => {
    set({ currentProjectId: id });
    saveData('currentProjectId', id);
  },

  getProjectTasks: (projectId) => {
    return get().tasks.filter((t) => t.projectId === projectId);
  },
}));
