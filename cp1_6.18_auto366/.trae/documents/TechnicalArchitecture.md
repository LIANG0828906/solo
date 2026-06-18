## 1. 架构设计

```mermaid
graph TD
    subgraph "前端 (React + TypeScript)"
        A["App.tsx - 路由入口"] --> B["pages/ProjectList.tsx - 项目列表"]
        A --> C["pages/NoteEditor.tsx - 笔记编辑"]
        B --> D["stores/projectStore.ts - Zustand状态管理"]
        C --> D
        D --> E["RESTful API 调用"]
        C --> F["MindMap Canvas - SVG拖拽画布"]
        C --> G["Tag Filter - 标签过滤组件"]
    end
    subgraph "后端 (Python FastAPI)"
        H["main.py - API路由"] --> I["models.py - SQLAlchemy模型"]
        I --> J["database.py - SQLite连接"]
        H --> K["Pydantic Schemas - 请求响应校验"]
    end
    subgraph "数据层"
        L["SQLite 数据库"]
    end
    E --> H
    J --> L
```

## 2. 技术描述

- **前端**：React 18 + TypeScript + Vite
- **状态管理**：Zustand
- **路由**：react-router-dom
- **图标**：lucide-react
- **后端**：Python FastAPI + Uvicorn
- **ORM**：SQLAlchemy
- **数据库**：SQLite
- **数据库异步驱动**：databases（可选，同步模式也可）
- **唯一ID**：uuid（前端）/ Python uuid（后端）

## 3. 路由定义

| 路由路径 | 页面组件 | 用途 |
|----------|----------|------|
| / | ProjectList | 项目列表页，展示所有项目，支持创建 |
| /project/:id | NoteEditor | 笔记编辑页，管理段落、标签、思维导图 |

## 4. API 定义

### TypeScript 类型定义

```typescript
interface Project {
  id: string;
  title: string;
  description: string;
  created_at: string;
}

interface Note {
  id: string;
  project_id: string;
  excerpt: string;
  reflection: string;
  tags: string[];
  created_at: string;
}

interface MindMapNode {
  id: string;
  noteId: string;
  x: number;
  y: number;
}

interface MindMapEdge {
  id: string;
  from: string;
  to: string;
}

interface MindMapData {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

interface Comment {
  id: string;
  project_id: string;
  nickname: string;
  avatar_color: string;
  content: string;
  created_at: string;
}
```

### API 端点

| 方法 | 路径 | 请求体 | 响应 | 说明 |
|------|------|--------|------|------|
| GET | /projects | - | Project[] | 获取所有项目列表 |
| POST | /projects | { title, description } | Project | 创建新项目 |
| GET | /projects/{id}/notes | - | Note[] | 获取项目下所有笔记 |
| POST | /projects/{id}/notes | { excerpt, reflection, tags } | Note | 创建新笔记 |
| PUT | /notes/{id} | { excerpt?, reflection?, tags? } | Note | 更新笔记 |
| GET | /projects/{id}/mindmap | - | MindMapData | 获取项目思维导图数据 |
| PUT | /projects/{id}/mindmap | MindMapData | MindMapData | 更新思维导图数据 |
| GET | /projects/{id}/comments | - | Comment[] | 获取项目评论列表 |
| POST | /projects/{id}/comments | { content } | Comment | 添加评论 |
| POST | /projects/{id}/like | - | { likes: number } | 点赞项目 |

## 5. 服务端架构图

```mermaid
graph TD
    A["FastAPI 路由层 (main.py)"] --> B["数据校验层 (Pydantic Schemas)"]
    B --> C["业务逻辑层 (main.py 内)"]
    C --> D["ORM 层 (models.py)"]
    D --> E["数据库连接 (database.py)"]
    E --> F["SQLite 文件数据库"]
```

## 6. 数据模型

### 6.1 实体关系图

```mermaid
erDiagram
    PROJECT ||--o{ NOTE : contains
    PROJECT ||--o{ COMMENT : has
    PROJECT ||--|| MINDMAP : has
    NOTE {
        uuid id PK
        uuid project_id FK
        text excerpt
        text reflection
        string tags
        datetime created_at
    }
    PROJECT {
        uuid id PK
        string title
        string description
        integer likes
        datetime created_at
    }
    COMMENT {
        uuid id PK
        uuid project_id FK
        string nickname
        string avatar_color
        text content
        datetime created_at
    }
    MINDMAP {
        uuid id PK
        uuid project_id FK
        json nodes_data
        json edges_data
    }
```

### 6.2 数据库 DDL

```sql
CREATE TABLE projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notes (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    excerpt TEXT NOT NULL,
    reflection TEXT NOT NULL DEFAULT '',
    tags TEXT NOT NULL DEFAULT '[]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE comments (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    nickname TEXT NOT NULL,
    avatar_color TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE TABLE mindmaps (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL UNIQUE,
    nodes_data TEXT NOT NULL DEFAULT '[]',
    edges_data TEXT NOT NULL DEFAULT '[]',
    FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

CREATE INDEX idx_notes_project_id ON notes(project_id);
CREATE INDEX idx_comments_project_id ON comments(project_id);
```
