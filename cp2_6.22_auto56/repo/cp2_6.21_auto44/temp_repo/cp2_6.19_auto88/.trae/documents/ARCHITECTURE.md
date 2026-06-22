## 1. 架构设计

```mermaid
graph TD
    subgraph "UI层 (React Components)"
        A1["App.tsx - 路由入口"]
        A2["pages/Home.tsx - 首页"]
        A3["pages/RecipeDetail.tsx - 详情页"]
        A4["pages/RecipeForm.tsx - 创建/编辑页"]
        A5["pages/Profile.tsx - 个人主页"]
        A6["components/RecipeCard.tsx - 食谱卡片"]
        A7["components/CommentList.tsx - 评论列表"]
        A8["components/SocialFeed.tsx - 动态侧边栏"]
        A9["components/StarRating.tsx - 评分组件"]
        A10["components/Navbar.tsx - 导航栏"]
    end

    subgraph "控制层 (Controller)"
        B1["module3/uiController.ts - UI控制器"]
        B2["module3/visualizer.ts - 可视化模块"]
    end

    subgraph "业务逻辑层 (Modules)"
        C1["module1/recipeManager.ts - 食谱管理"]
        C2["module1/recipeImport.ts - 食谱导入"]
        C3["module2/socialFeed.ts - 社交动态"]
        C4["module2/commentSystem.ts - 评论系统"]
    end

    subgraph "数据层 (IndexedDB)"
        D1["recipes - 食谱表"]
        D2["comments - 评论表"]
        D3["activities - 动态表"]
        D4["favorites - 收藏表"]
        D5["users - 用户表"]
    end

    A1 --> B1
    A2 --> B1
    A3 --> B1
    A4 --> B1
    A5 --> B1
    B1 --> C1
    B1 --> C3
    B1 --> C4
    B1 --> B2
    C2 --> C1
    C1 --> D1
    C1 --> D4
    C3 --> D3
    C3 --> C1
    C4 --> D2
    C4 --> C3
    B2 --> C3
```

## 2. 技术描述

- **前端框架**：React 18 + TypeScript 5
- **构建工具**：Vite 5
- **路由管理**：React Router DOM 6
- **状态管理**：Zustand（轻量级状态管理）
- **数据库**：IndexedDB（前端持久化）
- **拖拽库**：react-beautiful-dnd
- **Markdown渲染**：react-markdown
- **日期处理**：date-fns
- **ID生成**：uuid
- **CSS方案**：原生CSS + CSS变量（无Tailwind，按用户要求）
- **图标**：lucide-react

## 3. 路由定义

| 路由 | 页面 | 用途 |
|------|------|------|
| / | Home | 首页，瀑布流食谱列表 + 社交动态侧边栏 |
| /recipe/:id | RecipeDetail | 食谱详情页，展示食谱内容、评论 |
| /create | RecipeForm | 创建新食谱 |
| /edit/:id | RecipeForm | 编辑已有食谱 |
| /profile | Profile | 个人主页，展示我的食谱和收藏 |
| /search | Home | 搜索结果页（复用首页组件） |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    USERS ||--o{ RECIPES : creates
    USERS ||--o{ COMMENTS : writes
    USERS ||--o{ FAVORITES : has
    USERS ||--o{ ACTIVITIES : generates
    RECIPES ||--o{ COMMENTS : has
    RECIPES ||--o{ FAVORITES : has
    RECIPES ||--o{ ACTIVITIES : triggers

    USERS {
        string id PK
        string nickname
        string avatar
        string avatarColor
        datetime createdAt
    }

    RECIPES {
        string id PK
        string title
        string description
        string coverImage
        array ingredients
        array steps
        number rating
        number ratingCount
        string authorId
        string authorName
        datetime createdAt
        datetime updatedAt
    }

    COMMENTS {
        string id PK
        string recipeId FK
        string userId FK
        string userName
        string userAvatarColor
        string content
        datetime createdAt
    }

    FAVORITES {
        string id PK
        string userId FK
        string recipeId FK
        datetime createdAt
    }

    ACTIVITIES {
        string id PK
        string type
        string userId
        string userName
        string recipeId
        string recipeTitle
        string content
        datetime createdAt
    }
```

### 4.2 IndexedDB Store 定义

```typescript
// recipes store
{ keyPath: 'id', indexes: ['authorId', 'createdAt', 'title'] }

// comments store  
{ keyPath: 'id', indexes: ['recipeId', 'userId', 'createdAt'] }

// activities store
{ keyPath: 'id', indexes: ['userId', 'createdAt', 'type'] }

// favorites store
{ keyPath: 'id', indexes: ['userId', 'recipeId', 'createdAt'] }

// users store
{ keyPath: 'id' }
```

## 5. 核心模块职责

### module1 - 食谱数据模块
| 文件 | 职责 |
|------|------|
| recipeManager.ts | 食谱CRUD、收藏管理、评分管理、IndexedDB交互 |
| recipeImport.ts | 解析JSON/Markdown文本，生成食谱对象 |

### module2 - 社交模块
| 文件 | 职责 |
|------|------|
| socialFeed.ts | 动态生成、动态列表获取、时间排序、筛选 |
| commentSystem.ts | 评论CRUD、与socialFeed联动更新动态 |

### module3 - UI控制模块
| 文件 | 职责 |
|------|------|
| uiController.ts | Zustand store，管理组件状态，协调各模块数据 |
| visualizer.ts | Canvas绘图，生成评分分布、收藏趋势图表 |

## 6. 性能优化策略

1. **图片懒加载**：使用 Intersection Observer 实现瀑布流图片懒加载
2. **防抖搜索**：300ms 防抖延迟，避免频繁触发搜索
3. **IndexedDB 索引优化**：为常用查询字段创建索引
4. **请求合并**：批量获取评论和收藏数据
5. **CSS 动画优化**：使用 transform 和 opacity 实现 GPU 加速动画
6. **虚拟滚动**：长列表使用虚拟滚动（如需要）
7. **Memo 优化**：React.memo 包裹列表项组件，避免不必要重渲染

## 7. 文件结构

```
├── package.json
├── index.html
├── vite.config.js
├── tsconfig.json
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── db.ts          # IndexedDB封装
│   │   ├── hash.ts        # MD5哈希工具
│   │   └── debounce.ts    # 防抖工具
│   ├── module1/
│   │   ├── recipeManager.ts
│   │   └── recipeImport.ts
│   ├── module2/
│   │   ├── socialFeed.ts
│   │   └── commentSystem.ts
│   ├── module3/
│   │   ├── uiController.ts
│   │   └── visualizer.ts
│   ├── components/
│   │   ├── Navbar.tsx
│   │   ├── RecipeCard.tsx
│   │   ├── RecipeForm.tsx
│   │   ├── CommentList.tsx
│   │   ├── CommentItem.tsx
│   │   ├── SocialFeed.tsx
│   │   ├── ActivityItem.tsx
│   │   ├── StarRating.tsx
│   │   ├── FavoriteButton.tsx
│   │   ├── MasonryGrid.tsx
│   │   ├── Toast.tsx
│   │   └── EmptyState.tsx
│   └── pages/
│       ├── Home.tsx
│       ├── RecipeDetail.tsx
│       ├── RecipeCreate.tsx
│       └── Profile.tsx
```
