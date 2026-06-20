## 1. 架构设计

```mermaid
graph TB
    subgraph 前端
        A["React App"] --> B["@react-three/fiber Canvas"]
        A --> C["控制面板"]
        A --> D["家具面板"]
        B --> E["房间模型（墙壁/地板/天花板/窗户）"]
        B --> F["家具模型（几何体组合）"]
        B --> G["光源系统（方向光/环境光）"]
        B --> H["漫游控制器（WASD+鼠标）"]
    end
    subgraph 后端
        I["Express Server :3001"] --> J["POST /api/save"]
        I --> K["GET /api/load"]
        J --> L["server/data/rooms.json"]
        K --> L
    end
    A -->|"Vite Proxy /api"| I
```

## 2. 技术说明
- 前端：React@18 + TypeScript + Three.js + @react-three/fiber + @react-three/drei + Vite
- 状态管理：Zustand
- 样式：Tailwind CSS
- 后端：Express@4 + TypeScript + cors
- 数据库：本地JSON文件（server/data/rooms.json）
- 初始化工具：vite-init（react-express-ts模板）

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 主编辑页面，包含3D场景、控制面板、家具面板 |

## 4. API定义

### 4.1 TypeScript类型定义

```typescript
interface FurnitureItem {
  id: string;
  type: 'table' | 'chair' | 'sofa' | 'lamp';
  position: { x: number; y: number; z: number };
  rotation: number;
}

type TimeOfDay = 'morning' | 'noon' | 'evening' | 'night';
type Weather = 'sunny' | 'overcast';

interface RoomScheme {
  id: string;
  furniture: FurnitureItem[];
  timeOfDay: TimeOfDay;
  weather: Weather;
  savedAt: string;
}
```

### 4.2 请求/响应Schema

**POST /api/save**
- Request Body: `{ furniture: FurnitureItem[], timeOfDay: TimeOfDay, weather: Weather }`
- Response: `{ success: boolean, id: string }`

**GET /api/load**
- Response: `RoomScheme | null`

## 5. 服务器架构

```mermaid
graph LR
    A["Express Router"] --> B["保存接口"]
    A --> C["加载接口"]
    B --> D["读写 rooms.json"]
    C --> D
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    RoomScheme {
        string id PK
        string timeOfDay
        string weather
        string savedAt
    }
    FurnitureItem {
        string id PK
        string type
        float posX
        float posY
        float posZ
        float rotation
    }
    RoomScheme ||--o{ FurnitureItem : contains
```

### 6.2 数据定义语言
- 存储文件：`server/data/rooms.json`
- 格式：JSON数组，每个元素为一个RoomScheme对象
- 初始数据：空数组 `[]`
