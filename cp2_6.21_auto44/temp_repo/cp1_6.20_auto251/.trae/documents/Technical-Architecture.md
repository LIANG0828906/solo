## 1. 架构设计

```mermaid
flowchart LR
    subgraph "前端层"
        A["React 18 + TypeScript"] --> B["Vite 构建"]
        A --> C["Tone.js 音序处理"]
        A --> D["WebSocket 客户端"]
        A --> E["Canvas 波形可视化"]
    end
    
    subgraph "后端层"
        F["Express REST API"] --> G["项目管理"]
        F --> H["文件存储"]
        I["WebSocket 服务端"] --> J["协作者状态管理"]
        I --> K["操作验证与广播"]
        L["混音引擎模块"] --> M["ffmpeg WAV生成"]
    end
    
    subgraph "数据层"
        N["内存存储（项目/音符/协作者）"]
    end
    
    D --> I
    F --> N
    L --> M
```

## 2. 技术描述

- **前端**：React 18 + TypeScript + Vite
- **构建工具**：Vite
- **后端**：Express 4 + WebSocket (ws库)
- **音频处理**：Tone.js（前端音序）+ ffmpeg（后端混音）
- **实时通信**：ws (WebSocket库)
- **数据存储**：内存存储（开发环境）
- **UI框架**：Material Design 风格（自定义CSS）
- **依赖管理**：npm

## 3. 技术栈详细说明：

| 层级 | 技术 | 用途 |
|------|------|------|
| 前端展示 | React 18 | 组件化UI开发 |
| 类型系统 | TypeScript | 类型安全 |
| 构建工具 | Vite | 快速开发构建 |
| 音频处理 | Tone.js | 音序数据处理 |
| 后端服务 | Express 4 | REST API服务 |
| 实时通信 | ws | WebSocket服务端 |
| 音频生成 | ffmpeg | WAV格式音频生成 |
| 唯一标识 | uuid | 生成项目/协作者唯一ID |

## 3. 路由定义

| 路由 | 方法 | 用途 |
|------|------|------|
| / | - | 首页（项目列表） |
| /editor/:projectId | - | 乐谱编辑器页面 |
| /api/projects | GET | 获取项目列表 |
| /api/projects | POST | 创建新项目 |
| /api/projects/:id | GET | 获取单个项目详情 |
| /api/projects/:id | PUT | 更新项目 |
| /api/projects/:id | DELETE | 删除项目 |
| /api/projects/:id/mix | POST | 混音请求，返回WAV音频 |
| /ws | - | WebSocket连接端点 |

## 4. API 定义

### 4.1 类型定义

```typescript
// 音符数据模型
interface Note {
  id: string;
  trackId: string;
  pitch: number; // MIDI音高 0-127
  start: number; // 起始时间（八分音符数）
  duration: number; // 持续时间（八分音符数）
  velocity: number; // 力度 0-127
}

// 轨道（声部）
interface Track {
  id: string;
  name: string;
  instrument: string;
  color: string;
  width: number;
  notes: Note[];
}

// 协作者
interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  color: string;
  cursor?: { x: number; y: number };
  selectedTrackId?: string;
}

// 项目
interface Project {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  tracks: Track[];
  collaborators: Collaborator[];
  metadata: {
    tempo: number;
    timeSignature: [number, number];
  };
}

// WebSocket消息
interface WSMessage {
  type: 'join' | 'leave' | 'note-add' | 'note-update' | 'note-delete' | 'cursor-move' | 'track-update';
  payload: any;
  projectId: string;
  collaboratorId: string;
  timestamp: number;
}
```

### 4.2 请求/响应模式

**GET /api/projects
```
Response: Project[]
```

**POST /api/projects
```
Request: { name: string; template: string[] }
Response: Project
```

**POST /api/projects/:id/mix
```
Request: { tracks: Track[] }
Response: WAV audio buffer (Content-Type: audio/wav)
```

## 5. 服务器架构图

```mermaid
flowchart TD
    A["Express 服务器"] --> B["REST API 控制器"]
    A --> C["WebSocket 服务"]
    B --> D["项目服务"]
    B --> E["混音服务"]
    C --> F["协作者管理"]
    C --> G["操作验证器"]
    C --> H["消息广播器"]
    D --> I["内存存储"]
    E --> J["混音引擎 (child_process)"]
    J --> K["ffmpeg 进程"]
    F --> I
    G --> I
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    PROJECT ||--o{ TRACK : contains
    TRACK ||--o{ NOTE : contains
    PROJECT ||--o{ COLLABORATOR : has
    
    PROJECT {
        string id PK
        string name
        number createdAt
        number updatedAt
        number tempo
        string timeSignature
    }
    
    TRACK {
        string id PK
        string projectId FK
        string name
        string instrument
        string color
        number width
    }
    
    NOTE {
        string id PK
        string trackId FK
        number pitch
        number start
        number duration
        number velocity
    }
    
    COLLABORATOR {
        string id PK
        string projectId FK
        string name
        string avatar
        string color
        number cursorX
        number cursorY
        string selectedTrackId
    }
```

### 6.2 项目文件结构

```
auto251/
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
├── src/
│   ├── App.tsx
│   ├── components/
│   │   ├── ProjectList.tsx
│   │   └── EditorPanel.tsx
│   └── types/
│       └── index.ts
└── server/
    ├── index.ts
    └── mixer.ts
    └── types.ts
```

## 7. 关键技术决策

1. **实时同步机制：
   - 使用WebSocket（ws库）实现100ms内同步
   - 操作先在服务端验证再广播
   - 采用增量更新而非全量同步

2. **混音引擎**：
   - 独立模块封装
   - 通过child_process调用ffmpeg
   - 支持多声部合并为16位WAV输出

3. **性能优化**：
   - 音符操作局部更新
   - Canvas波形50fps刷新率
   - 连接池管理协作者状态

4. **安全考虑**：
   - 操作ID防重复
   - 协作者数量限制（最多6人）
   - 音符数据合法性校验
