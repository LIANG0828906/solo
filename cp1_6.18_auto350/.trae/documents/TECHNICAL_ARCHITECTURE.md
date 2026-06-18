# 星图演算 - 技术架构文档

## 1. 技术栈选型

| 类别 | 技术 | 版本 | 用途 |
|------|------|------|------|
| UI框架 | React | ^18 | 组件化开发 |
| 渲染引擎 | Three.js | ^0.160 | 3D图形渲染 |
| React绑定 | @react-three/fiber | ^8 | React-Three.js桥接 |
| 辅助组件 | @react-three/drei | ^9 | 常用3D组件封装 |
| 状态管理 | Zustand | ^4 | 轻量级状态管理 |
| 构建工具 | Vite | ^5 | 快速构建与开发 |
| 语言 | TypeScript | ^5 | 类型安全 |
| ID生成 | uuid | ^9 | 唯一标识符生成 |

---

## 2. 目录结构与模块职责

```
src/
├── types.ts              # 接口定义模块（被所有模块引用）
├── dataLoader.ts         # 数据加载模块（硬编码星图数据 + 解析）
├── starStore.ts          # 状态管理模块（Zustand store）
├── sceneManager.ts       # 3D场景模块（星体、连线、轨迹、动画）
├── interaction.ts        # 交互模块（点击、拖拽、缩放）
├── App.tsx               # 主应用组件
├── main.tsx              # 应用入口
└── index.css             # 全局样式
```

### 模块调用关系与数据流向

```
                    ┌─────────────┐
                    │  types.ts   │ ◄────── 所有模块引用
                    └─────────────┘
                           ▲
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
        ▼                  ▼                  ▼
┌──────────────┐   ┌──────────────┐   ┌──────────────┐
│ dataLoader   │──►│  starStore   │◄──│ interaction  │
└──────────────┘   └──────────────┘   └──────────────┘
                           ▲
                           │ 读取状态
                           ▼
                    ┌──────────────┐
                    │ sceneManager │
                    └──────────────┘
```

**数据流向说明：**

1. **types.ts** → 定义 `StarData`, `Constellation`, `TimelineState` 等核心类型
2. **dataLoader.ts** → 硬编码3个年代的星图数据，解析为 `StarData[]` 和 `Constellation[]`，写入 `starStore`
3. **starStore.ts** → 基于Zustand的状态中心：
   - 写入方：`interaction.ts`（年代切换、星体选择）、`sceneManager.ts`（动画控制）
   - 读取方：`sceneManager.ts`（渲染星体/连线/轨迹）
4. **sceneManager.ts** → 接收store数据，生成Three.js对象，处理时间轴插值动画
5. **interaction.ts** → 监听用户交互，更新store状态

---

## 3. 核心模块设计

### 3.1 接口定义模块 (types.ts)

```typescript
// 星体在三维空间中的位置
export interface Position3D {
  x: number;
  y: number;
  z: number;
}

// 星体数据
export interface StarData {
  id: string;
  name: string;
  constellationId: string;
  magnitude: number;  // 星等
  eraPositions: Position3D[];  // 三个年代的位置 [公元前2000, 公元元年, 公元1500]
}

// 星座连线
export interface Connection {
  starIdA: string;
  starIdB: string;
}

// 星座数据
export interface Constellation {
  id: string;
  name: string;
  starIds: string[];
  connections: Connection[];
  labelPosition: Position3D;  // 星座标签位置
}

// 年代信息
export interface Era {
  index: number;
  name: string;
  year: number;
}

// 时间轴状态
export interface TimelineState {
  currentEraIndex: number;      // 当前年代索引 0-2
  targetEraIndex: number;       // 目标年代索引
  transitionProgress: number;   // 过渡进度 0-1
  isPlaying: boolean;           // 是否正在播放动画
  selectedStarId: string | null; // 选中的星体ID
}

// 星体渲染状态（用于内部插值）
export interface StarRenderState {
  id: string;
  currentPosition: Position3D;
  targetPosition: Position3D;
  visualSize: number;
  visualColor: string;
  isHighlighted: boolean;
}
```

### 3.2 数据加载模块 (dataLoader.ts)

**职责：**
- 硬编码3个年代 × 15个星座 × 每星座3-6颗星的数据
- 生成星体间的连线关系
- 初始化Zustand store

**核心函数：**
```typescript
export function loadAllStarData(): {
  stars: StarData[];
  constellations: Constellation[];
  eras: Era[];
}
```

**星座列表（15个）：**
1. 北斗七星 (Ursa Major)
2. 猎户座 (Orion)
3. 天蝎座 (Scorpius)
4. 狮子座 (Leo)
5. 仙女座 (Andromeda)
6. 天鹅座 (Cygnus)
7. 天鹰座 (Aquila)
8. 双子座 (Gemini)
9. 处女座 (Virgo)
10. 水瓶座 (Aquarius)
11. 白羊座 (Aries)
12. 金牛座 (Taurus)
13. 巨蟹座 (Cancer)
14. 摩羯座 (Capricornus)
15. 天秤座 (Libra)

### 3.3 状态管理模块 (starStore.ts)

**基于Zustand的Store设计：**

```typescript
interface StarStore {
  // 数据
  stars: StarData[];
  constellations: Constellation[];
  eras: Era[];
  
  // 时间轴状态
  currentEraIndex: number;
  targetEraIndex: number;
  transitionProgress: number;
  isPlaying: boolean;
  
  // 交互状态
  selectedStarId: string | null;
  hoveredStarId: string | null;
  
  // Actions
  setEra: (index: number) => void;
  setTransitionProgress: (p: number) => void;
  togglePlay: () => void;
  selectStar: (id: string | null) => void;
  advanceEra: () => void;  // 动画播放时调用
  initializeData: () => void;
}
```

### 3.4 3D场景模块 (sceneManager.ts)

**包含的React Three Fiber组件：**

| 组件 | 职责 |
|------|------|
| `StarField` | 渲染所有星体（Points + 发光Sprite） |
| `ConstellationLines` | 渲染星座连线（LineSegments） |
| `ConstellationLabels` | 渲染星座名称标签（Text + Billboard） |
| `StarTrajectories` | 渲染星体轨迹圆环（RingGeometry） |
| `SelectedStarGlow` | 渲染选中星体的高亮发光效果 |
| `TimelineAnimator` | 时间轴动画控制器（useFrame钩子） |

**星体颜色映射算法：**
```typescript
// 星等越小（越亮）→ 越接近白色；星等越大（越暗）→ 越接近深蓝色
function magnitudeToColor(magnitude: number): THREE.Color {
  const t = clamp((magnitude + 1.5) / 6, 0, 1);  // 映射到0-1范围
  return new THREE.Color().lerpColors(
    new THREE.Color('#FFFFFF'),
    new THREE.Color('#1A237E'),
    t
  );
}
```

**星体尺寸映射：**
```typescript
function magnitudeToSize(magnitude: number): number {
  // 星等越小尺寸越大，范围1-3像素
  return 3 - clamp((magnitude + 1.5) / 3, 0, 2);
}
```

**位置插值算法：**
```typescript
// 每帧计算星体位置（线性插值，优化：缓存计算结果）
function interpolatePosition(
  eraA: Position3D,
  eraB: Position3D,
  t: number
): Position3D {
  return {
    x: eraA.x + (eraB.x - eraA.x) * t,
    y: eraA.y + (eraB.y - eraA.y) * t,
    z: eraA.z + (eraB.z - eraA.z) * t,
  };
}
```

### 3.5 交互模块 (interaction.ts)

**功能划分：**

| 功能 | 实现方式 |
|------|----------|
| 点击选择星体 | raycaster + pointerdown事件 |
| 拖拽旋转 | OrbitControls (drei)，灵敏度0.5 |
| 滚轮缩放 | OrbitControls，缩放范围3-20 |
| 高亮选中星体 | 放大至200% + 发光光晕Sprite |
| 控制台输出 | console.log 星体名称 |

---

## 4. 性能优化策略

### 4.1 渲染性能
- **Points批量渲染**：所有星体使用单个Points对象而非多个Mesh，减少Draw Call
- **LineSegments批量**：所有星座连线使用单个LineSegments对象
- **材质复用**：相同属性的几何体共享材质实例
- **几何体缓存**：RingGeometry按半径缓存，避免重复创建

### 4.2 动画性能
- **requestAnimationFrame批次**：所有状态更新统一在useFrame内处理
- **插值计算优化**：
  - 使用TypedArray存储位置数据
  - 预计算相邻年代间的位移向量，避免重复计算
  - 每帧插值计算控制在2ms以内（约150颗星）
- **避免重渲染**：
  - 使用Zustand的selector精确订阅
  - React Three Fiber的memo优化
  - 标签仅在必要时更新

### 4.3 内存管理
- 纹理资源按需创建并复用
- Sprite的圆形渐变纹理通过Canvas程序化生成，仅创建一次
- 组件卸载时清理事件监听器和动画引用

---

## 5. 状态管理数据流

```
用户操作
   │
   ▼
┌─────────────────────────────────────────────────┐
│              Zustand Store                      │
│                                                 │
│  currentEraIndex ────────┐                      │
│  targetEraIndex          │                      │
│  transitionProgress      │                      │
│  isPlaying               ├─► sceneManager 渲染   │
│  selectedStarId          │   (selector订阅)      │
│  hoveredStarId           │                      │
│  stars[]                 │                      │
│  constellations[] ───────┘                      │
└─────────────────────────────────────────────────┘
         ▲                         │
         │ update                  │ 动画帧更新
         │                         ▼
    interaction.ts          TimelineAnimator
    (UI事件/射线拾取)       (useFrame循环)
```

---

## 6. UI组件层次结构

```
App.tsx
├── Canvas (React Three Fiber)
│   ├── Scene (深空渐变背景)
│   ├── Camera (PerspectiveCamera)
│   ├── OrbitControls (拖拽/缩放)
│   ├── StarField (星体)
│   ├── ConstellationLines (连线)
│   ├── ConstellationLabels (标签，桌面端)
│   ├── StarTrajectories (轨迹环)
│   ├── SelectedStarGlow (选中发光)
│   └── TimelineAnimator (动画循环)
│
├── StarInfoPanel (星体详情面板)
│   ├── 左侧滑入 (≥768px)
│   └── 底部弹出 (<768px)
│
├── ControlPanel (右侧控制面板)
│   ├── PlayPauseButton (播放/暂停)
│   └── EraSlider (年代滑块)
│
└── HintOverlay (左下角操作提示)
```

---

## 7. 构建配置要点

### 7.1 Vite配置 (vite.config.js)
- 启用 `@vitejs/plugin-react`
- 优化依赖预构建（three相关）
- Source Map开启（开发环境）

### 7.2 TypeScript配置 (tsconfig.json)
- 严格模式（strict: true）
- esModuleInterop: true
- JSX: react-jsx
- 路径别名（可选）

### 7.3 依赖清单
```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "three": "^0.160.0",
    "@react-three/fiber": "^8.15.0",
    "@react-three/drei": "^9.92.0",
    "zustand": "^4.4.7",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "@types/three": "^0.160.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@types/uuid": "^9.0.0"
  }
}
```

---

## 8. 动画过渡设计

| 动画类型 | 时长 | 曲线 | 说明 |
|----------|------|------|------|
| 星体位置插值 | 1000ms | ease-in-out | 年代切换时 |
| 面板滑入/出 | 300ms | ease-out | 信息面板 |
| 高亮放大 | 300ms | ease | 星体选中 |
| 滑块同步移动 | 实时跟随 | - | 动画播放时 |
| 悬停反馈 | 150ms | ease | 鼠标悬停星体 |

---

## 9. 可扩展性预留

- **数据接口抽象**：`dataLoader` 可替换为从API加载真实天文数据
- **年代扩展**：`eraPositions` 数组支持更多年代
- **滤镜系统**：可按星座/星等过滤星体显示
- **导出功能**：可扩展截图/录制动画功能
- **多语言**：标签文本支持国际化
