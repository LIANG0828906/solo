export type TaskStatus = 'open' | 'claimed' | 'completed' | 'reviewed';

export type TaskCategory = '跑腿代办' | '家政服务' | '工具借用' | '技能互助' | '宠物照料' | '其他';

export interface Task {
  id: string;
  title: string;
  description: string;
  reward: number;
  category: TaskCategory;
  publisherId: string;
  publisherName: string;
  claimantId?: string;
  claimantName?: string;
  status: TaskStatus;
  rating?: number;
  createdAt: Date;
  claimedAt?: Date;
  completedAt?: Date;
}

const STORAGE_KEY = 'microtasks_tasks';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function reviveDates(obj: any): any {
  if (obj === null || obj === undefined) return obj;
  if (obj instanceof Date) return obj;
  if (typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(reviveDates);
  const result: any = {};
  for (const key of Object.keys(obj)) {
    const value = obj[key];
    if (key === 'createdAt' || key === 'claimedAt' || key === 'completedAt') {
      result[key] = value ? new Date(value) : value;
    } else if (typeof value === 'object' && value !== null) {
      result[key] = reviveDates(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function readFromStorage(): Task[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return reviveDates(parsed);
  } catch {
    return [];
  }
}

function writeToStorage(tasks: Task[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

export function initTasks(): Task[] {
  const existing = readFromStorage();
  if (existing.length > 0) return existing;

  const now = Date.now();
  const mockTasks: Task[] = [
    {
      id: generateId(),
      title: '帮我去校门口取个快递',
      description: '快递在菜鸟驿站，取件码已经发你了，是个小件不重，取完送到3号楼301寝室。',
      reward: 15,
      category: '跑腿代办',
      publisherId: 'user_001',
      publisherName: '小明',
      status: 'open',
      createdAt: new Date(now - 2 * 60 * 60 * 1000),
    },
    {
      id: generateId(),
      title: '周末帮忙打扫下房间卫生',
      description: '一室一厅大概50平，主要是扫地拖地和擦桌子，厨房简单清理一下就行，工具我都有。',
      reward: 80,
      category: '家政服务',
      publisherId: 'user_002',
      publisherName: '小红',
      status: 'claimed',
      claimantId: 'user_003',
      claimantName: '小华',
      createdAt: new Date(now - 8 * 60 * 60 * 1000),
      claimedAt: new Date(now - 5 * 60 * 60 * 1000),
    },
    {
      id: generateId(),
      title: '借用一下电钻，装个书架',
      description: '想在墙上装个书架需要打孔，借电钻用两小时就行，用完立即归还，可以付押金。',
      reward: 20,
      category: '工具借用',
      publisherId: 'user_004',
      publisherName: '小李',
      status: 'completed',
      claimantId: 'user_005',
      claimantName: '小王',
      createdAt: new Date(now - 24 * 60 * 60 * 1000),
      claimedAt: new Date(now - 20 * 60 * 60 * 1000),
      completedAt: new Date(now - 2 * 60 * 60 * 1000),
    },
    {
      id: generateId(),
      title: 'PS修图，帮忙调一下照片色调',
      description: '有一组旅行照片需要调色，大概20张，风格偏清新日系，有参考图可以照着调。',
      reward: 100,
      category: '技能互助',
      publisherId: 'user_006',
      publisherName: '小丽',
      status: 'reviewed',
      claimantId: 'user_007',
      claimantName: '小张',
      rating: 5,
      createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000),
      claimedAt: new Date(now - 2 * 24 * 60 * 60 * 1000),
      completedAt: new Date(now - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: generateId(),
      title: '出差三天帮忙喂下猫咪',
      description: '我家有一只英短，每天早上去喂一次猫粮和换水，顺便铲个屎就行，猫很乖不抓人。',
      reward: 120,
      category: '宠物照料',
      publisherId: 'user_008',
      publisherName: '小陈',
      status: 'open',
      createdAt: new Date(now - 5 * 60 * 60 * 1000),
    },
    {
      id: generateId(),
      title: '帮我写一份活动策划方案',
      description: '社团要搞一个迎新活动，需要一份完整的策划书，包括流程预算和人员安排，字数不用太多。',
      reward: 200,
      category: '其他',
      publisherId: 'user_009',
      publisherName: '小周',
      status: 'open',
      createdAt: new Date(now - 12 * 60 * 60 * 1000),
    },
  ];

  writeToStorage(mockTasks);
  return mockTasks;
}

export function getTasks(): Task[] {
  const tasks = readFromStorage();
  if (tasks.length === 0) return initTasks();
  return tasks;
}

export function getTaskById(id: string): Task | undefined {
  return getTasks().find((t) => t.id === id);
}

type CreateTaskData = Omit<Task, 'id' | 'status' | 'createdAt'>;

export function createTask(taskData: CreateTaskData): Task {
  const tasks = getTasks();
  const newTask: Task = {
    ...taskData,
    id: generateId(),
    status: 'open',
    createdAt: new Date(),
  };
  tasks.unshift(newTask);
  writeToStorage(tasks);
  return newTask;
}

type UpdateTaskData = Partial<Omit<Task, 'id' | 'createdAt'>>;

export function updateTask(id: string, updates: UpdateTaskData): Task | undefined {
  const tasks = getTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return undefined;
  tasks[index] = { ...tasks[index], ...updates };
  writeToStorage(tasks);
  return tasks[index];
}

export function deleteTask(id: string): boolean {
  const tasks = getTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;
  tasks.splice(index, 1);
  writeToStorage(tasks);
  return true;
}
