# 光痕记忆盒 - 技术架构文档

## 1. 技术选型

### 1.1 核心技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| TypeScript | 5.x | 类型安全的开发语言 |
| Three.js | 0.160.x | 3D渲染引擎 |
| Vite | 5.x | 构建工具与开发服务器 |
| @types/three | 0.160.x | Three.js类型定义 |

### 1.2 选型理由
- **Three.js**：成熟的WebGL封装库，提供完整的3D渲染能力
- **TypeScript**：提供类型安全，降低大型项目维护成本
- **Vite**：快速的开发体验，原生支持TypeScript和ES模块
- **无前端框架**：保持轻量，减少依赖，专注于3D渲染性能

---

## 2. 系统架构设计

### 2.1 整体架构图
```
┌─────────────────────────────────────────────────────────────┐
│                         浏览器环境                            │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                      index.html                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                                │
│                              ▼                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    src/main.ts (入口)                  │  │
│  │  - 初始化场景、相机、渲染器                            │  │
│  │  - 挂载UI组件                                         │  │
│  │  - 注册事件监听                                       │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                                │
│         ┌────────────────────┼────────────────────┐           │
│         ▼                    ▼                    ▼           │
│  ┌────────────┐      ┌────────────┐      ┌────────────┐      │
│  │ SceneManager │    │ DrawEngine │    │ AnimationCtrl│     │
│  │  (场景管理)  │    │ (绘制引擎) │    │  (动画控制)  │      │
│  └────────────┘      └────────────┘      └────────────┘      │
│         │                    │                    │           │
│         └────────────────────┼────────────────────┘           │
│                              │                                │
│                              ▼                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                      EventBus                          │  │
│  │  (事件总线 - 模块间解耦通信)                           │  │
│  └───────────────────────────────────────────────────────┘  │
│                              │                                │
│                              ▼                                │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                      UIManager                         │  │
│  │  (UI管理 - 工具栏、时间轴、播放控制)                   │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 模块职责划分

| 模块 | 职责 | 核心接口 |
|------|------|----------|
| SceneManager | 场景创建、相机控制、渲染循环、对象增删 | `addObject()`, `removeObject()`, `render()` |
| DrawEngine | 光笔管理、绘制逻辑、线段生成、帧数据管理 | `startDrawing()`, `stopDrawing()`, `getFrameData()`, `loadFrame()` |
| AnimationController | 帧列表管理、播放状态、帧切换逻辑 | `addFrame()`, `removeFrame()`, `reorderFrames()`, `play()`, `pause()` |
| UIManager | UI组件创建、用户交互、状态展示 | `createToolbar()`, `createTimeline()`, `createPlayControls()`, `updateUI()` |
| EventBus | 模块间事件通信 | `emit()`, `on()`, `off()` |

### 2.3 数据流设计

#### 绘制流程
```
用户鼠标事件 → DrawEngine → 生成顶点数据 → 更新LineSegments → SceneManager渲染
                      ↓
                保存到当前帧数据
                      ↓
                通知AnimationController
```

#### 播放流程
```
用户点击播放 → AnimationController → 按帧切换 → 通知DrawEngine加载帧数据
                                                         ↓
                                                  SceneManager渲染
                                                         ↓
                                                  UIManager更新高亮
```

#### 帧编辑流程
```
用户时间轴操作 → UIManager → EventBus → AnimationController
                                                     ↓
                                               更新帧列表
                                                     ↓
                                               通知DrawEngine
                                                     ↓
                                               SceneManager渲染
```

---

## 3. 数据结构设计

### 3.1 光迹数据结构
```typescript
interface LightTracePoint {
  x: number;
  y: number;
  z: number;
}

interface LightTrace {
  id: string;
  points: LightTracePoint[];
  color: string;
  thickness: number;
  createdAt: number;
}
```

### 3.2 帧数据结构
```typescript
interface Frame {
  id: string;
  index: number;
  traces: LightTrace[];
  thumbnail?: string;
  createdAt: number;
}
```

### 3.3 播放状态结构
```typescript
interface PlaybackState {
  isPlaying: boolean;
  currentFrameIndex: number;
  mode: 'loop' | 'once';
  startTime: number;
  frameDuration: number;
}
```

### 3.4 绘制状态结构
```typescript
interface DrawState {
  isDrawing: boolean;
  currentColor: string;
  currentThickness: number;
  currentTrace: LightTrace | null;
  isEditMode: boolean;
}
```

---

## 4. 核心模块设计

### 4.1 EventBus 事件总线
```typescript
class EventBus {
  private events: Map<string, Function[]>;
  
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
  emit(event: string, ...args: any[]): void;
}

// 预定义事件
enum Events {
  DRAW_START = 'draw:start',
  DRAW_END = 'draw:end',
  FRAME_ADDED = 'frame:added',
  FRAME_REMOVED = 'frame:removed',
  FRAME_CHANGED = 'frame:changed',
  FRAME_REORDERED = 'frame:reordered',
  PLAY_START = 'play:start',
  PLAY_PAUSE = 'play:pause',
  PLAY_STOP = 'play:stop',
  COLOR_CHANGED = 'color:changed',
  THICKNESS_CHANGED = 'thickness:changed',
  EDIT_MODE_ENTER = 'edit:enter',
  EDIT_MODE_EXIT = 'edit:exit',
  SCENE_CLEAR = 'scene:clear',
}
```

### 4.2 SceneManager 场景管理
```typescript
class SceneManager {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
  
  init(container: HTMLElement): void;
  createGrid(): void;
  addObject(object: THREE.Object3D): void;
  removeObject(object: THREE.Object3D): void;
  clearScene(): void;
  render(): void;
  getRaycasterIntersects(event: MouseEvent): THREE.Intersection[];
}
```

### 4.3 DrawEngine 绘制引擎
```typescript
class DrawEngine {
  private sceneManager: SceneManager;
  private eventBus: EventBus;
  private lightPen: THREE.Mesh;
  private currentLine: THREE.LineSegments | null;
  private frames: Map<string, LightTrace[]>;
  
  startDrawing(point: THREE.Vector3): void;
  continueDrawing(point: THREE.Vector3): void;
  stopDrawing(): LightTrace | null;
  cancelDrawing(): void;
  loadFrame(frameId: string): void;
  getCurrentFrameTraces(): LightTrace[];
  setColor(color: string): void;
  setThickness(thickness: number): void;
  updatePenPosition(point: THREE.Vector3): void;
}
```

### 4.4 AnimationController 动画控制
```typescript
class AnimationController {
  private eventBus: EventBus;
  private frames: Frame[];
  private playbackState: PlaybackState;
  
  addFrame(frameData?: LightTrace[]): Frame;
  removeFrame(frameId: string): void;
  reorderFrames(fromIndex: number, toIndex: number): void;
  goToFrame(index: number): void;
  nextFrame(): void;
  prevFrame(): void;
  play(mode: 'loop' | 'once'): void;
  pause(): void;
  stop(): void;
  getCurrentFrame(): Frame | null;
  getFrames(): Frame[];
  updateFrameThumbnail(frameId: string, thumbnail: string): void;
}
```

### 4.5 UIManager UI管理
```typescript
class UIManager {
  private eventBus: EventBus;
  private container: HTMLElement;
  private toolbar: HTMLElement;
  private timeline: HTMLElement;
  private playControls: HTMLElement;
  
  init(container: HTMLElement): void;
  createToolbar(): void;
  createTimeline(): void;
  createPlayControls(): void;
  updateTimelineFrames(frames: Frame[]): void;
  highlightCurrentFrame(index: number): void;
  updatePlayState(isPlaying: boolean): void;
  enterEditMode(frameId: string): void;
  exitEditMode(): void;
}
```

---

## 5. 文件结构

```
auto176/
├── package.json
├── index.html
├── tsconfig.json
├── vite.config.js
└── src/
    ├── main.ts
    ├── scene/
    │   └── SceneManager.ts
    ├── draw/
    │   └── DrawEngine.ts
    ├── animation/
    │   └── AnimationController.ts
    ├── ui/
    │   └── UIManager.ts
    └── utils/
        └── EventBus.ts
```

---

## 6. 关键技术实现

### 6.1 光迹渲染实现
- 使用 `THREE.LineSegments` 渲染光迹线段
- 材质使用 `THREE.LineBasicMaterial`，设置 `transparent` 和 `opacity`
- 添加 `THREE.Points` 在顶点位置增强光效
- 使用 `AdditiveBlending` 混合模式实现发光效果

### 6.2 帧过渡动画
- 使用 `requestAnimationFrame` 实现逐帧动画
- 淡入效果通过修改材质 `opacity` 实现
- 过渡时间 0.5s，使用缓动函数 `easeInOutQuad`

### 6.3 缩略图生成
- 使用 `renderer.domElement.toDataURL()` 生成帧缩略图
- 裁剪为 80x50 尺寸
- 缓存在 Frame 对象中

### 6.4 鼠标3D坐标转换
- 使用 `THREE.Raycaster` 进行射线检测
- 射线与虚拟平面相交获取3D坐标
- 平面使用相机朝向确保绘制深度一致

### 6.5 拖拽排序
- 使用 HTML5 Drag & Drop API 实现帧排序
- 拖拽时显示占位符
- 释放时更新 AnimationController 中的帧顺序

---

## 7. 性能优化策略

### 7.1 渲染优化
- 复用 LineSegments 的 Geometry，避免频繁重建
- 使用 `BufferGeometry` 替代普通 Geometry
- 合理设置相机远裁面，减少绘制调用

### 7.2 内存管理
- 及时 dispose 不再使用的 Geometry 和 Material
- 帧数据引用管理，避免内存泄漏
- 缩略图数据懒加载

### 7.3 交互优化
- 鼠标移动事件节流，限制绘制点密度
- Raycaster 检测范围优化
- UI 更新防抖

---

## 8. 开发与构建

### 8.1 脚本命令
```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview"
}
```

### 8.2 构建配置
- Vite 处理 TypeScript 编译
- 生产构建启用代码压缩
- Source Map 支持开发调试

---

## 9. 风险与应对

| 风险 | 影响 | 应对措施 |
|------|------|----------|
| WebGL 兼容性 | 部分浏览器无法运行 | 检测 WebGL 支持，给出友好提示 |
| 大数据量光迹卡顿 | 用户体验下降 | 实现点抽稀算法，限制单帧点数 |
| 内存泄漏 | 长时间运行崩溃 | 建立完善的资源释放机制 |
