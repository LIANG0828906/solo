export interface Task {
  id: string;
  title: string;
  description: string;
  assignee: string;
  status: 'todo' | 'in-progress' | 'done';
  createdAt: string;
  comments: Comment[];
}

export interface Comment {
  id: string;
  username: string;
  content: string;
  createdAt: string;
  avatarColor: string;
}

export interface Board {
  id: string;
  name: string;
  description: string;
  tasks: Task[];
  onlineUsers: string[];
}

const MEMBERS = ['Alice', 'Bob', 'Charlie'];

const AVATAR_COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9'];

function randomColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)];
}

let boards: Board[] = [
  {
    id: 'board-1',
    name: '产品开发看板',
    description: '产品迭代开发任务管理',
    onlineUsers: [],
    tasks: [
      {
        id: 'task-1',
        title: '设计登录页面',
        description: '完成登录页面的UI设计，包含表单验证交互',
        assignee: 'Alice',
        status: 'todo',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        comments: [
          { id: 'c1', username: 'Bob', content: '记得加上忘记密码的入口', createdAt: new Date(Date.now() - 86400000).toISOString(), avatarColor: '#4ECDC4' },
          { id: 'c2', username: 'Alice', content: '好的，我已经加上去了', createdAt: new Date(Date.now() - 3600000).toISOString(), avatarColor: '#FF6B6B' },
        ],
      },
      {
        id: 'task-2',
        title: '实现用户认证API',
        description: 'JWT token认证，包含注册、登录、刷新接口',
        assignee: 'Bob',
        status: 'in-progress',
        createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
        comments: [
          { id: 'c3', username: 'Charlie', content: 'Token过期时间建议设为2小时', createdAt: new Date(Date.now() - 7200000).toISOString(), avatarColor: '#45B7D1' },
        ],
      },
      {
        id: 'task-3',
        title: '数据库Schema设计',
        description: '设计用户表、任务表、评论表的ER图',
        assignee: 'Charlie',
        status: 'done',
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
        comments: [],
      },
      {
        id: 'task-4',
        title: '搭建CI/CD流水线',
        description: '配置GitHub Actions自动化构建和部署',
        assignee: 'Bob',
        status: 'todo',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        comments: [],
      },
      {
        id: 'task-5',
        title: '编写单元测试',
        description: '核心模块的单元测试覆盖率需达到80%',
        assignee: 'Alice',
        status: 'in-progress',
        createdAt: new Date(Date.now() - 86400000 * 1.5).toISOString(),
        comments: [
          { id: 'c4', username: 'Alice', content: '认证模块的测试已经完成', createdAt: new Date(Date.now() - 1800000).toISOString(), avatarColor: '#FF6B6B' },
        ],
      },
    ],
  },
  {
    id: 'board-2',
    name: '市场运营看板',
    description: '市场推广和运营活动管理',
    onlineUsers: [],
    tasks: [
      {
        id: 'task-6',
        title: '撰写产品发布会文案',
        description: '准备下月发布会的宣传文案和海报素材',
        assignee: 'Alice',
        status: 'todo',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        comments: [],
      },
      {
        id: 'task-7',
        title: '社交媒体排期',
        description: '安排下周一整周的社交媒体内容发布',
        assignee: 'Charlie',
        status: 'in-progress',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        comments: [],
      },
    ],
  },
];

export function getAllBoards(): Board[] {
  return boards;
}

export function getBoardById(id: string): Board | undefined {
  return boards.find((b) => b.id === id);
}

export function createBoard(name: string, description: string): Board {
  const board: Board = {
    id: `board-${Date.now()}`,
    name,
    description,
    tasks: [],
    onlineUsers: [],
  };
  boards.push(board);
  return board;
}

export function createTask(boardId: string, title: string, description: string, assignee: string): Task | null {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  const task: Task = {
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    description,
    assignee,
    status: 'todo',
    createdAt: new Date().toISOString(),
    comments: [],
  };
  board.tasks.push(task);
  return task;
}

export function updateTaskStatus(boardId: string, taskId: string, status: Task['status']): Task | null {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  const task = board.tasks.find((t) => t.id === taskId);
  if (!task) return null;
  task.status = status;
  return task;
}

export function addComment(boardId: string, taskId: string, username: string, content: string): Comment | null {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  const task = board.tasks.find((t) => t.id === taskId);
  if (!task) return null;
  const comment: Comment = {
    id: `cmt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    username,
    content,
    createdAt: new Date().toISOString(),
    avatarColor: randomColor(),
  };
  task.comments.push(comment);
  return comment;
}

export function getTaskComments(boardId: string, taskId: string): Comment[] | null {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return null;
  const task = board.tasks.find((t) => t.id === taskId);
  if (!task) return null;
  return task.comments;
}

export function addOnlineUser(boardId: string, username: string): void {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return;
  if (!board.onlineUsers.includes(username)) {
    board.onlineUsers.push(username);
  }
}

export function removeOnlineUser(boardId: string, username: string): void {
  const board = boards.find((b) => b.id === boardId);
  if (!board) return;
  board.onlineUsers = board.onlineUsers.filter((u) => u !== username);
}

export function getOnlineUsers(boardId: string): string[] {
  const board = boards.find((b) => b.id === boardId);
  return board ? board.onlineUsers : [];
}

export { MEMBERS };
