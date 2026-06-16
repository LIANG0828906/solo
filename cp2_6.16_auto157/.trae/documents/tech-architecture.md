## 1. 架构设计

```mermaid
flowchart TD
    "index.html" --> "Vite构建"
    "Vite构建" --> "main.ts（入口）"
    "main.ts" --> "maze.ts（迷宫生成）"
    "main.ts" --> "player.ts（玩家控制）"
    "main.ts" --> "crystal.ts（能量晶体）"
    "main.ts" --> "ui.ts（HUD界面）"
    "main.ts" --> "sound.ts（音效系统）"
    "Three.js渲染器" --> "WebGL Canvas"
    "ui.ts" --> "Canvas 2D HUD覆盖"
    "sound.ts" --> "Web Audio API"
```

## 2. 技术说明

- **前端框架**：TypeScript + Three.js@0.160（无React/Vue，纯3D游戏场景）
- **构建工具**：Vite
- **依赖**：three@0.160, uuid
- **音效**：Web Audio API（碰撞声120Hz/0.15s，采集声）
- **状态管理**：模块内状态管理，无额外框架
- **后端**：无

## 3. 文件结构与模块职责

| 文件 | 职责 |
|------|------|
| package.json | 依赖管理（three@0.160, uuid），启动脚本 npm run dev |
| index.html | 入口页面，全屏canvas容器，背景纯黑 |
| vite.config.js | Three.js与TypeScript构建配置 |
| tsconfig.json | 严格模式，ESNext模块 |
| src/main.ts | 场景、相机、渲染器初始化，游戏循环，模块协调 |
| src/maze.ts | 迷宫生成：10x10网格，递归回溯算法，返回地图矩阵和出口坐标 |
| src/player.ts | 小球控制：WASD移动、碰撞检测、能量采集状态 |
| src/crystal.ts | 能量晶体：创建、自转动画、悬停高亮、点击破碎粒子效果 |
| src/ui.ts | HUD：能量进度条、计时器、晶体计数、结算面板（Canvas 2D） |
| src/sound.ts | Web Audio API音效：碰撞声和采集声 |

## 4. 数据模型

### 4.1 迷宫数据结构

```typescript
interface MazeData {
  grid: number[][];       // 10x10, 0=路径, 1=墙壁
  entrance: { x: number; z: number };
  exit: { x: number; z: number };
}
```

### 4.2 晶体数据结构

```typescript
interface Crystal {
  type: 'red' | 'blue' | 'green' | 'purple' | 'gold';
  shape: 'octahedron' | 'tetrahedron' | 'dodecahedron' | 'hexahedron' | 'star';
  position: { x: number; y: number; z: number };
  collected: boolean;
  mesh: THREE.Mesh;
  glowRadius: number;
}
```

### 4.3 玩家状态

```typescript
interface PlayerState {
  position: { x: number; y: number; z: number };
  collectedCrystals: number;
  totalCrystals: number;
  hasUnlockedHiddenArea: boolean;
  startTime: number;
  elapsedTime: number;
}
```

## 5. 性能优化策略

- 水晶墙壁使用 InstancedMesh 减少绘制调用
- 粒子系统使用 BufferGeometry + Points
- 晶体破碎粒子使用对象池复用
- 仅渲染视锥内物体（Frustum Culling）
- 呼吸动画使用 Shader Material 在GPU端计算
- 限制同屏粒子总数上限
