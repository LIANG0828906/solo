## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层"
        A["React + TypeScript"] --> B["Vite 构建"]
        A --> C["React Router 路由"]
        A --> D["Zustand 状态管理"]
        A --> E["Axios API 调用"]
        A --> F["react-syntax-highlighter 高亮"]
    end
    
    subgraph "后端层"
        G["Express.js"] --> H["RESTful API"]
        H --> I["代码片段 CRUD"]
        H --> J["评论 CRUD"]
        H --> K["点赞功能"]
        G --> L["CORS 跨域"]
        G --> M["内存数据存储"]
