# 交互式3D植物生长模拟器 - 技术架构文档

## 1. 技术选型

| 类别 | 技术 | 版本要求 | 选型理由 |
|------|------|----------|----------|
| 前端框架 | React | ^18.x | 组件化开发，生态成熟，与R3F兼容良好 |
| 语言 | TypeScript | ^5.x | 严格类型检查，提升代码可维护性 |
| 构建工具 | Vite | ^5.x | 极速冷启动，HMR支持，轻量配置 |
| 3D渲染 | Three.js | ^0.160.x | 业界标准WebGL库，API完善 |
| React 3D层 | @react-three/fiber | ^8.x | React声明式Three.js封装，组件化场景 |
| 3D辅助库 | @react-three/drei | ^9.x | OrbitControls、环境、材质等开箱即用组件 |
| 数据可视化 | D3.js | ^7.x | 灵活的SVG绑定API，支持自定义曲线样式 |
| 类型定义 | @types/three, @types/d3 | 最新 | TypeScript类型支持 |

---

## 2. 项目结构

```
auto119/
├── .trae/documents/
│   ├── PRD.md                    # 产品需求文档
│   └── Architecture.md           # 本技术架构文档
├── package.json                  # 依赖与脚本配置
├── vite.config.js                # Vite构建配置
├── tsconfig.json                 # TypeScript严格模式配置
├── index.html                    # HTML入口，挂载点#root
└── src/
    ├── main.tsx                  # React应用入口，挂载根组件
    ├── App.tsx                   # 主应用组件：状态管理、布局编排
    ├── components/
    │   ├── PlantScene.tsx        # 3D场景组件：花盆、植物、粒子、光照
    │   ├── ControlPanel.tsx      # 控制面板：滑块、按钮、响应式抽屉
    │   └── GrowthChart.tsx       # 生长曲线：D3折线图、渐变填充、阶段标签
    └── utils/
        └── plantGrowth.ts        # 纯函数生长逻辑模块
```

**文件职责说明**：
- **App.tsx**：唯一的状态源，持有生长参数、时间、高度、阶段、曲线数据；向下派发props，向上收集回调。
- **PlantScene.tsx**：无业务逻辑，纯渲染组件；通过props接收当前形态参数，用useFrame执行插值动画。
- **ControlPanel.tsx**：受控UI组件，onChange回调触发父级状态更新；内置响应式断点监听。
- **GrowthChart.tsx**：接收数据数组后通过useEffect调用D3 imperative API渲染SVG。
- **plantGrowth.ts**：纯函数，无副作用；输入参数+delta，输出下一帧形态参数和阶段判断。

---

## 3. 核心数据模型

### 3.1 生长参数 (GrowthParams)
```typescript
interface GrowthParams {
  light: number;       // 光照强度 0-100，默认50
  water: number;       // 水分含量 0-100，默认60
  soil: number;        // 土壤肥沃度 0-100，默认40
}
```

### 3.2 植物形态 (PlantMorphology)
```typescript
interface PlantMorphology {
  height: number;              // 当前高度（单位）
  targetHeight: number;        // 目标高度（受土壤限制）
  stemRadius: number;          // 茎秆半径
  stemBend: number;            // 茎秆弯曲角度（弧度）
  stemColorStart: string;      // 茎秆起始色
  stemColorEnd: string;        // 茎秆终止色
  branchPoints: number[];      // 分叉高度 [0.4, 0.8, 1.2]
  branches: BranchData[];      // 侧枝数据
  leaves: LeafData[];          // 叶片数据
  flower: FlowerData | null;   // 花朵数据（开花阶段）
  stage: GrowthStage;          // 当前生长阶段
  leafYellowing: number;       // 叶片黄化程度 0-1
  leafCurling: number;         // 叶片卷曲程度 0-1
  growthSpeedMultiplier: number; // 生长速度倍率
  statusMessage: string;       // 状态提示文字
}

type GrowthStage = 'seed' | 'germination' | 'seedling' | 'adult' | 'flowering';

interface BranchData {
  id: string;
  height: number;    // 分叉位置高度
  angle: number;     // 分叉角度（弧度）
  direction: number; // 方向（绕Y轴旋转）
  length: number;    // 侧枝长度
}

interface LeafData {
  id: string;
  position: [number, number, number]; // 世界坐标
  rotation: [number, number, number]; // 欧拉角
  scale: number;                      // 缩放
  colorStart: string;
  colorEnd: string;
  yellowing: number;  // 黄化 0-1
  curling: number;    // 卷曲 0-1
  parentType: 'stem' | 'branch';
  parentId?: string;
}

interface FlowerData {
  petalCount: number;    // 5
  petalSize: number;     // 花瓣大小
  petalColor: string;    // #FFB6C1
  centerColor: string;   // 黄色花蕊
  opacity: number;       // 半透明
}
```

### 3.3 曲线数据点 (GrowthDataPoint)
```typescript
interface GrowthDataPoint {
  time: number;    // 秒
  height: number;  // 厘米（单位×100）
}
```

---

## 4. 核心算法与纯函数

### 4.1 生长增量计算 (`plantGrowth.ts`)
```
基础生长率 = 0.1单位 / 5秒 = 0.02单位/秒

光照倍率 L = 0.3 + (light / 100) × 1.4        [0.3 ~ 1.7]
水分倍率 W = 0.2 + (water / 100) × 1.3        [0.2 ~ 1.5]
土壤倍率 S = 0.5 + (soil  / 100) × 1.0        [0.5 ~ 1.5]

综合倍率 M = L × W × S
每帧增量 Δh = 基础生长率 × M × deltaTime

最大高度 H_max = 1.0 + (soil / 100) × 2.0      [1.0 ~ 3.0]
限制条件：h = min(h + Δh, H_max)
```

### 4.2 阶段判断
```
stage =
  h < 0.2                     → 'seed'
  0.2 ≤ h < 0.4               → 'germination'
  0.4 ≤ h < 1.0               → 'seedling'
  1.0 ≤ h < 1.8               → 'adult'
  h ≥ 1.8                     → 'flowering'
```

### 4.3 参数影响映射
| 参数 | 影响字段 | 公式 |
|------|----------|------|
| light | stemBend | `stemBend = (1 - light/100) × 20° × π/180` 最大弯曲20° |
| light | growthSpeedMultiplier | 见4.1 |
| water | leafYellowing | `yellowing = max(0, 1 - water/20)` water<20时开始黄化 |
| water | leafCurling | `curling = max(0, 1 - water/25)` |
| soil | targetHeight | `H_max = 1.0 + soil/100 × 2.0` |
| soil | stemRadius | `radius = 0.02 × (0.6 + soil/100 × 0.8)` |
| soil | flower.petalSize | `size = 0.12 × (0.6 + soil/100 × 0.8)` |

### 4.4 侧枝生成规则
- 分叉点固定位置：[0.4, 0.8, 1.2]
- 当高度超过分叉点 + 0.1时激活该分叉
- 每个分叉点左右两个方向（direction = 0和π）
- 侧枝长度 = min(0.15, (当前高度 - 分叉点) × 0.5)
- 侧枝角度：30° = π/6 弧度

### 4.5 叶片生成规则
- 茎秆顶端：每增长0.08单位高增加一对叶片
- 侧枝末端：每根侧枝末端生成2片叶
- 叶片随机旋转角度：Y轴 0~2π，Z轴 -π/4~π/4
- 叶片颜色按高度从#98FB98（低）插值到#006400（高）

### 4.6 数值过渡（lerp）
```typescript
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}
// 过渡速度：阶段变化0.5秒 → t = 1 - e^(-dt × 6/0.5) ≈ 帧增量×12
// 参数响应3秒 → t = 1 - e^(-dt × 6/3) ≈ 帧增量×2
```

---

## 5. 组件交互架构

```mermaid
graph TD
    "App.tsx" -->|"growthParams"| CP["ControlPanel.tsx<br/>滑块 onChange → setParams"]
    "App.tsx" -->|"morphology, time"| PS["PlantScene.tsx<br/>3D渲染 + lerp动画"]
    "App.tsx" -->|"dataPoints[], stage"| GC["GrowthChart.tsx<br/>D3折线图"]
    CP -->|"onReset() onParamsChange()"| "App.tsx"
    PS -->|"hoverInfo"| "App.tsx"
    "App.tsx" -->|"重置事件"| Reset["重置流程<br/>1. 触发逆生长1s<br/>2. 重置状态<br/>3. 曲线清空"]
    "App.tsx" -->|"阶段变化"| Particles["粒子特效<br/>发芽/开花触发"]
    "useFrame 60FPS" -->|"deltaTime"| Logic["plantGrowth.ts<br/>纯函数计算"]
    Logic -->|"newMorphology"| "App.tsx"
```

**状态管理策略**：
- 单一数据源：`App.tsx` 使用 `useState` 持有所有业务状态
- 动画驱动：`PlantScene` 内的 `useFrame` 每帧调用父组件传入的 `tick(delta)` 回调，`App` 调用纯函数计算新形态后 setState
- 避免重复渲染：子组件接收基础类型props + 使用 `React.memo` 包装

---

## 6. 关键实现方案

### 6.1 3D场景搭建 (PlantScene.tsx)
- **Canvas**：`@react-three/fiber` 的 `<Canvas>` 配置 `camera={{ position: [0, 1.5, 3], fov: 50 }}`，`shadows` 启用
- **背景**：`<Background>` 组件使用渐变纹理或 CSS3D 实现从#87CEEB到#E0F7FA的垂直渐变
- **光照**：`<ambientLight intensity={0.6} />` + `<directionalLight position={[3, 5, 2]} castShadow intensity={params.light/100 * 0.8 + 0.2} />`
- **地面**：drei `<Grid>` 组件，args={[10, 10]}，半透明材质
- **花盆**：`<cylinderGeometry args={[0.8, 0.7, 0.4, 32]}>` 棕色 `MeshStandardMaterial` + `roughness: 0.9`
- **土壤堆**：`<sphereGeometry args={[0.7, 0.1, 32]}>` scale.y压缩
- **相机控制**：`<OrbitControls enablePan={false} minDistance={0.5} maxDistance={5} mouseButtons={{ LEFT: null, RIGHT: MOUSE.ROTATE }} />` 实现右键旋转

### 6.2 植物组件实现
- **茎秆弯曲**：使用自定义曲线 `CatmullRomCurve3` 配合 `TubeGeometry`，控制点根据 stemBend 计算偏移
  - 控制点：P0=(0,0,0), P1=(sin(bend)×h/3, h/3, cos(bend)×h/3), P2=(sin(bend)×2h/3, 2h/3, cos(bend)×2h/3), P3=(sin(bend)×h, h, cos(bend)×h)
- **叶片形态**：使用 `ShapeGeometry` 创建椭圆形状，应用 `Matrix4.makeRotationZ` 实现卷曲效果（沿Z轴压缩一侧）
- **花朵**：5个 `circleGeometry` 旋转72°分布作为花瓣，中心一个黄色小球作为花蕊
- **lerp过渡**：在 `useFrame` 中用 `useRef` 保存上一帧形态，每帧向目标形态插值0.1（约0.5s完成）

### 6.3 粒子特效
- 使用 drei 的 `<Points>` 配合 `BufferGeometry` 管理粒子池（上限50）
- 触发条件：stage 从 'seed'→'germination' 或 'adult'→'flowering'
- 粒子数据：positions + colors + velocities + lifetimes 用 Float32Array
- 每帧更新：lifetime -= delta，过期粒子重置，颜色从#FFD700到#FF69B4按归一化生命周期插值

### 6.4 D3生长曲线 (GrowthChart.tsx)
- SVG尺寸 280×200，margin { top: 20, right: 20, bottom: 30, left: 40 }
- X轴比例尺：`d3.scaleLinear().domain([0, max(30, data.length)]).range([0, width])`
- Y轴比例尺：`d3.scaleLinear().domain([0, max(3, maxHeight)]).range([height, 0])`
- 折线生成器：`d3.line().x(d=>x(d.time)).y(d=>y(d.height)).curve(d3.curveMonotoneX)`
- 渐变填充：`<linearGradient>` + `<area>` 曲线下填充，opacity 0.3
- 圆点标记：`<circle r=3>` 在每个数据点
- 动画：新数据点通过 transition() 过渡，d3.select驱动

### 6.5 重置流程
1. 点击按钮 → App设置 `isResetting=true`，禁用按钮
2. PlantScene检测到 `isResetting`，启动1秒逆生长：
   - 每帧 height = lerp(current, 0, 0.05)
   - 记录逆生长起始高度 h0
   - 进度 progress = 1 - (height / h0)
3. 当 progress ≥ 0.99 或 height < 0.01 → 触发 App 的 `completeReset()`
4. completeReset 重置所有state：params默认值，time=0，dataPoints=[], stage='seed', isResetting=false

### 6.6 响应式抽屉
- 使用 `window.matchMedia('(max-width: 1024px)')` 监听媒体查询
- 窄屏：ControlPanel 渲染为 fixed 左侧抽屉 + 汉堡按钮（绝对定位左上角）
- 抽屉动画：CSS transform: translateX(-100%) → 0，transition 0.3s ease

### 6.7 悬停信息标签
- 植物各组件设置 `userData={{ type: 'stem'|'leaf'|... }}`
- Canvas 外使用 drei `<Html>` 组件跟随鼠标位置显示信息
- 显示内容：高度、叶片数、阶段等

---

## 7. 性能优化策略

| 优化点 | 方案 |
|--------|------|
| 渲染帧率 | 控制 useFrame 中计算量，使用 useMemo 缓存 geometry，避免每帧重建 |
| 植物组件 | 使用 `<group>` 组织，整体 scale 变化时不重建几何 |
| 叶片几何 | 同一形状叶片共享 geometry 引用，仅变换矩阵不同 |
| 曲线数据点 | `dataPoints.length > 300` 时 `dataPoints.shift()` 移除最早点 |
| 粒子池 | 对象池复用BufferAttribute，不销毁重建 |
| D3渲染 | useEffect 依赖 `[dataPoints]`，深比较触发重绘 |
| 状态更新 | React.memo 包装子组件，props 浅比较 |
| 构建产物 | Vite生产构建代码分割，Three.js动态import懒加载 |

---

## 8. 构建与开发

### 8.1 Scripts
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

### 8.2 依赖清单
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "three": "^0.160.0",
    "d3": "^7.8.5",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.92.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "@types/three": "^0.160.0",
    "@types/d3": "^7.4.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0"
  }
}
```

### 8.3 TypeScript严格模式
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "jsx": "react-jsx"
  }
}
```
