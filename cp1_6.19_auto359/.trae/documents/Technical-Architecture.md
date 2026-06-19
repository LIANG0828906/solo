## 1. 架构设计

```mermaid
graph TD
    subgraph "前端 (React + TypeScript)"
        A["App.tsx 主应用"]
        B["Zustand Store (orderStore)"]
        C["KitchenBoard 看板组件"]
        D["OrderCard 订单卡片"]
        E["StationPanel 档口面板"]
        F["Socket.io Client"]
    end
    subgraph "后端 (Node.js + Express)"
        G["Express REST API"]
        H["Socket.io Server"]
        I["订单CRUD服务"]
        J["档口负载推荐计算"]
    end
    subgraph "数据层"
        K["内存订单存储 (开发期)"]
    end
    A --> B
    C --> B
    D --> B
    E --> B
    B --> F
    F <--> H
    G --> I
    G --> J
    I --> K
    H --> K
```

## 2. 技术描述

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5.x
- **状态管理**: Zustand 4.x
- **实时通信**: Socket.io Client
- **后端框架**: Express 4.x
- **实时推送**: Socket.io Server
- **跨域支持**: cors
- **HTTP客户端**: axios
- **样式方案**: 原生CSS + CSS变量 + 响应式媒体查询

## 3. 路由定义

| 路由 | 方法 | 用途 |
|------|------|------|
| /api/orders | GET | 获取所有订单列表 |
| /api/orders | POST | 创建新订单 |
| /api/orders/:id | GET | 获取单个订单详情 |
| /api/orders/:id | PUT | 更新订单状态/信息 |
| /api/orders/:id | DELETE | 取消/删除订单 |
| /api/stations | GET | 获取所有档口实时负载 |
| /api/stations/:id/recommend | GET | 获取指定档口推荐分配的订单 |
| /api/stations/:id/lock | POST | 锁定订单到指定档口 |

## 4. API 类型定义

```typescript
// 订单状态枚举
type OrderStatus = 'pending' | 'cooking' | 'finishing' | 'completed';

// 档口类型
type StationType = 'wok' | 'grill' | 'cold';

// 菜品项
interface DishItem {
  name: string;
  emoji: string;
  quantity: number;
  station: StationType;
  cookTime: number; // 秒
}

// 订单
interface Order {
  id: string;
  tableNumber: string;
  status: OrderStatus;
  dishes: DishItem[];
  priority: number; // 1-10, 数值越高优先级越高
  assignedStation?: StationType | null;
  createdAt: number;
  estimatedFinishAt: number;
  remainingTime: number; // 剩余秒数
}

// 档口状态
interface Station {
  type: StationType;
  name: string;
  color: string;
  load: number; // 0-100 百分比
  activeOrders: string[];
  recommendedOrderId?: string;
}
```

## 5. 服务端架构

```mermaid
graph LR
    A["客户端请求"] --> B["Express 路由层"]
    B --> C["订单控制器"]
    B --> D["档口控制器"]
    C --> E["订单服务"]
    D --> F["档口服务"]
    E --> G["内存数据存储"]
    F --> G
    E --> H["Socket.io 广播"]
    F --> H
```

## 6. 数据模型

### 6.1 实体关系

```mermaid
erDiagram
    ORDER {
        string id PK
        string tableNumber
        string status
        number priority
        string assignedStation FK
        number createdAt
        number estimatedFinishAt
        number remainingTime
    }
    DISH {
        string id PK
        string orderId FK
        string name
        string emoji
        number quantity
        string station
        number cookTime
    }
    STATION {
        string type PK
        string name
        string color
        number load
    }
    ORDER ||--o{ DISH : contains
    ORDER }o--o| STATION : assignedTo
```

### 6.2 前端 Store 结构

```typescript
interface OrderStore {
  orders: Order[];
  draggingOrder: Order | null;
  dragOverArea: OrderStatus | null;
  stations: Station[];
  socket: Socket | null;
  currentTime: number;
  setOrders: (orders: Order[]) => void;
  addOrder: (order: Order) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  removeOrder: (id: string) => void;
  setDragging: (order: Order | null) => void;
  setDragOverArea: (area: OrderStatus | null) => void;
  setStations: (stations: Station[]) => void;
  lockOrderToStation: (orderId: string, stationType: StationType) => void;
  initSocket: () => void;
  updateCurrentTime: () => void;
}
```
