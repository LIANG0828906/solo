# 轻量级服务监控仪表板 技术架构

## 1. 技术选型

| 类别 | 选型 | 理由 |
|------|------|------|
| 构建工具 | Vite 5 | 启动快、HMR 体验优秀、原生支持 TS/React |
| 框架 | React 18 + TypeScript 5 | 严格类型安全，组件化开发效率高 |
| 路由 | Hash 路由（自实现） | 纯前端无需服务端配置，避免引入 react-router 依赖 |
| 状态管理 | 发布/订阅模式 + useReducer | 轻量零依赖，满足引擎与 UI 解耦需求 |
| 样式方案 | CSS Modules + CSS Variables | 作用域隔离，主题色统一定义，动画性能好 |
| 数据持久化 | localStorage | 零成本，纯浏览器端 |

---

## 2. 目录结构

```
auto5/
├── package.json
├── index.html
├── vite.config.js
├── tsconfig.json
└── src/
    ├── main.tsx                 # 应用入口
    ├── App.tsx                  # 根组件（路由 + 布局）
    ├── styles/
    │   ├── global.css           # 全局样式、CSS 变量、响应式断点
    │   └── animations.css       # 通用动画关键帧
    ├── engine/                  # 【核心模块 A】监控引擎
    │   ├── types.ts             # 共享数据类型定义
    │   └── monitorEngine.ts     # 检测调度、fetch、AbortController、事件发布
    ├── store/                   # 【桥梁模块】状态中心
    │   └── appStore.ts          # 发布/订阅、状态聚合、localStorage、导入导出
    └── ui/                      # 【核心模块 B】UI 展示
        ├── components/
        │   ├── NavBar.tsx       # 顶部导航栏
        │   ├── NotificationBanner.tsx  # 通知权限提醒条
        │   └── StatCard.tsx     # 通用统计卡片
        ├── Dashboard.tsx        # 主看板页面
        ├── MonitorCard.tsx      # 单个监控卡片（含详情面板）
        ├── SettingsPage.tsx     # 设置页面
        └── FailureHistory.tsx   # 故障历史页面
```

---

## 3. 模块分层与通信架构

### 3.1 总体架构图

```mermaid
graph TD
    subgraph "Engine 层 (零 DOM 依赖)"
        A[monitorEngine.ts<br/>setInterval 调度] --> B["单次检测<br/>fetch + AbortController"]
        B --> C["CheckResult 事件<br/>CustomEvent / 回调"]
    end

    subgraph "Store 层 (状态中心)"
        D[appStore.ts<br/>发布/订阅中心]
        D --> E["状态容器<br/>endpoints / results / failures"]
        D --> F["localStorage 持久化"]
        D --> G["JSON 导入/导出"]
    end

    subgraph "UI 层 (React 组件树)"
        H[App.tsx 路由]
        H --> I[Dashboard.tsx]
        H --> J[SettingsPage.tsx]
        H --> K[FailureHistory.tsx]
        I --> L[MonitorCard.tsx × N]
        I --> M[Summary Panel]
    end

    C -->|subscribe(result)| D
    D -->|on('stateChange', cb)| H
    D -->|dispatch(action)| I
    J -->|add/update/delete endpoint| D
    D -->|start/stop monitor| A
```

**核心约束：Engine 层绝不 import 任何 React / DOM 相关代码**

### 3.2 数据流单向原则

```
用户操作 → Settings 表单 → store.dispatch(ADD_ENDPOINT)
                           → store 更新 endpoints
                           → engine.startMonitoring(endpoint)
                           → engine 周期执行 fetch
                           → engine.publish(CHECK_RESULT)
                           → store 接收并聚合状态
                           → store.emit(STATE_CHANGED)
                           → UI 组件订阅后 setState → 重渲染
```

### 3.3 发布/订阅模式实现

```typescript
// Store 暴露的接口
interface AppStore {
  // 订阅批量状态更新（UI 层使用）
  subscribe(callback: (state: AppState) => void): () => void;
  
  // 接收引擎发布的检测结果（引擎层使用）
  publishCheckResult(result: CheckResult): void;
  
  // 端点管理 actions
  addEndpoint(endpoint: MonitoredEndpoint): void;
  updateEndpoint(id: string, patch: Partial<MonitoredEndpoint>): void;
  removeEndpoint(id: string): void;
  
  // 配置导入导出
  exportConfig(): string;
  importConfig(json: string): boolean;
}
```

---

## 4. 关键模块详细设计

### 4.1 monitorEngine.ts — 监控引擎

**核心职责：只管检测，不管状态展示**

```
类：MonitorEngine
├── 字段
│   ├── timers: Map<endpointId, NodeJS.Timeout>
│   ├── aborters: Map<endpointId, AbortController>
│   └── onResultCallback: (r: CheckResult) => void  // 注入的回调
├── 方法
│   ├── registerEndpoint(ep: MonitoredEndpoint)    // 启定时器
│   ├── unregisterEndpoint(id: string)             // 清定时器 + abort
│   ├── async checkOnce(ep: MonitoredEndpoint)     // 单次检测逻辑
│   │   ├── 创建 AbortController
│   │   ├── setTimeout(() => controller.abort(), ep.timeout * 1000)
│   │   ├── performance.now() 记起止
│   │   ├── try { fetch(ep.url, { signal }) } catch { /* 分类错误 */ }
│   │   ├── 构造 CheckResult → 调用 onResultCallback
│   └── destroy()  // 清理全部
```

**性能保障手段：**
- 每个端点独立 setInterval，到期后使用 `setTimeout(..., 0)` 将检测逻辑推到下一帧，避免定时器回调内重活阻塞 UI
- `fetch + AbortController` 本身是异步非阻塞的
- 批量检测时使用**时间错峰**：注册时对 interval 加一个 0~500ms 的随机启动延迟，避免 N 个端点同时在同一帧发起请求

### 4.2 appStore.ts — 状态中心

**核心内部状态：**
```typescript
interface AppState {
  endpoints: MonitoredEndpoint[];
  latestResults: Record<endpointId, CheckResult>;          // 每个端点最新一条
  resultHistory: Record<endpointId, CheckResult[]>;        // 每个端点近1小时
  consecutiveFailures: Record<endpointId, number>;         // 连续失败计数
  activeFailures: Record<endpointId, FailureEvent>;        // 进行中的故障
  failureHistory: FailureEvent[];                          // 已结束+进行中全部
  notificationPermission: 'default' | 'granted' | 'denied';
  monitoringStartTime: number;                             // 首次启动时间
}
```

**故障判定逻辑（收到 CheckResult 时）：**
1. 若 `isSuccess=true`：
   - 若存在 `activeFailures[id]` → 填入 endTime，移到 `failureHistory`，标记 resolved
   - `consecutiveFailures[id] = 0`
2. 若 `isSuccess=false`：
   - `consecutiveFailures[id] += 1`
   - 若计数达到 threshold 且无 activeFailure：
     - 创建新 FailureEvent（startTime = 本次 timestamp - (threshold-1)*interval）
     - **触发浏览器通知**
   - 若存在 activeFailure：追加 checkResults 到其中

**持久化策略：**
- `endpoints`、`failureHistory`（最多保留 500 条）、`monitoringStartTime` 写 localStorage
- `resultHistory`（近1小时内存即可）、`latestResults`、`consecutiveFailures`、`activeFailures` 不持久化（刷新后重新检测）

### 4.3 UI 组件层设计

#### Dashboard 布局（CSS Grid）
```
≥1024px (宽屏):       ≥768px (平板):        <768px (手机):
┌─────────────┬───┐   ┌─────────────┬───┐   ┌─────────────┐
│  卡片网格   │摘│   │  卡片网格   │摘│   │  摘要水平条  │
│  3列        │要│   │  2列        │要│   ├─────────────┤
│             │面│   │             │面│   │  卡片网格   │
│             │板│   │             │板│   │  1列        │
└─────────────┴───┘   └─────────────┴───┘   └─────────────┘
```

#### MonitorCard 详情面板延迟条形图
- X 轴：时间（近 1 小时，按采样顺序）
- Y 轴：每个采样一个水平条，长度映射 latency（0-5000ms 以上截断）
- 动画：挂载时 `width: 0 → targetWidth`，用 `requestAnimationFrame` 逐帧递增到目标值，缓动函数 `easeOutCubic`

#### 状态指示灯动画
- CSS transition：`background-color 1500ms ease`（黄）/ `2000ms ease`（红）
- 额外加上 `box-shadow: 0 0 8px currentColor` 呼吸感微光晕

---

## 5. 性能保障方案

| 风险点 | 保障措施 |
|--------|----------|
| 大量 fetch 同时 resolve 阻塞主线程 | Store 内使用 `queueMicrotask` 批量合并 50ms 内的多个 CheckResult，一次 emit 而非每条触发 UI 重渲染 |
| MonitorCard 列表重渲染 | 每个 Card 包 `React.memo(..., shallowEqual)`，props 仅传 `endpointId`，内部通过 store 细粒度订阅自身数据 |
| resultHistory 数组增长 | 每个端点最多保留 3600 条（1 小时 × 1 秒粒度上限），超出 shift() 先进先出 |
| 详情面板条形图渲染 | 仅展开的卡片才绘制，收起后卸载；Canvas-free 纯 DOM，使用 `will-change: width` 提示合成层 |
| 切换页面闪烁 | 路由切换使用 CSS `opacity` 过渡而非卸载挂载 |

---

## 6. 浏览器通知策略

1. 应用启动时 `Notification.requestPermission()` → 结果写入 store
2. Store 判定触发告警时调用：
   ```typescript
   if (permission === 'granted') {
     const n = new Notification(`⚠️ ${endpoint.name} 故障`, { body });
     n.onclick = () => { window.focus(); n.close(); };
   }
   ```
3. 权限为 `default` 时 UI 右上角显示横幅，点击可再次请求

---

## 7. 核心数据类型（完整定义）

见 `src/engine/types.ts`，该文件被 engine、store、ui 三层共同 import，是唯一的类型定义源。

---

## 8. 构建与运行

```bash
npm install        # 安装 react, react-dom, typescript, vite, @types/*
npm run dev        # 启动 vite dev server（默认 http://localhost:5173）
```

**生产构建可选**（用户未要求，暂不配置 CI）：
```bash
npm run build      # vite build → dist/
npm run preview    # 本地预览构建产物
```
