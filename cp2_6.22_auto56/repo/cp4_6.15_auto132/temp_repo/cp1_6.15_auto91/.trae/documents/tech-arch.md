## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层"
        A["React 组件"] --> B["API 封装层 (api.ts)"]
        B --> C["Vite 开发服务器"]
    end
    
    subgraph "后端层"
        D["Express 服务器"] --> E["路由处理"]
        E --> F["业务逻辑层"]
        F --> G["内存数据存储"]
    end
    
    C -->|HTTP 请求| D
    D -->|JSON 响应| C
```

## 2. 技术描述

- 前端：React 18 + TypeScript + Vite
- 路由：React Router DOM
- 状态管理：React Hooks + Context
- 后端：Express 4 + TypeScript
- 数据存储：内存数组（运行时存储）
- 跨域处理：cors 中间件
- ID生成：uuid
- 并发启动：concurrently

## 3. 路由定义

### 前端路由

| 路由路径 | 用途 | 加载方式 |
|----------|------|----------|
| / | 首页，书籍列表展示 | 直接加载 |
| /login | 用户登录页面 | 懒加载 |
| /register | 用户注册页面 | 懒加载 |
| /book/:id | 书籍详情页面 | 懒加载 |
| /publish | 发布书籍页面 | 懒加载 |
| /admin | 管理员后台页面 | 懒加载 |

### 后端 API 路由

| 方法 | 路由路径 | 用途 |
|------|----------|------|
| POST | /api/auth/register | 用户注册 |
| POST | /api/auth/login | 用户登录 |
| GET | /api/books | 获取书籍列表（支持查询参数） |
| GET | /api/books/:id | 获取单本书籍详情 |
| POST | /api/books | 发布新书籍（需登录） |
| PUT | /api/books/:id/review | 管理员审核书籍 |
| GET | /api/users/:id/books | 获取用户发布的书籍 |
| POST | /api/transactions | 创建交易记录（需登录） |
| GET | /api/transactions | 获取交易记录（管理员） |

## 4. API 定义

### 数据类型定义

```typescript
// 用户类型
interface User {
  id: string
  email: string
  password: string
  nickname: string
  avatar: string
  isAdmin: boolean
  createdAt: Date
}

// 书籍类型
interface Book {
  id: string
  title: string
  author: string
  publishYear: number
  description: string
  coverUrl: string
  category: 'novel' | 'documentary' | 'technology' | 'art' | 'life'
  transactionType: 'exchange' | 'sale'
  exchangeCategory?: string
  price?: number
  ownerId: string
  status: 'pending' | 'approved' | 'rejected'
  rejectReason?: string
  createdAt: Date
}

// 交易记录类型
interface Transaction {
  id: string
  bookId: string
  buyerId: string
  sellerId: string
  type: 'exchange' | 'sale'
  status: 'pending' | 'confirmed' | 'completed'
  price?: number
  createdAt: Date
}

// 登录响应
interface AuthResponse {
  token: string
  user: Omit<User, 'password'>
}
```

## 5. 服务器架构图

```mermaid
graph LR
    A["客户端请求"] --> B["CORS 中间件"]
    B --> C["Express 路由"]
    C --> D["认证中间件（如需要）"]
    D --> E["业务处理函数"]
    E --> F["内存数据操作"]
    F --> G["返回 JSON 响应"]
```

## 6. 数据模型

### 6.1 数据模型关系

```mermaid
erDiagram
    USER ||--o{ BOOK : "发布"
    USER ||--o{ TRANSACTION : "发起购买/交换"
    USER ||--o{ TRANSACTION : "接收购买/交换"
    BOOK ||--o{ TRANSACTION : "关联"
    
    USER {
        string id PK
        string email
        string password
        string nickname
        string avatar
        boolean isAdmin
        date createdAt
    }
    
    BOOK {
        string id PK
        string title
        string author
        number publishYear
        string description
        string coverUrl
        string category
        string transactionType
        string exchangeCategory
        number price
        string ownerId FK
        string status
        string rejectReason
        date createdAt
    }
    
    TRANSACTION {
        string id PK
        string bookId FK
        string buyerId FK
        string sellerId FK
        string type
        string status
        number price
        date createdAt
    }
```

### 6.2 初始数据

- 默认管理员账号：admin@bookstore.com / admin123
- 预置若干书籍数据用于演示
