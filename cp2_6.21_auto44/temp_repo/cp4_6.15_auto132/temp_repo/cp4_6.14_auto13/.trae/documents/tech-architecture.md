## 1. 架构设计

```mermaid
graph TB
    subgraph "前端 (React + Vite)"
        A["React Router 路由管理"] --> B["页面组件"]
        B --> C["首页"]
        B --> D["成员管理页"]
        B --> E["周计划页"]
        B --> F["采购清单页"]
        D --> G["MemberPanel 组件"]
        E --> H["CalendarView 组件"]
        E --> I["MealDetailModal 组件"]
        F --> J["ShoppingList 组件"]
        G --> K["成员偏好表单"]
        G --> L["可用性日历"]
        H --> M["菜谱卡片网格"]
        H --> N["拖拽交换逻辑"]
    end
    subgraph "核心算法"
        O["mealPlanner.ts<br/>贪心+局部搜索"]
        P["食材清单生成"]
    end
    subgraph "后端 (Express)"
        Q["RESTful API"]
        Q --> R["成员CRUD"]
        Q --> S["历史菜谱记录"]
    end
    subgraph "数据存储"
        T["内存数组"]
    end
    E --> O
    O --> P
    F --> P
    D -->|axios| Q
    E -->|axios| Q
    R --> T
    S --> T
```

## 2. 技术说明

- 前端：React 18 + TypeScript + styled-components + Vite
- 初始化工具：vite-init（react-express-ts模板）
- 后端：Express 4 + TypeScript + CORS
- 数据库：内存数组（无持久化数据库，符合用户要求）
- 状态管理：Zustand
- 路由：React Router DOM v6
- 样式：styled-components（暖色系主题，CSS变量）
- 图标：lucide-react
- 拖拽：HTML5 Drag and Drop API

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 首页，产品介绍与快速导航 |
| /members | 成员管理页，添加/编辑成员及偏好 |
| /plan | 周计划页，查看/生成/调整每周菜谱 |
| /shopping | 采购清单页，查看/勾选/删除食材 |

## 4. API 定义

### 4.1 成员管理

```typescript
interface Member {
  id: string;
  name: string;
  restrictions: string[];    // 忌口，最多5项
  cuisinePrefs: string[];    // 偏好菜系，最多3项
  availability: boolean[][]; // [7天][3餐] 可用性矩阵
}

// GET /members - 获取所有成员
// Response: Member[]

// POST /members - 添加成员
// Request: Omit<Member, 'id'>
// Response: Member

// PUT /members/:id - 更新成员
// Request: Partial<Member>
// Response: Member

// DELETE /members/:id - 删除成员
// Response: { success: boolean }
```

### 4.2 历史菜谱

```typescript
interface MealPlan {
  id: string;
  weekStart: string;         // ISO日期
  meals: MealAssignment[][]; // [7天][3餐]
}

interface MealAssignment {
  name: string;
  cookTime: number;          // 分钟
  ingredients: Ingredient[];
  steps: string[];
  cuisine: string;
}

interface Ingredient {
  name: string;
  amount: string;
  category: string;          // 蔬菜/肉类/调料等
}

// GET /history - 获取历史菜谱
// Response: MealPlan[]

// POST /history - 保存菜谱
// Request: Omit<MealPlan, 'id'>
// Response: MealPlan
```

## 5. 服务端架构图

```mermaid
graph LR
    A["Express Router"] --> B["成员控制器"]
    A --> C["历史菜谱控制器"]
    B --> D["内存数组存储"]
    C --> D
    A --> E["CORS中间件"]
    A --> F["JSON解析中间件"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    Member ||--o{ Availability : has
    MealPlan ||--|{ DayPlan : contains
    DayPlan ||--|{ MealSlot : contains
    MealSlot ||--|| Meal : references
    Meal ||--o{ Ingredient : requires

    Member {
        string id PK
        string name
        string[] restrictions
        string[] cuisinePrefs
    }

    Availability {
        string memberId FK
        int dayIndex
        int mealIndex
        boolean available
    }

    MealPlan {
        string id PK
        string weekStart
    }

    DayPlan {
        int dayIndex
    }

    MealSlot {
        int mealIndex
    }

    Meal {
        string name
        int cookTime
        string cuisine
        string[] steps
    }

    Ingredient {
        string name
        string amount
        string category
    }
```

### 6.2 核心算法说明

mealPlanner.ts 采用贪心+局部搜索策略：

1. **贪心阶段**：遍历每个餐段，根据该时段可用成员的偏好交集，从菜谱库中选择得分最高的菜品
2. **局部搜索阶段**：随机交换两个餐段的菜品，如果交换后整体满意度提升则保留，否则回退。迭代有限次数（≤100次）
3. **食材清单生成**：遍历最终菜谱中所有菜品的食材，按类别分组，同名食材合并数量
4. **性能要求**：客户端完成计算，100种组合以下响应时间 ≤ 500ms
