## 1. 架构设计

```mermaid
flowchart TB
  subgraph "前端 (React + TypeScript + Vite)"
    A["App.tsx 主路由"]
    B["Header 导航组件"]
    C["Dashboard 仪表盘页"]
    D["Subscription 订阅管理页"]
    E["Card 通用卡片组件"]
    F["工具函数与 Hooks"]
  end
  subgraph "后端 (Express + TypeScript)"
    G["Express 服务器"]
    H["RESTful API 路由"]
    I["内存数据存储"]
  end
  subgraph "数据层"
    J["订阅数据"]
    K["材料包数据"]
    L["物料时间线数据"]
  end
  A --> B
  A --> C
  A --> D
  C --> E
  D --> E
  C -->|/api/subscription| H
  D -->|/api/materials| H
  H --> I
  I --> J
  I --> K
  I --> L
```

## 2. 技术说明

- **前端**：React 18 + TypeScript + Vite
- **状态管理**：React useState/useEffect（轻量场景，无需额外状态库）
- **样式方案**：CSS Modules 或全局 CSS + CSS 变量（根据项目规模选择）
- **后端**：Express 4 + TypeScript
- **数据存储**：内存数组（无需数据库）
- **开发工具**：Vite 代理 /api 到后端端口

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 仪表盘页面（Dashboard） |
| /subscription | 订阅管理页面（Subscription） |

## 4. API 定义

### 4.1 GET /api/subscription

获取当前用户订阅信息与材料包列表。

**响应：**
```typescript
interface SubscriptionResponse {
  plan: 'basic' | 'premium';
  planName: string;
  nextDelivery: string; // ISO date string
  materials: Material[];
}

interface Material {
  id: string;
  name: string;
  image: string;
  quantity: number;
  description: string;
  usageScene: string;
}
```

### 4.2 GET /api/materials

获取月度物料时间线数据。

**响应：**
```typescript
interface MaterialsTimelineResponse {
  items: TimelineItem[];
}

interface TimelineItem {
  id: string;
  month: string;
  date: string;
  title: string;
  coverImage: string;
  isSubscribed: boolean;
  guide: Guide;
}

interface Guide {
  title: string;
  thumbnail: string;
  steps: GuideStep[];
}

interface GuideStep {
  id: number;
  image: string;
  description: string;
}
```

## 5. 服务器架构图

```mermaid
flowchart LR
  A["客户端请求"] --> B["Express 服务器 (port 3001)"]
  B --> C["CORS 中间件"]
  B --> D["路由层 (GET /api/*)"]
  D --> E["内存数据模块"]
  E --> F["Mock 数据数组"]
  F --> G["订阅数据"]
  F --> H["材料数据"]
  F --> I["时间线数据"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
  SUBSCRIPTION {
    string plan
    string planName
    date nextDelivery
  }
  MATERIAL {
    string id
    string name
    string image
    int quantity
    string description
    string usageScene
  }
  TIMELINE_ITEM {
    string id
    string month
    date date
    string title
    string coverImage
    boolean isSubscribed
  }
  GUIDE {
    string title
    string thumbnail
  }
  GUIDE_STEP {
    int id
    string image
    string description
  }
  TIMELINE_ITEM ||--|| GUIDE : contains
  GUIDE ||--o{ GUIDE_STEP : has
```

### 6.2 初始数据

- 订阅数据：默认高级版套餐，下次配送日期为未来 15 天
- 材料数据：8-12 种手工材料（布料、线团、工具、饰品配件等）
- 时间线数据：6 个月的月度物料，包含已订阅和未订阅状态
