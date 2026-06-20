# 技术架构文档：量子拓扑微雕工坊

## 1. 架构设计

```mermaid
flowchart TB
    subgraph "UI层 (React DOM)"
        CP["ControlPanel.tsx<br/>参数控制面板"]
        TB["Toolbar.tsx (内联于App)<br/>底部模式工具栏"]
        IP["InfoPanel.tsx (内联于App)<br/>左侧拓扑信息面板"]
    end

    subgraph "3D渲染层 (@react-three/fiber)"
        SC["Scene3D.tsx<br/>Canvas + 场景容器"]
        PT["ParticleSystem (内联)<br/>粒子+轨迹渲染"]
        LG["LightRig (内联)<br/>灯光组"]
        BG["Starfield (内联)<br/>星云背景"]
    end

    subgraph "状态与数据层"
        APP["App.tsx<br/>全局状态管理 (useState/useRef)"]
        TC["topologyCalculator.ts<br/>拓扑路径计算工具"]
        EH["exportHelper.ts<br/>PNG/JSON导出工具"]
    end

    CP -->|参数变更事件| APP
    TB -->|模式切换/导出事件| APP
    IP -->|关闭面板事件| APP
    APP -->|topologyData props| SC
    APP -->|调用计算| TC
    TC -->|返回ParticleData[]| APP
    SC -->|canvasRef| EH
    TB -->|调用导出| EH
    SC -->|选中结回传| APP
```

## 2. 技术描述

- **前端框架**：React 18 + TypeScript 5
- **构建工具**：Vite 5（热更新、原生ESM、Rollup生产构建）
- **3D渲染**：Three.js r160 + @react-three/fiber 8 + @react-three/drei 9
- **CSS方案**：原生CSS + CSS变量 + styled-components风格的内联样式（避免额外依赖，文件内style属性+CSS类混合）
- **ID生成**：uuid 9
- **后端**：无（纯前端静态应用）
- **部署**：Vite build 输出静态资源至 dist/

## 3. 目录结构与文件职责

| 文件路径 | 职责说明 |
|---------|---------|
| `package.json` | 依赖声明：react, react-dom, typescript, vite, @types/*, three, @react-three/fiber, @react-three/drei, uuid；脚本：npm run dev/build/preview |
| `index.html` | 入口HTML，title=量子拓扑微雕工坊，挂载点#root，引入Google Fonts等宽字体 |
| `tsconfig.json` | strict=true，baseUrl="./src"，paths: {"@/*": ["./*"]}，jsx=react-jsx，target=ES2020 |
| `vite.config.js` | @vitejs/plugin-react，resolve.alias @ → src，server.port=5173 |
| `src/main.tsx` | ReactDOM.createRoot 挂载 App 组件，StrictMode |
| `src/App.tsx` | 组合 Scene3D + ControlPanel + Toolbar + InfoPanel；管理全局 state：particleCount, speed, topologyMode, interactionMode, selectedKnot, knotPositions；提供 onParamChange, onModeChange, onExport, onKnotSelect 回调 |
| `src/components/Scene3D.tsx` | R3F Canvas，OrbitControls(autoRotate带条件)，灯光组，星点背景，内联 ParticleSystem 组件（消费topologyData prop，管理粒子Points + 轨迹LineSegments，useFrame更新位置/动画插值，raycaster点击选中检测） |
| `src/components/ControlPanel.tsx` | 右侧可折叠面板UI，使用CSS类实现毛玻璃+霓虹效果；三个控件：粒子数量range(100-1000 step=50)、速度range(0.1-3 step=0.1)、拓扑模式select(环面结/三叶结/莫比乌斯带/自定义组合)；折叠按钮(齿轮图标) |
| `src/utils/topologyCalculator.ts` | 核心工具函数：generateKnotPath(type, params)→Vector3[]，distributeParticlesOnPath(path, count)→ParticleData[]，calculateTopologyParams(type)→TopologyInfo；导出 calculateTopology(config)→TopologyResult 接口供App调用 |
| `src/utils/exportHelper.ts` | exportPNG(canvas, filename)→Promise<void>（toDataURL→Blob→下载），exportJSON(particleData, filename)→void（JSON.stringify→Blob→下载） |

## 4. 核心数据类型定义

```typescript
// src/utils/topologyCalculator.ts

export type TopologyMode = 'torus' | 'trefoil' | 'mobius' | 'custom';

export interface KnotConfig {
  id: string;
  type: TopologyMode;
  p?: number; // 环面结参数p
  q?: number; // 环面结参数q
  color: string; // 十六进制色系
  center: [number, number, number]; // 结中心位置
  scale: number;
}

export interface ParticleData {
  id: string;
  knotId: string;
  position: [number, number, number]; // 当前位置
  targetPosition: [number, number, number]; // 插值目标位置
  pathProgress: number; // 路径上的参数t∈[0,1)
  color: string;
  size: number;
}

export interface TopologyInfo {
  knotId: string;
  name: string;
  windingNumber: number; // 绕数
  crossingNumber: number; // 交点数
  energyValue: number; // 归一化能量
  genus: number; // 亏格
}

export interface TopologyResult {
  particles: ParticleData[];
  knots: KnotConfig[];
  knotInfos: TopologyInfo[];
  pathCache: Record<string, [number, number, number][]>; // 每个结的采样路径点，用于轨迹绘制
}
```

## 5. 关键算法说明

### 5.1 拓扑路径参数方程

| 拓扑类型 | 参数方程 |
|---------|---------|
| **环面结(p,q)** | x=(R+r·cos(qθ))·cos(pθ); y=(R+r·cos(qθ))·sin(pθ); z=r·sin(qθ)，θ∈[0,2π)，默认R=1.2, r=0.5 |
| **三叶结(trefoil)** | x=sinθ+2sin2θ; y=cosθ-2cos2θ; z=-sin3θ，θ∈[0,2π)，整体缩放0.5 |
| **莫比乌斯带** | x=(R+s·cos(θ/2))cosθ; y=(R+s·cos(θ/2))sinθ; z=s·sin(θ/2)，s∈[-w,w]，取粒子沿s=0中线 |
| **自定义组合** | 四个结分别取类型(2,3)(3,2)(2,5)(5,2)环面结 |

### 5.2 动画插值策略

- **位置过渡**：记录旧位置数组，参数变更时启动t=0→1计时(300ms)，每帧 `current = lerp(old, target, easeOutBack(t))`
- **easeOutBack**：`c4 * t * t * ((s + 1) * t + s) + 1`，s=1.70158，产生轻微弹跳过冲效果
- **轨迹渐隐**：轨迹线段维护alpha字段，参数变更时旧轨迹alpha线性衰减，新轨迹alpha从0增长

### 5.3 性能优化措施

1. **BufferGeometry复用**：参数变更仅更新attribute数组，不重建Geometry/Material
2. **TypedArray**：position/color使用Float32Array，避免频繁对象GC
3. **useFrame节流**：粒子位置更新使用delta累积，不做不必要的属性拷贝
4. **轨迹缓冲环**：每个结轨迹限制最大线段数(如500段)，超出后覆盖最旧段
5. **Raycaster优化**：点击检测使用包围盒粗筛，只对粒子system进行raycast

## 6. 性能与兼容性指标

| 指标 | 目标值 |
|-----|-------|
| 500粒子帧率 | ≥60FPS (≤16.7ms/帧) |
| 1000粒子帧率 | ≥45FPS (≤22.2ms/帧) |
| 参数变更过渡时长 | 300ms±20ms |
| UI元素过渡时长 | 200-300ms |
| 首屏可交互时间(Dev) | ≤3s |
| 浏览器兼容 | Chrome≥90, Edge≥90, Safari≥15, Firefox≥88 |
