## 1. 架构设计

```mermaid
graph TD
    A["React 应用层"] --> B["页面组件 (Pages)"]
    A --> C["通用组件 (Components)"]
    A --> D["状态管理 (Zustand Store)"]
    A --> E["类型定义 (Types)"]
    B --> B1["HomePage 首页"]
    B --> B2["PlantDetailPage 植物详情"]
    B --> B3["ProfilePage 个人中心"]
    C --> C1["PlantCard 植物卡片"]
    C --> C2["Navbar 导航栏"]
    C --> C3["Modal 弹窗组件"]
    C --> C4["Timeline 时间线组件"]
    D --> D1["植物列表状态"]
    D --> D2["领养请求状态"]
    D --> D3["用户信息状态"]
    E --> E1["Plant 植物类型"]
    E --> E2["AdoptionRequest 领养请求类型"]
    E --> E3["GrowthRecord 成长记录类型"]
```

## 2. 技术说明
- 前端框架：React 18 + TypeScript
- 构建工具：Vite
- 路由管理：react-router-dom
- 状态管理：zustand
- 工具库：uuid
- 样式方案：CSS Modules + 全局CSS变量
- 字体：Google Fonts Merriweather
- 图标：Font Awesome CDN

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 首页 - 展示所有可领养植物 |
| /plant/:id | 植物详情页 - 查看植物信息和成长日记 |
| /profile | 个人中心 - 管理发布和领养请求 |

## 4. 数据模型

### 4.1 数据模型定义
```mermaid
erDiagram
    USER ||--o{ PLANT : "发布"
    USER ||--o{ ADOPTION_REQUEST : "发出"
    PLANT ||--o{ ADOPTION_REQUEST : "接收"
    PLANT ||--o{ GROWTH_RECORD : "包含"
    
    USER {
        string id
        string nickname
        string avatar
    }
    
    PLANT {
        string id
        string name
        string latinName
        number difficulty
        string lightRequirement
        string waterFrequency
        string description
        string[] photos
        string status
        string ownerId
        string createdAt
    }
    
    ADOPTION_REQUEST {
        string id
        string plantId
        string applicantId
        string applicantNickname
        string status
        string createdAt
    }
    
    GROWTH_RECORD {
        string id
        string plantId
        string date
        string description
        string photo
    }
```

### 4.2 类型定义
```typescript
// Plant - 植物
interface Plant {
  id: string;
  name: string;
  latinName: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  lightRequirement: 'low' | 'medium' | 'high';
  waterFrequency: 'daily' | 'everyOtherDay' | 'weekly';
  description: string;
  photos: string[];
  status: 'available' | 'adopted';
  ownerId: string;
  createdAt: string;
}

// AdoptionRequest - 领养请求
interface AdoptionRequest {
  id: string;
  plantId: string;
  applicantId: string;
  applicantNickname: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

// GrowthRecord - 成长记录
interface GrowthRecord {
  id: string;
  plantId: string;
  date: string;
  description: string;
  photo?: string;
}

// User - 用户
interface User {
  id: string;
  nickname: string;
  avatar: string;
}
```

## 5. 项目文件结构
```
d:\P\tasks\auto77/
├── package.json
├── index.html
├── vite.config.js
├── tsconfig.json
└── src/
    ├── types.ts
    ├── store.ts
    ├── App.tsx
    ├── main.tsx
    ├── index.css
    ├── components/
    │   └── PlantCard.tsx
    └── pages/
        ├── HomePage.tsx
        ├── PlantDetailPage.tsx
        └── ProfilePage.tsx
```
