## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层"
        A["React SPA (Vite)"]
        B["路由管理 (React Router)"]
        C["状态管理 (Zustand)"]
        D["UI组件库"]
    end
    
    subgraph "接口层"
        E["RESTful API"]
        F["CORS处理"]
        G["JSON数据解析"]
    end
    
    subgraph "服务层"
        H["Express服务器"]
        I["路由处理器"]
        J["业务逻辑"]
    end
    
    subgraph "数据层"
        K["内存数据存储"]
        L["数据操作模块"]
    end
    
    A --> B & C & D
    D --> E
    E --> F & G
    F & G --> H
    H --> I
    I --> J
    J --> L
    L --> K
```

## 2. 技术描述

- **前端**：React 18 + TypeScript + Vite
  - 路由：React Router DOM
  - 状态管理：Zustand
  - 样式：Tailwind CSS 3
  - HTTP客户端：Fetch API
- **后端**：Express 4 + TypeScript
  - CORS跨域处理
  - 内存数据存储（开发阶段）
- **构建工具**：Vite 5
  - React插件支持
  - 开发服务器代理配置
  - HMR热更新

## 3. 路由定义

| 路由 | 页面组件 | 用途 |
|------|----------|------|
| `/` | HomePage | 首页瀑布流展示所有作品 |
| `/portfolio/:id` | PortfolioPage | 画集详情页，展示特定画集作品 |
| `/work/:id` | WorkDetailPage | 作品大图预览页 |
| `/admin` | AdminPage | 管理面板，作品和预约管理 |
| `/api/portfolios` | - | REST API - 画集CRUD |
| `/api/works` | - | REST API - 作品CRUD |
| `/api/appointments` | - | REST API - 预约CRUD |

## 4. API 定义

### 4.1 类型定义
```typescript
interface Portfolio {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  workCount: number;
  createdAt: string;
}

interface Work {
  id: string;
  portfolioId: string;
  title: string;
  description: string;
  imageUrl: string;
  thumbnailUrl: string;
  tags: string[];
  likes: number;
  isLiked: boolean;
  createdAt: string;
}

interface Appointment {
  id: string;
  name: string;
  email: string;
  phone: string;
  serviceType: 'illustration' | 'commercial' | 'other';
  expectedDate: string;
  description: string;
  status: 'pending' | 'contacted' | 'completed';
  createdAt: string;
}
```

### 4.2 API 接口

| 方法 | 路径 | 请求体 | 响应 | 用途 |
|------|------|--------|------|------|
| GET | `/api/portfolios` | - | Portfolio[] | 获取所有画集 |
| GET | `/api/portfolios/:id` | - | Portfolio | 获取单个画集 |
| GET | `/api/works` | - | Work[] | 获取所有作品 |
| GET | `/api/works?portfolioId=:id` | - | Work[] | 获取指定画集的作品 |
| GET | `/api/works/:id` | - | Work | 获取单个作品 |
| POST | `/api/works` | Partial<Work> | Work | 上传新作品 |
| PUT | `/api/works/:id` | Partial<Work> | Work | 更新作品信息 |
| DELETE | `/api/works/:id` | - | {success: boolean} | 删除作品 |
| POST | `/api/works/:id/like` | - | {likes: number, isLiked: boolean} | 点赞/取消点赞 |
| GET | `/api/appointments` | - | Appointment[] | 获取所有预约 |
| POST | `/api/appointments` | Partial<Appointment> | Appointment | 创建预约 |
| PUT | `/api/appointments/:id` | {status: string} | Appointment | 更新预约状态 |

## 5. 服务器架构

```mermaid
graph TD
    A["HTTP请求"] --> B["CORS中间件"]
    B --> C["JSON解析中间件"]
    C --> D["路由分发"]
    D --> E["Portfolios路由"]
    D --> F["Works路由"]
    D --> G["Appointments路由"]
    E --> H["数据存储模块"]
    F --> H
    G --> H
    H --> I["内存数据"]
    I --> J["Portfolios集合"]
    I --> K["Works集合"]
    I --> L["Appointments集合"]
```

## 6. 数据模型

### 6.1 ER图

```mermaid
erDiagram
    PORTFOLIO ||--o{ WORK : contains
    PORTFOLIO {
        string id PK
        string name
        string description
        string coverImage
        number workCount
        datetime createdAt
    }
    
    WORK {
        string id PK
        string portfolioId FK
        string title
        string description
        string imageUrl
        string thumbnailUrl
        string[] tags
        number likes
        boolean isLiked
        datetime createdAt
    }
    
    APPOINTMENT {
        string id PK
        string name
        string email
        string phone
        string serviceType
        date expectedDate
        string description
        string status
        datetime createdAt
    }
```

### 6.2 初始数据

系统启动时将加载示例数据，包括：
- 3个画集：人物插画、风景水彩、商业海报
- 每个画集包含3-5张示例作品
- 2-3条示例预约记录
- 使用占位图片URL（picsum.photos）
