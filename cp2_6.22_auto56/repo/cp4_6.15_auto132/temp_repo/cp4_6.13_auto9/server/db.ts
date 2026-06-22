import type { User, Board, SwimLane, Task, Comment, ActivityLog, Attachment } from './models';

const users = new Map<string, User>();
const boards = new Map<string, Board>();
const swimLanes = new Map<string, SwimLane>();
const tasks = new Map<string, Task>();
const comments = new Map<string, Comment>();
const activityLogs = new Map<string, ActivityLog>();
const attachments = new Map<string, Attachment>();

const teamId = 'team-001';

const mockUsers: User[] = [
  { id: 'user-001', username: '张小明', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix', role: 'admin', teamId },
  { id: 'user-002', username: '李小红', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka', role: 'member', teamId },
  { id: 'user-003', username: '王小强', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Milo', role: 'member', teamId },
  { id: 'user-004', username: '赵小美', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Luna', role: 'member', teamId },
];

const mockBoards: Board[] = [
  { id: 'board-001', name: '产品研发 V2.0', teamId, swimLanes: [] },
  { id: 'board-002', name: '营销活动策划', teamId, swimLanes: [] },
];

const mockSwimLanes: SwimLane[] = [
  { id: 'lane-001', name: '待办', boardId: 'board-001', order: 0 },
  { id: 'lane-002', name: '进行中', boardId: 'board-001', order: 1 },
  { id: 'lane-003', name: '评审', boardId: 'board-001', order: 2 },
  { id: 'lane-004', name: '已完成', boardId: 'board-001', order: 3 },
  { id: 'lane-005', name: '待启动', boardId: 'board-002', order: 0 },
  { id: 'lane-006', name: '执行中', boardId: 'board-002', order: 1 },
  { id: 'lane-007', name: '已结束', boardId: 'board-002', order: 2 },
];

const mockTasks: Task[] = [
  { id: 'task-001', title: '用户登录模块开发', description: '实现用户登录、注册、密码找回功能', priority: 'high', assigneeId: 'user-002', dueDate: '2026-06-20', swimLaneId: 'lane-002', boardId: 'board-001', createdAt: '2026-06-01T10:00:00Z' },
  { id: 'task-002', title: '首页UI设计稿', description: '完成首页视觉设计，包含banner、功能模块、底部', priority: 'medium', assigneeId: 'user-004', dueDate: '2026-06-18', swimLaneId: 'lane-003', boardId: 'board-001', createdAt: '2026-06-02T09:00:00Z' },
  { id: 'task-003', title: '数据库表结构设计', description: '设计用户、订单、商品等核心表结构', priority: 'high', assigneeId: 'user-003', dueDate: '2026-06-15', swimLaneId: 'lane-004', boardId: 'board-001', createdAt: '2026-05-28T14:00:00Z' },
  { id: 'task-004', title: 'API接口文档编写', description: '编写RESTful API文档，使用Swagger规范', priority: 'low', assigneeId: 'user-002', dueDate: '2026-06-25', swimLaneId: 'lane-001', boardId: 'board-001', createdAt: '2026-06-05T11:00:00Z' },
  { id: 'task-005', title: '性能优化', description: '优化首页加载速度，目标首屏时间<1.5s', priority: 'medium', assigneeId: 'user-003', dueDate: '2026-06-22', swimLaneId: 'lane-001', boardId: 'board-001', createdAt: '2026-06-06T08:00:00Z' },
  { id: 'task-006', title: '618促销活动方案', description: '策划618年中大促活动方案', priority: 'high', assigneeId: 'user-001', dueDate: '2026-06-10', swimLaneId: 'lane-006', boardId: 'board-002', createdAt: '2026-06-01T10:00:00Z' },
  { id: 'task-007', title: '社交媒体推广', description: '在微博、微信、抖音进行活动推广', priority: 'medium', assigneeId: 'user-004', dueDate: '2026-06-15', swimLaneId: 'lane-005', boardId: 'board-002', createdAt: '2026-06-03T09:00:00Z' },
];

const mockComments: Comment[] = [
  { id: 'comment-001', taskId: 'task-001', userId: 'user-001', content: '这个任务进度怎么样了？', createdAt: '2026-06-10T10:00:00Z' },
  { id: 'comment-002', taskId: 'task-001', userId: 'user-002', content: '已完成80%，预计本周可以提测', createdAt: '2026-06-10T11:30:00Z' },
  { id: 'comment-003', taskId: 'task-002', userId: 'user-003', content: '设计稿很赞，期待最终效果', createdAt: '2026-06-08T14:00:00Z' },
];

const mockActivityLogs: ActivityLog[] = [
  { id: 'log-001', taskId: 'task-001', userId: 'user-002', action: '创建任务', details: '创建了任务「用户登录模块开发」', createdAt: '2026-06-01T10:00:00Z' },
  { id: 'log-002', taskId: 'task-001', userId: 'user-001', action: '更新优先级', details: '将优先级从「中」改为「高」', createdAt: '2026-06-03T09:00:00Z' },
  { id: 'log-003', taskId: 'task-001', userId: 'user-002', action: '移动泳道', details: '从「待办」移动到「进行中」', createdAt: '2026-06-05T14:00:00Z' },
  { id: 'log-004', taskId: 'task-003', userId: 'user-003', action: '完成任务', details: '任务已完成，移动到「已完成」', createdAt: '2026-06-12T16:00:00Z' },
];

const mockAttachments: Attachment[] = [
  { id: 'attach-001', taskId: 'task-002', name: '设计稿v1.fig', url: '#', createdAt: '2026-06-07T10:00:00Z' },
  { id: 'attach-002', taskId: 'task-002', name: '切图资源.zip', url: '#', createdAt: '2026-06-09T14:00:00Z' },
];

function initMockData() {
  mockUsers.forEach(u => users.set(u.id, u));
  mockBoards.forEach(b => boards.set(b.id, b));
  mockSwimLanes.forEach(s => swimLanes.set(s.id, s));
  mockTasks.forEach(t => tasks.set(t.id, t));
  mockComments.forEach(c => comments.set(c.id, c));
  mockActivityLogs.forEach(l => activityLogs.set(l.id, l));
  mockAttachments.forEach(a => attachments.set(a.id, a));
}

initMockData();

export const db = {
  getUsers: async (): Promise<User[]> => Array.from(users.values()),
  getUserById: async (id: string): Promise<User | undefined> => users.get(id),
  getUserByUsername: async (username: string): Promise<User | undefined> => {
    return Array.from(users.values()).find(u => u.username === username);
  },
  getUsersByTeam: async (teamId: string): Promise<User[]> => {
    return Array.from(users.values()).filter(u => u.teamId === teamId);
  },
  addUser: async (user: User): Promise<User> => {
    users.set(user.id, user);
    return user;
  },
  removeUser: async (id: string): Promise<boolean> => users.delete(id),

  getBoards: async (): Promise<Board[]> => Array.from(boards.values()),
  getBoardsByTeam: async (teamId: string): Promise<Board[]> => {
    return Array.from(boards.values()).filter(b => b.teamId === teamId);
  },
  getBoardById: async (id: string): Promise<Board | undefined> => boards.get(id),
  addBoard: async (board: Board): Promise<Board> => {
    boards.set(board.id, board);
    return board;
  },
  updateBoard: async (id: string, data: Partial<Board>): Promise<Board | undefined> => {
    const board = boards.get(id);
    if (!board) return undefined;
    const updated = { ...board, ...data };
    boards.set(id, updated);
    return updated;
  },
  deleteBoard: async (id: string): Promise<boolean> => boards.delete(id),

  getSwimLanesByBoard: async (boardId: string): Promise<SwimLane[]> => {
    return Array.from(swimLanes.values())
      .filter(s => s.boardId === boardId)
      .sort((a, b) => a.order - b.order);
  },
  addSwimLane: async (lane: SwimLane): Promise<SwimLane> => {
    swimLanes.set(lane.id, lane);
    return lane;
  },
  updateSwimLane: async (id: string, data: Partial<SwimLane>): Promise<SwimLane | undefined> => {
    const lane = swimLanes.get(id);
    if (!lane) return undefined;
    const updated = { ...lane, ...data };
    swimLanes.set(id, updated);
    return updated;
  },
  deleteSwimLane: async (id: string): Promise<boolean> => swimLanes.delete(id),

  getTasksByBoard: async (boardId: string): Promise<Task[]> => {
    return Array.from(tasks.values()).filter(t => t.boardId === boardId);
  },
  getTasksBySwimLane: async (swimLaneId: string): Promise<Task[]> => {
    return Array.from(tasks.values()).filter(t => t.swimLaneId === swimLaneId);
  },
  getTaskById: async (id: string): Promise<Task | undefined> => tasks.get(id),
  addTask: async (task: Task): Promise<Task> => {
    tasks.set(task.id, task);
    return task;
  },
  updateTask: async (id: string, data: Partial<Task>): Promise<Task | undefined> => {
    const task = tasks.get(id);
    if (!task) return undefined;
    const updated = { ...task, ...data };
    tasks.set(id, updated);
    return updated;
  },
  deleteTask: async (id: string): Promise<boolean> => tasks.delete(id),

  getCommentsByTask: async (taskId: string): Promise<Comment[]> => {
    return Array.from(comments.values())
      .filter(c => c.taskId === taskId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  addComment: async (comment: Comment): Promise<Comment> => {
    comments.set(comment.id, comment);
    return comment;
  },

  getActivityLogsByTask: async (taskId: string): Promise<ActivityLog[]> => {
    return Array.from(activityLogs.values())
      .filter(l => l.taskId === taskId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },
  addActivityLog: async (log: ActivityLog): Promise<ActivityLog> => {
    activityLogs.set(log.id, log);
    return log;
  },

  getAttachmentsByTask: async (taskId: string): Promise<Attachment[]> => {
    return Array.from(attachments.values()).filter(a => a.taskId === taskId);
  },
  addAttachment: async (attachment: Attachment): Promise<Attachment> => {
    attachments.set(attachment.id, attachment);
    return attachment;
  },
};
