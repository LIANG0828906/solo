export type TagColor = 'red' | 'blue' | 'green' | 'orange' | 'purple';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface User {
  id: string;
  username: string;
  password: string;
  avatar: string;
}

export interface TaskTag {
  id: string;
  name: string;
  color: TagColor;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  tags: TaskTag[];
  assigneeId?: string;
  estimatedHours: number;
  blockedReason?: string;
  createdAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  deadline: string;
  memberIds: string[];
  createdAt: string;
}

const uid = () => Math.random().toString(36).slice(2, 11);

export const TAG_COLOR_MAP: Record<TagColor, string> = {
  red: '#EF4444',
  blue: '#3B82F6',
  green: '#10B981',
  orange: '#F59E0B',
  purple: '#8B5CF6',
};

export const store: {
  users: User[];
  projects: Project[];
  tasks: Task[];
} = {
  users: [
    { id: 'u1', username: 'Alice', password: '123456', avatar: 'A' },
    { id: 'u2', username: 'Bob', password: '123456', avatar: 'B' },
    { id: 'u3', username: 'Charlie', password: '123456', avatar: 'C' },
  ],
  projects: [
    {
      id: 'p1',
      name: '官网改版项目',
      description: '对公司官网进行全面的 UI/UX 改版，提升用户体验和品牌形象。',
      deadline: '2026-08-31',
      memberIds: ['u1', 'u2', 'u3'],
      createdAt: new Date().toISOString(),
    },
  ],
  tasks: [
    {
      id: 't1',
      projectId: 'p1',
      title: '需求分析与竞品调研',
      description: '收集用户反馈，分析主要竞品的设计特点',
      status: 'done',
      tags: [
        { id: 'g1', name: '设计', color: 'purple' },
        { id: 'g2', name: '调研', color: 'blue' },
      ],
      assigneeId: 'u1',
      estimatedHours: 16,
      createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    },
    {
      id: 't2',
      projectId: 'p1',
      title: '首页视觉稿设计',
      description: '完成首页及核心页面的高保真视觉稿',
      status: 'in-progress',
      tags: [
        { id: 'g3', name: '设计', color: 'purple' },
      ],
      assigneeId: 'u1',
      estimatedHours: 24,
      blockedReason: '等待品牌色确认',
      createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    },
    {
      id: 't3',
      projectId: 'p1',
      title: '前端组件库搭建',
      description: '基于设计规范建立基础组件库',
      status: 'in-progress',
      tags: [
        { id: 'g4', name: '前端', color: 'green' },
      ],
      assigneeId: 'u2',
      estimatedHours: 40,
      createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
    {
      id: 't4',
      projectId: 'p1',
      title: '后端 API 接口开发',
      description: '开发官网所需的内容管理 API',
      status: 'todo',
      tags: [
        { id: 'g5', name: '后端', color: 'orange' },
      ],
      assigneeId: 'u3',
      estimatedHours: 32,
      createdAt: new Date(Date.now() - 86400000).toISOString(),
    },
    {
      id: 't5',
      projectId: 'p1',
      title: '性能优化与测试',
      description: '对网站进行性能调优和兼容性测试',
      status: 'todo',
      tags: [
        { id: 'g6', name: '测试', color: 'red' },
        { id: 'g7', name: '前端', color: 'green' },
      ],
      estimatedHours: 20,
      createdAt: new Date().toISOString(),
    },
  ],
};

export const genId = uid;
