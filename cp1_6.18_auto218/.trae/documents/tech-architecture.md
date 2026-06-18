## 1. 架构设计

```mermaid
graph TB
    subgraph "前端 (React + TypeScript)"
        A["App.tsx 路由与全局状态"] --> B["账单列表页"]
        A --> C["仪表盘页"]
        B --> D["BillCard 组件"]
        B --> E["情感标签选择器"]
        B --> F["账单编辑表单"]
        C --> G["情感圆环图 (recharts)"]
        C --> H["预算进度条"]
        A --> I["Zustand Store"]
    end
    subgraph "后端 (Express)"
        J["Express Server :4000"] --> K["账单 CRUD API"]
        J --> L["情感标签 API"]
        J --> M["预算设置 API"]
        J --> N["统计 API"]
    end
    I -->|"API 调用"| J
```

## 2. 技术说明
- 前端：React@18 + TypeScript + Vite + Zustand + Recharts
- 初始化工具：vite-init (react-express-ts 模板)
- 后端：Express@4 + cors + uuid
- 数据库：内存数据存储（JSON），无需外部数据库
- 样式方案：全局CSS + CSS变量（深色主题）

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 账单列表页，展示所有消费记录 |
| /dashboard | 仪表盘页，情感分析与预算可视化 |

## 4. API 定义

### 4.1 TypeScript 类型定义

```typescript
interface EmotionTag {
  id: string;
  name: string;
  color: string;
}

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
}

interface Bill {
  id: string;
  amount: number;
  categoryId: string;
  emotionTagId: string;
  note: string;
  createdAt: string;
}

interface Budget {
  id: string;
  weeklyLimit: number;
}

interface EmotionStat {
  emotionTagId: string;
  emotionName: string;
  color: string;
  totalAmount: number;
  percentage: number;
  bills: Bill[];
}
```

### 4.2 请求/响应模式

| 方法 | 路径 | 请求体 | 响应 | 说明 |
|------|------|--------|------|------|
| GET | /api/emotions | - | EmotionTag[] | 获取情感标签列表 |
| GET | /api/categories | - | Category[] | 获取分类列表 |
| GET | /api/bills | - | Bill[] | 获取所有账单 |
| POST | /api/bills | Bill(无id) | Bill | 新增账单 |
| PUT | /api/bills/:id | Bill(无id) | Bill | 更新账单 |
| DELETE | /api/bills/:id | - | {success: boolean} | 删除账单 |
| GET | /api/budget | - | Budget | 获取预算设置 |
| PUT | /api/budget | {weeklyLimit: number} | Budget | 更新预算 |
| GET | /api/stats/emotion?range=day\|week\|month | - | EmotionStat[] | 情感消费统计 |
| GET | /api/stats/budget-usage | - | {used: number, limit: number, percentage: number, daysRemaining: number} | 预算使用情况 |

## 5. 服务器架构图

```mermaid
graph LR
    A["Express Router"] --> B["Bill Controller"]
    A --> C["Emotion Controller"]
    A --> D["Budget Controller"]
    A --> E["Stats Controller"]
    B --> F["内存数据存储"]
    C --> F
    D --> F
    E --> F
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    "Bill" {
        string id PK
        number amount
        string categoryId FK
        string emotionTagId FK
        string note
        string createdAt
    }
    "Category" {
        string id PK
        string name
        string icon
        string color
    }
    "EmotionTag" {
        string id PK
        string name
        string color
    }
    "Budget" {
        string id PK
        number weeklyLimit
    }
    "Bill" }o--|| "Category" : "belongs to"
    "Bill" }o--|| "EmotionTag" : "has emotion"
```

### 6.2 初始数据

**情感标签**：开心(#FFD700)、焦虑(#FF6B6B)、满足(#6BCB77)、后悔(#A66CFF)、平静(#4FC3F7)

**消费分类**：餐饮(🍜, #FF7043)、交通(🚗, #42A5F5)、娱乐(🎮, #AB47BC)、购物(🛍, #FFA726)、居住(🏠, #66BB6A)、医疗(💊, #EF5350)、教育(📚, #5C6BC0)、其他(📌, #78909C)

**默认预算**：周预算 2000 元
