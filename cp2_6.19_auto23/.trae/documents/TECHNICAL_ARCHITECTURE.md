# 在线食谱创作与分享社区应用 - 技术架构文档

## 1. 技术栈概览

| 类别 | 技术选型 | 版本说明 | 用途 |
|------|----------|----------|------|
| 开发语言 | TypeScript | ^5.x | 类型安全的 JavaScript 超集 |
| 前端框架 | React | ^18.x | 用户界面构建库 |
| 构建工具 | Vite | ^5.x | 下一代前端构建工具 |
| 状态管理 | Zustand | ^4.x | 轻量级状态管理库 |
| 唯一 ID | uuid | ^9.x | 生成数据唯一标识 |
| 数据存储 | localStorage | - | 浏览器本地持久化存储 |

### 1.1 依赖清单

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "zustand": "^4.0.0",
    "uuid": "^9.0.0"
  },
  "devDependencies": {
    "@types/react": "^18.0.0",
    "@types/react-dom": "^18.0.0",
    "typescript": "^5.0.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.0.0"
  }
}
```

---

## 2. 目录结构设计

```
src/
├── components/          # 通用组件
│   ├── layout/         # 布局组件（Header、Footer 等）
│   ├── recipe/         # 食谱相关组件（RecipeCard、RecipeForm 等）
│   └── common/         # 通用 UI 组件（Button、StarRating、Modal 等）
├── pages/              # 页面组件
│   ├── HomePage.tsx           # 首页
│   ├── RecipeDetailPage.tsx   # 食谱详情页
│   ├── RecipeEditPage.tsx     # 创建/编辑食谱页
│   └── FavoritesPage.tsx      # 我的收藏页
├── store/              # Zustand 状态管理
│   ├── useRecipeStore.ts      # 食谱状态
│   ├── useCommentStore.ts     # 评论状态
│   ├── useFavoriteStore.ts    # 收藏状态
│   ├── useRatingStore.ts      # 评分状态
│   └── useUserStore.ts        # 用户状态
├── types/              # TypeScript 类型定义
│   └── index.ts
├── utils/              # 工具函数
│   ├── storage.ts             # localStorage 封装
│   └── mockData.ts            # 初始模拟数据
├── styles/             # 全局样式
│   ├── global.css             # 全局样式
│   └── variables.css          # CSS 变量（色彩、间距等）
├── App.tsx             # 应用根组件
├── main.tsx            # 应用入口
└── vite-env.d.ts       # Vite 类型声明
```

---

## 3. 核心类型定义

```typescript
// src/types/index.ts

export interface Recipe {
  id: string;
  title: string;
  coverImage: string;
  description: string;
  ingredients: Ingredient[];
  steps: RecipeStep[];
  cookTime: number;
  authorId: string;
  authorName: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export interface Ingredient {
  name: string;
  quantity: string;
}

export interface RecipeStep {
  order: number;
  content: string;
  image?: string;
}

export interface Comment {
  id: string;
  recipeId: string;
  userId: string;
  userName: string;
  content: string;
  createdAt: number;
}

export interface Favorite {
  id: string;
  recipeId: string;
  userId: string;
  createdAt: number;
}

export interface Rating {
  id: string;
  recipeId: string;
  userId: string;
  score: 1 | 2 | 3 | 4 | 5;
  createdAt: number;
}

export interface User {
  id: string;
  name: string;
  avatar?: string;
}
```

---

## 4. 状态管理设计（Zustand）

### 4.1 存储分层策略

采用按领域拆分的多 Store 设计，每个 Store 负责一个数据域：

| Store | 职责 | 持久化 |
|-------|------|--------|
| useRecipeStore | 食谱的 CRUD、搜索 | 是 |
| useCommentStore | 评论的增删查 | 是 |
| useFavoriteStore | 收藏的增删查 | 是 |
| useRatingStore | 评分的增改查 | 是 |
| useUserStore | 当前用户身份管理 | 是 |

### 4.2 Store 示例

```typescript
// src/store/useRecipeStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Recipe } from '../types';

interface RecipeState {
  recipes: Recipe[];
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  getRecipeById: (id: string) => Recipe | undefined;
  getFilteredRecipes: () => Recipe[];
  addRecipe: (recipe: Omit<Recipe, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateRecipe: (id: string, data: Partial<Recipe>) => void;
  deleteRecipe: (id: string) => void;
}

export const useRecipeStore = create<RecipeState>()(
  persist(
    (set, get) => ({
      recipes: [],
      searchKeyword: '',
      setSearchKeyword: (keyword) => set({ searchKeyword: keyword }),
      getRecipeById: (id) => get().recipes.find(r => r.id === id),
      getFilteredRecipes: () => {
        const { recipes, searchKeyword } = get();
        if (!searchKeyword.trim()) return recipes;
        const kw = searchKeyword.toLowerCase();
        return recipes.filter(r =>
          r.title.toLowerCase().includes(kw) ||
          r.tags.some(t => t.toLowerCase().includes(kw)) ||
          r.ingredients.some(i => i.name.toLowerCase().includes(kw))
        );
      },
      addRecipe: (data) => {
        const newRecipe: Recipe = {
          ...data,
          id: crypto.randomUUID(),
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        set({ recipes: [newRecipe, ...get().recipes] });
      },
      updateRecipe: (id, data) => {
        set({
          recipes: get().recipes.map(r =>
            r.id === id ? { ...r, ...data, updatedAt: Date.now() } : r
          ),
        });
      },
      deleteRecipe: (id) => {
        set({ recipes: get().recipes.filter(r => r.id !== id) });
      },
    }),
    { name: 'recipe-store' }
  )
);
```

---

## 5. 数据持久化方案

### 5.1 localStorage 封装

使用 Zustand 内置的 `persist` 中间件自动将 Store 状态同步到 localStorage，key 命名规则为 `{domain}-store`。

### 5.2 初始数据

在 `src/utils/mockData.ts` 中预置若干示例食谱数据，首次加载时注入 Store，确保应用首次打开即有内容可浏览。

### 5.3 存储结构

localStorage 中保存的键：
- `recipe-store` - 食谱列表与搜索关键词
- `comment-store` - 评论列表
- `favorite-store` - 收藏列表
- `rating-store` - 评分列表
- `user-store` - 当前用户信息

---

## 6. 样式方案

### 6.1 CSS 变量定义

```css
/* src/styles/variables.css */
:root {
  --color-primary: #F5E6D3;
  --color-secondary: #D4A574;
  --color-accent: #E88D3E;
  --color-text: #333333;
  --color-text-secondary: #666666;
  --color-white: #FFFFFF;
  --color-border: #E8DCC8;

  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
  --radius-xl: 16px;

  --shadow-sm: 0 1px 3px rgba(0, 0, 0, 0.08);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.1);

  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
}
```

### 6.2 样式规范
- 采用 CSS Modules 或全局 CSS + BEM 命名
- 组件样式就近存放，与组件文件同目录
- 响应式断点：桌面端 ≥ 1024px，平板端 768px - 1023px

---

## 7. 组件层级与数据流

### 7.1 组件层级

```
App
├── Header (导航栏)
└── Routes
    ├── HomePage
    │   ├── SearchBar
    │   └── RecipeList
    │       └── RecipeCard (× N)
    ├── RecipeDetailPage
    │   ├── RecipeHeader
    │   ├── IngredientList
    │   ├── StepList
    │   ├── FavoriteButton
    │   ├── StarRating
    │   └── CommentSection
    │       ├── CommentForm
    │       └── CommentList
    ├── RecipeEditPage
    │   ├── RecipeForm
    │   │   ├── IngredientEditor
    │   │   └── StepEditor
    │   └── RecipePreview
    └── FavoritesPage
        └── RecipeList
            └── RecipeCard (× N)
```

### 7.2 数据流

1. **读取数据**：页面/组件通过 Zustand Selector 订阅所需状态
2. **修改数据**：调用 Store 暴露的 action 方法
3. **持久化**：Zustand persist 中间件自动同步到 localStorage
4. **跨组件通信**：通过共享 Store 实现，无需 Props 层层传递

---

## 8. 关键模块实现方案

### 8.1 星级评分组件
- 使用 5 个 SVG 星星图标
- 支持鼠标悬浮预览和点击打分
- 显示平均评分和评分人数
- 同一用户可修改评分，不可重复评分

### 8.2 食谱表单
- 受控表单，使用 React state 管理
- 食材和步骤支持动态增删
- 表单校验：必填项、数值范围
- 支持图片 URL 输入

### 8.3 搜索功能
- 前端实时过滤，防抖 300ms
- 匹配范围：标题、标签、食材名
- 大小写不敏感

---

## 9. 构建与部署

### 9.1 可用脚本

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本到 `dist/` |
| `npm run preview` | 预览生产构建 |

### 9.2 构建配置
- Vite 默认配置，启用 React 插件
- TypeScript 严格模式开启
- 构建产出静态文件，可部署到任意静态托管服务
