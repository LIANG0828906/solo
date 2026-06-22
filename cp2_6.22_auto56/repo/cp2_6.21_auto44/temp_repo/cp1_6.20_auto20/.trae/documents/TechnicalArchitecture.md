## 1. 架构设计

```mermaid
graph TD
    subgraph "前端 React + TypeScript"
        A["App.tsx (路由/全局状态)"]
        B["PlaylistCard.tsx (歌单卡片)"]
        C["PlayerBar.tsx (播放器)"]
        D["SongList.tsx (歌曲列表)"]
        E["types.ts (类型定义)"]
        F["index.css (全局样式)"]
    end

    subgraph "后端 Express"
        G["server/index.js (Express服务)"]
        H["本地JSON存储"]
    end

    subgraph "构建工具 Vite"
        I["vite.config.js (代理/插件)"]
    end

    A --> B
    A --> C
    A --> D
    A --> E
    D --> C
    A --> G
    G --> H
    I --> A
```

## 2. 技术选型说明

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite（快速热更新、开箱即用）
- **后端服务**：Express 4（轻量级HTTP服务）
- **数据存储**：本地JSON文件（无需数据库，简单易用）
- **状态管理**：React useState/useEffect（项目规模适中，无需额外状态管理库）
- **路由**：简单的hash路由或条件渲染（仅2个页面，无需react-router）
- **唯一ID**：uuid库

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 首页，展示所有歌单卡片列表 |
| /playlist/:id | 歌单详情页，展示歌曲列表和播放器 |

## 4. API 定义

### 4.1 获取所有歌单
```typescript
// GET /api/playlists
// Response:
interface PlaylistListResponse {
  playlists: Playlist[];
}
```

### 4.2 创建歌单
```typescript
// POST /api/playlists
// Request Body:
interface CreatePlaylistRequest {
  name: string;
}
// Response:
interface PlaylistResponse {
  playlist: Playlist;
}
```

### 4.3 获取单个歌单
```typescript
// GET /api/playlists/:id
// Response:
interface PlaylistResponse {
  playlist: Playlist;
}
```

### 4.4 更新歌单（添加/排序/删除歌曲）
```typescript
// PUT /api/playlists/:id
// Request Body:
interface UpdatePlaylistRequest {
  name?: string;
  songs?: Song[];
}
// Response:
interface PlaylistResponse {
  playlist: Playlist;
}
```

### 4.5 删除歌单
```typescript
// DELETE /api/playlists/:id
// Response:
interface DeleteResponse {
  success: boolean;
}
```

## 5. 服务器架构

```mermaid
flowchart LR
    A["Express App"] --> B["路由层 (Routes)"]
    B --> C["文件存储层 (JSON File I/O)"]
    C --> D["data/playlists.json"]
    B --> E["data/playlists.json"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    PLAYLIST ||--o{ SONG : contains
    PLAYLIST {
        string id PK "唯一ID"
        string name "歌单名称"
        string coverGradient "渐变色配置"
        datetime createdAt "创建时间"
    }
    SONG {
        string id PK "唯一ID"
        string title "歌曲名称"
        string artist "艺术家（可选）"
        number duration "时长（秒）"
        string fileUrl "本地Blob URL或文件路径"
        string fileName "原始文件名"
    }
```

### 6.2 TypeScript 类型定义

```typescript
// src/types.ts
interface Song {
  id: string;
  title: string;
  artist?: string;
  duration: number;
  fileUrl: string;
  fileName: string;
}

interface Playlist {
  id: string;
  name: string;
  coverGradient: string;
  songs: Song[];
  createdAt: string;
}
```

## 7. 项目文件结构

```
auto20/
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
├── server/
│   └── index.js          # Express后端服务
├── data/
│   └── playlists.json    # 数据存储文件（运行时创建）
└── src/
    ├── types.ts          # 类型定义
    ├── App.tsx           # 主应用组件
    ├── index.css         # 全局样式
    └── components/
        ├── PlaylistCard.tsx  # 歌单卡片
        ├── PlayerBar.tsx     # 播放器控制条
        └── SongList.tsx      # 歌曲列表
```
