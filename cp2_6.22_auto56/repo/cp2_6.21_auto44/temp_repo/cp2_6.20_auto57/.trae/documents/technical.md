## 1. 架构设计

```mermaid
flowchart TB
    subgraph Frontend["前端 React + TypeScript"]
        A["CanvasBoard 画板组件"] --> S["useScoreStore 状态管理"]
        B["StaffEditor 五线谱编辑器"] --> S
        S --> R["recognitionService 识别服务"]
        R --> API["后端API调用"]
        A --> S
        S --> B
    end

    subgraph Backend["后端 FastAPI"]
        API --> C["识别控制器"]
        API --> M["MIDI生成控制器"]
        API --> SH["分享控制器"]
        C --> REC["音符识别引擎"]
        M --> MID["MIDI文件生成"]
        SH --> DB["内存数据存储"]
    end

    Frontend -->|"/api/*"| Backend
```

## 2. 技术说明

- 前端：React@18 + TypeScript + Vite + Tailwind CSS + Zustand
- 初始化工具：vite-init（react-ts模板）
- 后端：FastAPI（Python），提供RESTful API和MIDI生成服务
- 数据库：无持久化数据库，使用内存数据存储（分享链接数据）
- 音频引擎：Web Audio API（前端播放）
- 识别引擎：前端基础笔迹分析 + 后端增强识别API

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 主工作台页面（画板+编辑器） |
| /share/:id | 分享页面（只读乐谱+播放） |

## 4. API定义

### 4.1 音符识别

```typescript
// POST /api/recognize
interface RecognizeRequest {
  strokes: Array<{
    points: Array<{ x: number; y: number; timestamp: number }>;
  }>;
}

interface RecognizeResponse {
  notes: Array<{
    type: "whole" | "half" | "quarter" | "eighth";
    pitch: string;
    octave: number;
    confidence: number;
  }>;
}
```

### 4.2 MIDI生成

```typescript
// POST /api/export/midi
interface MidiExportRequest {
  notes: Array<{
    pitch: string;
    octave: number;
    duration: number;
    velocity: number;
    order: number;
  }>;
  tempo: number;
}

interface MidiExportResponse {
  file_url: string;
}
```

### 4.3 分享

```typescript
// POST /api/share
interface ShareRequest {
  notes: Array<{
    pitch: string;
    octave: number;
    duration: number;
    velocity: number;
    order: number;
  }>;
  tempo: number;
}

interface ShareResponse {
  share_id: string;
  share_url: string;
}

// GET /api/share/:id
interface ShareDetailResponse {
  notes: Array<{
    pitch: string;
    octave: number;
    duration: number;
    velocity: number;
    order: number;
  }>;
  tempo: number;
  created_at: string;
}
```

## 5. 服务端架构图

```mermaid
flowchart LR
    C["Controller 路由层"] --> S["Service 业务层"]
    S --> R["Repository 数据层"]
    R --> D["内存数据存储"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    Score ||--o{ Note : contains
    Score {
        string id PK
        number tempo
        string created_at
    }
    Note {
        string id PK
        string score_id FK
        string pitch
        number octave
        number duration
        number velocity
        number order
    }
```

### 6.2 数据定义语言

前端Store数据结构（Zustand）：

```typescript
interface NoteData {
  id: string;
  pitch: string;
  octave: number;
  duration: number;
  velocity: number;
  order: number;
  type: "whole" | "half" | "quarter" | "eighth";
  x: number;
  y: number;
  isValid: boolean;
}

interface ScoreState {
  notes: NoteData[];
  tempo: number;
  isPlaying: boolean;
  currentPlayIndex: number;
  addNote: (note: NoteData) => void;
  removeNote: (id: string) => void;
  updateNote: (id: string, partial: Partial<NoteData>) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentPlayIndex: (index: number) => void;
  reorderNotes: (fromIndex: number, toIndex: number) => void;
}
```
