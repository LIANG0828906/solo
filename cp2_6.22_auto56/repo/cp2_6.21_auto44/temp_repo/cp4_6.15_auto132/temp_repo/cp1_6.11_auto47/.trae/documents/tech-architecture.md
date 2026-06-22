## 1. 架构设计

```mermaid
flowchart TD
    "A[index.html 入口页面]" --> "B[App.tsx 主组件]"
    "B" --> "C[GuitarFretboard.tsx 指板组件]"
    "B" --> "D[PlayerControls.tsx 控制栏组件]"
    "B" --> "E[sampleTrack.ts 音轨数据]"
    "C -->|Canvas渲染| "F[requestAnimationFrame 循环"]"
    "D -->|回调通知| "B"
    "B -->|传递当前note| "C"
    "E -->|导出音轨数据| "B"
```

### 数据流向
1. `sampleTrack.ts` 导出预设音轨数据 → `App.tsx` 加载
2. `App.tsx` 每16ms根据当前时间从音轨数据提取当前note → 传递给 `GuitarFretboard.tsx`
3. `GuitarFretboard.tsx` 在requestAnimationFrame中根据note数据更新Canvas高亮位置和波纹特效
4. `PlayerControls.tsx` 通过回调通知 `App.tsx` 控制播放/暂停、进度跳转、速度调节

## 2. 技术说明
- 前端框架：React 18 + TypeScript（严格模式，target ES2020）
- 构建工具：Vite（入口index.html，端口5173）
- 样式方案：CSS-in-JS（内联样式 + CSS模块），不使用Tailwind（用户指定了具体样式要求）
- 状态管理：React useState/useRef（组件内状态，无需全局状态库）
- 渲染引擎：Canvas 2D API（指板图渲染）
- 无后端，纯前端应用

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 主页面，包含指板可视化与播放控制 |

## 4. 文件结构

```
├── package.json           # 依赖：react, react-dom, typescript, vite, @types/react, @types/react-dom
├── vite.config.js         # 构建配置，入口index.html，端口5173
├── tsconfig.json          # 严格模式，target ES2020
├── index.html             # 入口页面，深色主题，旋转吉他图标加载动画
└── src/
    ├── App.tsx            # 主组件：整合指板图+播放控制，管理播放状态和时间轴逻辑
    ├── GuitarFretboard.tsx # 指板Canvas组件：渲染6弦12品，高亮当前音符，波纹特效
    ├── PlayerControls.tsx  # 播放控制栏：播放/暂停、进度条、速度滑块
    └── sampleTrack.ts     # 预设音轨数据：4小节C大调音阶
```

### 文件间调用关系
- `App.tsx` → import `GuitarFretboard`、`PlayerControls`、`sampleTrack`
- `App.tsx` → state: `isPlaying`, `currentTime`, `playbackSpeed`, `trackData`
- `App.tsx` → 每16ms tick: 从trackData提取currentNote → props传给GuitarFretboard
- `PlayerControls` → 回调props: `onPlayPause()`, `onSeek(progress)`, `onSpeedChange(speed)`
- `GuitarFretboard` → props: `currentNotes[]`, `trackDuration` → Canvas渲染循环

## 5. 核心类型定义

```typescript
interface Note {
  time: number;        // 发声时间（ms）
  duration: number;    // 持续时间（ms）
  string: number;      // 弦号（1-6，1为最细弦）
  fret: number;        // 品位（0为空弦）
  finger: number;      // 手指编号（1-4，0为空弦）
  chord?: string;      // 所属和弦名（用于颜色映射）
}

interface TrackData {
  name: string;
  duration: number;    // 总时长（ms）
  bpm: number;
  notes: Note[];
}
```

## 6. 关键实现要点

### 6.1 Canvas指板渲染
- 使用requestAnimationFrame驱动渲染循环，确保30+ FPS
- 绘制顺序：背景渐变 → 品丝 → 弦 → 音孔 → 品位编号 → 高亮圆点 → 波纹特效
- 高亮圆点位置计算：根据弦号和品位映射到Canvas坐标
- 波纹特效：使用透明度递减的扩展圆环，频率随播放速度缩放

### 6.2 播放时间轴逻辑
- 使用setInterval(16ms)检测当前播放时间
- 根据currentTime和playbackSpeed计算实际播放位置
- 从trackData.notes中筛选当前时间窗口内的活跃音符
- 播放结束判定：currentTime >= trackDuration

### 6.3 和弦颜色映射
```typescript
const chordColorMap: Record<string, string> = {
  'C': '#ff6b35',  // 橙红
  'G': '#4a90d9',  // 蓝色
  'Am': '#e74c3c', // 红色
  'F': '#2ecc71',  // 绿色
};
默认颜色：#ff6b35（橙红）
```
