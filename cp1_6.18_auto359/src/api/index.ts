import { v4 as uuidv4 } from 'uuid';
import type { User, Board, Task, Comment, RetroReport, TaskStatus, RetroPeriod, EmotionType } from '@/types';
import { generateGradientFromId } from '@/utils/colors';
import { getDateRange, isDateInRange } from '@/utils/date';
import { generateWordCloud } from '@/utils/wordCloud';

const STORAGE_KEYS = {
  USERS: 'agileflow_users',
  BOARDS: 'agileflow_boards',
  TASKS: 'agileflow_tasks',
  COMMENTS: 'agileflow_comments',
  CURRENT_USER: 'agileflow_current_user',
  PASSWORDS: 'agileflow_passwords',
};

const delay = <T>(data: T, ms: number = 100): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export const api = {
  async login(username: string, password: string): Promise<User> {
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const passwords = getFromStorage<Record<string, string>>(STORAGE_KEYS.PASSWORDS, {});
    
    const user = users.find((u) => u.username === username);
    if (!user) throw new Error('用户不存在');
    
    if (passwords[user.id] !== password) throw new Error('密码错误');
    
    setToStorage(STORAGE_KEYS.CURRENT_USER, user);
    return delay(user);
  },

  async register(username: string, password: string, nickname: string): Promise<User> {
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const passwords = getFromStorage<Record<string, string>>(STORAGE_KEYS.PASSWORDS, {});
    
    if (users.some((u) => u.username === username)) {
      throw new Error('用户名已存在');
    }
    
    const id = uuidv4();
    const user: User = {
      id,
      username,
      nickname,
      avatarGradient: generateGradientFromId(id),
      createdAt: new Date().toISOString(),
    };
    
    users.push(user);
    passwords[id] = password;
    
    setToStorage(STORAGE_KEYS.USERS, users);
    setToStorage(STORAGE_KEYS.PASSWORDS, passwords);
    setToStorage(STORAGE_KEYS.CURRENT_USER, user);
    
    return delay(user);
  },

  async getCurrentUser(): Promise<User | null> {
    const user = getFromStorage<User | null>(STORAGE_KEYS.CURRENT_USER, null);
    return delay(user);
  },

  async logout(): Promise<void> {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    return delay(undefined);
  },

  async getUser(id: string): Promise<User | null> {
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const user = users.find((u) => u.id === id) || null;
    return delay(user);
  },

  async getBoards(userId: string): Promise<Board[]> {
    const boards = getFromStorage<Board[]>(STORAGE_KEYS.BOARDS, []);
    const userBoards = boards.filter(
      (b) => b.ownerId === userId || b.memberIds.includes(userId)
    );
    return delay(userBoards);
  },

  async getBoard(id: string): Promise<Board | null> {
    const boards = getFromStorage<Board[]>(STORAGE_KEYS.BOARDS, []);
    const board = boards.find((b) => b.id === id) || null;
    return delay(board);
  },

  async createBoard(board: Omit<Board, 'id' | 'createdAt'>): Promise<Board> {
    const boards = getFromStorage<Board[]>(STORAGE_KEYS.BOARDS, []);
    const newBoard: Board = {
      ...board,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    boards.push(newBoard);
    setToStorage(STORAGE_KEYS.BOARDS, boards);
    return delay(newBoard);
  },

  async updateBoard(id: string, updates: Partial<Board>): Promise<Board> {
    const boards = getFromStorage<Board[]>(STORAGE_KEYS.BOARDS, []);
    const index = boards.findIndex((b) => b.id === id);
    if (index === -1) throw new Error('看板不存在');
    
    boards[index] = { ...boards[index], ...updates };
    setToStorage(STORAGE_KEYS.BOARDS, boards);
    return delay(boards[index]);
  },

  async deleteBoard(id: string): Promise<void> {
    const boards = getFromStorage<Board[]>(STORAGE_KEYS.BOARDS, []);
    const filtered = boards.filter((b) => b.id !== id);
    setToStorage(STORAGE_KEYS.BOARDS, filtered);
    
    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const filteredTasks = tasks.filter((t) => t.boardId !== id);
    setToStorage(STORAGE_KEYS.TASKS, filteredTasks);
    
    return delay(undefined);
  },

  async getTasks(boardId: string): Promise<Task[]> {
    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const boardTasks = tasks.filter((t) => t.boardId === boardId);
    return delay(boardTasks);
  },

  async createTask(task: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Promise<Task> {
    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const now = new Date().toISOString();
    const newTask: Task = {
      ...task,
      id: uuidv4(),
      createdAt: now,
      updatedAt: now,
    };
    tasks.push(newTask);
    setToStorage(STORAGE_KEYS.TASKS, tasks);
    return delay(newTask);
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const index = tasks.findIndex((t) => t.id === id);
    if (index === -1) throw new Error('任务不存在');
    
    tasks[index] = { 
      ...tasks[index], 
      ...updates, 
      updatedAt: new Date().toISOString() 
    };
    setToStorage(STORAGE_KEYS.TASKS, tasks);
    return delay(tasks[index]);
  },

  async deleteTask(id: string): Promise<void> {
    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const filtered = tasks.filter((t) => t.id !== id);
    setToStorage(STORAGE_KEYS.TASKS, filtered);
    
    const comments = getFromStorage<Comment[]>(STORAGE_KEYS.COMMENTS, []);
    const filteredComments = comments.filter((c) => c.taskId !== id);
    setToStorage(STORAGE_KEYS.COMMENTS, filteredComments);
    
    return delay(undefined);
  },

  async moveTask(taskId: string, newStatus: TaskStatus, newIndex: number): Promise<void> {
    const tasks = getFromStorage<Task[]>(STORAGE_KEYS.TASKS, []);
    const taskIndex = tasks.findIndex((t) => t.id === taskId);
    if (taskIndex === -1) throw new Error('任务不存在');
    
    const task = tasks[taskIndex];
    const boardId = task.boardId;
    
    tasks[taskIndex] = {
      ...task,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };
    
    const boardTasks = tasks.filter((t) => t.boardId === boardId);
    const sameStatusTasks = boardTasks
      .filter((t) => t.status === newStatus && t.id !== taskId)
      .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime());
    
    sameStatusTasks.splice(newIndex, 0, tasks[taskIndex]);
    
    setToStorage(STORAGE_KEYS.TASKS, tasks);
    return delay(undefined);
  },

  async updateTaskEmotion(taskId: string, emotion: EmotionType): Promise<Task> {
    return this.updateTask(taskId, { emotion });
  },

  async getComments(taskId: string): Promise<Comment[]> {
    const comments = getFromStorage<Comment[]>(STORAGE_KEYS.COMMENTS, []);
    const taskComments = comments
      .filter((c) => c.taskId === taskId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    return delay(taskComments);
  },

  async createComment(comment: Omit<Comment, 'id' | 'createdAt'>): Promise<Comment> {
    const comments = getFromStorage<Comment[]>(STORAGE_KEYS.COMMENTS, []);
    const newComment: Comment = {
      ...comment,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    comments.push(newComment);
    setToStorage(STORAGE_KEYS.COMMENTS, comments);
    return delay(newComment);
  },

  async deleteComment(id: string): Promise<void> {
    const comments = getFromStorage<Comment[]>(STORAGE_KEYS.COMMENTS, []);
    const filtered = comments.filter((c) => c.id !== id);
    setToStorage(STORAGE_KEYS.COMMENTS, filtered);
    return delay(undefined);
  },

  async generateReport(boardId: string, period: RetroPeriod): Promise<RetroReport> {
    const { start, end } = getDateRange(period);
    
    const tasks = await this.getTasks(boardId);
    const comments = getFromStorage<Comment[]>(STORAGE_KEYS.COMMENTS, []);
    
    const periodTasks = tasks.filter((t) => isDateInRange(t.updatedAt, start, end));
    const periodTaskIds = periodTasks.map((t) => t.id);
    const periodComments = comments.filter((c) => 
      periodTaskIds.includes(c.taskId) && isDateInRange(c.createdAt, start, end)
    );
    
    const totalTasks = periodTasks.length;
    const completedTasks = periodTasks.filter((t) => t.status === 'done').length;
    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    
    const emotionStats: Record<string, number> = {
      happy: 0,
      sad: 0,
      angry: 0,
      proud: 0,
      tired: 0,
    };
    
    periodTasks.forEach((t) => {
      if (t.emotion) {
        emotionStats[t.emotion] = (emotionStats[t.emotion] || 0) + 1;
      }
    });
    
    const commentTexts = periodComments.map((c) => c.content);
    const wordCloud = generateWordCloud(commentTexts, 30);
    
    const report: RetroReport = {
      period,
      startDate: start.toISOString(),
      endDate: end.toISOString(),
      completionRate,
      totalTasks,
      completedTasks,
      emotionStats,
      wordCloud,
    };
    
    return delay(report, 300);
  },

  async exportReportToHtml(report: RetroReport, boardName: string): Promise<string> {
    const emotionLabels: Record<string, string> = {
      happy: '😊 快乐',
      sad: '😢 悲伤',
      angry: '😠 愤怒',
      proud: '💪 自豪',
      tired: '😧 疲惫',
    };
    
    const emotionEntries = Object.entries(report.emotionStats)
      .filter(([, count]) => count > 0)
      .map(([key, count]) => `<div class="emotion-item"><span class="emotion-label">${emotionLabels[key]}</span><span class="emotion-count">${count}</span></div>`)
      .join('');
    
    const wordCloudHtml = report.wordCloud
      .map((item, index) => {
        const size = 12 + (item.count / Math.max(1, report.wordCloud[0]?.count || 1)) * 24;
        const colors = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C', '#E67E22'];
        const color = colors[index % colors.length];
        return `<span style="font-size: ${size}px; color: ${color}; margin: 4px 8px; display: inline-block;">${item.word}</span>`;
      })
      .join('');
    
    const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${boardName} - 项目回顾报告</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; padding: 40px; color: #2C3E50; }
    .container { max-width: 900px; margin: 0 auto; background: rgba(255,255,255,0.95); backdrop-filter: blur(16px); border-radius: 16px; padding: 40px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); }
    h1 { font-size: 32px; font-weight: 700; margin-bottom: 8px; color: #2C3E50; }
    .subtitle { color: #7F8C8D; margin-bottom: 32px; font-size: 16px; }
    .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin-bottom: 32px; }
    .stat-card { background: #F0F4F8; border-radius: 12px; padding: 20px; text-align: center; }
    .stat-value { font-size: 36px; font-weight: 700; color: #E74C3C; }
    .stat-label { font-size: 14px; color: #7F8C8D; margin-top: 4px; }
    .section { margin-bottom: 32px; }
    .section-title { font-size: 20px; font-weight: 700; margin-bottom: 16px; color: #2C3E50; display: flex; align-items: center; gap: 8px; }
    .section-title::before { content: ''; width: 4px; height: 24px; background: #E74C3C; border-radius: 2px; }
    .completion-bar { height: 24px; background: #E1E8ED; border-radius: 12px; overflow: hidden; margin-top: 12px; }
    .completion-fill { height: 100%; background: linear-gradient(90deg, #66BB6A, #2ECC71); border-radius: 12px; transition: width 1s ease; display: flex; align-items: center; justify-content: center; color: white; font-weight: 700; font-size: 12px; }
    .emotion-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 12px; }
    .emotion-item { background: #F0F4F8; border-radius: 8px; padding: 12px 16px; display: flex; justify-content: space-between; align-items: center; }
    .emotion-label { font-size: 16px; }
    .emotion-count { font-size: 20px; font-weight: 700; color: #E74C3C; }
    .word-cloud { background: #F0F4F8; border-radius: 12px; padding: 24px; text-align: center; line-height: 2; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #E1E8ED; text-align: center; color: #7F8C8D; font-size: 14px; }
  </style>
</head>
<body>
  <div class="container">
    <h1>${boardName}</h1>
    <p class="subtitle">项目回顾报告 · ${new Date(report.startDate).toLocaleDateString('zh-CN')} - ${new Date(report.endDate).toLocaleDateString('zh-CN')}</p>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-value">${report.totalTasks}</div>
        <div class="stat-label">总任务数</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.completedTasks}</div>
        <div class="stat-label">已完成任务</div>
      </div>
      <div class="stat-card">
        <div class="stat-value">${report.completionRate}%</div>
        <div class="stat-label">完成率</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">任务完成率</div>
      <div class="completion-bar">
        <div class="completion-fill" style="width: ${report.completionRate}%">${report.completionRate}%</div>
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">情感分布</div>
      <div class="emotion-grid">
        ${emotionEntries}
      </div>
    </div>
    
    <div class="section">
      <div class="section-title">高频词云</div>
      <div class="word-cloud">
        ${wordCloudHtml || '<span style="color: #999;">暂无评论数据</span>'}
      </div>
    </div>
    
    <div class="footer">
      由 AgileFlow 生成 · ${new Date().toLocaleString('zh-CN')}
    </div>
  </div>
</body>
</html>`;
    
    return delay(html);
  },
};
