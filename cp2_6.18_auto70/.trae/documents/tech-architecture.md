## 1. 架构设计

```mermaid
graph TB
    subgraph "前端应用"
        A["React 组件层"] --> B["Zustand 状态管理层"]
        B --> C["工具模块层"]
        C --> D["类型定义层"]
    end
    subgraph "模块划分"
        A1["项目管理模块<br/>ProjectList / ProjectDetail"]
        A2["音频导出模块<br/>AudioExportDialog"]
        A3["公共UI组件<br/>Sidebar / Waveform / Comments"]
    end
    subgraph "状态通信"
        B1["projectStore<br/>项目/曲目/版本全局状态"]
        B2["共享曲目状态对象<br/>版本管理 ↔ 时间线视图"]
    end
    subgraph "工具模块"
        C1["downloadQueue<br/>下载队列管理(并发3)"]
        C2["工具函数<br/>格式化/日期/动画"]
    end
```

## 2. 技术描述
- 前端：React@18 + TypeScript + Vite
- 状态管理：Zustand
- 路由：React Router DOM
- 工具库：uuid、date-fns
- 样式方案：TailwindCSS + 自定义CSS变量
- 后端：无（纯前端Mock数据）

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 项目列表页，展示所有项目卡片 |
| /project/:id | 项目详情页，曲目管理与版本时间线 |

## 4. 数据模型

### 4.1 类型定义
```typescript
interface Project {
  id: string;
  name: string;
  clientName: string;
  genres: string[];
  bpmRange: { min: number; max: number };
  trackIds: string[];
  collaborators: Collaborator[];
  createdAt: Date;
}

interface Track {
  id: string;
  projectId: string;
  name: string;
  description: string;
  status: 'pending' | 'recorded' | 'mixing' | 'finalized';
  versionIds: string[];
  assigneeId?: string;
  createdAt: Date;
}

interface Version {
  id: string;
  trackId: string;
  version: string;
  uploader: string;
  uploadTime: Date;
  note: string;
  audioUrl: string;
  fileSize: number;
  commentIds: string[];
}

interface Comment {
  id: string;
  versionId: string;
  author: string;
  authorId: string;
  content: string;
  emoji?: string;
  timestamp: number;
  createdAt: Date;
}

interface Collaborator {
  id: string;
  name: string;
  color: string;
}
```

### 4.2 ER 图
```mermaid
erDiagram
    PROJECT ||--o{ TRACK : contains
    PROJECT ||--o{ COLLABORATOR : has
    TRACK ||--o{ VERSION : has
    VERSION ||--o{ COMMENT : has
    TRACK }o--|| COLLABORATOR : "assigned to"
    
    PROJECT {
        string id PK
        string name
        string clientName
        string[] genres
        int bpmMin
        int bpmMax
    }
    TRACK {
        string id PK
        string projectId FK
        string name
        string status
        string assigneeId FK
    }
    VERSION {
        string id PK
        string trackId FK
        string version
        string audioUrl
        int fileSize
    }
    COMMENT {
        string id PK
        string versionId FK
        string content
        int timestamp
    }
    COLLABORATOR {
        string id PK
        string name
        string color
    }
```

## 5. 文件结构
```
src/
├── main.tsx                    # 应用入口
├── App.tsx                     # 根组件（路由）
├── index.css                   # 全局样式 + Tailwind
├── store/
│   └── projectStore.ts         # Zustand 全局状态
├── modules/
│   ├── projectManager/
│   │   ├── ProjectList.tsx     # 项目列表页
│   │   └── ProjectDetail.tsx   # 项目详情页
│   └── audioExport/
│       └── AudioExportDialog.tsx # 导出对话框
├── components/
│   ├── Sidebar.tsx             # 侧边导航
│   ├── ProjectCard.tsx         # 项目卡片
│   ├── Timeline.tsx            # 版本时间线
│   ├── Waveform.tsx            # 波形对比
│   ├── CommentBubble.tsx       # 评论气泡
│   ├── AudioPlayer.tsx         # 音频播放器
│   └── ui/                     # 基础UI组件
├── utils/
│   └── downloadQueue.ts        # 下载队列模块
├── types/
│   └── index.ts                # 全局类型定义
└── data/
    └── mockData.ts             # Mock演示数据
```
