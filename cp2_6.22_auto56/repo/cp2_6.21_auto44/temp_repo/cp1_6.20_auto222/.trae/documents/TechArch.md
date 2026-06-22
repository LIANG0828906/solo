## 1. 架构设计

```mermaid
graph TB
    subgraph "前端 UI 层"
        App["App.tsx 根组件"]
        MC["MapCanvas.tsx 蜂窝地图"]
        CP["ControlPanel.tsx 控制面板"]
        CH["ChartPanel.tsx 统计图表"]
        TP["TimePanel 时间轴+简报"]
    end
    subgraph "Three.js 渲染层"
        T3D["Three.js 3D叠加层"]
        RING["变异圆环动画"]
        PULSE["脉冲/光晕动画"]
    end
    subgraph "Web Worker 计算层"
        GE["gridEngine.ts 传播算法"]
        VM["variantManager.ts 变异管理"]
    end
    App --> MC
    App --> CP
    App --> CH
    App --> TP
    MC --> T3D
    T3D --> RING
    T3D --> PULSE
    GE --> VM
    App --postMessage--> GE
    GE --postMessage--> App
```

## 2. 技术说明

- **前端框架**：React 18 + TypeScript + Vite
- **样式方案**：Tailwind CSS 3
- **3D渲染**：Three.js（变异圆环扩散动画、感染格脉冲放大、免疫光晕脉冲）
- **2D渲染**：Canvas 2D（蜂窝网格地图、折线图表）
- **后台计算**：Web Worker（gridEngine.ts 传播算法 + variantManager.ts 变异逻辑）
- **状态管理**：Zustand
- **构建工具**：Vite
- **无后端服务**

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 主界面，包含地图、控制面板、图表、时间轴 |

## 4. 数据流架构

```mermaid
sequenceDiagram
    participant U as 用户
    participant App as App.tsx
    participant CP as ControlPanel
    participant WW as Web Worker
    participant GE as gridEngine
    participant VM as variantManager
    participant MC as MapCanvas
    participant CH as ChartPanel

    U->>CP: 调整参数
    CP->>App: 更新参数状态
    App->>WW: postMessage({type:'config', params})
    U->>App: 点击播放
    App->>WW: postMessage({type:'start'})
    loop 每代计算
        WW->>GE: 计算传播
        GE->>VM: 检测变异
        VM-->>GE: 返回变异事件
        GE-->>WW: 网格状态+统计数据
        WW-->>App: postMessage({type:'tick', grid, stats, mutations})
        App->>MC: 更新网格数据
        App->>CH: 更新统计数据
    end
    U->>MC: 点击/拖拽接种
    MC->>App: 接种请求
    App->>WW: postMessage({type:'vaccinate', cells})
```

## 5. 文件组织

```
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
├── src/
│   ├── engine/
│   │   ├── gridEngine.ts      # Web Worker：30x30网格传播算法
│   │   └── variantManager.ts  # 变异管理器：计算变异概率、生成简报
│   ├── ui/
│   │   ├── MapCanvas.tsx      # Canvas蜂窝地图 + Three.js叠加层
│   │   ├── ControlPanel.tsx   # 控制面板滑块组件
│   │   ├── ChartPanel.tsx     # Canvas折线图表
│   │   └── TimePanel.tsx      # 时间轴+变异简报面板
│   ├── store/
│   │   └── useSimStore.ts     # Zustand全局状态
│   ├── types/
│   │   └── index.ts           # TypeScript类型定义
│   ├── App.tsx                # 根组件
│   ├── main.tsx               # 入口
│   └── index.css              # 全局样式+Tailwind
```

## 6. 核心数据模型

### 6.1 网格单元状态

```typescript
enum CellState {
  Healthy = 0,
  Infected = 1,
  Immune = 2,
  Mutated = 3
}

interface Cell {
  state: CellState
  infectionAge: number
  immunityAge: number
  isMutated: boolean
  variantId: number
}

interface SimParams {
  transmissionRate: number
  immunityDuration: number
  mutationRate: number
  initialInfected: number
}

interface MutationEvent {
  generation: number
  x: number
  y: number
  newRate: number
}

interface GenerationStats {
  healthy: number
  infected: number
  immune: number
  mutated: number
}
```

### 6.2 Web Worker消息协议

```typescript
type WorkerCommand =
  | { type: 'config'; params: SimParams }
  | { type: 'start' }
  | { type: 'pause' }
  | { type: 'seek'; generation: number }
  | { type: 'vaccinate'; cells: [number, number][] }
  | { type: 'batchVaccinate'; bounds: { x1: number; y1: number; x2: number; y2: number } }

type WorkerResponse =
  | { type: 'tick'; grid: Cell[][]; stats: GenerationStats; generation: number; mutations: MutationEvent[] }
  | { type: 'ready' }
```
