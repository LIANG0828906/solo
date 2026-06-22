## 1. 架构设计

```mermaid
flowchart TD
    subgraph "应用入口"
        main["main.ts - 协调数据流"]
    end
    
    subgraph "核心模块"
        audio["audio-engine.ts\n音频加载/解码/播放\nAnalyserNode管理\n频域数据输出"]
        visual["visualizer.ts\n渲染循环\n三种可视化模式\n鼠标交互响应"]
        beat["beat-editor.ts\n节奏标记管理\n时间轴渲染\n拖拽交互"]
        effect["effect-panel.ts\nUI控制面板\n参数管理\n事件绑定"]
    end
    
    subgraph "Web API层"
        canvas["Canvas 2D API"]
        webaudio["Web Audio API"]
        dom["DOM API"]
    end
    
    main --> audio
    main --> visual
    main --> beat
    main --> effect
    
    audio -->|频域数据| visual
    audio -->|播放进度| beat
    audio --> webaudio
    
    visual --> canvas
    beat --> canvas
    effect -->|参数更新| visual
    effect --> dom
```

## 2. 技术描述

- **前端**: TypeScript + 原生 Web API (Canvas 2D + Web Audio API)
- **构建工具**: Vite 5.x
- **不使用框架**: 无 React/Vue，保持轻量
- **依赖**: typescript, vite

## 3. 文件结构

```
d:\P\tasks\auto60\
├── package.json          # 项目配置与依赖
├── index.html            # 入口HTML
├── tsconfig.json         # TypeScript严格模式配置
├── vite.config.js        # Vite配置
├── .trae/
│   └── documents/
│       ├── prd.md
│       └── architecture.md
└── src/
    ├── main.ts           # 应用入口，协调所有模块
    ├── audio-engine.ts   # 音频引擎模块
    ├── visualizer.ts     # 可视化渲染模块
    ├── beat-editor.ts    # 节奏标记编辑模块
    └── effect-panel.ts   # 特效控制面板模块
```

## 4. 模块接口定义

### 4.1 AudioEngine 接口

```typescript
interface AudioEngine {
  loadAudio(file: File): Promise<AudioBuffer>;
  play(): void;
  pause(): void;
  stop(): void;
  getFrequencyData(): Uint8Array;
  getTimeDomainData(): Uint8Array;
  getCurrentTime(): number;
  getDuration(): number;
  isPlaying(): boolean;
  onProgress(callback: (time: number) => void): void;
}
```

### 4.2 Visualizer 接口

```typescript
type VisualMode = 'particles' | 'bars' | 'stars';

interface VisualizerParams {
  mode: VisualMode;
  particleCount: number;
  particleSize: number;
  speed: number;
  colorSaturation: number;
  backgroundBlur: number;
}

interface Visualizer {
  setParams(params: Partial<VisualizerParams>): void;
  start(): void;
  stop(): void;
  handleMouseMove(x: number, y: number): void;
  handleMouseClick(x: number, y: number): void;
}
```

### 4.3 BeatEditor 接口

```typescript
interface BeatMarker {
  id: string;
  time: number;
  color: 'red' | 'blue' | 'green' | null;
}

interface BeatEditor {
  addMarker(time: number): void;
  removeMarker(id: string): void;
  updateMarkerTime(id: string, time: number): void;
  setMarkerColor(id: string, color: 'red' | 'blue' | 'green'): void;
  getMarkers(): BeatMarker[];
  setZoom(level: number): void;
  setOffset(time: number): void;
}
```

### 4.4 EffectPanel 接口

```typescript
interface EffectPanel {
  onParamChange(callback: (params: Partial<VisualizerParams>) => void): void;
  onModeChange(callback: (mode: VisualMode) => void): void;
  updateParams(params: Partial<VisualizerParams>): void;
}
```

## 5. 数据流

```mermaid
sequenceDiagram
    participant User as 用户
    participant Main as main.ts
    participant Audio as audio-engine.ts
    participant Visual as visualizer.ts
    participant Beat as beat-editor.ts
    participant Effect as effect-panel.ts
    
    User->>Main: 上传音频文件
    Main->>Audio: loadAudio(file)
    Audio-->>Main: AudioBuffer
    Main->>Beat: 渲染波形和时间轴
    
    User->>Main: 点击播放
    Main->>Audio: play()
    Audio->>Audio: AnalyserNode采集数据
    loop 每16ms (60fps)
        Audio->>Visual: 频域数据
        Visual->>Visual: Canvas渲染
        Audio->>Beat: 播放进度
        Beat->>Beat: 高亮更新和标记闪烁
    end
    
    User->>Effect: 调整参数/切换模式
    Effect->>Main: 参数变更事件
    Main->>Visual: setParams()
    Visual->>Visual: 实时更新效果
    
    User->>Beat: 点击频谱/拖拽标记
    Beat->>Beat: 添加/更新标记
    Beat->>Main: 标记变更事件
```

## 6. 性能优化策略

| 优化点 | 技术方案 |
|--------|----------|
| 音频解码 | 使用 decodeAudioData 异步解码，避免阻塞主线程 |
| 渲染循环 | requestAnimationFrame + 时间差计算，保证稳定60fps |
| 粒子系统 | 对象池模式复用粒子实例，避免频繁GC |
| Canvas渲染 | 分层Canvas（背景层+动画层+UI层），离屏缓存静态波形 |
| 数据传递 | TypedArray 直接引用，避免数据拷贝 |
| 事件节流 | 鼠标移动事件使用 requestAnimationFrame 节流 |
| 响应式 | ResizeObserver 监听尺寸变化，debounce重绘 |
