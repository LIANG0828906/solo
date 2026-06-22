export interface User {
  id: string;
  name: string;
  avatarColor: string;
  cursorLine: number;
}

export interface Reply {
  id: string;
  annotationId: string;
  authorId: string;
  content: string;
  createdAt: Date;
}

export interface Annotation {
  id: string;
  documentLine: number;
  selectedText: string;
  authorId: string;
  content: string;
  createdAt: Date;
  isResolved: boolean;
  replies: Reply[];
}

export type EventType =
  | 'annotation:created'
  | 'annotation:updated'
  | 'annotation:reply'
  | 'cursor:moved'
  | 'sidebar:scrollTo';

export type EventCallback = (payload: unknown) => void;

const genId = (): string =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

const MOCK_USERS: User[] = [
  { id: 'u1', name: '林青', avatarColor: '#7EB8D8', cursorLine: 12 },
  { id: 'u2', name: '陈墨', avatarColor: '#F4A6A6', cursorLine: 24 },
  { id: 'u3', name: '苏然', avatarColor: '#A8D8B9', cursorLine: 45 },
  { id: 'u4', name: '周子衡', avatarColor: '#D8B4E2', cursorLine: 68 },
];

const SAMPLE_DOCUMENT = `# 产品需求文档 v2.3

## 一、项目背景

随着团队规模扩大，文档协作效率成为瓶颈。传统的邮件往返和会议沟通方式
已经无法满足快速迭代的需求，我们需要一款轻量级的协作文档批注工具，
让团队成员能够在同一份文档上快速交换意见、追踪讨论进展，并在问题
解决后及时归档。

## 二、核心功能设计

### 2.1 文档渲染

文档支持 Markdown 和纯文本两种输入格式。上传后系统将自动解析并渲染
为带行号的可读视图。行号是批注系统的锚点，每一行都有稳定的唯一标识，
即使上方内容插入或删除，批注也能够通过文本指纹进行智能匹配和重定位。

渲染引擎采用行级虚拟化，当文档超过 500 行时，仅渲染视口内可见内容
及其前后缓冲区（各 50 行），确保在处理长篇技术文档时依然保持
60fps 的流畅滚动体验。

### 2.2 批注机制

用户可以选中任意一段文本后触发批注创建流程。选中区域会以雾霾蓝半
透明高亮显示，同时在上方弹出批注输入气泡。支持 @提及其他团队成员，
被提及的用户将在侧边栏收到通知提示。

批注支持回复线程，每条批注下可以有多条回复形成讨论串。讨论未结束
时批注处于"打开"状态，左侧行旁会显示蓝色竖条标记；解决后竖条变
为绿色并可折叠，减少视觉干扰。

### 2.3 实时协作模拟

为了演示多人协作效果，系统内置了四位虚拟团队成员。他们会在页面加载
后的 3-8 秒区间内随机移动光标位置，并对新创建的批注以 40% 的概率
在 1-2 秒后自动回复一条建议性内容。每位用户的光标使用不同颜色标识，
包含头像色块和姓名标签，轻微浮动动画避免视觉僵硬。

### 2.4 侧边栏管理

侧边栏按"全部 / 未解决 / 已解决 / 我参与的"四个维度提供快速筛选。
同时支持章节筛选，自动提取文档中所有标题（## 开头的行）并生成下
拉菜单。底部全局搜索支持按批注内容、作者姓名、回文内容进行全文匹
配，匹配关键词以黄色高亮显示。

点击侧边栏中的任意批注，文档区域会平滑滚动至对应行并高亮 3 秒，
高亮动画使用 transform 和 opacity 的 GPU 合成层实现，不触发重排。

## 三、非功能性需求

性能方面，文档达到 5000 汉字（约 80KB）、批注数量 50 条、回复总
数 200 条时，滚动帧率不得低于 55fps。首屏加载时间在 3G 网络环境
下控制在 2.5 秒以内。

可访问性方面，所有交互元素均需支持键盘 Tab 聚焦和 Enter 触发，
颜色对比度满足 WCAG 2.1 AA 级标准（至少 4.5:1）。

## 四、迭代计划

Week 1: 文档渲染引擎 + 批注 CRUD
Week 2: 侧边栏筛选搜索 + 高亮跳转
Week 3: 实时协作模拟 + 光标系统
Week 4: 性能优化 + 可访问性加固 + 测试

## 五、风险与应对

风险一：文本指纹匹配在大段编辑时失效。
应对：优先使用行号匹配，辅以 Levenshtein 距离小于阈值的二级匹配。

风险二：侧边栏大量 DOM 导致滚动卡顿。
应对：批注列表超过 30 条时自动启用行级虚拟滚动。

风险三：颜色方案在部分显示器上表现不清晰。
应对：提供高对比度模式切换开关，默认模式经过色盲模拟器验证。

---

文档结束。请在上方任意文本处按住鼠标左键拖选，即可创建批注。
体验侧边栏的筛选功能时，注意观察文档区域的高亮联动效果。`;

const INITIAL_ANNOTATIONS: Annotation[] = [
  {
    id: 'a1',
    documentLine: 5,
    selectedText: '文档协作效率成为瓶颈',
    authorId: 'u2',
    content: '建议补充调研数据：当前平均一份 PRD 的平均评论轮次和周转周期是多少？',
    createdAt: new Date(Date.now() - 86400000 * 2),
    isResolved: false,
    replies: [
      {
        id: 'r1',
        annotationId: 'a1',
        authorId: 'u1',
        content: '好建议，下周一产品侧提供近三个月的数据汇总。',
        createdAt: new Date(Date.now() - 86400000),
      },
    ],
  },
  {
    id: 'a2',
    documentLine: 14,
    selectedText: '行级虚拟化',
    authorId: 'u3',
    content: '建议引用 react-window 或自研？自研需要额外 3 天工期。',
    createdAt: new Date(Date.now() - 3600000 * 5),
    isResolved: true,
    replies: [
      {
        id: 'r2',
        annotationId: 'a2',
        authorId: 'u4',
        content: '保持无第三方依赖的话可以先实现简化版，文档超 500 行时降级。',
        createdAt: new Date(Date.now() - 3600000 * 4),
      },
      {
        id: 'r3',
        annotationId: 'a2',
        authorId: 'u1',
        content: '按简化版走，已在实现要点中备注。',
        createdAt: new Date(Date.now() - 3600000 * 3),
      },
    ],
  },
  {
    id: 'a3',
    documentLine: 24,
    selectedText: '雾霾蓝半透明高亮',
    authorId: 'u1',
    content: '高亮透明度建议设为 0.18，实测比 0.25 在白底上更柔和。',
    createdAt: new Date(Date.now() - 3600000 * 2),
    isResolved: false,
    replies: [],
  },
  {
    id: 'a4',
    documentLine: 33,
    selectedText: '40% 的概率',
    authorId: 'u4',
    content: '概率偏高，演示环境 25% 就足够密集了。',
    createdAt: new Date(Date.now() - 1800000),
    isResolved: false,
    replies: [],
  },
];

class AnnotationStore {
  private users: User[] = MOCK_USERS.map(u => ({ ...u }));
  private annotations: Annotation[] = INITIAL_ANNOTATIONS.map(a => ({
    ...a,
    replies: a.replies.map(r => ({ ...r })),
  }));
  private listeners: Map<EventType, Set<EventCallback>> = new Map();
  private _cursorTimer: ReturnType<typeof setInterval> | null = null;
  private currentUserId: string = 'u1';

  constructor() {
    this.startCursorSimulation();
    this.on('annotation:created', this.handleAutoReply.bind(this));
  }

  getCurrentUser(): User {
    return this.users.find(u => u.id === this.currentUserId)!;
  }

  getUsers(): User[] {
    return this.users;
  }

  getDocument(): string {
    return SAMPLE_DOCUMENT;
  }

  getAnnotations(): Annotation[] {
    return this.annotations;
  }

  getAnnotationsByLine(line: number): Annotation[] {
    return this.annotations.filter(a => a.documentLine === line);
  }

  addAnnotation(
    documentLine: number,
    selectedText: string,
    content: string,
  ): Annotation {
    const annotation: Annotation = {
      id: genId(),
      documentLine,
      selectedText,
      authorId: this.currentUserId,
      content,
      createdAt: new Date(),
      isResolved: false,
      replies: [],
    };
    this.annotations.push(annotation);
    this.emit('annotation:created', annotation);
    this.emit('annotation:updated', this.annotations.slice());
    return annotation;
  }

  addReply(annotationId: string, content: string, authorId?: string): Reply | null {
    const ann = this.annotations.find(a => a.id === annotationId);
    if (!ann) return null;
    const reply: Reply = {
      id: genId(),
      annotationId,
      authorId: authorId ?? this.currentUserId,
      content,
      createdAt: new Date(),
    };
    ann.replies.push(reply);
    this.emit('annotation:reply', reply);
    this.emit('annotation:updated', this.annotations.slice());
    return reply;
  }

  toggleResolved(annotationId: string): void {
    const ann = this.annotations.find(a => a.id === annotationId);
    if (!ann) return;
    ann.isResolved = !ann.isResolved;
    this.emit('annotation:updated', this.annotations.slice());
  }

  scrollToLine(line: number, annotationId: string): void {
    this.emit('sidebar:scrollTo', { line, annotationId });
  }

  on(event: EventType, cb: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(cb);
    return () => this.listeners.get(event)!.delete(cb);
  }

  private emit(event: EventType, payload: unknown): void {
    const set = this.listeners.get(event);
    if (!set) return;
    set.forEach(cb => {
      try {
        cb(payload);
      } catch (e) {
        console.error('listener error:', e);
      }
    });
  }

  private startCursorSimulation(): void {
    const tick = () => {
      const docLines = SAMPLE_DOCUMENT.split('\n').length;
      this.users.forEach(u => {
        if (u.id === this.currentUserId) return;
        const delta = Math.floor(Math.random() * 7) - 3;
        u.cursorLine = Math.max(1, Math.min(docLines, u.cursorLine + delta));
      });
      this.emit('cursor:moved', this.users.slice());
    };
    this._cursorTimer = setInterval(tick, 3500);
  }

  private handleAutoReply(payload: unknown): void {
    const ann = payload as Annotation;
    if (Math.random() > 0.3) return;
    const others = this.users.filter(u => u.id !== this.currentUserId);
    const replier = others[Math.floor(Math.random() * others.length)];
    const replies = [
      '收到，我稍后看一下这段。',
      '这个点提得好，建议同步到实现清单里。',
      '可以，先按这个方向推进。',
      '补充：注意性能测试的用例覆盖。',
      '我有个不同想法，下午同步一下？',
    ];
    const text = replies[Math.floor(Math.random() * replies.length)];
    const delay = 1000 + Math.random() * 1500;
    setTimeout(() => {
      this.addReply(ann.id, text, replier.id);
    }, delay);
  }
}

export const store = new AnnotationStore();
