# 会议反馈系统 技术架构文档

## 1. 技术选型

| 类别 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| 框架 | React | ^18.2.0 | 组件化开发，生态丰富 |
| 语言 | TypeScript | ^5.0.0 | 类型安全，提升可维护性 |
| 构建工具 | Vite | ^5.0.0 | 快速冷启动，热更新 |
| 状态管理 | Zustand | ^4.4.0 | 轻量、简洁、支持持久化 |
| 图表库 | Recharts | ^2.10.0 | React 原生，API 简洁 |
| ID 生成 | uuid | ^9.0.0 | 生成唯一 ID |
| 路由 | React Router | ^6.20.0 | （按需引入，或使用简单状态路由） |

## 2. 目录结构

```
src/
├── App.tsx                          # 主应用组件，路由/布局/状态
├── main.tsx                         # 应用入口
├── index.css                        # 全局样式
├── types/
│   └── index.ts                     # 类型定义
├── modules/
│   ├── feedback/
│   │   ├── components/
│   │   │   ├── FeedbackForm.tsx     # 反馈表单
│   │   │   └── FeedbackCard.tsx     # 反馈卡片
│   │   └── store/
│   │       └── feedbackStore.ts     # Zustand store
│   ├── analytics/
│   │   ├── components/
│   │   │   └── MeetingDashboard.tsx # 仪表盘
│   │   └── utils/
│   │       └── wordCloud.ts         # 词频统计
│   └── meetings/
│       └── components/
│           └── MeetingList.tsx      # 会议列表
└── shared/
    └── components/
        └── Navbar.tsx               # 导航栏
```

## 3. 核心数据模型

### 3.1 Meeting（会议）
```typescript
interface Meeting {
  id: string;
  title: string;
  createdAt: string; // ISO date
  createdBy: string;
  participantCount: number;
}
```

### 3.2 Feedback（反馈）
```typescript
interface Feedback {
  id: string;
  meetingId: string;
  name: string;
  role: 'host' | 'participant' | 'observer';
  rating: 1 | 2 | 3 | 4 | 5;
  keyTakeaways: string;
  improvements: string;
  createdAt: string; // ISO date
  isProcessed: boolean;
  reply?: string;
  repliedAt?: string;
}
```

### 3.3 Store 状态
```typescript
interface FeedbackState {
  meetings: Meeting[];
  feedbacks: Feedback[];
  currentMeetingId: string | null;
  currentView: 'list' | 'detail' | 'create';
  
  // Actions
  addMeeting: (meeting: Omit<Meeting, 'id' | 'createdAt'>) => void;
  addFeedback: (feedback: Omit<Feedback, 'id' | 'createdAt' | 'isProcessed'>) => void;
  processFeedback: (feedbackId: string, reply: string) => void;
  setCurrentMeeting: (id: string | null) => void;
  setCurrentView: (view: 'list' | 'detail' | 'create') => void;
  getMeetingFeedbacks: (meetingId: string) => Feedback[];
  getMeetingStats: (meetingId: string) => MeetingStats;
}
```

## 4. 模块设计

### 4.1 Zustand Store 设计
- 使用 `persist` 中间件持久化到 localStorage
- 按领域聚合状态和方法
- 计算属性通过 selector 暴露

### 4.2 表单组件 (FeedbackForm)
- 受控组件模式
- 自定义 hooks 管理表单状态和校验
- CSS transition 实现动画
- 字数统计实时更新

### 4.3 反馈卡片 (FeedbackCard)
- 内部状态管理展开/收起
- CSS `max-height` + `overflow: hidden` 实现平滑展开
- `transform` 动画实现置位效果

### 4.4 仪表盘 (MeetingDashboard)
- 从 store 选择当前会议反馈
- memo 优化重渲染
- Recharts 原生组件
- 词云：CSS `font-size` 渐变 + `color` 渐变

### 4.5 词频工具 (wordCloud.ts)
- 中文分词（简单按标点/空格分割 + 停用词过滤）
- 统计词频
- 归一化字号（12px - 48px）
- 颜色插值（蓝色 → 紫色）

## 5. 性能优化策略

### 5.1 列表性能
- `React.memo` 包装卡片组件
- 虚拟化列表（如数据量大）
- 避免内联函数重新创建

### 5.2 动画性能
- 使用 `transform` 和 `opacity` 动画（GPU 加速）
- 避免 `height` 动画对布局的影响（使用 `max-height`）
- `will-change` 提示浏览器优化

### 5.3 图表性能
- 数据预处理在组件外完成
- `useMemo` 缓存计算结果
- Recharts 动画可配置关闭提升性能

## 6. 状态数据流

```
用户操作 → 组件事件 → Store Action → 更新状态 → localStorage 持久化
     ↑                                                        ↓
     └─────────────── 订阅状态变化 ← 选择器计算 ← 状态更新 ────┘
```

## 7. 路由策略

采用简单的状态路由（基于 store 的 `currentView` 和 `currentMeetingId`）：
- `currentView = 'list'` → 显示会议列表
- `currentView = 'create'` → 显示创建会议/反馈表单
- `currentView = 'detail'` + `currentMeetingId` → 显示会议详情 + 仪表盘

优势：无需额外路由依赖，状态一致，支持持久化。

## 8. 构建配置

### 8.1 tsconfig.json
- strict: true
- jsx: react-jsx
- target: ES2020
- moduleResolution: bundler

### 8.2 vite.config.js
- React 插件
- 端口 5173
- 开发代理（如需要）

## 9. 关键实现要点

### 9.1 卡片展开动画
```css
.card {
  max-height: 120px;
  overflow: hidden;
  transition: max-height 300ms cubic-bezier(0.4, 0, 0.2, 1);
}
.card.expanded {
  max-height: 1000px;
}
```

### 9.2 词云颜色插值
```typescript
function getColor(frequency: number, maxFreq: number): string {
  const ratio = frequency / maxFreq;
  // 蓝色 (#2563eb) → 紫色 (#7c3aed)
  const r = Math.round(37 + (124 - 37) * ratio);
  const g = Math.round(99 + (58 - 99) * ratio);
  const b = Math.round(235 + (237 - 235) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}
```

### 9.3 卡片背景色渐变
```typescript
function getScoreGradient(avgScore: number): string {
  // 低分红色 → 高分绿色
  // avgScore: 1-5
  const ratio = (avgScore - 1) / 4; // 0-1
  const r = Math.round(239 - 229 * ratio);
  const g = Math.round(68 + 107 * ratio);
  const b = Math.round(68 + 3 * ratio);
  return `linear-gradient(135deg, rgba(${r},${g},${b},0.15), rgba(${r},${g},${b},0.25))`;
}
```

