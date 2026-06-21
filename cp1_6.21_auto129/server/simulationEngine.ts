import { v4 as uuidv4 } from 'uuid';

const CHINESE_WORDS = [
  '代码', '函数', '变量', '模块', '接口', '组件', '渲染', '状态', '属性', '事件',
  '异步', '回调', '框架', '路由', '中间件', '数据库', '缓存', '索引', '查询', '优化',
  '性能', '测试', '部署', '容器', '服务', '配置', '日志', '监控', '安全', '加密',
  '架构', '迭代', '重构', '调试', '编译', '运行', '发布', '集成', '交付', '维护',
  '前端', '后端', '全栈', '微服务', '负载均衡', '高可用', '容错', '扩容', '迁移', '回滚',
];

export interface SimUser {
  id: string;
  name: string;
  color: string;
  online: boolean;
}

export interface SimEditEvent {
  id: string;
  userId: string;
  type: 'insert' | 'delete';
  position: number;
  text: string;
  deletedText?: string;
  timestamp: string;
}

const CHINESE_NAMES = [
  '张编辑', '李校对', '王撰写', '刘审核',
  '陈设计', '赵开发', '周测试', '吴运维',
];

const USER_COLORS = ['#EF4444', '#3B82F6', '#22C55E', '#F59E0B'];

export class SimulationEngine {
  private users: Map<string, SimUser> = new Map();
  private editTimer: ReturnType<typeof setTimeout> | null = null;
  private content: string;
  private colorIndex: number = 0;
  private onEdit: (event: SimEditEvent) => void;
  private onCursorUpdate: (userId: string, position: number) => void;

  constructor(
    initialContent: string,
    onEdit: (event: SimEditEvent) => void,
    onCursorUpdate: (userId: string, position: number) => void,
  ) {
    this.content = initialContent;
    this.onEdit = onEdit;
    this.onCursorUpdate = onCursorUpdate;
  }

  addUser(): SimUser | null {
    const onlineCount = Array.from(this.users.values()).filter(u => u.online).length;
    if (onlineCount >= 4) return null;
    const id = uuidv4();
    const name = CHINESE_NAMES[this.colorIndex % CHINESE_NAMES.length];
    const color = USER_COLORS[this.colorIndex % USER_COLORS.length];
    const user: SimUser = { id, name, color, online: true };
    this.users.set(id, user);
    this.colorIndex++;
    return user;
  }

  removeUser(id: string): void {
    const user = this.users.get(id);
    if (user) {
      user.online = false;
    }
  }

  startSimulation(): void {
    if (this.editTimer) return;
    this.scheduleNext();
  }

  stopSimulation(): void {
    if (this.editTimer) {
      clearTimeout(this.editTimer);
      this.editTimer = null;
    }
  }

  isRunning(): boolean {
    return this.editTimer !== null;
  }

  private scheduleNext(): void {
    const delay = 300 + Math.random() * 500;
    this.editTimer = setTimeout(() => {
      this.performRandomEdit();
      this.scheduleNext();
    }, delay);
  }

  performSingleEdit(): void {
    this.performRandomEdit();
  }

  private performRandomEdit(): void {
    const onlineUsers = Array.from(this.users.values()).filter(u => u.online);
    if (onlineUsers.length === 0) return;

    const user = onlineUsers[Math.floor(Math.random() * onlineUsers.length)];
    const isInsert = Math.random() > 0.3;

    if (isInsert) {
      const text = this.generateRandomText();
      const maxPos = Math.max(1, this.content.length);
      const position = Math.floor(Math.random() * maxPos);
      this.content =
        this.content.slice(0, position) + text + this.content.slice(position);

      const event: SimEditEvent = {
        id: uuidv4(),
        userId: user.id,
        type: 'insert',
        position,
        text,
        timestamp: new Date().toISOString(),
      };
      this.onEdit(event);
      this.onCursorUpdate(user.id, position + text.length);
    } else {
      const deleteLength = 5 + Math.floor(Math.random() * 11);
      const maxPos = Math.max(1, this.content.length - deleteLength);
      if (maxPos <= 0) return;
      const position = Math.floor(Math.random() * maxPos);
      const deletedText = this.content.slice(position, position + deleteLength);
      this.content =
        this.content.slice(0, position) + this.content.slice(position + deleteLength);

      const event: SimEditEvent = {
        id: uuidv4(),
        userId: user.id,
        type: 'delete',
        position,
        text: deletedText,
        deletedText,
        timestamp: new Date().toISOString(),
      };
      this.onEdit(event);
      this.onCursorUpdate(user.id, position);
    }
  }

  private generateRandomText(): string {
    const length = 2 + Math.floor(Math.random() * 5);
    let text = '';
    for (let i = 0; i < length; i++) {
      text += CHINESE_WORDS[Math.floor(Math.random() * CHINESE_WORDS.length)];
    }
    return text;
  }

  getContent(): string {
    return this.content;
  }

  getUsers(): SimUser[] {
    return Array.from(this.users.values());
  }
}
