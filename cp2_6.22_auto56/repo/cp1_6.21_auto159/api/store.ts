import { v4 as uuidv4 } from 'uuid';

export type TaskStatus = 'todo' | 'inProgress' | 'done';
export type TaskPriority = 'high' | 'medium' | 'low';
export type LogAction = 'created' | 'moved' | 'deleted';

export interface Board {
  id: string;
  name: string;
  description: string;
  createdAt: string;
}

export interface Task {
  id: string;
  boardId: string;
  title: string;
  description: string;
  assignee: string;
  priority: TaskPriority;
  status: TaskStatus;
  order: number;
  createdAt: string;
}

export interface LogEntry {
  id: string;
  boardId: string;
  taskId: string;
  taskTitle: string;
  action: LogAction;
  timestamp: string;
  operator: string;
}

export interface MemberLoad {
  date: string;
  member: string;
  todo: number;
  inProgress: number;
  done: number;
}

export const MEMBERS = ['张三', '李四', '王五', '赵六'];

const board1Id = uuidv4();
const board2Id = uuidv4();

const seedTasks: Task[] = [
  {
    id: uuidv4(),
    boardId: board1Id,
    title: '用户调研分析',
    description: '对目标用户群体进行深度访谈和问卷调查，整理用户画像',
    assignee: '张三',
    priority: 'high',
    status: 'todo',
    order: 0,
    createdAt: '2026-06-15T09:00:00.000Z',
  },
  {
    id: uuidv4(),
    boardId: board1Id,
    title: '首页改版设计',
    description: '根据调研结果重新设计首页布局和视觉风格',
    assignee: '李四',
    priority: 'high',
    status: 'inProgress',
    order: 0,
    createdAt: '2026-06-14T10:30:00.000Z',
  },
  {
    id: uuidv4(),
    boardId: board1Id,
    title: 'API接口开发',
    description: '开发用户模块、订单模块的核心API接口',
    assignee: '王五',
    priority: 'medium',
    status: 'inProgress',
    order: 1,
    createdAt: '2026-06-14T14:00:00.000Z',
  },
  {
    id: uuidv4(),
    boardId: board1Id,
    title: '性能优化方案',
    description: '针对首屏加载速度和接口响应时间制定优化方案',
    assignee: '赵六',
    priority: 'medium',
    status: 'done',
    order: 0,
    createdAt: '2026-06-13T08:30:00.000Z',
  },
  {
    id: uuidv4(),
    boardId: board1Id,
    title: '数据埋点方案',
    description: '制定关键业务流程的数据埋点规范和实施方案',
    assignee: '张三',
    priority: 'low',
    status: 'todo',
    order: 1,
    createdAt: '2026-06-16T11:00:00.000Z',
  },
  {
    id: uuidv4(),
    boardId: board1Id,
    title: '用户反馈整理',
    description: '收集并分类最近一个月的用户反馈意见',
    assignee: '李四',
    priority: 'medium',
    status: 'done',
    order: 1,
    createdAt: '2026-06-13T16:00:00.000Z',
  },
  {
    id: uuidv4(),
    boardId: board1Id,
    title: '灰度发布配置',
    description: '配置灰度发布规则，支持按地域和用户比例灰度',
    assignee: '王五',
    priority: 'high',
    status: 'todo',
    order: 2,
    createdAt: '2026-06-17T09:30:00.000Z',
  },
  {
    id: uuidv4(),
    boardId: board1Id,
    title: '自动化测试编写',
    description: '编写核心业务流程的端到端自动化测试用例',
    assignee: '赵六',
    priority: 'low',
    status: 'inProgress',
    order: 2,
    createdAt: '2026-06-15T13:00:00.000Z',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    title: '竞品分析报告',
    description: '分析三款主要竞品的功能特性和用户体验',
    assignee: '张三',
    priority: 'high',
    status: 'done',
    order: 0,
    createdAt: '2026-06-13T09:00:00.000Z',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    title: '交互原型设计',
    description: '设计核心功能的交互原型，完成可用性评估',
    assignee: '李四',
    priority: 'high',
    status: 'inProgress',
    order: 0,
    createdAt: '2026-06-14T09:00:00.000Z',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    title: '视觉规范制定',
    description: '制定色彩、字体、间距、图标等视觉规范文档',
    assignee: '王五',
    priority: 'medium',
    status: 'inProgress',
    order: 1,
    createdAt: '2026-06-15T10:00:00.000Z',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    title: '组件库搭建',
    description: '基于视觉规范搭建基础组件库，包含按钮、输入框等',
    assignee: '赵六',
    priority: 'high',
    status: 'todo',
    order: 0,
    createdAt: '2026-06-16T14:00:00.000Z',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    title: '可用性测试',
    description: '邀请目标用户进行可用性测试，收集改进意见',
    assignee: '张三',
    priority: 'medium',
    status: 'todo',
    order: 1,
    createdAt: '2026-06-17T10:00:00.000Z',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    title: '设计评审会议',
    description: '组织设计评审会议，对齐各方设计方案和细节',
    assignee: '李四',
    priority: 'low',
    status: 'done',
    order: 1,
    createdAt: '2026-06-13T14:00:00.000Z',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    title: '动效设计方案',
    description: '设计页面转场和交互反馈的动效方案',
    assignee: '王五',
    priority: 'low',
    status: 'inProgress',
    order: 2,
    createdAt: '2026-06-16T09:00:00.000Z',
  },
];

const seedLogs: LogEntry[] = [
  {
    id: uuidv4(),
    boardId: board1Id,
    taskId: seedTasks[3].id,
    taskTitle: '性能优化方案',
    action: 'created',
    timestamp: '2026-06-13T08:30:00.000Z',
    operator: '赵六',
  },
  {
    id: uuidv4(),
    boardId: board1Id,
    taskId: seedTasks[5].id,
    taskTitle: '用户反馈整理',
    action: 'created',
    timestamp: '2026-06-13T16:00:00.000Z',
    operator: '李四',
  },
  {
    id: uuidv4(),
    boardId: board1Id,
    taskId: seedTasks[3].id,
    taskTitle: '性能优化方案: todo→inProgress',
    action: 'moved',
    timestamp: '2026-06-14T09:00:00.000Z',
    operator: '赵六',
  },
  {
    id: uuidv4(),
    boardId: board1Id,
    taskId: seedTasks[1].id,
    taskTitle: '首页改版设计',
    action: 'created',
    timestamp: '2026-06-14T10:30:00.000Z',
    operator: '李四',
  },
  {
    id: uuidv4(),
    boardId: board1Id,
    taskId: seedTasks[2].id,
    taskTitle: 'API接口开发',
    action: 'created',
    timestamp: '2026-06-14T14:00:00.000Z',
    operator: '王五',
  },
  {
    id: uuidv4(),
    boardId: board1Id,
    taskId: seedTasks[3].id,
    taskTitle: '性能优化方案: inProgress→done',
    action: 'moved',
    timestamp: '2026-06-14T17:00:00.000Z',
    operator: '赵六',
  },
  {
    id: uuidv4(),
    boardId: board1Id,
    taskId: seedTasks[0].id,
    taskTitle: '用户调研分析',
    action: 'created',
    timestamp: '2026-06-15T09:00:00.000Z',
    operator: '张三',
  },
  {
    id: uuidv4(),
    boardId: board1Id,
    taskId: seedTasks[7].id,
    taskTitle: '自动化测试编写',
    action: 'created',
    timestamp: '2026-06-15T13:00:00.000Z',
    operator: '赵六',
  },
  {
    id: uuidv4(),
    boardId: board1Id,
    taskId: seedTasks[1].id,
    taskTitle: '首页改版设计: todo→inProgress',
    action: 'moved',
    timestamp: '2026-06-15T15:00:00.000Z',
    operator: '李四',
  },
  {
    id: uuidv4(),
    boardId: board1Id,
    taskId: seedTasks[2].id,
    taskTitle: 'API接口开发: todo→inProgress',
    action: 'moved',
    timestamp: '2026-06-15T16:00:00.000Z',
    operator: '王五',
  },
  {
    id: uuidv4(),
    boardId: board1Id,
    taskId: seedTasks[4].id,
    taskTitle: '数据埋点方案',
    action: 'created',
    timestamp: '2026-06-16T11:00:00.000Z',
    operator: '张三',
  },
  {
    id: uuidv4(),
    boardId: board1Id,
    taskId: seedTasks[6].id,
    taskTitle: '灰度发布配置',
    action: 'created',
    timestamp: '2026-06-17T09:30:00.000Z',
    operator: '王五',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    taskId: seedTasks[8].id,
    taskTitle: '竞品分析报告',
    action: 'created',
    timestamp: '2026-06-13T09:00:00.000Z',
    operator: '张三',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    taskId: seedTasks[13].id,
    taskTitle: '设计评审会议',
    action: 'created',
    timestamp: '2026-06-13T14:00:00.000Z',
    operator: '李四',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    taskId: seedTasks[8].id,
    taskTitle: '竞品分析报告: todo→inProgress',
    action: 'moved',
    timestamp: '2026-06-13T15:00:00.000Z',
    operator: '张三',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    taskId: seedTasks[9].id,
    taskTitle: '交互原型设计',
    action: 'created',
    timestamp: '2026-06-14T09:00:00.000Z',
    operator: '李四',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    taskId: seedTasks[13].id,
    taskTitle: '设计评审会议: todo→inProgress',
    action: 'moved',
    timestamp: '2026-06-14T10:00:00.000Z',
    operator: '李四',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    taskId: seedTasks[8].id,
    taskTitle: '竞品分析报告: inProgress→done',
    action: 'moved',
    timestamp: '2026-06-14T16:00:00.000Z',
    operator: '张三',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    taskId: seedTasks[9].id,
    taskTitle: '交互原型设计: todo→inProgress',
    action: 'moved',
    timestamp: '2026-06-15T09:00:00.000Z',
    operator: '李四',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    taskId: seedTasks[10].id,
    taskTitle: '视觉规范制定',
    action: 'created',
    timestamp: '2026-06-15T10:00:00.000Z',
    operator: '王五',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    taskId: seedTasks[13].id,
    taskTitle: '设计评审会议: inProgress→done',
    action: 'moved',
    timestamp: '2026-06-15T14:00:00.000Z',
    operator: '李四',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    taskId: seedTasks[14].id,
    taskTitle: '动效设计方案',
    action: 'created',
    timestamp: '2026-06-16T09:00:00.000Z',
    operator: '王五',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    taskId: seedTasks[11].id,
    taskTitle: '组件库搭建',
    action: 'created',
    timestamp: '2026-06-16T14:00:00.000Z',
    operator: '赵六',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    taskId: seedTasks[10].id,
    taskTitle: '视觉规范制定: todo→inProgress',
    action: 'moved',
    timestamp: '2026-06-16T15:00:00.000Z',
    operator: '王五',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    taskId: seedTasks[12].id,
    taskTitle: '可用性测试',
    action: 'created',
    timestamp: '2026-06-17T10:00:00.000Z',
    operator: '张三',
  },
  {
    id: uuidv4(),
    boardId: board2Id,
    taskId: seedTasks[14].id,
    taskTitle: '动效设计方案: todo→inProgress',
    action: 'moved',
    timestamp: '2026-06-17T14:00:00.000Z',
    operator: '王五',
  },
];

let boards: Board[] = [
  {
    id: board1Id,
    name: '产品迭代',
    description: '产品核心功能迭代与优化',
    createdAt: '2026-06-13T08:00:00.000Z',
  },
  {
    id: board2Id,
    name: '设计冲刺',
    description: '设计团队冲刺周期任务',
    createdAt: '2026-06-13T08:00:00.000Z',
  },
];

let tasks: Task[] = [...seedTasks];
let logs: LogEntry[] = [...seedLogs];

export function getBoards(): Board[] {
  return boards;
}

export function getBoardById(id: string): Board | undefined {
  return boards.find((b) => b.id === id);
}

export function createBoard(name: string, description: string): Board {
  const board: Board = {
    id: uuidv4(),
    name,
    description,
    createdAt: new Date().toISOString(),
  };
  boards.push(board);
  return board;
}

export function deleteBoard(id: string): boolean {
  const idx = boards.findIndex((b) => b.id === id);
  if (idx === -1) return false;
  boards.splice(idx, 1);
  tasks = tasks.filter((t) => t.boardId !== id);
  logs = logs.filter((l) => l.boardId !== id);
  return true;
}

export function getTasksByBoardId(boardId: string): Task[] {
  return tasks.filter((t) => t.boardId === boardId);
}

export function getTaskById(id: string): Task | undefined {
  return tasks.find((t) => t.id === id);
}

export function createTask(task: Omit<Task, 'id' | 'createdAt'>): Task {
  const newTask: Task = {
    ...task,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  };
  tasks.push(newTask);
  return newTask;
}

export function updateTask(
  id: string,
  updates: Partial<Omit<Task, 'id' | 'boardId' | 'createdAt'>>,
): Task | undefined {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  tasks[idx] = { ...tasks[idx], ...updates };
  return tasks[idx];
}

export function deleteTask(id: string): Task | undefined {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return undefined;
  const [removed] = tasks.splice(idx, 1);
  return removed;
}

export function getLogsByBoardId(boardId: string): LogEntry[] {
  return logs.filter((l) => l.boardId === boardId);
}

export function addLog(entry: Omit<LogEntry, 'id'>): LogEntry {
  const log: LogEntry = { ...entry, id: uuidv4() };
  logs.push(log);
  return log;
}

export function getMemberLoad(boardId: string): MemberLoad[] {
  const boardTasks = tasks.filter((t) => t.boardId === boardId);
  const result: MemberLoad[] = [];

  const today = new Date('2026-06-21T00:00:00.000Z');
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);

    for (const member of MEMBERS) {
      let todo = 0;
      let inProgress = 0;
      let done = 0;

      for (const task of boardTasks) {
        if (task.assignee !== member) continue;
        if (task.createdAt > d.toISOString()) continue;

        const taskLogs = logs
          .filter((l) => l.taskId === task.id && l.action === 'moved' && l.timestamp <= d.toISOString())
          .sort((a, b) => a.timestamp.localeCompare(b.timestamp));

        let status: TaskStatus = 'todo';
        if (taskLogs.length > 0) {
          const lastLog = taskLogs[taskLogs.length - 1];
          const match = lastLog.taskTitle.match(/→(\w+)$/);
          if (match) {
            status = match[1] as TaskStatus;
          }
        }

        if (status === 'todo') todo++;
        else if (status === 'inProgress') inProgress++;
        else if (status === 'done') done++;
      }

      result.push({ date: dateStr, member, todo, inProgress, done });
    }
  }

  return result;
}
