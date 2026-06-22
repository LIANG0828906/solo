# CrystalGarden 技术架构文档

## 1. 技术选型

| 技术 | 版本 | 用途 |
|------|------|------|
| TypeScript | 5.x | 类型安全的开发语言 |
| Three.js | 0.160 | 3D 渲染引擎 |
| Vite | 5.x | 构建工具与开发服务器 |
| uuid | 9.x | 唯一标识符生成 |
| @types/three | 0.160 | Three.js 类型定义 |

## 2. 项目结构

```
CrystalGarden/
├── package.json              # 项目依赖与脚本
├── index.html                # HTML 入口
├── tsconfig.json             # TypeScript 配置
├── vite.config.js            # Vite 配置
└── src/
    ├── main.ts               # 入口文件：场景初始化、动画循环
    ├── Crystal.ts            # 水晶类：几何体生成、动画逻辑
    ├── Garden.ts             # 花园管理：地形、交互、状态管理
    └── UI.ts                 # UI 模块：工具栏、事件绑定
```

## 3. 模块设计

### 3.1 main.ts - 入口模块

**职责**:
- 初始化 Three.js 核心对象（Scene、PerspectiveCamera、WebGLRenderer）
- 设置 OrbitControls 相机控制
- 处理窗口 resize 事件
- 启动动画循环 (requestAnimationFrame)
- 实例化 Garden 和 UI 模块

**关键对象**:
- `scene: THREE.Scene` - 场景根节点
- `camera: THREE.PerspectiveCamera` - 透视相机
- `renderer: THREE.WebGLRenderer` - WebGL 渲染器
- `controls: OrbitControls` - 轨道控制器
- `garden: Garden` - 花园管理器实例
- `ui: UI` - UI 控制器实例

### 3.2 Crystal.ts - 水晶类

**职责**:
- 生成参数化的棱柱几何体
- 创建带有发光描边的材质
- 管理水晶的绽放/收缩动画
- 处理粒子效果

**接口设计**:
```typescript
class Crystal {
  mesh: THREE.Mesh;
  edges: THREE.LineSegments;
  position: THREE.Vector3;
  
  constructor(position: THREE.Vector3, colorPalette: string[]);
  generateGeometry(): THREE.BufferGeometry;
  createMaterial(): THREE.MeshPhysicalMaterial;
  createEdges(): THREE.LineSegments;
  animateBurst(): void;          // 绽放动画
  animateShrink(duration: number): Promise<void>;  // 收缩动画
  animateGrow(duration: number): Promise<void>;    // 生长动画
  hoverOn(): void;               // 悬停开始
  hoverOff(): void;              // 悬停结束
  update(deltaTime: number): void;  // 帧更新
}
```

**数据流向**:
- 构造函数接收位置和颜色参数
- `generateGeometry()` 创建随机棱柱（6-12 面，高度 0.8-2.5）
- 主循环调用 `update()` 处理动画状态
- Garden 通过 raycaster 检测后调用 `animateBurst()`

### 3.3 Garden.ts - 花园管理

**职责**:
- 生成并管理地形网格（PlaneGeometry 顶点抖动）
- 生成地表荧光点（Points）
- 管理所有水晶实例数组
- 实现极光背景效果
- 处理鼠标交互（raycaster 检测）
- 管理地形起伏参数
- 实现水晶重置功能与地面震动效果

**接口设计**:
```typescript
class Garden {
  scene: THREE.Scene;
  crystals: Crystal[];
  terrain: THREE.Mesh;
  terrainAmplitude: number;
  
  constructor(scene: THREE.Scene);
  generateTerrain(amplitude: number): void;
  generateFluorescentPoints(): void;
  generateCrystals(): void;
  updateTerrainAmplitude(amplitude: number): void;  // 平滑过渡
  resetAllCrystals(): Promise<void>;  // 全部重新生长
  handleMouseMove(event: MouseEvent): void;  // raycaster 检测 hover
  handleClick(event: MouseEvent): void;      // raycaster 检测 click
  createAuroraBackground(): void;  // 极光背景
  update(deltaTime: number): void;
}
```

**数据流向**:
- 内部管理所有 Crystal 实例数组
- UI 模块通过方法调用更新地形参数或触发重置
- 鼠标事件通过 raycaster 映射到具体水晶实例
- 主循环调用 `update()` 更新所有动画状态

### 3.4 UI.ts - 用户界面

**职责**:
- 创建悬浮工具栏 DOM 元素
- 实现磨砂玻璃 CSS 样式
- 绑定按钮点击和滑块事件
- 将用户操作回调到 Garden 实例

**接口设计**:
```typescript
class UI {
  garden: Garden;
  container: HTMLElement;
  
  constructor(garden: Garden);
  createToolbar(): void;
  createRegrowButton(): HTMLButtonElement;
  createTerrainSlider(): HTMLInputElement;
  applyFrostedGlassStyle(element: HTMLElement): void;
}
```

**数据流向**:
- 构造函数接收 Garden 实例引用
- 按钮点击 → 调用 `garden.resetAllCrystals()`
- 滑块拖动 → 调用 `garden.updateTerrainAmplitude(value)`

## 4. 关键技术实现

### 4.1 棱柱几何体生成
使用 `THREE.CylinderGeometry` 或自定义 BufferGeometry：
- 随机边数 6-12
- 顶面半径小于底面半径形成棱柱
- 高度随机 0.8-2.5
- 顶点随机微小抖动增加有机感

### 4.2 材质与发光效果
- `MeshPhysicalMaterial` 实现玻璃质感
- `transmission` 和 `opacity` 控制透明度
- `emissive` 实现发光效果
- `EdgesGeometry` + `LineBasicMaterial` 实现棱边描边

### 4.3 绽放动画
- 将几何体分裂为 6-8 个独立碎片
- 每个碎片应用独立的旋转和位移动画
- 使用 `THREE.Points` 实现粒子系统
- 动画完成后重新生成新的几何体

### 4.4 极光背景
- 使用 `ShaderMaterial` 创建自定义着色器
- 多层噪声叠加实现极光流动效果
- 颜色随时间缓慢变化

### 4.5 地形平滑过渡
- 使用顶点目标位置 + 当前位置插值
- `lerp` 函数实现平滑过渡动画
- 避免直接修改顶点位置造成跳变

### 4.6 性能优化
- 水晶数量限制 ≤ 300
- 粒子系统对象池复用
- Frustum Culling 自动剔除不可见对象
- 材质共享减少状态切换

## 5. 动画系统

使用时间驱动的动画系统：
- 所有动画基于 deltaTime 计算
- 使用 `THREE.Clock` 追踪时间
- 动画状态机管理绽放/生长/悬停状态
- Promise 封装动画完成回调

## 6. 交互检测

使用 `THREE.Raycaster`:
- `pointermove` 事件检测 hover 状态
- `click` 事件检测点击
- `recursive: true` 递归检测子对象
- 优先检测最近的物体

## 7. 构建配置

### Vite 配置
```javascript
resolve: {
  alias: {
    '@': '/src',
  },
},
server: {
  port: 5173,
  open: true,
}
```

### TypeScript 配置
- `strict: true` 严格模式
- `moduleResolution: "bundler"` 模块解析
- `target: "ES2020"` 目标版本
