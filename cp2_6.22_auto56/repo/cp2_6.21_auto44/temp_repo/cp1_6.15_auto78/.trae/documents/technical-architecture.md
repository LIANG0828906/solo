## 1. 架构设计

```mermaid
graph TD
    subgraph "前端 (React + TypeScript)"
        A["App.tsx 主应用"]
        B["MenuBoard 菜单展示组件"]
        C["OrderPanel 订单面板组件"]
        D["购物车状态管理 (Zustand)"]
        E["API 请求层 (fetch)"]
    end

    subgraph "后端 (Express + Node.js)"
        F["Express 服务器"]
        G["Menu 菜单路由"]
        H["Orders 订单路由"]
        I["内存数据存储"]
    end

    A --> B
    A --> C
    B --> D
    C --> D
    A --> E
    E -->|REST API| F
    F --> G
    F --> H
    G --> I
    H --> I
```

## 2. 技术选型说明

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **样式方案**：CSS Modules + CSS 变量
- **状态管理**：Zustand（轻量级，适合购物车状态）
- **后端框架**：Express 4
- **数据存储**：内存存储（开发演示用）
- **通信方式**：RESTful API
- **图标库**：lucide-react

## 3. 路由定义

| 路由路径 | 页面/组件 | 说明 |
|----------|-----------|------|
| / | App.tsx | 主应用，菜单浏览 + 购物车 + 订单追踪 |

## 4. API 定义

### 4.1 获取菜单列表

```typescript
// GET /api/menu
interface MenuItem {
  id: string;
  name: string;
  category: 'iced' | 'hot' | 'light';
  price: number;
  image_url: string;
  description?: string;
}

// Response: MenuItem[]
```

### 4.2 创建订单

```typescript
// POST /api/orders
interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
}

interface CreateOrderRequest {
  items: OrderItem[];
  pickupTime: string;
  total: number;
}

interface CreateOrderResponse {
  id: string;
  status: 'submitted' | 'preparing' | 'ready' | 'completed';
  pickupTime: string;
  createdAt: string;
}
```

### 4.3 查询订单状态

```typescript
// GET /api/orders/:id
interface OrderStatusResponse {
  id: string;
  status: 'submitted' | 'preparing' | 'ready' | 'completed';
  items: OrderItem[];
  pickupTime: string;
  total: number;
  createdAt: string;
  updatedAt: string;
}
```

## 5. 服务器架构图

```mermaid
graph TD
    A["Express App (server/index.js)"] --> B["CORS 中间件"]
    A --> C["JSON 解析中间件"]
    A --> D["静态文件服务"]
    A --> E["GET /api/menu"]
    A --> F["POST /api/orders"]
    A --> G["GET /api/orders/:id"]
    
    E --> H["menuData 内存数据"]
    F --> I["orders 内存存储"]
    G --> I
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    MENU_ITEM {
        string id PK
        string name
        string category
        number price
        string image_url
        string description
    }
    
    ORDER {
        string id PK
        string status
        string pickupTime
        number total
        string createdAt
        string updatedAt
    }
    
    ORDER_ITEM {
        string id PK
        string orderId FK
        string menuItemId
        string name
        number price
        number quantity
    }
    
    ORDER ||--o{ ORDER_ITEM : contains
```

### 6.2 初始数据

菜单初始数据包含：
- 冰饮类：冰美式、冰拿铁、冰摩卡、冰焦糖玛奇朵
- 热饮类：热美式、热拿铁、热卡布奇诺、热巧克力
- 轻食类：牛角包、芝士蛋糕、提拉米苏、三明治

每个商品包含 id、name、category、price、image_url、description 字段。
