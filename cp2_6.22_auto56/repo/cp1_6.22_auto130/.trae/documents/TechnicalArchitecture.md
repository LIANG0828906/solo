# 沉浸式UI组件沙盒与交互状态调试应用 - 技术架构文档

## 1. 技术选型说明

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| React | 18.x | UI框架 | 组件化开发，Hooks API支持状态管理 |
| TypeScript | 5.x | 类型系统 | 严格类型检查，提升代码可维护性 |
| Vite | 5.x | 构建工具 | 快速开发服务器，热更新，高效构建 |
| Zustand | 4.x | 状态管理 | 轻量级，API简洁，支持中间件 |
| Immer | 10.x | 不可变更新 | 简化状态更新逻辑，配合Zustand |
| UUID | 9.x | 唯一标识 | 生成组件实例和日志条目的唯一ID |

---

## 2. 项目结构设计

```
auto130/
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx                 # 应用入口
    ├── App.tsx                  # 根组件
    ├── types/
    │   └── index.ts             # 全局类型定义
    ├── moduleA/                 # 沙盒渲染与状态管理
    │   ├── sandbox/
    │   │   └── SandboxRenderer.tsx    # 沙盒主渲染器
    │   ├── store/
    │   │   └── sandboxStore.ts        # 沙盒状态管理
    │   ├── components/
    │   │   ├── SandboxInput.tsx       # 输入框组件
    │   │   ├── SandboxButton.tsx      # 按钮组件
    │   │   ├── SandboxSwitch.tsx      # 开关组件
    │   │   ├── SandboxTable.tsx       # 表格组件
    │   │   └── ComponentWrapper.tsx   # 组件包装器（选中、拖拽）
    │   └── hooks/
    │       ├── useDragDrop.ts         # 拖拽Hook
    │       └── useUndoRedo.ts         # 撤销重做Hook
    ├── moduleB/                 # 数据模拟层
    │   ├── mock/
    │   │   └── MockDataEditor.tsx     # Mock数据编辑面板
    │   └── store/
    │       └── mockStore.ts           # Mock数据状态管理
    ├── moduleC/                 # 日志记录与分析
    │   ├── logger/
    │   │   └── InteractionLogger.ts   # 日志采集模块
    │   ├── store/
    │   │   └── loggerStore.ts         # 日志状态管理
    │   └── components/
    │       └── EventLogPanel.tsx      # 事件日志面板
    ├── store/                   # 全局状态聚合
    │   └── useAppStore.ts
    ├── styles/                  # 全局样式
    │   ├── index.css
    │   └── variables.css
    └── utils/                   # 工具函数
        └── index.ts
```

---

## 3. 模块间调用关系与数据流向

### 3.1 数据流向图

```
┌─────────────────────────────────────────────────────────────────────────┐
│                             User Actions                                │
│  (点击选中、修改props、拖拽排序、编辑mock数据、键盘快捷键)               │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    useAppStore (Zustand 全局状态)                       │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────┐                │
│  │ sandboxStore │   │ mockStore    │   │ loggerStore  │                │
│  │  (组件列表)  │   │  (Mock数据)  │   │  (事件日志)  │                │
│  └──────────────┘   └──────────────┘   └──────────────┘                │
│          │                  │                  │                       │
│          └──────────────────┼──────────────────┘                       │
│                             ▼                                           │
│                    ┌──────────────────┐                                │
│                    │  Undo/Redo Stack │                                │
│                    │  (状态快照队列)  │                                │
│                    └──────────────────┘                                │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            Component Rendering                          │
│  ┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐  │
│  │ SandboxRenderer  │    │ MockDataEditor   │    │ EventLogPanel    │  │
│  │  (左侧沙盒)      │    │  (右侧标签页)    │    │  (右侧日志)      │  │
│  └──────────────────┘    └──────────────────┘    └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        InteractionLogger                                │
│              (采集所有交互事件，非阻塞写入loggerStore)                  │
└─────────────────────────────────────────────────────────────────────────┘
```

### 3.2 模块调用关系

| 模块 | 依赖模块 | 调用方式 | 数据流向 |
|------|----------|----------|----------|
| SandboxRenderer | sandboxStore, mockStore, loggerStore | Zustand hooks | 读取状态 → 渲染组件 → 派发事件 |
| MockDataEditor | mockStore, sandboxStore, loggerStore | Zustand hooks | 读取mock数据 → 编辑 → 更新store |
| EventLogPanel | loggerStore | Zustand hooks | 读取日志 → 展示 → 展开详情 |
| sandboxStore | mockStore, loggerStore | Immer produce, subscribe | 状态更新 → 触发日志记录 |
| mockStore | sandboxStore | Zustand subscribe | Mock数据更新 → 通知沙盒重新渲染 |
| loggerStore | - | setTimeout (非阻塞) | 事件写入 → 自动裁剪 → 持久化 |

---

## 4. 核心数据结构定义

### 4.1 组件实例类型

```typescript
export type ComponentType = 'input' | 'button' | 'switch' | 'table';

export interface ComponentProps {
  [key: string]: any;
}

export interface ComponentInstance {
  id: string;
  type: ComponentType;
  props: ComponentProps;
  mockDataKey?: string;
}

export interface SandboxState {
  components: ComponentInstance[];
  selectedComponentId: string | null;
  draggingComponentId: string | null;
}
```

### 4.2 Mock数据类型

```typescript
export interface MockDataItem {
  id: string;
  key: string;
  value: any;
}

export interface MockState {
  data: MockDataItem[];
}
```

### 4.3 事件日志类型

```typescript
export type EventType = 
  | 'component_select'
  | 'component_drag_start'
  | 'component_drag_end'
  | 'component_reorder'
  | 'prop_change'
  | 'mock_data_add'
  | 'mock_data_update'
  | 'mock_data_delete'
  | 'undo'
  | 'redo';

export interface LogEntry {
  id: string;
  type: EventType;
  timestamp: number;
  payload: Record<string, any>;
}

export interface LoggerState {
  logs: LogEntry[];
  expandedLogId: string | null;
}
```

### 4.4 状态快照类型

```typescript
export interface StateSnapshot {
  sandbox: SandboxState;
  mock: MockState;
  logger: LoggerState;
  timestamp: number;
}
```

---

## 5. 核心功能实现方案

### 5.1 沙盒渲染（SandboxRenderer）

**核心逻辑：**
1. 从sandboxStore读取组件列表和选中状态
2. 遍历组件列表，用ComponentWrapper包裹每个组件
3. 根据组件类型渲染对应的沙盒组件
4. 将mock数据通过props注入依赖mock数据的组件

**组件选中机制：**
- 点击组件时，更新sandboxStore的selectedComponentId
- ComponentWrapper根据选中状态应用蓝色虚线边框样式

### 5.2 拖拽排序（useDragDrop Hook）

**实现步骤：**
1. mousedown事件触发，启动0.3秒定时器
2. 定时器触发前mouseup则取消，判定为普通点击
3. 定时器触发后进入拖拽模式，记录初始位置
4. mousemove时计算拖拽位移，更新占位位置
5. mouseup时重排组件数组，记录component_reorder事件

**动画实现：**
- 使用CSS transform: translateY()配合transition: transform 0.2s
- 根据拖拽目标位置动态计算每个组件的偏移量

### 5.3 Props编辑与实时预览

**实现方案：**
1. 控制面板根据选中组件类型生成可编辑props表单
2. 表单输入通过onChange事件更新sandboxStore
3. Zustand的selectors保证只有相关组件重渲染
4. 闪烁动画通过CSS animation实现，修改时临时添加flash类

### 5.4 撤销/重做机制（useUndoRedo Hook）

**实现方案：**
1. 创建StateSnapshot包含sandbox、mock、logger的完整状态
2. 订阅三个store的变化，使用debounce(100ms)避免频繁快照
3. 快照存入undo栈，最多保留50个快照
4. 撤销时弹出undo栈顶，推入redo栈，恢复状态
5. 重做时弹出redo栈顶，推入undo栈，恢复状态

**快捷键监听：**
- 监听keydown事件，判断Ctrl+Z和Ctrl+Shift+Z
- 阻止默认行为，防止浏览器的撤销操作

### 5.5 事件日志非阻塞写入

**实现方案：**
1. InteractionLogger提供logEvent方法
2. logEvent内部使用setTimeout(0)将写入操作推到宏任务队列
3. loggerStore使用Immer更新，保证不可变
4. 日志写入后检查数量，超过500条则shift删除50条（10%）

---

## 6. 性能优化策略

### 6.1 渲染性能优化

1. **Zustand Selectors：** 使用shallow比较，避免不必要的重渲染
2. **React.memo：** 所有沙盒组件使用React.memo包装
3. **useCallback/useMemo：** 事件处理函数和计算属性缓存
4. **虚拟滚动：** 事件日志列表超过50条时使用虚拟滚动

### 6.2 状态更新优化

1. **Immer批量更新：** 多次状态变更合并为一次更新
2. **Debounce快照：** 快速连续操作只生成一个快照
3. **浅比较：** Props变化检测使用浅比较，避免深度遍历

### 6.3 日志性能优化

1. **非阻塞写入：** setTimeout(0)确保不阻塞UI
2. **批量裁剪：** 超过500条时一次性裁剪50条
3. **懒加载详情：** 点击展开时才计算payload详情展示

---

## 7. 响应式设计方案

### 7.1 断点定义

```css
:root {
  --breakpoint-wide: 1200px;
  --breakpoint-tablet: 768px;
}

@media (min-width: 1200px) {
  --sandbox-width: 70%;
  --panel-width: 360px;
}

@media (min-width: 768px) and (max-width: 1199px) {
  --sandbox-width: 60%;
  --panel-width: 300px;
}
```

### 7.2 布局实现

- 使用Flexbox布局，沙盒flex-grow自适应
- 控制面板固定宽度，不收缩（flex-shrink: 0）
- 平板尺寸下调整间距和字体大小

---

## 8. 动画实现方案

### 8.1 标签页滑动切换

```css
.tab-content {
  display: flex;
  width: 300%;
  transition: transform 0.3s ease;
}

.tab-panel {
  width: 33.333%;
  flex-shrink: 0;
}
```

### 8.2 Prop修改闪烁动画

```css
@keyframes flash {
  0% { background-color: #FFFFFF; }
  50% { background-color: #E0F2FE; }
  100% { background-color: #FFFFFF; }
}

.flash {
  animation: flash 0.2s ease-out;
}
```

### 8.3 撤销/重做淡入效果

```css
.fade-in {
  animation: fadeIn 0.15s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0.8; }
  to { opacity: 1; }
}
```

---

## 9. 部署与构建

### 9.1 构建命令

```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

### 9.2 严格模式配置

tsconfig.json启用严格模式：
- strict: true
- noImplicitAny: true
- strictNullChecks: true
- noImplicitReturns: true
