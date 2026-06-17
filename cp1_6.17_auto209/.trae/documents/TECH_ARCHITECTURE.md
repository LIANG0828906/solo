## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        A1["App.tsx 根组件"]
        A2["Canvas.tsx 星空画布"]
        A3["InspirationManager.ts Zustand状态管理"]
        A4["socketManager.ts WebSocket客户端"]
        A5["UI组件层<br/>协作面板/Tab栏/添加面板"]
    end
    subgraph "后端层"
        B1["Express HTTP服务器"]
        B2["Socket.IO 实时通信服务"]
        B3["Mock数据模拟层"]
    end
    subgraph "数据层"
        C1["内存数据存储<br/>协作者/卡片/星群"]
    end
    A3 --> A2
    A1 --> A2
    A1 --> A5
    A4 --> A3
    A5 --> A3
    A2 --> A4
    A4 <-->|WebSocket| B2
    B1 --> C1
    B2 --> C1
```

## 2. 技术描述

- **前端框架**：React 18 + TypeScript (严格模式)
- **构建工具**：Vite + @vitejs/plugin-react
- **状态管理**：Zustand
- **实时通信**：socket.io-client
- **后端服务**：Express.js + Socket.IO
- **后端语言**：TypeScript (ts-node运行)

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 主页面 - 星空画布与所有交互组件 |
| GET /api/collaborators | 获取协作者列表 |
| GET /api/cards | 获取所有灵感卡片 |
| GET /api/clusters | 获取星群数据 |

## 4. API定义

### 类型定义
```typescript
interface Card {
  id: string;
  title: string;
  description: string;
  category: 'tech' | 'design' | 'operation';
  clusterId: string | null;
  x: number;
  y: number;
  authorId: string;
  createdAt: number;
}

interface Cluster {
  id: string;
  category: 'tech' | 'design' | 'operation';
  x: number;
  y: number;
  particleCount: number;
  targetParticleCount: number;
}

interface Collaborator {
  id: string;
  name: string;
  avatar: string;
  isOnline: boolean;
  lastCardId: string | null;
  lastActiveAt: number;
}

interface ClusterConnection {
  from: string;
  to: string;
}
```

### Socket事件
| 事件名 | 方向 | 数据 |
|--------|------|------|
| 'collaborator:join' | Client→Server | {name, avatar} |
| 'collaborator:list' | Server→Client | Collaborator[] |
| 'card:create' | Client→Server | CardCreateData |
| 'card:created' | Server→Client | Card |
| 'card:move' | Client→Server | {cardId, x, y, clusterId} |
| 'card:moved' | Server→Client | {cardId, x, y, clusterId, userId} |
| 'card:recluster' | Client→Server | {cardId, oldClusterId, newClusterId} |
| 'card:reclustered' | Server→Client | {cardId, ...clusterChanges} |

## 5. 服务器架构图

```mermaid
flowchart LR
    A["HTTP入口<br/>server/index.ts"] --> B["Express App"]
    A --> C["Socket.IO Server"]
    B --> D["REST路由层"]
    D --> E["数据访问层"]
    C --> F["事件处理器"]
    F --> E
    E --> G["内存数据仓库"]
    G --> H["Mock种子数据"]
```

## 6. 数据模型

### 6.1 数据模型ER图
```mermaid
erDiagram
    COLLABORATOR ||--o{ CARD : "creates"
    COLLABORATOR {
        string id PK
        string name
        string avatar
        boolean isOnline
        string lastCardId FK
        number lastActiveAt
    }
    CARD }o--|| CLUSTER : "belongs to"
    CARD {
        string id PK
        string title
        string description
        string category
        string clusterId FK
        number x
        number y
        string authorId FK
        number createdAt
    }
    CLUSTER ||--|{ CLUSTER_CONNECTION : "connects"
    CLUSTER {
        string id PK
        string category
        number x
        number y
        number particleCount
    }
    CLUSTER_CONNECTION {
        string fromCluster PK
        string toCluster PK
    }
```

### 6.2 初始Mock数据
- 3个初始星群（技术/设计/运营），位置均匀分布于画布
- 每星群5-6张示例卡片
- 3-4名模拟协作者，不同在线状态
- 星群间关联连线：技术-设计，设计-运营
