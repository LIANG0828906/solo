## 1. 架构设计

```mermaid
graph TB
    subgraph "前端 (Vite + React + Three.js)"
        A["React UI层"] --> B["Three.js 渲染层"]
        A --> C["游戏状态管理 (Zustand)"]
        B --> D["地牢场景"]
        B --> E["角色/敌人模型"]
        B --> F["粒子效果系统"]
        C --> G["API通信模块"]
    end
    subgraph "后端 (Express)"
        H["API路由"] --> I["地牢生成服务"]
        H --> J["敌人配置服务"]
        H --> K["掉落物品服务"]
    end
    G -->|"RESTful API"| H
```

## 2. 技术说明

- 前端：React@18 + Three.js + TypeScript + Vite
- 初始化工具：vite-init (react-ts模板)
- 后端：Express@4 + CORS
- 状态管理：Zustand
- 通信方式：RESTful API (Fetch)

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 游戏标题屏幕与主入口 |
| /game | 游戏主界面(3D场景+HUD覆盖层) |

## 4. API定义

### 4.1 POST /api/dungeon/generate

请求：
```typescript
interface DungeonGenerateRequest {
  seed?: number;
  floor: number;
}
```

响应：
```typescript
interface Room {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  connections: string[];
  isEntrance: boolean;
  isExit: boolean;
  hasChest: boolean;
  enemyCount: number;
}

interface DungeonGenerateResponse {
  seed: number;
  floor: number;
  rooms: Room[];
  corridors: { from: string; to: string; points: { x: number; y: number }[] }[];
  enemies: EnemyConfig[];
  loot: LootItem[];
}
```

### 4.2 GET /api/enemies/config?floor={floor}

响应：
```typescript
interface EnemyConfig {
  type: 'skeleton' | 'ghost' | 'demon';
  name: string;
  hp: number;
  attack: number;
  defense: number;
  speed: number;
  attackRange: number;
  attackInterval: number;
}
```

### 4.3 POST /api/loot/roll

请求：
```typescript
interface LootRollRequest {
  playerLevel: number;
  floor: number;
}
```

响应：
```typescript
interface LootItem {
  id: string;
  name: string;
  type: 'weapon' | 'armor' | 'accessory';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  stats: {
    attackBonus?: number;
    hpBonus?: number;
    energyRegenBonus?: number;
  };
  description: string;
}
```

## 5. 服务端架构图

```mermaid
graph LR
    A["Express路由层"] --> B["地牢生成服务"]
    A --> C["敌人配置服务"]
    A --> D["掉落物品服务"]
    B --> E["种子随机数生成器"]
    C --> F["层 difficulty 缩放"]
    D --> G["稀有度权重表"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    "Dungeon" ||--o{ "Room" : "contains"
    "Room" ||--o{ "Corridor" : "connected"
    "Room" ||--o{ "Enemy" : "spawns"
    "Room" ||--o| "Chest" : "contains"
    "Enemy" ||--o{ "LootTable" : "drops"
    "Chest" ||--o{ "LootTable" : "contains"
    "LootTable" ||--o{ "LootItem" : "generates"
    "Player" ||--o{ "LootItem" : "carries"
```

### 6.2 核心类型定义

```typescript
interface PlayerState {
  hp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  energyRegen: number;
  attack: number;
  defense: number;
  level: number;
  floor: number;
  gold: number;
  inventory: LootItem[];
  equippedWeapon: LootItem | null;
  equippedArmor: LootItem | null;
  equippedAccessory: LootItem | null;
  position: { x: number; y: number; z: number };
  isInvincible: boolean;
  isAttacking: boolean;
  isDead: boolean;
}

interface EnemyState {
  id: string;
  type: 'skeleton' | 'ghost' | 'demon' | 'boss';
  name: string;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  position: { x: number; y: number; z: number };
  state: 'patrol' | 'chase' | 'attack' | 'dead';
  attackTimer: number;
  attackCooldown: number;
  isBoss: boolean;
  bossPhase?: number;
}

interface GameState {
  player: PlayerState;
  enemies: EnemyState[];
  currentFloor: number;
  dungeonData: DungeonGenerateResponse | null;
  isGameOver: boolean;
  isPaused: boolean;
}
```
