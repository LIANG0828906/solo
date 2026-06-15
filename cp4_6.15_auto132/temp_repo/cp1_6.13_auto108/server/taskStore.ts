import { v4 as uuidv4 } from 'uuid';

export type TaskStatus = 'todo' | 'in-progress' | 'done';
export type Priority = 'P0' | 'P1' | 'P2' | 'P3';
export type Tag = '前端' | '后端' | '设计' | '测试' | '运维';

export interface Comment {
  id: string;
  content: string;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  tags: Tag[];
  priority: Priority;
  status: TaskStatus;
  createdAt: number;
  statusChangedAt: number;
  comments: Comment[];
  order: number;
}

const PRESET_TAGS: Tag[] = ['前端', '后端', '设计', '测试', '运维'];

function createInitialTasks(): Task[] {
  const now = Date.now();
  const hour = 3600 * 1000;

  const sampleTasks: Task[] = [
    {
      id: uuidv4(),
      title: '设计登录页面UI',
      description: '需要包含用户名密码输入框、记住密码、忘记密码链接',
      tags: ['设计', '前端'],
      priority: 'P1',
      status: 'todo',
      createdAt: now - 48 * hour,
      statusChangedAt: now - 48 * hour,
      comments: [],
      order: 0,
    },
    {
      id: uuidv4(),
      title: '搭建项目脚手架',
      description: '使用Vite + React + TypeScript初始化项目结构',
      tags: ['前端', '运维'],
      priority: 'P0',
      status: 'todo',
      createdAt: now - 36 * hour,
      statusChangedAt: now - 36 * hour,
      comments: [
        { id: uuidv4(), content: '记得配置ESLint', createdAt: now - 30 * hour },
      ],
      order: 1,
    },
    {
      id: uuidv4(),
      title: '编写API文档',
      description: '定义所有RESTful接口的请求/响应格式',
      tags: ['后端'],
      priority: 'P2',
      status: 'todo',
      createdAt: now - 24 * hour,
      statusChangedAt: now - 24 * hour,
      comments: [],
      order: 2,
    },
    {
      id: uuidv4(),
      title: '实现用户认证模块',
      description: 'JWT token生成与验证，登录/注册接口',
      tags: ['后端'],
      priority: 'P0',
      status: 'in-progress',
      createdAt: now - 72 * hour,
      statusChangedAt: now - 12 * hour,
      comments: [
        { id: uuidv4(), content: 'Token过期时间设为2小时', createdAt: now - 10 * hour },
        { id: uuidv4(), content: '需要刷新token机制', createdAt: now - 8 * hour },
      ],
      order: 0,
    },
    {
      id: uuidv4(),
      title: '看板拖拽功能开发',
      description: '使用react-beautiful-dnd实现卡片拖拽排序',
      tags: ['前端'],
      priority: 'P1',
      status: 'in-progress',
      createdAt: now - 60 * hour,
      statusChangedAt: now - 6 * hour,
      comments: [],
      order: 1,
    },
    {
      id: uuidv4(),
      title: '编写单元测试',
      description: '对核心业务逻辑编写测试用例，覆盖率>80%',
      tags: ['测试'],
      priority: 'P2',
      status: 'in-progress',
      createdAt: now - 48 * hour,
      statusChangedAt: now - 3 * hour,
      comments: [{ id: uuidv4(), content: '使用Jest框架', createdAt: now - 2 * hour }],
      order: 2,
    },
    {
      id: uuidv4(),
      title: '数据库表结构设计',
      description: '用户、任务、评论等核心表设计',
      tags: ['后端', '设计'],
      priority: 'P0',
      status: 'done',
      createdAt: now - 120 * hour,
      statusChangedAt: now - 24 * hour,
      comments: [
        { id: uuidv4(), content: '记得加索引', createdAt: now - 100 * hour },
        { id: uuidv4(), content: '审核通过', createdAt: now - 24 * hour },
      ],
      order: 0,
    },
    {
      id: uuidv4(),
      title: '需求文档评审',
      description: '组织团队评审需求文档，确认范围',
      tags: ['设计'],
      priority: 'P1',
      status: 'done',
      createdAt: now - 96 * hour,
      statusChangedAt: now - 48 * hour,
      comments: [],
      order: 1,
    },
    {
      id: uuidv4(),
      title: '开发环境配置',
      description: '配置本地开发环境、CI/CD流水线',
      tags: ['运维'],
      priority: 'P1',
      status: 'done',
      createdAt: now - 144 * hour,
      statusChangedAt: now - 72 * hour,
      comments: [{ id: uuidv4(), content: '已完成', createdAt: now - 72 * hour }],
      order: 2,
    },
  ];

  return sampleTasks;
}

let tasks: Task[] = createInitialTasks();

export function getPresetTags(): Tag[] {
  return [...PRESET_TAGS];
}

export function getTasks(): Task[] {
  return JSON.parse(JSON.stringify(tasks));
}

export function addTask(
  data: Omit<Task, 'id' | 'createdAt' | 'statusChangedAt' | 'comments' | 'status' | 'order'>
): Task {
  const now = Date.now();
  const todoTasks = tasks.filter((t) => t.status === 'todo');
  const newTask: Task = {
    id: uuidv4(),
    title: data.title,
    description: data.description,
    tags: data.tags,
    priority: data.priority,
    status: 'todo',
    createdAt: now,
    statusChangedAt: now,
    comments: [],
    order: todoTasks.length,
  };
  tasks.push(newTask);
  return JSON.parse(JSON.stringify(newTask));
}

export function updateTask(
  id: string,
  updates: Partial<Pick<Task, 'title' | 'description' | 'tags' | 'priority' | 'status' | 'order'>>
): Task | null {
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const oldTask = tasks[index];
  const shouldUpdateStatusTime = updates.status && updates.status !== oldTask.status;

  tasks[index] = {
    ...oldTask,
    ...updates,
    statusChangedAt: shouldUpdateStatusTime ? Date.now() : oldTask.statusChangedAt,
  };

  return JSON.parse(JSON.stringify(tasks[index]));
}

export function reorderTasks(
  sourceStatus: TaskStatus,
  sourceIndex: number,
  destinationStatus: TaskStatus,
  destinationIndex: number
): Task[] {
  const now = Date.now();
  const sourceList = tasks
    .filter((t) => t.status === sourceStatus)
    .sort((a, b) => a.order - b.order);

  const [movedTask] = sourceList.splice(sourceIndex, 1);

  sourceList.forEach((t, i) => {
    const idx = tasks.findIndex((x) => x.id === t.id);
    tasks[idx].order = i;
  });

  const destList = tasks
    .filter((t) => t.status === destinationStatus)
    .sort((a, b) => a.order - b.order);

  const movedIdx = tasks.findIndex((x) => x.id === movedTask.id);
  tasks[movedIdx].status = destinationStatus;
  tasks[movedIdx].statusChangedAt = sourceStatus !== destinationStatus ? now : movedTask.statusChangedAt;

  destList.splice(destinationIndex, 0, tasks[movedIdx]);
  destList.forEach((t, i) => {
    const idx = tasks.findIndex((x) => x.id === t.id);
    tasks[idx].order = i;
  });

  return JSON.parse(JSON.stringify(tasks));
}

export function addComment(taskId: string, content: string): Task | null {
  const index = tasks.findIndex((t) => t.id === taskId);
  if (index === -1) return null;

  const comment: Comment = {
    id: uuidv4(),
    content,
    createdAt: Date.now(),
  };
  tasks[index].comments.push(comment);
  return JSON.parse(JSON.stringify(tasks[index]));
}
