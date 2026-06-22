## 1. 架构设计

```mermaid
graph TB
    subgraph Client["前端 (React + TypeScript)"]
        A["Vite 开发服务器"] --> B["React Router 路由层"]
        B --> C["页面组件层"]
        C --> C1["侧边栏 Sidebar"]
        C --> C2["植物列表 PlantList"]
        C --> C3["植物详情 PlantDetail"]
        C --> C4["仪表盘 Dashboard"]
        C --> D["Zustand 状态管理"]
        D --> E["Axios API 客户端"]
        C --> F["Recharts 图表组件"]
    end

    subgraph Server["后端 (Node.js + Express)"]
        G["Express 服务器"] --> H["CORS 中间件"]
        H --> I["路由层 Routes"]
        I --> I1["/api/plants"]
        I --> I2["/api/sensors"]
        I --> J["数据存储 (内存/JSON)"]
    end

    subgraph Data["模拟数据层"]
        K["植物种子数据"]
        L["传感器模拟生成器"]
        M["浇水/施肥记录模拟"]
    end

    E <-->|RESTful API| H
    J --> K
    J --> L
    J --> M
```

## 2. 技术描述

- **前端**：React@18 + TypeScript@5 + Vite@5
  - 状态管理：zustand@4
  - 路由：react-router-dom@6
  - HTTP客户端：axios@1
  - 图表库：recharts@2
  - 图标：lucide-react
- **初始化工具**：vite-init（react-express-ts模板）
- **后端**：Express@4 + TypeScript
  - 跨域：cors@2
  - ID生成：uuid@9
- **数据库**：内存存储 + JSON文件持久化（模拟场景）
- **构建工具**：Vite（前端） + ts-node/tsc（后端）

## 3. 路由定义

| 路由路径 | 页面组件 | 用途 |
|----------|----------|------|
| / | PlantList | 植物列表页（首页） |
| /plants | PlantList | 植物列表页 |
| /plants/:id | PlantDetail | 植物详情页 |
| /dashboard | Dashboard | 智慧灌溉仪表盘 |

## 4. API 定义

### 4.1 类型定义

```typescript
// 植物品种枚举
type PlantSpecies = '绿萝' | '虎皮兰' | '多肉' | '龟背竹' | '发财树' | '吊兰' | '文竹' | '仙人掌' | '芦荟' | '常春藤';

// 摆放位置枚举
type PlantLocation = '客厅' | '卧室' | '书房