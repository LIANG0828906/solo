## 1. 架构设计

```mermaid
flowchart LR
    A["React 前端 (Vite)"] --> B["Express 后端 API"]
    A --> C["本地数据存储 (dataStore)"]
    B --> D["内存数据存储"]
```

## 2. 技术说明

- 前端：React 18 + TypeScript + Vite + react-beautiful-dnd + axios + react-router-dom
- 后端：Node.js + Express + cors + uuid
- 构建工具：Vite，配置路径别名 @ 指向 src 目录
- 状态管理：React Hooks (useState, useEffect) 管理组件状态
- 样式方案：内联样式 + CSS 变量 + CSS 动画

## 3. 路由定义

| 路由 | 用途 |
|-------|---------|
| / | 主行程规划页面 |
| /share/:code | 分享行程查看页面 |

## 4. API 定义

### 4.1 TypeScript 类型定义

```typescript
interface Attraction {
  id: string;
  name: string;
  lat: number;
  lng: number;
  description: string;
  duration: number;
  rating: number;
  openTime: string;
  closeTime: string;
  address: string;
  category: string;
}

interface ScheduleItem {
  id: string;
  attractionId: string;
  attraction: Attraction;
}

interface DaySchedule {
  date: string;
  weekday: string;
  morning: ScheduleItem[];
  afternoon: ScheduleItem[];
  evening: ScheduleItem[];
}

interface Trip {
  id: string;
  city: string;
  days: number;
  schedules: DaySchedule[];
  shareCode?: string;
}
```

### 4.2 后端 API 端点

| 方法 | 路径 | 描述 | 请求体 | 响应 |
|------|------|------|--------|------|
| GET | /api/attractions | 获取景点列表 | - | Attraction[] |
| POST | /api/share | 创建分享链接 | Trip | { shareCode: string, shareUrl: string } |
| GET | /api/share/:code | 获取分享行程 | - | Trip |

## 5. 服务器架构图

```mermaid
flowchart TD
    A["Express App"] --> B["CORS 中间件"]
    B --> C["JSON 解析中间件"]
    C --> D["路由控制器"]
    D --> E["/api/attractions"]
    D --> F["/api/share"]
    E --> G["景点数据内存存储"]
    F --> H["分享码内存存储 (uuid)"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    ATTRACTION {
        string id PK
        string name
        float lat
        float lng
        string description
        int duration
        float rating
        string openTime
        string closeTime
        string address
        string category
    }
    
    TRIP {
        string id PK
        string city
        int days
        string shareCode
    }
    
    DAY_SCHEDULE {
        string id PK
        string tripId FK
        string date
        string weekday
    }
    
    SCHEDULE_ITEM {
        string id PK
        string dayScheduleId FK
        string attractionId FK
        string timeSlot
    }
    
    TRIP ||--o{ DAY_SCHEDULE : contains
    DAY_SCHEDULE ||--o{ SCHEDULE_ITEM : contains
    SCHEDULE_ITEM }o--|| ATTRACTION : references
```

### 6.2 预置数据

景点库预置50个景点数据，涵盖不同城市和分类，包含完整的经纬度、开放时间、评分等信息。
