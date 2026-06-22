## 1. 架构设计

```mermaid
flowchart LR
    subgraph Frontend["前端 (React + TypeScript + Vite)"]
        A["App.tsx - 路由管理"]
        B["BoardPage.tsx - 看板页面"]
        C["StatsPage.tsx - 统计页面"]
        D["EmailCard.tsx - 邮件卡片"]
        E["Navbar.tsx - 导航栏"]
    end
    subgraph Backend["后端 (Express + TypeScript)"]
        F["GET /api/emails - 获取邮件列表"]
        G["PUT /api/emails/:id - 更新邮件状态"]
        H["GET /api/stats - 获取统计数据"]
    end
    subgraph Data["数据层"]
        I["内存数组 - 50封样例邮件"]
    end
    A --> B
    A --> C
    B --> D
    A --> E
    B -->|axios| F
    B -->|axios| G
    C -->|axios| H
    F --> I
    G --> I
    H --> I
```

## 2. 技术说明

- 前端：React@18 + TypeScript + Vite + @dnd-kit/core + @dnd-kit/sortable + recharts + axios + react-router-dom
- 初始化工具：vite-init (react-express-ts模板)
- 后端：Express@4 + TypeScript + cors + uuid + nodemailer
- 数据库：无，使用Node.js内存数组存储

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 看板页面（默认） |
| /stats | 统计页面 |

## 4. API定义

### 4.1 TypeScript类型定义

```typescript
type EmailCategory = 'work' | 'social' | 'promo' | 'spam';
type EmailStatus = 'pending' | 'processing' | 'done';

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  timestamp: string;
  category: EmailCategory;
  status: EmailStatus;
}

interface DailyStats {
  date: string;
  count: number;
}

interface CategoryStats {
  category: EmailCategory;
  count: number;
}

interface StatsResponse {
  daily: DailyStats[];
  byCategory: CategoryStats[];
  total: number;
  done: number;
}
```

### 4.2 请求/响应模式

| 端点 | 方法 | 请求参数 | 响应 |
|------|------|----------|------|
| /api/emails | GET | ?status=pending\|processing\|done (可选) | Email[] |
| /api/emails/:id | PUT | { status: EmailStatus } | Email |
| /api/stats | GET | 无 | StatsResponse |

## 5. 服务端架构图

```mermaid
flowchart TD
    A["Express路由控制器"] --> B["邮件服务层"]
    B --> C["内存数据存储"]
    A --> D["统计服务层"]
    D --> C
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    Email {
        string id PK
        string from
        string subject
        string body
        string timestamp
        string category
        string status
    }
```

### 6.2 初始数据

服务器启动时生成50封样例邮件，随机分配发件人、主题、内容、时间戳和分类，状态默认为pending。使用nodemailer库的邮件生成功能辅助创建格式各异的样例数据。每次返回数据时模拟100ms-300ms随机网络延迟。
