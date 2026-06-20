import { v4 as uuidv4 } from 'uuid';
import type { Task, Sprint, TeamMember, AssignmentHistoryEntry } from '@/types';

let tasks: Task[] = [];
let sprints: Sprint[] = [];
let teamMembers: TeamMember[] = [];

const delay = (min = 200, max = 500): Promise<void> => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, ms));
};

const initializeMockData = () => {
  teamMembers = [
    { id: uuidv4(), name: '张三' },
    { id: uuidv4(), name: '李四' },
    { id: uuidv4(), name: '王五' },
  ];

  const sprintId = uuidv4();
  sprints = [
    {
      id: sprintId,
      name: 'Sprint 1',
      startDate: '2024-01-01',
      endDate: '2024-01-14',
      teamMembers: teamMembers.map((m) => m.id),
    },
  ];

  tasks = [
    {
      id: uuidv4(),
      title: '用户登录功能开发',
      description: '实现用户登录、注册、密码找回功能',
      priority: 'high',
      status: 'in-progress',
      assignee: teamMembers[0].id,
      estimate: 8,
      sprintId: sprintId,
      createdAt: new Date('2024-01-02').toISOString(),
      assignmentHistory: [
        { assignee: teamMembers[0].id, date: new Date('2024-01-02').toISOString() },
      ],
    },
    {
      id: uuidv4(),
      title: '首页UI设计',
      description: '完成首页的整体UI设计和布局',
      priority: 'medium',
      status: 'todo',
      assignee: teamMembers[1].id,
      estimate: 5,
      sprintId: sprintId,
      createdAt: new Date('2024-01-02').toISOString(),
      assignmentHistory: [
        { assignee: teamMembers[1].id, date: new Date('2024-01-02').toISOString() },
      ],
    },
    {
      id: uuidv4(),
      title: '数据库优化',
      description: '优化数据库查询性能，添加索引',
      priority: 'low',
      status: 'done',
      assignee: teamMembers[2].id,
      estimate: 3,
      sprintId: sprintId,
      createdAt: new Date('2024-01-01').toISOString(),
      assignmentHistory: [
        { assignee: teamMembers[2].id, date: new Date('2024-01-01').toISOString() },
      ],
    },
    {
      id: uuidv4(),
      title: 'API接口文档',
      description: '编写完整的API接口文档',
      priority: 'medium',
      status: 'todo',
      assignee: null,
      estimate: 4,
      sprintId: null,
      createdAt: new Date('2024-01-03').toISOString(),
      assignmentHistory: [
        { assignee: null, date: new Date('2024-01-03').toISOString() },
      ],
    },
    {
      id: uuidv4(),
      title: '单元测试覆盖',
      description: '增加核心模块的单元测试覆盖率',
      priority: 'high',
      status: 'todo',
      assignee: null,
      estimate: 6,
      sprintId: null,
      createdAt: new Date('2024-01-04').toISOString(),
      assignmentHistory: [
        { assignee: null, date: new Date('2024-01-04').toISOString() },
      ],
    },
  ];
};

initializeMockData();

export const fetchTasks = async (): Promise<Task[]> => {
  await delay();
  return [...tasks];
};

export const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'assignmentHistory'>): Promise<Task> => {
  await delay();
  const newTask: Task = {
    ...task,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
    assignmentHistory: [
      { assignee: task.assignee, date: new Date().toISOString() },
    ],
  };
  tasks.push(newTask);
  return { ...newTask };
};

export const updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
  await delay();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error(`Task with id ${id} not found`);
  }
  const currentTask = tasks[index];
  const newHistoryEntry: AssignmentHistoryEntry | null =
    'assignee' in updates && updates.assignee !== currentTask.assignee
      ? { assignee: updates.assignee ?? null, date: new Date().toISOString() }
      : null;

  const updatedTask: Task = {
    ...currentTask,
    ...updates,
    assignmentHistory: newHistoryEntry
      ? [...currentTask.assignmentHistory, newHistoryEntry]
      : currentTask.assignmentHistory,
  };
  tasks[index] = updatedTask;
  return { ...tasks[index] };
};

export const deleteTask = async (id: string): Promise<void> => {
  await delay();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) {
    throw new Error(`Task with id ${id} not found`);
  }
  tasks.splice(index, 1);
};

export const fetchSprints = async (): Promise<Sprint[]> => {
  await delay();
  return [...sprints];
};

export const createSprint = async (sprint: Omit<Sprint, 'id'>): Promise<Sprint> => {
  await delay();
  const newSprint: Sprint = {
    ...sprint,
    id: uuidv4(),
  };
  sprints.push(newSprint);
  return { ...newSprint };
};

export const updateSprint = async (id: string, updates: Partial<Sprint>): Promise<Sprint> => {
  await delay();
  const index = sprints.findIndex((s) => s.id === id);
  if (index === -1) {
    throw new Error(`Sprint with id ${id} not found`);
  }
  sprints[index] = { ...sprints[index], ...updates };
  return { ...sprints[index] };
};

export const deleteSprint = async (id: string): Promise<void> => {
  await delay();
  const index = sprints.findIndex((s) => s.id === id);
  if (index === -1) {
    throw new Error(`Sprint with id ${id} not found`);
  }
  sprints.splice(index, 1);
};

export const fetchTeamMembers = async (): Promise<TeamMember[]> => {
  await delay();
  return [...teamMembers];
};
