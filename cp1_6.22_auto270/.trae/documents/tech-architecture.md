## 1. 架构设计

```mermaid
flowchart TD
    subgraph Frontend["前端层"]
        A["main.tsx 入口"] --> B["AudioEditor 主编辑器"]
        B --> C["TrackItem 音轨组件"]
        B --> D["SpectrumAnalyzer 频谱组件"]
        B --> E["useAudioEngine Hook"]
        C --> F["WaveSurfer.js 波形渲染"]
        E --> G["Web Audio API"]
        D --> H["Canvas 频谱渲染"]
    end
    subgraph Data["数据层"]
        I["mockData.ts 模拟数据"]
        J["Zustand 状态管理"]
    end
    I --> B
    J --> B
```

## 2. 技术说明

- 前端：React 18 + TypeScript + Vite
- 初始化工具：vite-init（react-ts模板）
- 状态管理：Zustand
- 波形渲染：wavesurfer.js
- 频谱渲染：Canvas 2D API + requestAnimationFrame
- 音频引擎：Web Audio API（AnalyserNode获取频域数据）
- 后端：无
- 数据库：无，使用模拟数据

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 主编辑器页面（单页应用） |

## 4. API定义

不适用（纯前端，无后端API）

## 5. 服务端架构图

不适用

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
classDiagram
    class Track {
        +string id
        +string name
        +number duration
        +number volume
        +string waveColor
        +Float32Array waveformData
        +AudioBuffer audioBuffer
        +boolean isTrimming
        +number trimStart
        +number trimEnd
        +number[] splicePoints
    }
    class EditorState {
        +Track[] tracks
        +boolean isPlaying
        +number currentTime
        +number totalDuration
        +number playbackRate
        +addTrack()
        +removeTrack()
        +reorderTracks()
        +togglePlayback()
        +seekTo()
    }
    EditorState --> Track
```

### 6.2 数据定义语言

不适用（无数据库）
