## 1. 架构设计

```mermaid
flowchart TB
    subgraph Frontend["前端 (React + Three.js + Vite)"]
        A["App.tsx"] --> B["EcoSystem.tsx"]
        A --> C["ObservationChamber.tsx"]
        A --> D["InfoPanel"]
        B --> E["SeaCreatureManager.tsx"]
        B --> F["海底地形生成"]
        B --> G["海草/珊瑚渲染"]
        B --> H["光照/深度系统"]
        C --> I["键盘输入处理"]
        C --> J["鼠标拖拽旋转"]
        C --> K["阻尼惯性系统"]
    end

    subgraph Backend["后端 (Express + lowdb)"]
        L["server.ts"] --> M["/api/creatures"]
        L --> N["/api/corals"]
        M --> O["lowdb → db.json"]
        N --> O
    end

    E -->|"axios 获取生物数据"| M
    E -->|"axios 获取珊瑚数据"| N
```

## 2. 技术说明
- 前端：React@18 + TypeScript + Three.js + @react-three/fiber + @react-three/drei + Vite
- 初始化工具：vite-init (react-express-ts 模板)
- 后端：Express@4 + TypeScript + lowdb + cors
- 数据库：lowdb (JSON文件存储，db.json)
- 状态管理：zustand
- 样式：CSS (毛玻璃效果) + Tailwind辅助

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 主场景页面，包含3D海底观察站 |

## 4. API定义
```typescript
interface Creature {
  id: string;
  name: string;
  scientificName: string;
  habitat: string;
  depthRange: string;
  conservationStatus: string;
  description: string;
  color: string;
  size: number;
  speed: number;
}

interface Coral {
  id: string;
  name: string;
  scientificName: string;
  habitat: string;
  depthRange: string;
  conservationStatus: string;
  description: string;
  color: string;
}

// GET /api/creatures → Creature[]
// GET /api/corals → Coral[]
```

## 5. 服务端架构图
```mermaid
flowchart LR
    A["Express Router"] --> B["Creature Controller"]
    A --> C["Coral Controller"]
    B --> D["lowdb 读取 db.json"]
    C --> D
```

## 6. 数据模型

### 6.1 数据模型定义
```mermaid
erDiagram
    Creature {
        string id PK
        string name
        string scientificName
        string habitat
        string depthRange
        string conservationStatus
        string description
        string color
        number size
        number speed
    }
    Coral {
        string id PK
        string name
        string scientificName
        string habitat
        string depthRange
        string conservationStatus
        string description
        string color
    }
```

### 6.2 数据定义
db.json 初始化包含5种鱼类 + 1种海龟 + 5种珊瑚数据，每个条目包含完整的学名、生活习性、分布深度、保护状态字段。
