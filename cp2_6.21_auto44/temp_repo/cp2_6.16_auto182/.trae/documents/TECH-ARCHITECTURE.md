# CloudWeaver 技术架构文档

## 1. 技术栈选型

| 技术 | 版本 | 用途 |
|------|------|------|
| TypeScript | 5.x | 类型安全的开发语言 |
| Three.js | 0.160.0 | 3D 渲染引擎 |
| Vite | 5.x | 构建工具与开发服务器 |
| @types/three | 0.160.0 | Three.js 类型定义 |

---

## 2. 项目结构

```
auto182/
├── package.json              # 项目依赖与脚本
├── index.html                # 入口 HTML
├── vite.config.js            # Vite 构建配置
├── tsconfig.json             # TypeScript 配置
└── src/
    ├── main.ts               # 应用入口：场景、相机、渲染器初始化
    ├── cloudSystem.ts        # 粒子系统核心类
    ├── uiController.ts       # UI 控制逻辑
    └── types.ts              # TypeScript 类型定义
```

---

## 3. 核心模块设计

### 3.1 类型定义模块 (`types.ts`)

#### 3.1.1 云类型枚举
```typescript
enum CloudType {
  CUMULUS = 'cumulus',    // 积云
  STRATUS = 'stratus',    // 层云
  CIRRUS = 'cirrus',      // 卷云
}
```

#### 3.1.2 粒子数据接口
```typescript
interface CloudParticle {
  position: Float32Array;    // [x, y, z]
  basePosition: Float32Array; // 初始位置，用于风力计算
  size: number;              // 粒子半径
  opacity: number;           // 透明度
  velocity: Float32Array;    // 速度向量
  turbulenceOffset: Float32Array; // 湍流偏移
}
```

#### 3.1.3 降水粒子接口
```typescript
interface PrecipitationParticle {
  position: Float32Array;
  velocity: Float32Array;
  opacity: number;
  swingOffset: number;       // 正弦摆动相位
}
```

#### 3.1.4 系统参数接口
```typescript
interface SystemParams {
  cloudType: CloudType;
  windSpeed: number;         // 0-20 m/s
  windDirection: number;     // 0-360 度
  precipitationIntensity: number; // 0-100%
  cloudDensity: number;      // 云层密度
}
```

#### 3.1.5 云类型配置
```typescript
interface CloudTypeConfig {
  name: string;
  color: string;
  particleCount: number;
  sizeRange: [number, number];
  distribution: 'clustered' | 'layered' | 'wispy';
  opacity: number;
}
```

---

### 3.2 粒子系统模块 (`cloudSystem.ts`)

#### 3.2.1 类定义
```typescript
class CloudSystem {
  private scene: THREE.Scene;
  private cloudPoints: THREE.Points;
  private precipitationPoints: THREE.Points;
  private params: SystemParams;
  
  // 粒子数据 (Typed Arrays 避免 GC)
  private cloudPositions: Float32Array;
  private cloudBasePositions: Float32Array;
  private cloudSizes: Float32Array;
  private cloudOpacities: Float32Array;
  private cloudVelocities: Float32Array;
  private turbulenceOffsets: Float32Array;
  
  private precipPositions: Float32Array;
  private precipVelocities: Float32Array;
  private precipOpacities: Float32Array;
  private precipSwingOffsets: Float32Array;
  
  constructor(scene: THREE.Scene);
  
  // 公共方法
  public updateParams(params: Partial<SystemParams>): void;
  public update(deltaTime: number): void;
  public getParticleCount(): number;
  public dispose(): void;
  
  // 私有方法
  private initCloudParticles(): void;
  private initPrecipitationParticles(): void;
  private generateCumulusPositions(): void;
  private generateStratusPositions(): void;
  private generateCirrusPositions(): void;
  private updateCloudPositions(delta: number): void;
  private updatePrecipitation(delta: number): void;
  private regenerateCloud(): void;
}
```

#### 3.2.2 云生成算法

**积云 (Cumulus)**:
- 使用高斯分布生成团簇状粒子
- 中心区域粒子密集，边缘稀疏
- 粒子大小范围：0.15 - 0.3 单位
- 整体形态：蓬松的棉花球状

**层云 (Stratus)**:
- 在水平面上均匀分布
- 垂直方向压缩为扁平带状
- 粒子大小范围：0.1 - 0.2 单位
- 整体形态：水平延展的云层

**卷云 (Cirrus)**:
- 稀疏分布，形成丝缕状结构
- 使用 Perlin 噪声生成流线型分布
- 粒子大小范围：0.05 - 0.15 单位
- 整体形态：纤细的羽毛状

#### 3.2.3 动态效果实现

**风力效果**:
1. 计算风向向量：`(cos(rad), 0, sin(rad))`
2. 粒子基础位置平移：`basePos += windVector * windSpeed * delta`
3. 湍流抖动：使用 sin/cos 函数生成伪随机偏移，幅度随风速增大
4. 边缘粒子：距离中心越远，消散效果越明显

**降水效果**:
1. 从云层底部随机位置生成降水粒子
2. 下落速度：`0.5 + (intensity / 100) * 2.5` 单位/秒
3. 水平摆动：`sin(time * 2 + swingOffset) * 0.1 * (windSpeed / 10)`
4. 粒子落地后循环回顶部

---

### 3.3 UI 控制模块 (`uiController.ts`)

#### 3.3.1 类定义
```typescript
class UIController {
  private cloudSystem: CloudSystem;
  private params: SystemParams;
  
  // UI 元素引用
  private controlPanel: HTMLElement;
  private toggleButton: HTMLElement;
  private tabs: HTMLElement[];
  private tabContents: HTMLElement[];
  
  // 统计面板元素
  private particleCountEl: HTMLElement;
  private cloudTypeEl: HTMLElement;
  private windSpeedEl: HTMLElement;
  private precipitationEl: HTMLElement;
  
  constructor(cloudSystem: CloudSystem, initialParams: SystemParams);
  
  // 公共方法
  public updateStats(): void;
  public dispose(): void;
  
  // 私有方法
  private initUI(): void;
  private bindEvents(): void;
  private togglePanel(): void;
  private switchTab(index: number): void;
  private onCloudTypeChange(type: CloudType): void;
  private onWindSpeedChange(value: number): void;
  private onWindDirectionChange(value: number): void;
  private onPrecipitationChange(value: number): void;
}
```

#### 3.3.2 UI 组件结构

```
控制面板 (.control-panel)
├── 切换按钮 (.panel-toggle)
└── 面板内容 (.panel-content)
    ├── 选项卡导航 (.tab-nav)
    │   ├── 云类型 (.tab-btn active)
    │   ├── 风参数 (.tab-btn)
    │   └── 降水 (.tab-btn)
    └── 选项卡内容 (.tab-content)
        ├── 云类型选项卡 (.tab-pane active)
        │   ├── 积云按钮 (.cloud-btn cumulus)
        │   ├── 层云按钮 (.cloud-btn stratus)
        │   └── 卷云按钮 (.cloud-btn cirrus)
        ├── 风参数选项卡 (.tab-pane)
        │   ├── 风速滑块 (.slider wind-speed)
        │   └── 风向旋钮 (.knob wind-direction)
        └── 降水选项卡 (.tab-pane)
            └── 降水强度滑块 (.slider precipitation)

统计面板 (.stats-panel)
├── 粒子总数 (.stat-item)
├── 云类型 (.stat-item)
├── 风速 (.stat-item)
└── 降水强度 (.stat-item)
```

---

### 3.4 主入口模块 (`main.ts`)

#### 3.4.1 初始化流程
```typescript
// 1. 初始化 Three.js 基础组件
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(...);
const renderer = new THREE.WebGLRenderer({ antialias: true });

// 2. 设置天空背景渐变
scene.background = createSkyGradient();

// 3. 添加轨道控制器
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;

// 4. 初始化粒子系统
const cloudSystem = new CloudSystem(scene);

// 5. 初始化 UI 控制器
const uiController = new UIController(cloudSystem, initialParams);

// 6. 启动渲染循环
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();
  controls.update();
  cloudSystem.update(delta);
  uiController.updateStats();
  renderer.render(scene, camera);
}
animate();
```

#### 3.4.2 天空渐变实现
使用 `CanvasTexture` 创建渐变纹理作为场景背景：
```typescript
function createSkyGradient(): THREE.Texture {
  const canvas = document.createElement('canvas');
  canvas.width = 2;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;
  const gradient = ctx.createLinearGradient(0, 0, 0, 512);
  gradient.addColorStop(0, '#87CEEB');
  gradient.addColorStop(1, '#B0E0E6');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 2, 512);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
```

---

## 4. 性能优化策略

### 4.1 内存管理
- 使用 `Float32Array` 存储所有粒子数据，避免频繁对象创建
- 粒子池化：预分配最大数量的粒子数组，运行时仅更新可见性
- 避免在渲染循环中创建新对象

### 4.2 渲染优化
- 使用 `THREE.Points` 批量渲染粒子，而非独立网格
- 启用 `PointsMaterial` 的 `transparent` 和 `depthWrite: false`
- 使用 `alphaTest` 优化半透明渲染
- 粒子大小使用 `sizeAttenuation: true` 实现透视效果

### 4.3 计算优化
- 粒子位置更新使用向量化计算
- 湍流抖动使用预计算的正弦波表
- 降水粒子更新只处理活动粒子（根据强度动态调整）

---

## 5. 关键算法

### 5.1 伪随机数生成
使用确定性种子随机数，保证云形态可复现：
```typescript
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}
```

### 5.2 三维高斯分布
用于生成积云团簇形态：
```typescript
function gaussianRandom(): number {
  const u1 = Math.random();
  const u2 = Math.random();
  return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}
```

### 5.3 湍流抖动计算
```typescript
function calculateTurbulence(
  time: number,
  offset: [number, number, number],
  windSpeed: number
): [number, number, number] {
  const scale = 0.1 + (windSpeed / 20) * 0.3;
  return [
    Math.sin(time * 1.5 + offset[0]) * scale,
    Math.cos(time * 1.2 + offset[1]) * scale * 0.5,
    Math.sin(time * 1.8 + offset[2]) * scale,
  ];
}
```

---

## 6. 构建配置

### 6.1 Vite 配置 (`vite.config.js`)
```javascript
import { defineConfig } from 'vite';

export default defineConfig({
  root: '.',
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    target: 'es2020',
  },
  optimizeDeps: {
    include: ['three'],
  },
});
```

### 6.2 TypeScript 配置 (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"]
  },
  "include": ["src"]
}
```
