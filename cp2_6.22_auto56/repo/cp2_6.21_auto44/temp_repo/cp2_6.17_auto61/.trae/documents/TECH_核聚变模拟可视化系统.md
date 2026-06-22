## 1. 架构设计

```mermaid
architecture-beta
    group client(frontend)[浏览器前端]
    group sim[粒子模拟模块]
    group ui[用户交互模块]

    service app(App.tsx) in client
    service scene(SceneManager.tsx) in ui
    service panel(UIPanel.tsx) in ui
    service particle(particleSystem.ts) in sim
    service physics(physicsEngine.ts) in sim
    service store(Zustand Store) in client

    app --> scene
    app --> panel
    scene --> particle
    particle --> physics
    particle --> store
    physics --> store
    panel --> store
    store --> scene
    store --> panel
```

## 2. 技术描述

- **前端框架**：React@18 + React-DOM@18 + TypeScript
- **3D 渲染**：Three.js + @react-three/fiber + @react-three/drei
- **状态管理**：Zustand
- **构建工具**：Vite
- **工具库**：uuid

**模块职责划分**：
- `simulation/particleSystem.ts`：粒子系统核心逻辑，粒子生成、运动更新、碰撞检测、聚变事件
- `simulation/physicsEngine.ts`：物理引擎，磁场力场计算、螺旋运动轨迹、参数化运动方程
- `interaction/SceneManager.tsx`：Three.js 场景管理，相机控制、渲染循环、响应式适配
- `interaction/UIPanel.tsx`：UI 控件，参数滑块、诊断图表、导航栏
- `store/store.ts`：全局状态管理，粒子数据、参数状态、碰撞事件队列

## 3. 目录结构

```
src/
├── simulation/
│   ├── particleSystem.ts    # 粒子系统：生成、更新、碰撞
│   └── physicsEngine.ts     # 物理引擎：磁场、运动轨迹
├── interaction/
│   ├── UIPanel.tsx          # 参数面板 + 诊断图表
│   └── SceneManager.tsx     # 3D 场景与相机控制
├── store/
│   └── store.ts             # Zustand 状态管理
├── App.tsx                  # 根组件
├── main.tsx                 # 入口文件
└── index.css                # 全局样式
```

## 4. 核心数据模型

### 4.1 粒子数据结构

```typescript
interface Particle {
  id: string;
  position: { x: number; y: number; z: number };
  velocity: { x: number; y: number; z: number };
  temperature: number;      // 1e6 ~ 1.5e8 K
  size: number;             // 3 ~ 8 px
  color: string;            // 基于温度：蓝色 #1E90FF → 白色 #FFFFFF
  toroidalAngle: number;    // 环向角度
  radialOffset: number;     // 径向偏移
  poloidalAngle: number;    // 极向角度
}
```

### 4.2 模拟参数

```typescript
interface SimulationParams {
  temperature: number;      // 1e6 ~ 1.5e8 K，步长 1e6
  magneticField: number;    // 1 ~ 10 T，步长 0.1
  particleCount: number;    // 50 ~ 500，步长 10
  reactionProbability: number; // 1% ~ 100%，步长 1%
}
```

### 4.3 碰撞事件

```typescript
interface CollisionEvent {
  id: string;
  position: { x: number; y: number; z: number };
  timestamp: number;
  flashOpacity: number;     // 1.0 → 0，持续 0.3s
  markerOpacity: number;    // 1.0 → 0，持续 1.5s
}
```

### 4.4 诊断数据

```typescript
interface DiagnosticsData {
  reactionRate: number;     // 反应/秒
  averageTemperature: number;
  temperatureHistory: number[]; // 最近 50 帧
  totalFusions: number;
}
```

## 5. Store 状态定义

```typescript
interface FusionStore {
  // 粒子数据
  particles: Particle[];
  // 模拟参数
  params: SimulationParams;
  // 碰撞事件队列
  collisions: CollisionEvent[];
  // 诊断数据
  diagnostics: DiagnosticsData;
  // 相机状态
  camera: {
    distance: number;
    theta: number;
    phi: number;
    panX: number;
    panY: number;
  };
  // Actions
  setParams: (params: Partial<SimulationParams>) => void;
  updateParticles: (particles: Particle[]) => void;
  addCollision: (collision: CollisionEvent) => void;
  updateDiagnostics: (data: Partial<DiagnosticsData>) => void;
  updateCamera: (camera: Partial<FusionStore['camera']>) => void;
  resetSimulation: () => void;
}
```

## 6. 关键技术实现

### 6.1 粒子渲染优化
- 使用 `BufferGeometry` 存储所有粒子位置、颜色数据
- 启用 `frustumCulled` 优化
- 粒子数变化时平滑过渡，避免闪烁
- 使用 `PointsMaterial` 实现发光效果

### 6.2 物理运动方程
- 粒子螺旋运动：沿环向角速度 0.5 rad/s，叠加径向随机扰动（幅度 0.05）
- 磁场力场影响：`F = q(v × B)` 简化模型，参数化控制螺旋半径与螺距
- 碰撞检测：空间网格优化，粒子间距 < 6px 时触发聚变

### 6.3 交互控制
- 鼠标拖拽旋转：水平 0.005 rad/px，垂直 0.003 rad/px，限制 ±45°
- 滚轮缩放：距离范围 5-30 单位，ease-out 缓动 0.2s
- 右键平移：0.05 单位/像素

### 6.4 性能指标
- 模拟帧率 ≥ 45fps，500 粒子时 ≥ 30fps
- 参数响应延迟 ≤ 100ms
- 交互响应延迟 ≤ 50ms
