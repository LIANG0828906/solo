## 1. 架构设计

```mermaid
graph TD
    A["React前端 (Vite)"] --> B["状态管理 (Zustand)"]
    A --> C["组件层"]
    C --> C1["GameBoard 战棋地图"]
    C --> C2["UnitPanel 棋子详情"]
    C --> C3["CombatLog 战斗日志"]
    C --> C4["Toolbar 工具栏"]
    A --> D["API模块 (Axios)"]
    D --> E["Express后端"]
    E --> F["文件系统持久化"]
    F --> F1["game_*.json 战斗快照"]
    F --> F2["log_*.json 战斗日志"]
```

## 2. 技术描述
- **前端**：React 18 + TypeScript + Vite + TailwindCSS 3 + Zustand
- **后端**：Express 4 + TypeScript
- **数据存储**：文件系统（JSON文件）
- **初始化工具**：vite-init
- **HTTP客户端**：Axios
- **图标库**：lucide-react
- **唯一ID**：uuid

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 战斗主界面 |

## 4. API 定义

### 类型定义
```typescript
// 棋子类型
interface Unit {
  id: string;
  name: string;
  race: string;
  level: number;
  hp: number;
  maxHp: number;
  armor: number;
  movement: number;
  strength: number;
  agility: number;
  intelligence: number;
  position: { q: number; r: number };
  type: 'player' | 'enemy';
  isDead: boolean;
}

// 地形类型
type TerrainType = 'grass' | 'stone' | 'water';

interface HexCell {
  q: number;
  r: number;
  terrain: TerrainType;
}

// 战斗日志
interface LogEntry {
  id: string;
  round: number;
  timestamp: number;
  source: string;
  target: string;
  skill: string;
  value: number;
  type: 'attack' | 'heal' | 'buff' | 'debuff';
}

// 战斗状态
interface GameState {
  units: Unit[];
  terrain: HexCell[];
  currentRound: number;
  selectedUnitId: string | null;
  editMode: boolean;
  brushType: TerrainType;
}
```

### API接口
| 方法 | 路径 | 请求 | 响应 | 说明 |
|------|------|------|------|------|
| GET | /api/state | - | GameState | 获取当前战斗状态 |
| POST | /api/state | GameState | { success: boolean, filename: string } | 保存战斗快照 |
| GET | /api/log | - | LogEntry[] | 获取战斗日志 |
| POST | /api/log | LogEntry | { success: boolean } | 追加战斗日志 |
| POST | /api/state/load | { filename: string } | GameState | 加载指定快照 |
| GET | /api/snapshots | - | { filenames: string[] } | 获取快照列表 |

## 5. 服务器架构图

```mermaid
graph TD
    A["Express Server"] --> B["CORS 中间件"]
    A --> C["Session 中间件"]
    A --> D["JSON 解析中间件"]
    A --> E["路由控制器"]
    E --> E1["GET /api/state"]
    E --> E2["POST /api/state"]
    E --> E3["GET /api/log"]
    E --> E4["POST /api/log"]
    E --> E5["POST /api/state/load"]
    E --> E6["GET /api/snapshots"]
    F["文件系统层"] --> F1["game_*.json"]
    F --> F2["log_*.json"]
    E --> F
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    UNIT {
        string id PK
        string name
        string race
        int level
        int hp
        int maxHp
        int armor
        int movement
        int strength
        int agility
        int intelligence
        int position_q
        int position_r
        string type
        boolean isDead
    }
    
    HEX_CELL {
        int q PK
        int r PK
        string terrain
    }
    
    LOG_ENTRY {
        string id PK
        int round
        number timestamp
        string source
        string target
        string skill
        int value
        string type
    }
    
    GAME_STATE {
        UNIT[] units
        HEX_CELL[] terrain
        int currentRound
        string selectedUnitId
        boolean editMode
        string brushType
    }
```

### 6.2 文件结构
```
project/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── config.ts
│   ├── api.ts
│   ├── store.ts
│   ├── gameBoard.tsx
│   ├── unitPanel.tsx
│   ├── combatLog.tsx
│   ├── toolbar.tsx
│   └── types.ts
└── server/
    ├── index.ts
    ├── game_*.json
    └── log_*.json
```
