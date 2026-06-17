import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import type { Task, Project, TeamMember, Priority, TaskStatus, TaskStore } from '@/types';
import { saveToStorage, loadFromStorage, STORAGE_KEYS } from '@/utils/dataPersistence';

const defaultMembers: TeamMember[] = [
  { id: 'member-1', name: '用户自己' },
  { id: 'member-2', name: '张三' },
  { id: 'member-3', name: '李四' },
  { id: 'member-4', name: '王五' },
];

const createMockData = () => {
  const projectId = uuidv4();
  const today = new Date();
  const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
  const twoDaysLater = new Date(today.getTime() + 2 * 24 * 60 * 60 * 1000);
  const fiveDaysLater = new Date(today.getTime() + 5 * 24 * 60 * 60 * 1000);

  const projects: Project[] = [
    {
      id: projectId,
      name: '网站重构项目',
      createdAt: today.toISOString(),
    },
  ];

  const tasks: Task[] = [
    {
      id: uuidv4(),
      title: '设计首页UI界面',
      assigneeId: 'member-1',
      dueDate: fiveDaysLater.toISOString().split('T')[0],
      priority: 'high',
      status: 'in-progress',
      projectId,
      createdAt: today.toISOString(),
    },
    {
      id: uuidv4(),
      title: '编写技术方案文档',
      assigneeId: 'member-2',
      dueDate: twoDaysLater.toISOString().split('T')[0],
      priority: 'medium',
      status: 'done',
      projectId,
      createdAt: today.toISOString(),
    },
    {
      id: uuidv4(),
      title: '后端API接口开发',
      assigneeId: 'member-3',
      dueDate: nextWeek.toISOString().split('T')[0],
      priority: 'high',
      status: 'todo',
      projectId,
      createdAt: today.toISOString(),
    },
    {
      id: uuidv4(),
      title: '用户登录模块开发',
      assigneeId: 'member-4',
      dueDate: yesterday.toISOString().split('T')[0],
      priority: 'high',
      status: 'todo',
      projectId,
      createdAt: today.toISOString(),
    },
    {
      id: uuidv4(),
      title: '数据库表结构设计',
      assigneeId: 'member-2',
      dueDate: twoDaysLater.toISOString().split('T')[0],
      priority: 'low',
      status: 'done',
      projectId,
      createdAt: today.toISOString(),
    },
    {
      id: uuidv4(),
      title: '单元测试编写',
      assigneeId: 'member-1',
      dueDate: fiveDaysLater.toISOString().split('T')[0],
      priority: 'medium',
      status: 'todo',
      projectId,
      createdAt: today.toISOString(),
    },
  ];

  return { projects, tasks, currentProjectId: projectId };
};

const getInitialState = () => {
  const storedProjects = loadFromStorage<Project[]>(STORAGE_KEYS.PROJECTS, []);
  const storedTasks = loadFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
  const storedCurrentProjectId = loadFromStorage<string | null>(STORAGE_KEYS.CURRENT_PROJECT_ID, null);
  
  const members = loadFromStorage<TeamMember[]>(STORAGE_KEYS.MEMBERS, defaultMembers);

  if (storedProjects.length > 0) {
    return {
      projects: storedProjects,
      tasks: storedTasks,
      members,
      currentProjectId: storedCurrentProjectId,
      searchQuery: '',
      filterPriority: 'all' as Priority | 'all',
    };
  }

  const mockData = createMockData();
  saveToStorage(STORAGE_KEYS.PROJECTS, mockData.projects);
  saveToStorage(STORAGE_KEYS.TASKS, mockData.tasks);
  saveToStorage(STORAGE_KEYS.CURRENT_PROJECT_ID, mockData.currentProjectId);
  saveToStorage(STORAGE_KEYS.MEMBERS, members);

  return {
    projects: mockData.projects,
    tasks: mockData.tasks,
    members,
    currentProjectId: mockData.currentProjectId,
    searchQuery: '',
    filterPriority: 'all' as Priority | 'all',
  };
};

export const useTaskStore = create<TaskStore>((set, get) => ({
  ...getInitialState(),

  addProject: (name: string) => {
    const newProject: Project = {
      id: uuidv4(),
      name,
      createdAt: new Date().toISOString(),
    };
    const projects = [...get().projects, newProject];
    set({ projects, currentProjectId: newProject.id });
    saveToStorage(STORAGE_KEYS.PROJECTS, projects);
    saveToStorage(STORAGE_KEYS.CURRENT_PROJECT_ID, newProject.id);
  },

  deleteProject: (id: string) => {
    const projects = get().projects.filter((p) => p.id !== id);
    const tasks = get().tasks.filter((t) => t.projectId !== id);
    const currentProjectId = get().currentProjectId === id
      ? (projects.length > 0 ? projects[0].id : null)
      : get().currentProjectId;

    set({ projects, tasks, currentProjectId });
    saveToStorage(STORAGE_KEYS.PROJECTS, projects);
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
    saveToStorage(STORAGE_KEYS.CURRENT_PROJECT_ID, currentProjectId);
  },

  setCurrentProject: (id: string) => {
    set({ currentProjectId: id });
    saveToStorage(STORAGE_KEYS.CURRENT_PROJECT_ID, id);
  },

  addTask: (task) => {
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    const tasks = [...get().tasks, newTask];
    set({ tasks });
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  },

  updateTask: (id: string, updates: Partial<Task>) => {
    const tasks = get().tasks.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    );
    set({ tasks });
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  },

  deleteTask: (id: string) => {
    const tasks = get().tasks.filter((t) => t.id !== id);
    set({ tasks });
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  },

  moveTask: (taskId: string, newStatus: TaskStatus) => {
    const tasks = get().tasks.map((t) =>
      t.id === taskId ? { ...t, status: newStatus } : t
    );
    set({ tasks });
    saveToStorage(STORAGE_KEYS.TASKS, tasks);
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  setFilterPriority: (priority: Priority | 'all') => {
    set({ filterPriority: priority });
  },

  loadFromStorage: () => {
    set(getInitialState());
  },
}));

export const useFilteredTasks = () => {
  const { tasks, currentProjectId, searchQuery, filterPriority } = useTaskStore();

  return tasks.filter((task) => {
    if (task.projectId !== currentProjectId) return false;
    if (searchQuery && !task.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterPriority !== 'all' && task.priority !== filterPriority) return false;
    return true;
  });
};

export const useProjectStats = () => {
  const { tasks, currentProjectId, members } = useTaskStore();

  const projectTasks = tasks.filter((t) => t.projectId === currentProjectId);
  const total = projectTasks.length;
  const completed = projectTasks.filter((t) => t.status === 'done').length;

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const overdue = projectTasks.filter((t) => {
    if (t.status === 'done') return false;
    const dueDate = new Date(t.dueDate);
    dueDate.setHours(0, 0, 0, 0);
    return dueDate < now;
  }).length;

  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

  const memberStats = members.map((member) => {
    const memberTasks = projectTasks.filter((t) => t.assigneeId === member.id);
    return {
      memberId: member.id,
      memberName: member.name,
      total: memberTasks.length,
      completed: memberTasks.filter((t) => t.status === 'done').length,
    };
  });

  return {
    total,
    completed,
    overdue,
    completionRate,
    memberStats,
  };
};
