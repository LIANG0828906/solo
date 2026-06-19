## 1. 架构设计

```mermaid
graph TD
    subgraph "Frontend 前端层 (React + TypeScript)"
        A["App.tsx 主布局"] --> B["FridgePage 冰箱管理"]
        A --> C["RecipePage 食谱推荐"]
        A --> D["ShoppingDrawer 购物清单抽屉"]
        A --> E["SharePage 分享只读页"]
        B --> F["useStore Zustand 状态管理"]
        C --> F
        D --> F
        F --> G["fetch API 调用层"]
    end

    subgraph "Backend 后端层 (Express + Node.js)"
        G --> H["/api/ingredients 食材接口"]
        G --> I["/api/recipes 食谱推荐接口"]
        G --> J["/api/shopping-list 购物清单接口"]
        H --> K["内存数据存储"]
        I --> K
        J --> K
    end

    subgraph "数据层"
        K --> L["ingredients 食材数据"]
        K --> M["recipes 食谱库 (20+)"]
        K --> N["shoppingLists 购物清单分享"]
    end
```

## 2. 技术描述

- **前端框架**：React 18 + TypeScript 5
- **构建工具**：Vite 5
- **路由**：react-router-dom 6
- **状态管理**：Zustand 4
- **动画库**：framer-motion 11
- **HTTP代理**：Vite 代理 /api/* → http://localhost:4000
- **后端框架**：Express 4 + TypeScript
- **跨域支持**：cors 中间件
- **数据存储**：内存 Map（开发演示用）
- **唯一ID生成**：uuid 9
- **邮件支持（预留）**：nodemailer

## 3. 路由定义

| 前端路由 | 页面组件 | 用途 |
|----------|----------|------|
| `/` | App 主容器 | 冰箱管理 + 食谱推荐 + 购物清单抽屉 |
| `/share/:id` | SharePage | 只读版购物清单分享页面 |

| 后端API | 方法 | 用途 |
|----------|------|------|
| `/api/ingredients` | GET | 获取所有食材列表 |
| `/api/ingredients` | POST | 添加新食材 |
| `/api/ingredients/:id` | PUT | 更新食材数量/信息 |
| `/api/ingredients/:id` | DELETE | 删除食材 |
| `/api/recipes` | POST | 根据库存和偏好推荐3道食谱 |
| `/api/shopping-list` | POST | 生成/保存购物清单，返回分享ID |
| `/api/shopping-list/:id` | GET | 根据分享ID获取只读清单 |

## 4. API 定义

```typescript
// 食材类型
interface Ingredient {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: 'vegetable' | 'meat' | 'dairy' | 'grain' | 'seafood' | 'fruit' | 'seasoning' | 'other';
  expiryDate: string; // ISO date
  createdAt: string;
}

// 食谱类型
interface Recipe {
  id: string;
  name: string;
  timeMinutes: number;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[]; // 'quick' | 'low-calorie' | 'spicy' | ...
  ingredients: { name: string; quantity: number; unit: string; category: string }[];
  steps: string[];
  matchScore?: number; // 0-100 匹配度
}

// 购物清单
interface ShoppingItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  note?: string;
}

interface ShoppingList {
  id: string;
  recipeId: string;
  recipeName: string;
  items: ShoppingItem[];
  createdAt: string;
}

// 推荐请求
interface RecommendRequest {
  ingredients: Ingredient[];
  preferences: string[]; // 用户偏好标签
}

// 推荐响应
interface RecommendResponse {
  recipes: Recipe[]; // 3道匹配度最高
}
```

## 5. 后端架构图

```mermaid
graph LR
    A["Express App"] --> B["CORS 中间件"]
    B --> C["JSON Body Parser"]
    C --> D["路由层 Routes"]
    D --> E["ingredientRoutes 食材路由"]
    D --> F["recipeRoutes 食谱路由"]
    D --> G["shoppingRoutes 购物清单路由"]
    E --> H["DataStore 内存存储"]
    F --> H
    F --> I["RecipeMatcher 匹配算法"]
    I --> H
    G --> H
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    INGREDIENT {
        string id PK
        string name
        number quantity
        string unit
        string category
        string expiryDate
        string createdAt
    }
    
    RECIPE {
        string id PK
        string name
        number timeMinutes
        number difficulty
        string tags
        string ingredients_json
        string steps_json
    }
    
    SHOPPING_LIST {
        string id PK
        string recipeId
        string recipeName
        string items_json
        string createdAt
    }
    
    USER_PREFERENCE {
        string id PK
        string tags_json
    }
```

### 6.2 初始数据
- **食谱库**：预设20+道菜谱，涵盖蔬菜、肉类、海鲜、主食等各类别，覆盖快手菜、低卡、辣、家常等标签
- **初始食材**：5-8条示例食材，包含正常和即将过期的示例数据
- **匹配算法**：基于库存食材覆盖率（权重60%）+ 偏好标签匹配度（权重30%）+ 过期紧急度加成（权重10%）
