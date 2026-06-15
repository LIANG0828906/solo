## 1. 架构设计

```mermaid
graph TD
    subgraph "前端 React (Vite + TS)"
        A["客户前端路由"] --> B["首页组件"]
        A --> C["图书详情页组件"]
        D["管理员后台路由"] --> E["仪表盘组件"]
        D --> F["库存管理组件"]
        G["共享组件层"] --> H["BookCard 图书卡片"]
        G --> I["CartModal 购物车模态"]
        J["Zustand 状态管理"] --> K["购物车状态"]
        J --> L["浏览历史状态"]
    end
    
    subgraph "后端 Node.js (Express + TS)"
        M["Express 服务器"] --> N["GET /api/books 图书查询"]
        M --> O["POST /api/orders 订单提交"]
        N --> P["模拟数据库 data.ts"]
        O --> P
    end
    
    subgraph "通信层"
        Q["RESTful API /api/*"]
        R["Vite 代理转发 :5173/api → :3001"]
    end
    
    B --> Q
    C --> Q
    E --> Q
    F --> Q
    Q --> R
    R --> M
```

## 2. 技术说明

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite 5
- **状态管理**：Zustand
- **路由**：React Router DOM 6
- **样式方案**：Tailwind CSS 3 + 自定义 CSS 动画
- **图标库**：Lucide React
- **后端框架**：Express 4
- **后端语言**：TypeScript（ts-node/tsx 运行）
- **数据库**：内存模拟数据（data.ts 常量数组）
- **跨域处理**：Vite devServer proxy → Express cors 中间件
- **进程管理**：concurrently 同时启动前后端

## 3. 路由定义

| 路由路径 | 页面用途 |
|----------|----------|
| `/` | 客户首页（轮播 + 猜你喜欢推荐） |
| `/book/:id` | 图书详情页 |
| `/admin` | 管理员仪表盘（统计卡片 + 库存表格） |

## 4. API 定义

### 4.1 GET /api/books

查询参数：
```typescript
interface BookQuery {
  search?: string;      // 书名/作者模糊搜索
  page?: number;        // 页码，默认 1
  pageSize?: number;    // 每页数量，默认 20
  category?: string;    // 分类过滤
}
```

响应：
```typescript
interface BookListResponse {
  total: number;
  list: Book[];
}

interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  stock: number;
  price: number;
  cover: string;       // 封面图片 URL
  description: string; // 书籍简介
  isBestseller?: boolean;
}
```

### 4.2 GET /api/books/:id

响应：`Book`（单本详情）

### 4.3 POST /api/orders

请求体：
```typescript
interface OrderItem {
  bookId: string;
  title: string;
  price: number;
  quantity: number;
}

interface OrderRequest {
  items: OrderItem[];
  total: number;
  customerName?: string;
}
```

响应：
```typescript
interface OrderResponse {
  orderId: string;     // uuid
  success: boolean;
  message: string;
}
```

## 5. 后端服务架构

```mermaid
graph LR
    A["Express App"] --> B["CORS 中间件"]
    A --> C["JSON body 解析中间件"]
    A --> D["路由层"]
    D --> E["GET /api/books"]
    D --> F["GET /api/books/:id"]
    D --> G["POST /api/orders"]
    E --> H["data.ts 图书数据"]
    F --> H
    G --> I["uuid 生成订单号"]
    G --> H
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    BOOK {
        string id PK
        string title
        string author
        string isbn
        string category
        int stock
        float price
        string cover
        string description
        boolean isBestseller
    }
    
    ORDER {
        string id PK
        float total
        string status
        datetime createdAt
    }
    
    ORDER_ITEM {
        string id PK
        string orderId FK
        string bookId FK
        int quantity
        float price
    }
    
    ORDER ||--o{ ORDER_ITEM : contains
    BOOK ||--o{ ORDER_ITEM : referenced_by
```

### 6.2 初始数据

- 模拟 20-30 本图书数据，覆盖文学、科幻、历史、艺术、商业等分类
- 每本图书包含完整字段：id（uuid）、title、author、isbn、category、stock（0-50 之间含低库存样例）、price（25-128 元）、cover（使用占位图服务）、description
- 部分图书标记 isBestseller: true 用于首轮推荐
