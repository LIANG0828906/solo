## 1. 架构设计

```mermaid
graph TB
    subgraph "前端 (React + TypeScript + Vite)"
        A["App.tsx (路由+布局)"]
        B["pages/Home.tsx (首页瀑布流)"]
        C["pages/Publish.tsx (发布页)"]
        D["pages/Detail.tsx (详情页)"]
        E["components/RecipeCard.tsx (菜谱卡片)"]
        F["components/SkeletonCard.tsx (骨架屏)"]
        G["components/IngredientTag.tsx (食材标签)"]
    end
    
    subgraph "后端 (Express.js