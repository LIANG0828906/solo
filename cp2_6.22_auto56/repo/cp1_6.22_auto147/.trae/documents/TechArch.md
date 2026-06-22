## 1. 架构设计

```mermaid
graph TD
    subgraph "前端 (React + TypeScript)"
        A["App.tsx (路由/布局)"]
        B["pages/Login.tsx"]
        C["pages/ProjectList.tsx"]
        D["pages/TimelineDetail.tsx"]
        E["components/TimeLine.tsx"]
        F["components/StatusBadge.tsx"]
        G["dataProcessor.ts (数据处理)"]
        H["api/client.ts (API封装)"]
        I["context/AuthContext.tsx"]
    end
    
    subgraph "后端 (Node.js + Express)"
        J["server/index.ts (API路由)"]
        K["server/auth.ts (JWT认证)"]
        L["server/data.ts (内存数据存储)"]
    end
    
    A --> B
    A --> C
    A --> D
    D --> E
    D --> F
    E --> G
    D --> H
    B --> H
    C --> H
    H --> J
    J --> K
    J --> L
```

## 2. 技术栈说明
- **前端**：React 18 + TypeScript 5 + Vite 5 + React Router DOM 6 + Axios + date-fns + uuid
- **后端**：Node.js + Express 4 + cors + jsonwebtoken + bcryptjs
- **构建工具**：Vite 5 + @vitejs/plugin-react
- **数据存储**：内存存储（开发阶段），后续可扩展为SQLite/PostgreSQL

## 3. 路由定义
| 路由 | 用途 | 鉴权要求 |
|------|------|----------|
| /login | 登录注册页 | 否 |
| /projects | 项目列表页 | 是 |
| /projects/:id | 时间轴详情页 | 是 |
| / | 重定向到 /projects 或 /login | - |

## 4. API 定义

### 4.1 TypeScript 类型定义
```typescript
interface User {
  id: string;
  username: string;
  avatar?: string;
}

interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
  memberIds: string[];
  createdAt: string;
  updatedAt: string;
}

type TaskStatus = 'planned' | 'in-progress' | 'blocked' | 'completed';

interface TaskUpdate {
  id: string;
  projectId: string;
  userId: string;
  targetUserId: string;
  status: TaskStatus;
  note: string;
  tags: string[];
  createdAt: string;
}

interface WeeklyReport {
  userId: string;
  username: string;
  completed: number;
  blocked: number;
  inProgress: number;
  notes: string[];
}
```

### 4.2 请求/响应接口
| 方法 | 路径 | 描述 | 请求体 | 响应 |
|------|------|------|--------|------|
| POST | /api/auth/register | 用户注册 | { username, password } | { user, token } |
| POST | /api/auth/login | 用户登录 | { username, password } | { user, token } |
| GET | /api/projects | 获取项目列表 | - | Project[] |
| POST | /api/projects | 创建项目 | { name, description } | Project |
| POST | /api/projects/:id/members | 邀请成员 | { username } | Project |
| GET | /api/projects/:id/updates | 获取任务更新 | - | TaskUpdate[] |
| POST | /api/projects/:id/updates | 发布任务更新 | { targetUserId, status, note, tags } | TaskUpdate |
| GET | /api/projects/:id/weekly-report | 生成周报 | - | WeeklyReport[] |
| GET | /api/users | 获取所有用户 | - | User[] |

## 5. 服务端架构图

```mermaid
graph TD
    A["HTTP 请求"] --> B["Express Middleware"]
    B --> C["CORS 处理"]
    B --> D["JSON 解析"]
    B --> E["JWT 鉴权中间件"]
    E --> F["路由处理器"]
    F --> G["/api/auth/*"]
    F --> H["/api/projects/*"]
    F --> I["/api/users/*"]
    G --> J["auth.ts (注册/登录/Token校验)"]
    H --> K["内存数据层 (data.ts)"]
    I --> K
    K --> L["内存存储 (Map/Array)"]
```

## 6. 数据模型

### 6.1 ER 图
```mermaid
erDiagram
    USER ||--o{ PROJECT : "创建"
    USER }|--o{ PROJECT_MEMBER : "参与"
    PROJECT ||--o{ PROJECT_MEMBER : "包含"
    PROJECT ||--o{ TASK_UPDATE : "包含"
    USER ||--o{ TASK_UPDATE : "发布"
    USER ||--o{ TASK_UPDATE : "目标"
    
    USER {
        string id PK
        string username
        string passwordHash
        string createdAt
    }
    
    PROJECT {
        string id PK
        string name
        string description
        string ownerId FK
        string createdAt
        string updatedAt
    }
    
    PROJECT_MEMBER {
        string projectId PK
        string userId PK
        string joinedAt
    }
    
    TASK_UPDATE {
        string id PK
        string projectId FK
        string userId FK
        string targetUserId FK
        string status
        string note
        string tags
        string createdAt
    }
```

### 6.2 文件结构与调用关系
```
项目根目录/
├── package.json          # 依赖配置
├── vite.config.js        # Vite构建配置
├── tsconfig.json         # TypeScript配置
├── index.html            # 前端入口HTML
├── server/
│   ├── index.ts          # Express服务器入口 (调用 auth.ts 和 data.ts)
│   ├── auth.ts           # JWT认证模块 (被 server/index.ts 调用)
│   └── data.ts           # 内存数据存储 (被 server/index.ts 调用)
└── src/
    ├── main.tsx          # React入口 (渲染 App.tsx)
    ├── App.tsx           # 主组件 (路由配置、布局导航，调用子页面)
    ├── api/
    │   └── client.ts     # Axios API封装 (被所有页面调用)
    ├── context/
    │   └── AuthContext.tsx # 认证上下文 (被 App.tsx 和页面调用)
    ├── pages/
    │   ├── Login.tsx         # 登录页 (调用 api/client.ts)
    │   ├── ProjectList.tsx   # 项目列表页 (调用 api/client.ts)
    │   └── TimelineDetail.tsx # 时间轴详情页 (调用 api/client.ts、dataProcessor.ts、组件)
    ├── components/
    │   ├── TimeLine.tsx      # 时间轴组件 (接收 dataProcessor 输出)
    │   ├── StatusBadge.tsx   # 状态徽章组件 (被 TimeLine.tsx 调用)
    │   ├── Sidebar.tsx       # 侧边导航组件 (被 App.tsx 调用)
    │   ├── Modal.tsx         # 模态框组件 (被 TimelineDetail.tsx 调用)
    │   └── FilterBar.tsx     # 筛选栏组件 (被 TimelineDetail.tsx 调用)
    ├── types/
    │   └── index.ts          # 类型定义 (被所有模块引用)
    └── dataProcessor.ts      # 数据处理模块 (被 TimelineDetail.tsx 调用)
```

**数据流向**：
1. 前端页面 → `api/client.ts` → HTTP请求 → `server/index.ts` → `auth.ts`鉴权 → `data.ts`读写
2. 后端响应 → `api/client.ts` → 前端状态 → `dataProcessor.ts`处理 → `TimeLine.tsx`渲染
3. 用户交互 → 页面组件状态更新 → `dataProcessor.ts`重新计算 → 时间轴重新渲染
