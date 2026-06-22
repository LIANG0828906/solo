export type Priority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'in-progress' | 'done';

export interface Comment {
  id: string;
  taskId: string;
  author: string;
  content: string;
  createdAt: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: Priority;
  status: TaskStatus;
  assignee: string;
  assigneeId: string;
  dueDate: string;
  createdAt: number;
  statusChangedAt: number;
  comments: Comment[];
}

export interface Member {
  id: string;
  name: string;
  avatarColor: string;
}

const generateAvatarColor = (name: string): string => {
  const colors = ['#1890ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#eb2f96', '#fa8c16'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export const initialMembers: Member[] = [
  { id: 'm1', name: '张三', avatarColor: generateAvatarColor('张三') },
  { id: 'm2', name: '李四', avatarColor: generateAvatarColor('李四') },
  { id: 'm3', name: '王五', avatarColor: generateAvatarColor('王五') },
  { id: 'm4', name: '赵六', avatarColor: generateAvatarColor('赵六') },
  { id: 'm5', name: '陈七', avatarColor: generateAvatarColor('陈七') },
];

const now = Date.now();
const day = 24 * 60 * 60 * 1000;

export const initialComments: Comment[] = [
  { id: 'c1', taskId: 't1', author: '李四', content: '这个需求需要和产品再确认一下细节', createdAt: now - 3 * day },
  { id: 'c2', taskId: 't1', author: '张三', content: '好的，我下午开会讨论', createdAt: now - 2 * day },
  { id: 'c3', taskId: 't2', author: '王五', content: '接口文档已更新，请查看', createdAt: now - 1 * day },
  { id: 'c4', taskId: 't4', author: '赵六', content: '测试用例已经写完了', createdAt: now - 4 * day },
];

export const initialTasks: Task[] = [
  {
    id: 't1',
    title: '用户登录模块优化',
    description: '优化用户登录体验，支持第三方登录',
    priority: 'high',
    status: 'todo',
    assignee: '张三',
    assigneeId: 'm1',
    dueDate: '2026-06-25',
    createdAt: now - 7 * day,
    statusChangedAt: now - 7 * day,
    comments: initialComments.filter(c => c.taskId === 't1' || c.taskId === 't2'),
  },
  {
    id: 't2',
    title: 'API接口文档完善',
    description: '完善后端API接口文档，包括参数说明和示例',
    priority: 'medium',
    status: 'todo',
    assignee: '李四',
    assigneeId: 'm2',
    dueDate: '2026-06-28',
    createdAt: now - 5 * day,
    statusChangedAt: now - 5 * day,
    comments: initialComments.filter(c => c.taskId === 't2'),
  },
  {
    id: 't3',
    title: '首页UI重构',
    description: '按照新设计稿重构首页界面',
    priority: 'high',
    status: 'in-progress',
    assignee: '张三',
    assigneeId: 'm1',
    dueDate: '2026-06-22',
    createdAt: now - 10 * day,
    statusChangedAt: now - 2 * day,
    comments: [],
  },
  {
    id: 't4',
    title: '单元测试覆盖',
    description: '提高核心模块的单元测试覆盖率到80%',
    priority: 'medium',
    status: 'in-progress',
    assignee: '赵六',
    assigneeId: 'm4',
    dueDate: '2026-06-30',
    createdAt: now - 8 * day,
    statusChangedAt: now - 3 * day,
    comments: initialComments.filter(c => c.taskId === 't4'),
  },
  {
    id: 't5',
    title: '数据导出功能',
    description: '支持将报表数据导出为Excel',
    priority: 'low',
    status: 'in-progress',
    assignee: '王五',
    assigneeId: 'm3',
    dueDate: '2026-07-05',
    createdAt: now - 6 * day,
    statusChangedAt: now - 1 * day,
    comments: [],
  },
  {
    id: 't6',
    title: '用户反馈处理',
    description: '处理上周收集的用户反馈',
    priority: 'medium',
    status: 'done',
    assignee: '陈七',
    assigneeId: 'm5',
    dueDate: '2026-06-18',
    createdAt: now - 14 * day,
    statusChangedAt: now - 1 * day,
    comments: [],
  },
  {
    id: 't7',
    title: '性能优化',
    description: '优化页面加载速度优化首页渲染性能',
    priority: 'high',
    status: 'done',
    assignee: '李四',
    assigneeId: 'm2',
    dueDate: '2026-06-15',
    createdAt: now - 20 * day,
    statusChangedAt: now - 4 * day,
    comments: [],
  },
  {
    id: 't8',
    title: '安全漏洞修复',
    description: '修复安全扫描发现的漏洞',
    priority: 'high',
    status: 'done',
    assignee: '张三',
    assigneeId: 'm1',
    dueDate: '2026-06-10',
    createdAt: now - 21 * day,
    statusChangedAt: now - 6 * day,
    comments: [],
  },
];
