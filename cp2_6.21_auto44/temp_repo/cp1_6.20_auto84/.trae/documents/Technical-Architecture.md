## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层"
        A["React UI层<br/>(组件/状态管理)"]
        B["Canvas渲染层<br/>(游戏画面/粒子/动画)"]
        C["GameEngine核心引擎<br/>(网格/合成/资源/事件)"]
    end
    subgraph "后端层"
        D["Express API服务器<br/>(配方数据/状态持久化)"]
    end
    subgraph "数据层"
        E["本地JSON文件<br/>(gameState.json)"]
        F["初始配方数据"]
    end
    A -->|状态同步/事件订阅| C
    C -->|渲染指令| B
    A -->|HTTP请求| D
    D -->|读写| E
    D -->|加载| F
```

## 2. 技术描述

- **前端框架**：React@18 + TypeScript@5 + Vite@5
- **游戏渲染**：原生HTML5 Canvas 2D API
- **状态管理**：GameEngine内部状态 + React useState/useEffect + 事件总线模式
- **HTTP客户端**：原生fetch API
- **后端**：Node.js + Express@4
- **数据存储**：本地JSON文件（server/data/gameState.json）
- **构建工具**：Vite + @vitejs/plugin-react
- **其他依赖**：uuid（唯一ID）、body-parser（请求解析）、cors（跨域）、date-fns（日期格式化）

## 3. 路由定义

| 路由 | 目的 |
|-------|---------|
| / | 游戏主页面 |
| GET /api/recipes | 获取初始配方数据 |
| POST /api/game/save | 保存游戏状态 |
| POST /api/game/load | 加载游戏状态 |

## 4. API定义

### 4.1 获取配方数据

**GET /api/recipes**

响应：
```typescript
interface Recipe {
  id: string;
  name: string;
  type: 'advanced' | 'potion';
  inputs: { materialId: string; amount: number }[];
  output: { materialId: string; amount: number };
  manaCost: number;
  craftTime: number; // ms
}

interface RecipesResponse {
  materials: Material[];
  facilities: Facility[];
  recipes: Recipe[];
}
```

### 4.2 保存游戏状态

**POST /api/game/save**

请求体：
```typescript
interface GameState {
  grid: (FacilityInstance | null)[][];
  inventory: InventoryItem[];
  mana: number;
  maxMana: number;
  craftHistory: CraftRecord[];
  statistics: Statistics;
  timestamp: number;
}
```

响应：`{ success: boolean; message: string }`

### 4.3 加载游戏状态

**POST /api/game/load**

响应：`{ success: boolean; data?: GameState; message: string }`

## 5. 服务端架构图

```mermaid
graph LR
    A["Express App"] --> B["CORS Middleware"]
    A --> C["Body Parser Middleware"]
    A --> D["RecipeController"]
    A --> E["GameStateController"]
    D --> F["RecipeService"]
    E --> G["GameStateService"]
    F --> H["recipes.json"]
    G --> I["gameState.json"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    MATERIAL ||--o{ RECIPE_INPUT : "used as"
    MATERIAL ||--o{ RECIPE_OUTPUT : "produced as"
    RECIPE ||--|{ RECIPE_INPUT : "requires"
    RECIPE ||--|| RECIPE_OUTPUT : "yields"
    FACILITY ||--o{ FACILITY_INSTANCE : "placed as"
    FACILITY_INSTANCE }o--o{ MATERIAL : "stores/crafts"
    INVENTORY_ITEM }o--|| MATERIAL : "refers to"
    CRAFT_RECORD }o--|| RECIPE : "executed"

    MATERIAL {
        string id PK
        string name
        string type "basic|advanced|potion"
        string color
        string description
    }

    FACILITY {
        string id PK
        string name
        string type
        string description
    }

    FACILITY_INSTANCE {
        string id PK
        string facilityId FK
        int gridX
        int gridY
        object config
        string status "idle|working"
    }

    RECIPE {
        string id PK
        string name
        string type
        int manaCost
        int craftTime
    }

    RECIPE_INPUT {
        string recipeId FK
        string materialId FK
        int amount
    }

    RECIPE_OUTPUT {
        string recipeId FK
        string materialId FK
        int amount
    }

    INVENTORY_ITEM {
        string id PK
        string materialId FK
        int amount
        int obtainedAt
    }

    CRAFT_RECORD {
        string id PK
        string recipeId FK
        int completedAt
        boolean success
    }
```

### 6.2 类型定义（TypeScript）

```typescript
type MaterialType = 'basic' | 'advanced' | 'potion';
type FacilityType = 'alchemy_table' | 'material_rack' | 'furnace' | 'potion_rack' | 'mana_well';

interface Material {
  id: string;
  name: string;
  type: MaterialType;
  color: string;
  icon: string; // pixel art key
  description: string;
}

interface Facility {
  id: FacilityType;
  name: string;
  description: string;
  color: string;
}

interface FacilityInstance {
  id: string;
  type: FacilityType;
  x: number;
  y: number;
  craftQueue: CraftTask[];
  storage: { [materialId: string]: number };
  config: FacilityConfig;
  currentCraft?: CraftTask;
  craftProgress: number; // 0-1
}

interface CraftTask {
  recipeId: string;
  startTime: number;
  endTime: number;
}

interface CraftRecord {
  id: string;
  recipeId: string;
  inputs: { materialId: string; amount: number }[];
  output: { materialId: string; amount: number };
  completedAt: number;
  facilityType: FacilityType;
}

interface InventoryItem {
  id: string;
  materialId: string;
  amount: number;
  obtainedAt: number;
}

interface Statistics {
  facilityWorkTime: { [type: string]: number };
  totalCrafts: number;
  totalPotions: number;
}
```
