## 1. 架构设计

```mermaid
flowchart TB
    subgraph Frontend["前端 (React + TypeScript + Vite)"]
        A["App.tsx 主布局"] --> B["FloorMap.tsx 工位地图"]
        A --> C["SidePanel.tsx 侧边面板"]
        A --> D["TeamFeed.tsx 团队动态"]
        E["store.ts Zustand状态管理"] --> A
        F["api.ts API请求封装"] --> E
    end

    subgraph Backend["后端 (Express.js)"]
        G["REST API /api/stations"]
        H["REST API /api/reserve"]
        I["REST API /api/release"]
        J["WebSocket 消息推送"]
        K["模拟工位数据"]
    end

    F -->|"HTTP请求"| G
    F -->|"HTTP请求"| H
    F -->|"HTTP请求"| I
    J -->|"实时推送"| D
    K --> G
```

## 2. 技术说明
- 前端：React 18 + TypeScript + Vite + Zustand + Tailwind CSS
- 初始化工具：vite-init (react-express-ts 模板)
- 后端：Express.js 4 + CORS + uuid
- 数据库：无，使用内存模拟数据
- 实时通信：WebSocket（模拟）

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 主页，包含工位地图、侧边面板、团队动态栏 |

## 4. API 定义

### 4.1 获取工位数据
```
GET /api/stations?date=YYYY-MM-DD
Response: { stations: Station[] }
```

### 4.2 预约工位
```
POST /api/stations/:id/reserve
Body: { userId: string, date: string, startTime: string, endTime: string }
Response: { success: boolean, station: Station }
```

### 4.3 释放工位
```
POST /api/stations/:id/release
Body: { userId: string, date: string }
Response: { success: boolean, station: Station }
```

### 4.4 获取团队消息
```
GET /api/messages
Response: { messages: Message[] }
```

### 4.5 发送团队消息
```
POST /api/messages
Body: { userId: string, content: string }
Response: { success: boolean, message: Message }
```

### 4.6 TypeScript 类型定义
```typescript
interface Station {
  id: string;
  name: string;
  row: number;
  col: number;
  status: 'available' | 'reserved' | 'occupied';
  reservedBy?: string;
  reserveTime?: string;
}

interface Message {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: number;
  type: 'chat' | 'system';
}

interface ReserveRequest {
  userId: string;
  date: string;
  startTime: string;
  endTime: string;
}
```

## 5. 服务器架构图

```mermaid
flowchart LR
    A["Express Router"] --> B["Station Controller"]
    A --> C["Message Controller"]
    B --> D["Station Service"]
    C --> E["Message Service"]
    D --> F["内存数据存储"]
    E --> F
    F --> G["WebSocket 广播"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    "Station" {
        string id PK
        string name
        number row
        number col
        string status
        string reservedBy
        string reserveTime
    }
    "User" {
        string id PK
        string name
        string avatar
    }
    "Message" {
        string id PK
        string userId FK
        string content
        number timestamp
        string type
    }
    "Reservation" {
        string id PK
        string stationId FK
        string userId FK
        string date
        string startTime
        string endTime
    }
    "User" ||--o{ "Message" : sends
    "User" ||--o{ "Reservation" : makes
    "Station" ||--o{ "Reservation" : has
```

### 6.2 初始化数据
- 24个工位（A-01到A-12，B-01到B-12），6行4列排列
- 5个模拟用户
- 预置部分预约数据
