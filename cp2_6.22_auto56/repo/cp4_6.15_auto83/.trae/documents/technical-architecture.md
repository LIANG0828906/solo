## 1. 架构设计

```mermaid
graph TB
    subgraph "前端 (Frontend"
        A["React + TypeScript + Vite"]
        B["Zustand 状态管理"]
        C["React Router 路由"]
        D["组件层 (首页/播放列表/播放器/历史)"]
    end
    subgraph "后端 (Backend)"
        E["Express.js"]
        F["情绪分析模块"]
        G["音乐数据管理"]
    end
    subgraph "数据层"
        H["内存数据存储"]
        I["静态音乐数据"]
    end
    A -->|HTTP API| E
    E --> F
    E --> G
    G --> I
    F --> H
```

## 2. 技术描述

- **前端**: React@18 + TypeScript + Vite
- **状态管理**: Zustand
- **路由**: React Router DOM
- **样式**: 原生CSS（毛玻璃效果、动画）
- **后端**: Express@4 + TypeScript
- **HTTP客户端**: Fetch API
- **图标**: Font Awesome + Lucide React
- **字体**: Google Fonts (Poppins)
- **音频**: HTML5 Audio API
- **数据存储**: 内存对象（静态数据）

## 3. 项目结构

```
.
├── package.json              # 根目录配置
├── index.html              # 入口HTML
├── vite.config.js           # Vite配置
├── tsconfig.json          # TypeScript配置
├── frontend/
│   └── src/
│       ├── components/
│       │   ├── App.tsx              # 主应用组件
│       │   ├── WelcomePage.tsx       # 情绪选择首页
│       │   ├── PlaylistPage.tsx     # 播放列表页
│       │   ├── Player.tsx           # 迷你播放器
│       │   ├── HistoryPage.tsx      # 历史记录页
│       │   ├── MoodCard.tsx        # 情绪卡片组件
│       │   ├── SongCard.tsx         # 歌曲卡片组件
│       │   └── Sidebar.tsx         # 侧边栏导航
│       ├── store/
│       │   └── moodStore.ts       # Zustand状态管理
│       ├── types/
│       │   └── index.ts          # 类型定义
│       └── utils/
│           └── api.ts             # API请求工具
└── backend/
    └── src/
        ├── server.ts              # Express服务器
        └── data/
            └── moodSongs.ts         # 音乐数据
```

## 3. 路由定义

| 路由 | 目的 |
|-------|---------|
| `/` | 情绪选择首页 |
| `/playlist` | 播放列表页 |
| `/history` | 情绪历史记录页 |

## 4. API 定义

### 4.1 获取情绪列表
- **GET** `/api/moods`
- **响应**:
```typescript
interface Mood {
  id: string;
  name: string;
  label: string;
  emoji: string;
  gradient: string;
}
```

### 4.2 情绪预测分析
- **POST** `/api/predict-mood`
- **请求体**:
```typescript
interface PredictMoodRequest {
  text?: string;
  mood?: string;
}
```
- **响应**:
```typescript
interface PredictMoodResponse {
  emotion: string;
  confidence: number;
}
```

### 4.3 获取推荐播放列表
- **POST** `/api/recommend`
- **请求体**:
```typescript
interface RecommendRequest {
  mood: string;
}
```
- **响应**:
```typescript
interface Song {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  duration: number;
  previewUrl: string;
}
type RecommendResponse = Song[];
```

## 5. 数据模型

### 5.1 情绪数据模型

```mermaid
erDiagram
    MOOD ||--o{ SONG : "推荐"
    MOOD {
        string id PK "情绪ID"
        string name "情绪名称"
        string emoji "情绪emoji"
        string gradient "渐变色"
    }
    SONG {
        string id PK "歌曲ID"
        string title "歌曲标题"
        string artist "艺术家"
        string coverUrl "封面URL"
        number duration "时长(秒)"
        string previewUrl "预览URL"
    }
    HISTORY {
        string id PK "记录ID"
        string moodId FK "情绪ID"
        string moodName "情绪名称"
        number songCount "歌曲数量"
        Date timestamp "时间戳"
        Song[] songs "歌曲列表"
    }
```
