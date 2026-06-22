## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层"
        A["React + TypeScript"]
        B["Vite 构建工具"]
        C["Socket.IO Client 实时通信"]
        D["Axios HTTP 请求"]
        E["React Router 路由"]
    end
    subgraph "后端层"
        F["Express REST API"]
        G["Socket.IO Server WebSocket"]
        H["Sharp 图片处理"]
        I["Multer 文件上传"]
        J["内存状态管理"]
    end
    subgraph "数据流"
        K["图片上传"] --> F --> H --> L["切割为碎片"]
        M["拖拽操作"] --> C --> G --> J --> N["广播更新"] --> C
    end
```

## 2. 技术描述

- 前端：React@18 + TypeScript + Vite
- 后端：Node.js + Express@4 + Socket.IO
- 图片处理：Sharp
- 文件上传：Multer
- HTTP客户端：Axios
- 实时通信：Socket.IO
- 路由：React Router DOM
- 状态管理：React useState/useReducer 本地状态，服务端内存存储会话

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 首页，创建/加入游戏 |
| /game/:roomId | 游戏页，拼图协作主界面 |

## 4. API 定义

### 4.1 TypeScript 类型定义

```typescript
interface PuzzlePiece {
  id: number;
  correctRow: number;
  correctCol: number;
  currentRow: number;
  currentCol: number;
  isPlaced: boolean;
  imageUrl: string;
}

interface GameSession {
  roomId: string;
  imageUrl: string;
  pieces: PuzzlePiece[];
  players: Player[];
  startTime: number;
  moveCount: number;
  history: MoveRecord[];
  isCompleted: boolean;
  completedAt?: number;
}

interface Player {
  id: string;
  name: string;
  socketId: string;
}

interface MoveRecord {
  pieceId: number;
  fromRow: number;
  fromCol: number;
  toRow: number;
  toCol: number;
  timestamp: number;
  playerId: string;
}
```

### 4.2 REST API

| 方法 | 路径 | 描述 | 请求 | 响应 |
|------|------|------|------|------|
| POST | /api/upload | 上传图片并创建游戏 | multipart/form-data: image, gameName | { roomId, imageUrl, pieces } |
| GET | /api/game/:roomId | 获取游戏状态 | - | { game: GameSession } |
| POST | /api/join/:roomId | 加入游戏 | { playerName } | { game: GameSession, playerId } |

### 4.3 WebSocket 事件

| 事件 | 方向 | 描述 | 数据 |
|------|------|------|------|
| piece_moved | 客户端→服务端 | 碎片移动 | { pieceId, toRow, toCol, playerId } |
| piece_moved | 服务端→客户端 | 广播碎片移动 | { pieceId, toRow, toCol, playerId, isCorrect } |
| move_conflict | 服务端→客户端 | 移动冲突需回滚 | { pieceId, originalRow, originalCol } |
| undo_move | 客户端→服务端 | 撤销操作 | { playerId } |
| move_undone | 服务端→客户端 | 广播撤销 | { pieceId, toRow, toCol } |
| game_completed | 服务端→客户端 | 游戏完成 | { completedAt, duration, playerCount } |
| player_joined | 服务端→客户端 | 玩家加入 | { player: Player } |
| player_left | 服务端→客户端 | 玩家离开 | { playerId } |

## 5. 服务器架构图

```mermaid
graph TD
    A["客户端"] -->|HTTP| B["Express Router"]
    B --> C["Multer 中间件"]
    C --> D["Upload Controller"]
    D --> E["Sharp 图片切割"]
    E --> F["PuzzleManager"]
    A -->|WebSocket| G["Socket.IO Server"]
    G --> H["事件处理器"]
    H --> F["PuzzleManager"]
    F --> I["内存状态存储"]
    H --> G
    G --> A
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    GAME_SESSION {
        string roomId PK
        string imageUrl
        datetime startTime
        int moveCount
        boolean isCompleted
        datetime completedAt
    }
    PUZZLE_PIECE {
        int id PK
        int gameId FK
        int correctRow
        int correctCol
        int currentRow
        int currentCol
        boolean isPlaced
        string imageUrl
    }
    PLAYER {
        string id PK
        string gameId FK
        string name
        string socketId
    }
    MOVE_RECORD {
        int id PK
        int pieceId FK
        int fromRow
        int fromCol
        int toRow
        int toCol
        datetime timestamp
        string playerId
    }
    GAME_SESSION ||--o{ PUZZLE_PIECE : contains
    GAME_SESSION ||--o{ PLAYER : has
    GAME_SESSION ||--o{ MOVE_RECORD : history
    PUZZLE_PIECE ||--o{ MOVE_RECORD : referenced
```

### 6.2 内存存储结构

服务端使用 Map 存储游戏会话，键为 roomId：

```javascript
const games = new Map<string, GameSession>();
```

每个会话包含完整的拼图状态、玩家列表和操作历史。
