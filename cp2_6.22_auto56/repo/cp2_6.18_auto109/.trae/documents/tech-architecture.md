## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        "main.ts 入口"
        "pipeData.ts 管线数据模块"
        "collisionDetect.ts 碰撞检测模块"
        "sceneRender.ts 场景渲染模块"
    end

    subgraph "状态层"
        "Zustand Store"
    end

    subgraph "渲染层"
        "Three.js Scene"
        "OrbitControls"
        "Raycaster"
    end

    "main.ts 入口" --> "pipeData.ts 管线数据模块"
    "main.ts 入口" --> "collisionDetect.ts 碰撞检测模块"
    "main.ts 入口" --> "sceneRender.ts 场景渲染模块"
    "pipeData.ts 管线数据模块" --> "Zustand Store"
    "sceneRender.ts 场景渲染模块" --> "Zustand Store"
    "collisionDetect.ts 碰撞检测模块" --> "Zustand Store"
    "sceneRender.ts 场景渲染模块" --> "Three.js Scene"
    "Three.js Scene" --> "OrbitControls"
    "Three.js Scene" --> "Raycaster"
```

### 数据流向

```mermaid
flowchart LR
    "原始管线数据" --> "parsePipeData"
    "parsePipeData" --> "Store.pipes"
    "Store.pipes" --> "renderScene"
    "Store.pipes" --> "detectCollisions"
    "detectCollisions" --> "Store.collisions"
    "Store.collisions" --> "renderScene"
    "用户交互" --> "Store.camera"
    "Store.camera" --> "renderScene"
```

## 2. 技术栈

- **前端框架**：TypeScript + Three.js（纯TS，无React/Vue）
- **构建工具**：Vite
- **3D引擎**：Three@0.160
- **状态管理**：Zustand
- **类型系统**：TypeScript 严格模式，target ES2020

## 3. 文件结构

```
pipevue/
├── package.json              # 依赖：three@0.160, @types/three, zustand
├── vite.config.js            # 构建配置
├── tsconfig.json             # 严格模式，target es2020
├── index.html                # 入口页面
└── src/
    ├── main.ts               # 入口：初始化场景、载入数据、动画循环
    ├── store.ts              # Zustand全局状态：管线数组、冲突标记、相机状态
    └── modules/
        ├── pipeData.ts       # 管线数据模块：parsePipeData, addPipe, removePipe
        ├── collisionDetect.ts # 碰撞检测模块：detectCollisions
        └── sceneRender.ts    # 场景渲染模块：renderScene, 交互处理
```

### 文件调用关系

| 文件 | 调用 | 被调用 |
|------|------|--------|
| main.ts | pipeData.ts, collisionDetect.ts, sceneRender.ts, store.ts | - |
| pipeData.ts | store.ts | main.ts |
| collisionDetect.ts | - | main.ts |
| sceneRender.ts | store.ts | main.ts |
| store.ts | - | pipeData.ts, sceneRender.ts, main.ts |

## 4. 类型定义

```typescript
type PipeType = 'water' | 'power' | 'gas';

interface PipeData {
  id: string;
  type: PipeType;
  start: { x: number; y: number; z: number };
  end: { x: number; y: number; z: number };
  radius: number;
  depth: number;
}

interface CollisionPair {
  pipeA: PipeData;
  pipeB: PipeData;
  closestPoint: { x: number; y: number; z: number };
  minDistance: number;
}

interface PipeStore {
  pipes: PipeData[];
  collisions: CollisionPair[];
  selectedPipe: PipeData | null;
  hoveredPipe: PipeData | null;
  showCollisionMarkers: boolean;
  setPipes: (pipes: PipeData[]) => void;
  addPipe: (pipe: PipeData) => void;
  removePipe: (id: string) => void;
  setCollisions: (collisions: CollisionPair[]) => void;
  setSelectedPipe: (pipe: PipeData | null) => void;
  setHoveredPipe: (pipe: PipeData | null) => void;
  setShowCollisionMarkers: (show: boolean) => void;
}
```

## 5. 核心算法

### 5.1 管线间最短距离

两条管线视为三维空间中的线段，计算两线段之间的最短距离：

1. 将管线A和管线B表示为参数方程：P(s) = A1 + s*(A2-A1), Q(t) = B1 + t*(B2-B1)
2. 求解使 |P(s) - Q(t)|² 最小的 s 和 t
3. 将 s 和 t 钳制到 [0, 1] 范围内
4. 计算对应最近点坐标和距离

### 5.2 碰撞判定条件

```
minDistance < pipeA.radius + pipeB.radius + 0.5
```

### 5.3 管线圆柱体渲染

1. 使用 CylinderGeometry(radius, radius, length, 16)
2. 计算起点到终点的方向向量
3. 使用 Quaternion 将圆柱体从默认Y轴方向旋转到目标方向
4. 定位到管线中点

## 6. 性能约束

- 帧率稳定在30FPS以上（管线数量≤10）
- 碰撞检测每帧耗时≤2ms
- 使用 requestAnimationFrame 动画循环
- 射线拾取仅在鼠标移动时触发
