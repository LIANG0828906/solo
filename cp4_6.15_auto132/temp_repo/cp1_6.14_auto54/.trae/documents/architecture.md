## 1. 架构设计

```mermaid
graph TD
    A["前端 React + TypeScript + Vite"] --> B["UI 组件层"]
    B --> B1["MapView 地图组件"]
    B --> B2["CommentList 评价列表"]
    B --> B3["RadarChart 雷达图"]
    B --> B4["StarRating 星级评分"]
    A --> C["状态管理 Zustand"]
    A --> D["路由管理 React Router"]
    A --> E["API 层 Axios"]
    E --> F["后端 Express"]
    F --> G["lowdb 数据持久化"]
    F --> H["Multer + Sharp 图片处理"]
    G --> I["本地文件存储"]
    H --> J["uploads 图片目录"]
```

## 2. 技术描述

- **前端**：React@18 + TypeScript + Vite + React Router + Zustand + Axios + Leaflet
- **后端**：Express@4 + lowdb + Multer + Sharp + JWT + bcryptjs
- **数据库**：lowdb（JSON文件存储）
- **地图**：Leaflet + @react-leaflet/core + react-leaflet
- **图片处理**：Multer上传 + Sharp压缩裁剪
- **构建工具**：Vite（开发服务器 + 代理配置）

## 3. 路由定义

| 路由 | 用途 |
|-------|---------|
| `/` | 首页（地图 + 评价列表） |
| `/login` | 登录页 |
| `/register` | 注册页 |
| `/community/:id` | 小区详情页 |
| `/community/:id/review` | 评价提交页 |

## 4. API 定义

```typescript
// 类型定义
interface User {
  id: string;
  username: string;
  password: string; // 加密存储
  createdAt: string;
}

interface Community {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  scores: {
    life: number;
    transport: number;
    quiet: number;
    green: number;
    neighbor: number;
  };
  reviewCount: number;
  averageScore: number;
}

interface Review {
  id: string;
  userId: string;
  communityId: string;
  username: string;
  scores: {
    life: number;
    transport: number;
    quiet: number;
  };
  content: string;
  images: string[];
  likes: number;
  likedBy: string[];
  reported: boolean;
  createdAt: string;
}

// API 端点
GET    /api/auth/register      // 注册
POST   /api/auth/login         // 登录
GET    /api/communities     // 小区列表/搜索
GET    /api/communities/:id  // 小区详情
GET    /api/reviews?communityId=:id  // 评价列表
POST   /api/reviews        // 提交评价
POST   /api/reviews/:id/like    // 点赞
POST   /api/reviews/:id/report  // 举报
POST   /api/upload         // 图片上传
```

## 5. 服务端架构

```mermaid
graph TD
    A["Express 路由层"] --> A1["用户认证模块"]
    A --> A2["小区管理模块"]
    A --> A3["评价管理模块"]
    A --> A4["文件上传模块"]
    B["中间件层"] --> B1["JWT 认证中间件"]
    B --> B2["错误处理中间件"]
    C["业务逻辑层"] --> C1["用户服务"]
    C --> C2["小区服务"]
    C --> C3["评价服务"]
    D["数据访问层"] --> D1["lowdb 操作"]
    D --> D2["文件系统操作"]
```

## 6. 数据模型

### 6.1 ER图

```mermaid
erDiagram
    USER ||--o{ REVIEW : "发表"
    COMMUNITY ||--o{ REVIEW : "拥有"
    USER }o--o{ REVIEW : "点赞"
    
    USER {
        string id PK
        string username
        string password
        datetime createdAt
    }
    
    COMMUNITY {
        string id PK
        string name
        string address
        float lat
        float lng
        float life_score
        float transport_score
        float quiet_score
        float green_score
        float neighbor_score
        int reviewCount
        float averageScore
    }
    
    REVIEW {
        string id PK
        string userId FK
        string communityId FK
        string username
        int life_score
        int transport_score
        int quiet_score
        string content
        string images
        int likes
        string likedBy
        boolean reported
        datetime createdAt
    }
```

### 6.2 db.json 初始数据

```json
{
  "users": [],
  "communities": [
    {
      "id": "1",
      "name": "阳光花园",
      "address": "北京市朝阳区建国路88号",
      "lat": 39.9042,
      "lng": 116.4074,
      "scores": {
        "life": 4.2,
        "transport": 4.5,
        "quiet": 3.8,
        "green": 4.0,
        "neighbor": 4.1
      },
      "reviewCount": 156,
      "averageScore": 4.12
    }
  ],
  "reviews": []
}
```
