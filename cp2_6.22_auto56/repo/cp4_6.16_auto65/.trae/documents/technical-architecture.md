# FitScribe 技术架构文档

## 1. 技术栈选型

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI 框架 |
| TypeScript | 5.x | 类型系统 |
| Vite | 5.x | 构建工具 |
| React Router DOM | 6.x | 路由管理 |
| Zustand | 4.x | 状态管理 |
| idb-keyval | 6.x | IndexedDB 封装 |
| Recharts | 2.x | 图表库 |
| uuid | 9.x | ID 生成 |

## 2. 项目结构

```
auto65/
├── package.json              # 项目依赖配置
├── vite.config.js            # Vite 构建配置
├── tsconfig.json             # TypeScript 配置
├── index.html                # HTML 入口
└── src/
    ├── App.tsx               # 根组件（路由与布局）
    ├── main.tsx              # 应用入口
    ├── index.css             # 全局样式
    ├── modules/
    │   └── exercise/
    │       ├── types.ts      # 类型定义
    │       └── store.ts      # Zustand 状态管理
    ├── pages/
    │   ├── HomePage.tsx      # 首页（动作库 + 训练日志）
    │   └── ChartPage.tsx     # 统计图表页
    └── utils/
        └── localStorage.ts   # IndexedDB 封装
```

## 3. 核心架构设计

### 3.1 数据流设计

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   User Action   │────▶│   Zustand Store │────▶│   IndexedDB     │
│   (UI Events)   │     │   (State Mgmt)  │     │   (Persistence) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
          │                        │                        │
          │                        ▼                        │
          │                  ┌─────────────────┐            │
          └──────────────────│   React Components  │◀───────┘
                             │   (Re-render)      │
                             └─────────────────┘
```

### 3.2 状态管理设计

**Zustand Store 分层：**
- `exercises`：动作库列表
- `trainingRecords`：训练记录列表
- `templates`：训练模板列表
- `searchQuery`：搜索关键词
- `filterCategory`：筛选部位
- `loading`：加载状态

### 3.3 数据模型

#### 3.3.1 动作 (Exercise)
```typescript
interface Exercise {
  id: string;
  name: string;
  category: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'core';
  type: 'free' | 'machine' | 'bodyweight';
  description: string;
  createdAt: number;
}
```

#### 3.3.2 训练记录 (TrainingRecord)
```typescript
interface TrainingRecord {
  id: string;
  exerciseId: string;
  exerciseName: string;
  category: string;
  sets: number;
  reps: number;
  weight: number;
  totalWeight: number;
  date: string;
  time: string;
  createdAt: number;
}
```

#### 3.3.3 训练模板 (TrainingTemplate)
```typescript
interface TrainingTemplate {
  id: string;
  name: string;
  exercises: TemplateExercise[];
  createdAt: number;
}

interface TemplateExercise {
  exerciseId: string;
  exerciseName: string;
  category: string;
  defaultSets: number;
  defaultReps: number;
  defaultWeight: number;
}
```

## 4. 模块设计

### 4.1 类型定义模块 (types.ts)
- 定义所有核心数据接口
- 定义枚举类型
- 定义 Store 接口

### 4.2 状态管理模块 (store.ts)
- 动作 CRUD 操作
- 训练记录 CRUD 操作
- 训练模板 CRUD 操作
- 搜索和筛选逻辑
- 数据持久化（调用 localStorage 工具）
- 数据导出/导入功能

### 4.3 存储工具模块 (localStorage.ts)
- 封装 idb-keyval 的 get/set/delete 操作
- 提供批量读写接口
- 性能监控（可选）

### 4.4 首页模块 (HomePage.tsx)
- 左侧：动作库面板
  - 添加动作表单
  - 搜索/筛选控件
  - 动作卡片网格
- 右侧：训练日志面板
  - 训练记录表单
  - 模板选择器
  - 训练记录列表

### 4.5 图表页模块 (ChartPage.tsx)
- 折线图：最近7天训练组数
- 柱状图：各部位训练次数
- 数据统计摘要

## 5. 性能优化策略

### 5.1 搜索优化
- 使用 useMemo 缓存搜索和筛选结果
- 防抖处理用户输入（100ms）
- 纯前端过滤，无网络延迟

### 5.2 渲染优化
- 列表虚拟化（如记录超过100条）
- React.memo 包装纯展示组件
- 合理使用 useCallback 避免不必要重渲染

### 5.3 存储优化
- IndexedDB 异步读写，不阻塞主线程
- 批量写入操作
- 数据变更后增量更新 UI

### 5.4 动画性能
- 使用 CSS transform 和 opacity 动画
- 避免 layout thrashing
- 合理使用 will-change

## 6. 样式方案

### 6.1 CSS 变量
```css
:root {
  --bg-primary: #1a1a2e;
  --bg-card: #16213e;
  --bg-button: #0f3460;
  --accent: #e94560;
  --text-primary: #ffffff;
  --text-secondary: rgba(255, 255, 255, 0.7);
  --glass-bg: rgba(22, 33, 62, 0.8);
  --glass-border: rgba(255, 255, 255, 0.1);
}
```

### 6.2 响应式断点
- 桌面：≥ 768px（双栏布局）
- 移动：< 768px（单列布局）

## 7. 动画设计

### 7.1 页面加载动画
- 卡片 stagger 动画（递增 animation-delay）
- 从下往上滑入 + 淡入

### 7.2 交互动画
- 卡片悬停：translateY(-4px) + 阴影加深
- 搜索结果：opacity 0 → 1（300ms）
- 删除记录：translateX(-100%) + opacity 0（300ms）

### 7.3 图表动画
- Recharts 自带 isAnimationActive
- 渐变色折线和柱状图

## 8. 测试策略

### 8.1 性能测试
- 搜索响应时间：console.time 标记
- 存储操作：performance.now() 测量
- 渲染性能：React DevTools Profiler

### 8.2 功能测试
- 手动验证所有 CRUD 操作
- 验证导出/导入数据完整性
- 移动端响应式测试
