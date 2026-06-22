# 文明漫游者 - 技术架构文档

## 1. 技术选型

| 技术 | 用途 | 版本 |
|------|------|------|
| React 18 | UI框架 | 18.x |
| TypeScript | 类型系统 | 5.x |
| Vite | 构建工具 | 5.x |
| Three.js | 3D渲染引擎 | 0.160.x |
| Zustand | 状态管理 | 4.x |
| @types/three | Three.js类型定义 | 0.160.x |
| @vitejs/plugin-react | Vite React插件 | 4.x |

## 2. 文件结构与职责

```
src/
├── App.tsx                          # 应用根组件
├── main.tsx                        # 应用入口
├── vite-env.d.ts                   # Vite环境类型
├── styles/
│   └── global.css                 # 全局样式
├── store/
│   └── useAppStore.ts             # Zustand全局状态
└── modules/
    ├── timeline/
    │   ├── TimelinePanel.tsx        # 时间轴面板组件
    │   └── timelineData.ts        # 时间轴数据管理
    ├── exhibition/
    │   ├── ExhibitionHall.tsx      # 3D展厅组件
    │   └── artifactLoader.ts      # 文物模型加载器
    └── data/
        └── dataFetch.ts              # 模拟API数据获取
```

## 3. 模块调用关系与数据流向

```
┌─────────────────────────────────────────────────────────────────┐
│                        App.tsx                                │
│  ┌───────────────────────────────────────────────────────┐    │
│  │  Zustand Store (useAppStore)                   │    │
│  │  - selectedEventId: string | null                │    │
│  │  - isLoading: boolean                          │    │
│  │  - artifactData: Artifact | null                   │    │
│  │  - setSelectedEvent(id)                          │    │
│  │  - setLoading(state)                            │    │
│  │  - setArtifactData(data)                        │    │
│  └───────────────────────────────────────────────────────┘    │
│                                                             │
│  ┌──────────────────┐         ┌───────────────────┐          │
│  │ TimelinePanel   │         │ ExhibitionHall   │          │
│  │  (点击事件)    │         │  (3D渲染)    │          │
│  └────────┬─────────┘         └─────────┬─────────┘          │
│           │                                │                    │
│           │ selectedEventId                │ selectedEventId    │
│           ▼                                ▼                    │
│  ┌───────────────────────────────────────────────────────┐          │
│  │              dataFetch.ts                             │          │
│  │  - getEvents(): TimelineEvent[]                   │          │
│  │  - getEventById(id): TimelineEvent              │          │
│  │  - getArtifactByEventId(id): Artifact         │          │
│  └───────────────────────────────────────────────────────┘          │
│                                                             │
│  ┌──────────────────┐         ┌───────────────────┐          │
│  │ timelineData.ts   │         │ artifactLoader.ts  │          │
│  │  - 事件数据模型│         │  - GLTF加载   │          │
│  │  - 颜色计算   │         │  - 进度回调   │          │
│  └──────────────────┘         └─────────┬─────────┘          │
│                                           │                    │
│                                           ▼                    │
│                                        Three.js Scene             │
└─────────────────────────────────────────────────────────────────┘
```

### 3.1 数据流向说明

1. **用户点击时间轴节点** → TimelinePanel.tsx
   - 调用 `setSelectedEvent(id)` 更新状态
   - 触发 App.tsx 重新渲染

2. **App.tsx 监听 selectedEventId 变化**
   - 调用 `setLoading(true)`
   - 调用 `dataFetch.getArtifactByEventId(id)` 获取文物数据

3. **ExhibitionHall.tsx 接收 selectedEventId**
   - 调用 `artifactLoader.loadModel(modelPath)` 加载3D模型
   - 加载完成后 `setLoading(false)`
   - 调用 `setArtifactData(data)` 更新文物数据

4. **关联事件点击** → 信息卡片
   - 调用 `setSelectedEvent(relatedId)` 跳转到关联事件

## 4. 核心组件设计

### 4.1 App.tsx - 根组件

**职责**:
- 使用zustand管理全局状态
- 组合TimelinePanel和ExhibitionHall
- 布局编排和状态流转
- 处理加载状态和过渡动画

**状态管理**:
```typescript
interface AppState {
  selectedEventId: string | null;
  isLoading: boolean;
  artifactData: Artifact | null;
  showInfoCard: boolean;
  setSelectedEvent: (id: string | null) => void;
  setLoading: (loading: boolean) => void;
  setArtifactData: (data: Artifact | null) => void;
  setShowInfoCard: (show: boolean) => void;
}
```

### 4.2 TimelinePanel.tsx - 时间轴面板

**Props**:
- `events: TimelineEvent[]
- `selectedEventId: string | null`
- `onEventSelect: (id: string) => void

**交互**:
- 渲染水平时间轴
- 8个事件节点（圆形图标）
- 颜色渐变（#4A148C → #FF8F00）
- 悬停放大1.2倍，显示标题
- 点击触发onEventSelect
- 选中时显示垂直连接线动画

### 4.3 timelineData.ts - 时间轴数据

**导出**:
- `events: TimelineEvent[] - 8个历史事件
- `getEventById(id: string): TimelineEvent | undefined
- `getColorByYear(year: number): string - 计算年份对应的渐变色

### 4.4 ExhibitionHall.tsx - 3D展厅

**Props**:
- `selectedEventId: string | null`
- `isLoading: boolean`
- `onLoadingComplete: () => void`

**功能**:
- Three.js场景初始化
- 相机控制（拖拽旋转、滚轮缩放）
- 模型自动旋转（Y轴，12s周期）
- 场景背景渐变（#0A0F2E → #1A237E）
- 地面网格辅助线
- 相机角度限制（水平-90°~90°，垂直-30°~30°）

### 4.5 artifactLoader.ts - 模型加载器

**导出函数**:
```typescript
function loadGLTFModel(
  path: string,
  onProgress?: (progress: number) => void
): Promise<Group>
```

**功能**:
- 封装GLTFLoader
- 加载进度回调
- 模型自动居中
- 多边形数检查（≤5000）
- 返回加载完成的Group对象

### 4.6 dataFetch.ts - 数据获取层

**导出函数**:
```typescript
function getEvents(): Promise<TimelineEvent[]>
function getEventById(id: string): Promise<TimelineEvent | undefined>
function getArtifactByEventId(eventId: string): Promise<Artifact | undefined>
```

**功能**:
- 模拟API延迟（1~3秒随机延迟）
- 返回模拟的时间轴和文物数据
- 包含8个文明的文物数据

## 5. Three.js 场景架构

```
Scene
├── PerspectiveCamera (fov: 60, near: 0.1, far: 1000)
├── AmbientLight (intensity: 0.6)
├── DirectionalLight (intensity: 1.0, position: [5, 10, 7])
├── GridHelper (size: 20, divisions: 20, color: 0x444466)
└── Group (文物模型，自动旋转)
```

### 5.1 相机控制参数

| 参数 | 值 | 说明 |
|------|-----|------|
| 初始位置 | [0, 2, 5] | |
| 水平旋转范围 | -90° ~ 90° | |
| 垂直旋转范围 | -30° ~ 30° | |
| 缩放范围 | 0.5 ~ 3.0 | |
| 自动旋转速度 | Y轴，12s/圈 | |

### 5.2 性能优化策略

1. **模型优化**:
   - 模型多边形数 ≤ 5000
   - 使用draco压缩的glTF格式
   - 禁用阴影计算（低多边形模型不需要）

2. **渲染优化**:
   - 使用requestAnimationFrame
   - 只在场景变化时更新渲染
   - 页面不可见时暂停渲染

3. **内存管理**:
   - 模型切换时清理旧模型
   - 正确dispose几何体和材质
   - 避免内存泄漏

## 6. 动画系统设计

### 6.1 CSS动画

| 动画 | 时长 | 缓动 | 说明 |
|------|------|------|------|
| 节点悬停 | 0.2s | ease | transform: scale(1.2) |
| 连接线展开 | 0.5s | ease-out | height: 0 → 100% |
| 卡片滑入 | 0.4s | ease-out | translateX: 50px → 0 |
| 场景淡出 | 0.3s | ease | opacity: 1 → 0 |
| 场景淡入 | 0.5s | ease | opacity: 0 → 1 |
| 加载指示器 | 1s | linear | 无限旋转 |

### 6.2 Three.js动画

- 使用Clock跟踪时间
- 模型Y轴自动旋转
- 相机平滑过渡

## 7. 接口设计

### 7.1 时间轴事件数据

```typescript
const events: TimelineEvent[] = [
  {
    id: 'event-1',
    year: -2560,
    title: '古埃及金字塔建造',
    description: '古埃及人建造吉萨大金字塔',
    civilization: '古埃及',
    color: '#4A148C'
  },
  // ... 共8个事件
];
```

### 7.2 文物数据

```typescript
const artifacts: Record<string, Artifact> = {
  'event-1': {
    id: 'artifact-1',
    name: '吉萨金字塔模型',
    era: '公元前2560年',
    civilization: '古埃及',
    modelPath: '/models/pyramid.glb',
    description: '...',
    relatedEvents: ['event-2', 'event-3']
  },
  // ... 共8个文物
};
```

## 8. 性能监控

### 8.1 性能指标监控点

- FPS监控（Stats.js）
- 模型加载时间
- 内存使用情况
- 交互响应时间

### 8.2 降级策略

- WebGL不可用时显示静态图片
- 低性能设备降低渲染质量
