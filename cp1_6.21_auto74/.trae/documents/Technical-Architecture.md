## 1. 架构设计

```mermaid
graph TB
    subgraph "Frontend (React + TypeScript + Vite)"
        A["App.tsx 顶级组件<br/>布局/路由状态管理"]
        B["HomePage.tsx 主页面<br/>整合三栏布局"]
        C["RecipeCard.tsx 食谱卡片<br/>缩略图/名称/收藏"]
        D["CategoryPanel 分类面板<br/>树状折叠/搜索"]
        E["RecipeModal 创建模态框<br/>表单/图片上传"]
        F["DetailPanel 详情面板<br/>右侧滑出"]
        G["Toast 提示条<br/>全局通知"]
        A --> B
        B --> C
        B --> D
        B --> E
        B --> F
        A --> G
    end
    subgraph "Backend (Express + TypeScript)"
        H["app.ts Express入口<br/>路由/CORS中间件"]
        I["recipeStore.ts 内存存储<br/>CRUD/收藏"]
        H --> I
    end
    subgraph "通信层"
        J["REST API<br/>JSON over HTTP"]
    end
    A -->|fetch| J
    J --> H
```

## 2. 技术描述

- **前端**：React 18 + TypeScript 5 + Vite 5 + @vitejs/plugin-react
- **后端**：Express 4 + TypeScript 5 + cors + uuid
- **状态管理**：React Hooks（useState/useEffect/useCallback），无需额外状态库
- **数据库**：内存存储（Map 数据结构，recipeStore.ts）
- **构建工具**：Vite（前端热更新）、ts-node-dev 或 tsc + node（后端）
- **样式方案**：内联 CSS（styled-jsx 风格）+ CSS 变量，无需 Tailwind（用户未要求）
- **图标库**：lucide-react

## 3. 路由定义

| 路由 | 用途 |
|-------|---------|
| / | 主页面（单页应用，无客户端路由切换） |

## 4. API 定义

### TypeScript 类型定义
```typescript
interface Ingredient {
  name: string;
  amount: string;
}

interface Step {
  description: string;
  image?: string; // base64 data URL
}

interface Recipe {
  id: string;           // uuid
  name: string;
  image: string;        // base64 data URL
  difficulty: number;   // 1-5
  cookTime: number;     // 分钟
  ingredients: Ingredient[];
  steps: Step[];
  category: string;
  isFavorite: boolean;
  createdAt: number;
}
```

### 接口列表

| 方法 | 路径 | 请求体 | 响应 | 说明 |
|------|------|--------|------|------|
| GET | /api/recipes | - | `Recipe[]` | 获取全部食谱 |
| GET | /api/recipes/search?q=xxx | - | `Recipe[]` | 搜索食谱 |
| POST | /api/recipes | `Omit<Recipe,'id','isFavorite','createdAt'>` | `Recipe` | 创建食谱 |
| PATCH | /api/recipes/:id/favorite | `{ isFavorite: boolean }` | `Recipe` | 切换收藏状态 |
| DELETE | /api/recipes/:id | - | `{ success: true }` | 删除食谱 |

## 5. 服务器架构图

```mermaid
graph LR
    A["HTTP Request"] --> B["CORS Middleware"]
    B --> C["JSON Body Parser"]
    C --> D["Express Router"]
    D -->|GET /api/recipes| E["recipeStore.getAll()"]
    D -->|GET /api/recipes/search| F["recipeStore.search()"]
    D -->|POST /api/recipes| G["recipeStore.create()"]
    D -->|PATCH /api/recipes/:id/favorite| H["recipeStore.toggleFavorite()"]
    D -->|DELETE /api/recipes/:id| I["recipeStore.delete()"]
    E & F & G & H & I --> J["Memory Map (recipes)"]
    J --> K["JSON Response"]
```

## 6. 数据模型

### 6.1 数据模型定义（ER 图）
```mermaid
erDiagram
    RECIPE {
        string id PK "uuid"
        string name "菜名"
        string image "base64图片"
        number difficulty "1-5难度"
        number cookTime "烹饪分钟"
        string category "分类名称"
        boolean isFavorite "是否收藏"
        number createdAt "时间戳"
    }
    INGREDIENT {
        string name "食材名"
        string amount "用量"
        string recipeId FK "外键"
    }
    STEP {
        string description "步骤描述"
        string image "可选图片"
        number order "序号"
        string recipeId FK "外键"
    }
    RECIPE ||--o{ INGREDIENT : "包含"
    RECIPE ||--o{ STEP : "包含"
```

### 6.2 初始种子数据

应用启动时 recipeStore 初始化内置 3-5 条示例食谱数据（家常菜、川菜、甜品等分类），确保首次打开即有内容展示。
