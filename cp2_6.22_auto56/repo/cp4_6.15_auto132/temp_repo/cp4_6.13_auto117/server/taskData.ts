import { v4 as uuidv4 } from 'uuid';
import type {
  Task,
  TeamMember,
  TaskCreateInput,
  TaskUpdateInput,
  TimeSnapshot,
} from '../src/types';

const defaultMembers: TeamMember[] = [
  { id: 'm1', name: '张明', avatar: '张' },
  { id: 'm2', name: '李华', avatar: '李' },
  { id: 'm3', name: '王芳', avatar: '王' },
  { id: 'm4', name: '赵强', avatar: '赵' },
  { id: 'm5', name: '刘洋', avatar: '刘' },
];

let tasks: Task[] = [];
let timeSnapshots: TimeSnapshot[] = [];
const teamMembers: TeamMember[] = defaultMembers;

function seedDemoTasks(): void {
  const now = Date.now();
  tasks = [
    {
      id: uuidv4(),
      title: '需求分析文档',
      description: '完成项目需求分析，整理用户故事和验收标准',
      estimatedHours: 8,
      assignees: [teamMembers[0], teamMembers[1]],
      timeSpent: 3600,
      isRunning: false,
      createdAt: now - 86400000,
      position: 0,
    },
    {
      id: uuidv4(),
      title: 'UI原型设计',
      description: '根据需求文档设计高保真UI原型',
      estimatedHours: 12,
      assignees: [teamMembers[2]],
      timeSpent: 7200,
      isRunning: false,
      createdAt: now - 72000000,
      position: 1,
    },
    {
      id: uuidv4(),
      title: '前端架构搭建',
      description: '搭建React项目骨架，配置开发工具链',
      estimatedHours: 6,
      assignees: [teamMembers[3]],
      timeSpent: 0,
      isRunning: false,
      createdAt: now - 36000000,
      position: 2,
    },
    {
      id: uuidv4(),
      title: '后端接口开发',
      description: '实现REST API和WebSocket服务',
      estimatedHours: 16,
      assignees: [teamMembers[4], teamMembers[3]],
      timeSpent: 1800,
      isRunning: false,
      createdAt: now - 18000000,
      position: 3,
    },
  ];
}

seedDemoTasks();

export function getTeamMembers(): TeamMember[] {
  return teamMembers;
}

export function getAllTasks(): Task[] {
  return [...tasks].sort((a, b) => a.position - b.position);
}

export function getTaskById(id: string): Task | undefined {
  return tasks.find((t) => t.id === id);
}

export function addTask(input: TaskCreateInput): Task {
  const newTask: Task = {
    id: uuidv4(),
    title: input.title,
    description: input.description,
    estimatedHours: input.estimatedHours,
    assignees: input.assignees,
    timeSpent: 0,
    isRunning: false,
    createdAt: Date.now(),
    position: tasks.length,
  };
  tasks.push(newTask);
  return newTask;
}

export function updateTask(id: string, input: TaskUpdateInput): Task | null {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  tasks[idx] = { ...tasks[idx], ...input };
  return tasks[idx];
}

export function deleteTask(id: string): boolean {
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return false;
  tasks.splice(idx, 1);
  tasks.forEach((t, i) => {
    t.position = i;
  });
  return true;
}

export function updateTimeSpent(taskId: string, seconds: number): Task | null {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;
  task.timeSpent = Math.max(0, seconds);
  timeSnapshots.push({
    id: uuidv4(),
    taskId,
    timestamp: Date.now(),
    timeSpent: task.timeSpent,
  });
  return task;
}

export function setTimerRunning(taskId: string, running: boolean): Task | null {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;
  task.isRunning = running;
  return task;
}

export function resetTimer(taskId: string): Task | null {
  const task = tasks.find((t) => t.id === taskId);
  if (!task) return null;
  task.timeSpent = 0;
  task.isRunning = false;
  return task;
}

export function getSnapshotsByTask(taskId: string): TimeSnapshot[] {
  return timeSnapshots.filter((s) => s.taskId === taskId);
}

export function getAllSnapshots(): TimeSnapshot[] {
  return [...timeSnapshots];
}

export function getExportData(): {
  exportedAt: number;
  teamMembers: TeamMember[];
  tasks: Task[];
  timeSnapshots: TimeSnapshot[];
} {
  return {
    exportedAt: Date.now(),
    teamMembers: [...teamMembers],
    tasks: getAllTasks(),
    timeSnapshots: [...timeSnapshots],
  };
}
