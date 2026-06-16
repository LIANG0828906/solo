## 1. 架构设计

```mermaid
flowchart TB
    subgraph Frontend["前端 (React + TypeScript + Vite)"]
        A["App.tsx 主应用组件"]
        B["Timeline.tsx 时间轴组件"]
        C["Preview.tsx 预览组件"]
        D["DetailPanel.tsx 详情面板"]
        E["store.ts Zustand状态管理"]
        F["api.ts 模拟API层"]
    end

    subgraph Backend["后端 (Express.js)"]
        G["server.js Express服务器"]
        H["文件上传接口"]
        I["静态文件服务"]
    end

    subgraph BrowserAPIs["浏览器原生API"]
        J["MediaRecorder API"]
        K["Canvas API"]
        L["Web Audio API"]
        M["FileReader API"]
    end

    A --> B
    A --> C
    A --> D
    B --> E
    C --> E
    D --> E
    F --> G
    G --> H
    G --> I
    C --> J
    B --> K
    C --> K
    D --> L
    F --> M
```

## 2. 技术说明

- 前端：React@18 + TypeScript + Vite + Ant Design + Zustand
- 初始化工具：vite-init（react-express-ts模板）
- 后端：Express.js（运行于localhost:3001）
- 数据库：无（前端Zustand状态管理，模拟数据）
- 视频处理：浏览器原生 MediaRecorder + Canvas API
- 音频混音：Web Audio API
- 样式：SCSS + CSS Variables（深色主题）

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 编辑器主页面，包含上传、时间轴、预览和详情面板 |

## 4. API定义

### 4.1 视频上传接口

```typescript
// POST /api/upload
interface UploadRequest {
  file: File;
}

interface UploadResponse {
  id: string;
  filename: string;
  duration: number;
  url: string;
  thumbnailUrl: string;
}
```

### 4.2 音频预加载接口

```typescript
// GET /api/audio/:style
interface AudioResponse {
  style: 'light' | 'soothing' | 'suspense' | 'intense' | 'romantic';
  url: string;
  duration: number;
}
```

### 4.3 静态文件服务

```typescript
// GET /uploads/:filename - 返回上传的视频文件
// GET /audio/:filename - 返回音频文件
```

## 5. 服务器架构图

```mermaid
flowchart LR
    A["Express服务器"] --> B["文件上传中间件 (multer)"]
    A --> C["静态文件服务"]
    A --> D["CORS中间件"]
    B --> E["uploads目录"]
    C --> E
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    Clip {
        string id PK
        string filename
        number duration
        number trimStart
        number trimEnd
        string videoUrl
        string thumbnailUrl
        number order
    }
    Subtitle {
        string id PK
        string clipId FK
        string text
        number startTime
        number endTime
    }
    AudioTrack {
        string id PK
        string style
        string url
        number volume
        boolean enabled
    }
    Project {
        string id PK
        string name
        Clip clips
        Subtitle subtitles
        AudioTrack audioTrack
    }
    Project ||--o{ Clip : contains
    Clip ||--o| Subtitle : has
    Project ||--o| AudioTrack : has
```

### 6.2 前端状态定义（Zustand Store）

```typescript
interface Clip {
  id: string;
  filename: string;
  duration: number;
  trimStart: number;
  trimEnd: number;
  videoUrl: string;
  thumbnailUrl: string;
  order: number;
}

interface Subtitle {
  id: string;
  clipId: string;
  text: string;
  startTime: number;
  endTime: number;
}

interface AudioTrack {
  style: 'light' | 'soothing' | 'suspense' | 'intense' | 'romantic';
  url: string;
  volume: number;
  enabled: boolean;
}

interface ProjectState {
  clips: Clip[];
  subtitles: Subtitle[];
  audioTrack: AudioTrack | null;
  selectedClipId: string | null;
  isPlaying: boolean;
  currentTime: number;

  addClip: (clip: Clip) => void;
  removeClip: (id: string) => void;
  trimClip: (id: string, trimStart: number, trimEnd: number) => void;
  reorderClips: (fromIndex: number, toIndex: number) => void;
  setAudio: (track: AudioTrack | null) => void;
  setSelectedClip: (id: string | null) => void;
  setPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
  addSubtitle: (subtitle: Subtitle) => void;
  removeSubtitle: (id: string) => void;
  updateSubtitle: (id: string, text: string) => void;
}
```
