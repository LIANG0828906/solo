## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层"
        A["React 应用入口<br/>main.tsx"] --> B["状态管理层<br/>zustand store"]
        A --> C["3D渲染层<br/>@react-three/fiber"]
        A --> D["UI控制层<br/>framer-motion"]
        C --> C1["仪象台组件<br/>仪象台.tsx"]
        C --> C2["浑象天球子组件"]
        C --> C3["报时木人子组件"]
        C --> C4["齿轮组子组件"]
        C --> C5["水轮子组件"]
        D --> D1["控制面板组件<br/>控制面板.tsx"]
        B --> E["业务逻辑层<br/>use仪象台逻辑.ts"]
        E --> F["工具函数层<br/>utils/"]
        C --> G["Three.js场景"]
        G --> G1["光照系统"]
        G --> G2["相机系统"]
        G --> G3["后处理效果"]
        H["Web Audio API<br/>音效合成
```

## 2. 技术描述

* **前端框架**：React\@18 + TypeScript\@5 + Vite\@5

* **3D引擎**：three\@0.160 + @react-three/fiber\@8 + @react-three/drei\@9

* **状态管理**：zustand\@4

* **动画库**：framer-motion\@11

* **开发工具**：@vitejs/plugin-react\@4

## 3. 项目结构

```
auto39/
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
├── .trae/
│   └── documents/
│       ├── prd.md
│       └── tech-architecture.md
└── src/
    ├── main.tsx
    ├── components/
    │   ├── 仪象台.tsx
    │   └── 控制面板.tsx
    ├── hooks/
    │   └── use仪象台逻辑.ts
    ├── store/
    │   └── 仪象台Store.ts
    ├── utils/
    │   ├── 音效.ts
    │   ├── 时辰.ts
    │   └── 常量.ts
    └── types/
        └── index.ts
```

## 4. 状态管理设计

### 4.1 Zustand Store 结构

```typescript
interface 仪象台State {
  // 运行状态
  isRunning: boolean
  speed: number           // 0.1 - 10
  baseRotationPeriod: number  // 天球旋转周期（秒）
  
  // 天体状态
  天球角度: number       // 0 - 360度
  当前时辰: number       // 0 - 11 (子丑寅卯...)
  
  // 齿轮状态
  齿轮转速比例: number[]  // 4个齿轮的转速比例
  高亮齿轮: number | null
  
  // 相机状态
  相机目标位置: [number, number, number]
  相机目标朝向: [number, number, number]
  选中部件: string | null
  
  // 报时状态
  正在报时: boolean
  报时进度: number
  
  // Actions
  toggle运行: () => void
  set速度: (speed: number) => void
  set天球角度: (angle: number) => void
  set齿轮转速比例: (index: number, ratio: number) => void
  set高亮齿轮: (index: number | null) => void
  set选中部件: (name: string | null) => void
  触发报时: () => void
  重置相机: () => void
}
```

## 5. 核心组件设计

### 5.1 仪象台组件 (仪象台.tsx)

* **职责**：构建3D模型层次结构，管理所有3D对象

* **子组件**：

  * 木阁结构：5层木构架，每层带斗拱和翘角屋檐

  * 浑象天球：星点粒子系统 + 银河带纹理

  * 报时木人：两尊人形模型，带动画状态机

  * 齿轮组：4个啮合齿轮，支持拖拽交互

  * 水轮：底层驱动轮，与齿轮联动

* **交互**：Raycaster检测点击，OrbitControls控制视角

* **动画循环**：useFrame驱动所有旋转动画

### 5.2 控制面板组件 (控制面板.tsx)

* **职责**：2D覆盖UI，framer-motion动画

* **元素**：

  * 启动/暂停按钮 (▶/⏸)

  * 速度滑块 (0.1x - 10x)

  * 时辰显示

  * 传动比显示

  * 重置视角按钮

* **响应式**：根据屏幕宽度调整位置和尺寸

### 5.3 use仪象台逻辑 Hook

* **职责**：核心业务逻辑

* **功能**：

  * 天球角度计算与时辰判定

  * 齿轮转速联动计算

  * 报时事件触发

  * 相机平滑移动插值

  * 音效播放控制

## 6. 性能优化策略

### 6.1 3D渲染优化

* **几何体复用**：InstancedMesh渲染星点

* **材质共享**：相同材质的木构件共享MeshStandardMaterial

* **LOD**：远景减少细节

* **阴影优化**：仅关键物体投射/接收阴影

* **帧率控制**：useFrame中限制计算量

### 6.2 计算优化

* **齿轮联动**：预计算传动比矩阵，O(1)查询

* **角度计算**：增量计算避免三角函数

* **事件节流**：拖拽事件节流到16ms

### 6.3 内存优化

* **纹理压缩**：使用KTX2压缩纹理

* **对象池**：复用临时向量/矩阵对象

* **及时清理**：组件卸载时dispose几何体和材质

## 7. 数据定义

### 7.1 十二时辰数据

```typescript
const 十二时辰 = [
  { 名称: '子', 对应角度: 0 },
  { 名称: '丑', 对应角度: 30 },
  { 名称: '寅', 对应角度: 60 },
  { 名称: '卯', 对应角度: 90 },
  { 名称: '辰', 对应角度: 120 },
  { 名称: '巳', 对应角度: 150 },
  { 名称: '午', 对应角度: 180 },
  { 名称: '未', 对应角度: 210 },
  { 名称: '申', 对应角度: 240 },
  { 名称: '酉', 对应角度: 270 },
  { 名称: '戌', 对应角度: 300 },
  { 名称: '亥', 对应角度: 330 },
]
```

### 7.2 部件说明数据

```typescript
const 部件说明: Record<string, { 名称: string; 说明: string }> = {
  '浑象天球': { 名称: '浑象天球', 说明: '模拟天体运行的天球仪，标注二十八星宿，随天自动旋转' },
  '报时木人': { 名称: '报时木人所在地柜', 说明: '第二层木阁内的司辰木人，每时辰敲钟击鼓报时' },
  '齿轮组': { 名称: '传动齿轮组', 说明: '水力驱动的齿轮传动系统，按齿数比传递动力' },
  '水轮': { 名称: '枢轮', 说明: '水力驱动的主轮，由漏水推动运转' },
  '五层木阁': { 名称: '五层木阁', 说明: '报时机构所在的木构建筑，每层有不同功能' },
  '砖石台基': { 名称: '台基', 说明: '支撑整座仪象台的青灰砖石基座' },
}
```

## 8. 音效实现

### 8.1 钟声合成

* 频率：800Hz 正弦波

* 包络：ADSR，A=0.01s, D=0.1s, S=0.3, R=0.3s

* 持续时间：0.3秒

### 8.2 鼓声合成

* 频率：200Hz 三角波 + 白噪声

* 包络：快速衰减，敲击感

* 每次报时敲击3次，间隔0.15秒

## 9. 构建配置

### 9.1 Vite 配置要点

* base: './'

* 构建目标：ES2020

* 生产构建启用压缩

* sourcemap：开发环境启用

### 9.2 TypeScript 配置

* 严格模式：strict: true

* target: ES2020

* jsx: react-jsx

* moduleResolution: bundler

