## 1. 架构设计

```mermaid
graph TD
    A["前端 Vite + React"] --> B["Zustand状态管理"]
    A --> C["React Router 路由"]
    A --> D["Three.js / R3F 3D渲染"]
    B --> E["挖掘状态"]
    B --> F["碎片状态"]
    B --> G["修复状态"]
    B --> H["收藏状态"]
    D --> I["粒子特效"]
    D --> J["3D展览柜"]
    A --> K["HTTP /api 代理"]
    K --> L["后端 Express 3001端口"]
    L --> M["lowdb JSON数据库"]
    M --> N["修复记录"]
    M --> O["用户收藏"]
    M --> P["文物数据"]
```

## 2. 技术说明

- **前端框架**：React@18 + TypeScript + Vite@5
- **状态管理**：Zustand@4
- **路由管理**：react-router-dom@6
- **3D渲染**：three + @react-three/fiber + @react-three/drei
- **HTTP请求**：axios
- **后端框架**：Express@4
- **数据库**：lowdb@7（JSON本地存储）
- **跨域**：CORS中间件 + Vite代理
- **唯一ID**：uuid

## 3. 路由定义

| 路由 | 用途 |
|-------|---------|
| / | 首页，场地选择和工具选择 |
| /dig-site/:site | 挖掘场地页面，处理网格挖掘 |
| /workbench | 修复工作台页面 |
| /exhibition | 3D展览柜收藏展示页面 |

## 4. API定义

```typescript
// 文物数据结构
interface ArtifactData {
  id: string;
  name: string;
  region: string; // 地域：egypt/greek/china等
  era: string; // 年代
  fragmentCount: number; // 5-8块
  fragments: FragmentData[];
  thumbnail: string; // 缩略图数据
  backgroundType: string; // 背景类型
}

// 碎片数据
interface FragmentData {
  id: string;
  artifactId: string;
  index: number;
  shape: number[][]; // 多边形顶点
  color: string;
  edgeSignature: EdgeSignature;
  initialRotation: number;
  initialFlipped: boolean;
}

// 边缘特征
interface EdgeSignature {
  north?: { matchId: string; angle: number };
  south?: { matchId: string; angle: number };
  east?: { matchId: string; angle: number };
  west?: { matchId: string; angle: number };
}

// 修复记录
interface RestorationRecord {
  id: string;
  artifactId: string;
  artifactName: string;
  site: string; // desert/jungle/ocean
  tool: string; // brush/shovel/vacuum
  integrity: number; // 完整度百分比
  stars: number; // 1-3星
  digTime: number; // 挖掘用时（秒）
  restorationAccuracy: number; // 修复准确率
  createdAt: string;
}

// 响应格式
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}
```

| API | 方法 | 请求 | 响应 |
|-----|------|------|------|
| /api/records | POST | RestorationRecord | ApiResponse<RestorationRecord> 保存修复记录 |
| /api/records | GET | - | ApiResponse<RestorationRecord[]> 获取收藏列表 |
| /api/records/:id | DELETE | id param | ApiResponse 删除记录 |
| /api/artifacts | GET | - | ApiResponse<ArtifactData[]> 获取文物数据 |
| /api/artifacts/random | GET | site param | ApiResponse<ArtifactData[]> 根据场地随机文物 |

## 5. 服务端架构图

```mermaid
graph TD
    A["Express App"] --> B["CORS中间件"]
    A --> C["JSON解析中间件"]
    A --> D["静态文件中间件"]
    D --> E["public目录"]
    A --> F["Router路由层"]
    F --> G["POST /api/records"]
    F --> H["GET /api/records"]
    F --> I["DELETE /api/records/:id"]
    F --> J["GET /api/artifacts"]
    F --> K["GET /api/artifacts/random"]
    G & H & I --> L["LowDB数据层"]
    J & K --> L
    L --> M["db.json文件"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    ARTIFACT ||--o{ FRAGMENT : contains
    RESTORATION_RECORD }o--|| ARTIFACT : references
    ARTIFACT {
        string id PK
        string name
        string region
        string era
        number fragmentCount
        string thumbnail
        string backgroundType
    }
    FRAGMENT {
        string id PK
        string artifactId FK
        number index
        string shape_points
        string color
        string edge_signature
    }
    RESTORATION_RECORD {
        string id PK
        string artifactId FK
        string artifactName
        string site
        string tool
        number integrity
        number stars
        number digTime
        number restorationAccuracy
        string createdAt
    }
```

### 6.2 初始数据（lowdb seed）

lowdb数据库初始化时内置6件文物（每种场地2件），每件文物5-8块碎片，碎片形状为不规则多边形（用SVG path表示），包含边缘匹配关系。
