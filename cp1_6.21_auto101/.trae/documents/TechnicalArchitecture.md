## 1. 架构设计

```mermaid
flowchart LR
    subgraph "前端 React + TypeScript + Vite"
        A["App.tsx 根组件 全局状态管理 WebSocket连接"]
        B["Board.tsx 棋盘组件 8x8网格 交互 动画"]
        C["GameInfo.tsx 信息栏组件 已揭示棋子显示"]
        D["UI组件 胜利弹窗 战报面板 回合指示器"]
        E["API层 REST接口 获取房间信息 验证走法"]
        F["WebSocket层 接收对方行动 广播棋局同步"]
    end
    
    subgraph "后端 Node.js + Express + TypeScript"
        G["server.ts Express服务器 HTTP服务 WebSocket服务 房间管理"]
        H["gameEngine.ts 游戏引擎 pure functions"]
        I["类型定义 Board Piece Move GameState"]
    end
    
    subgraph "通信协议"
        J["REST API /api/rooms /api/move/validate"]
        K["WebSocket join move state_sync"]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    E --> J
    F --> K
    J --> G
    K --> G
    G --> H
    H --> I
```

## 2. 技术描述

- **前端**：React 18 + TypeScript + Vite，CSS Modules/内联样式实现动画
- **后端**：Express 4 + TypeScript + ws (WebSocket) + uuid
- **数据存储**：内存缓存（Map存储房间状态），无需数据库
- **初始化工具**：Vite初始化React+TypeScript模板，手动添加Express后端

## 3. 路由定义

| 路由 | 方法 | 用途 |
|------|------|------|
| / | GET | 前端入口（Vite提供） |
| /api/rooms | POST | 创建新房间，返回roomId |
| /api/rooms/:roomId | GET | 获取房间信息（玩家状态、当前棋局） |
| /api/move/validate | POST | 验证走法合法性，返回校验结果 |
| /ws | Upgrade | WebSocket连接端点 |

## 4. API定义

### 4.1 TypeScript 类型定义

```typescript
// shared types - 前后端共用
type PlayerColor = 'white' | 'black';
type PieceType = 'pawn' | 'rook' | 'knight' | 'bishop' | 'queen' | 'king';

interface Piece {
  id: string;
  type: PieceType;
  color: PlayerColor;
  revealed: boolean;       // 是否已被揭示
  position: Position;      // 当前位置
}

interface Position {
  row: number;             // 0-7
  col: number;             // 0-7
}

interface Move {
  pieceId: string;
  from: Position;
  to: Position;
  capturedPieceId?: string; // 被吃棋子ID
}

interface BoardState {
  pieces: Piece[];
  currentTurn: PlayerColor;
  totalMoves: number;
  winner: PlayerColor | null;
  isGameOver: boolean;
}

interface Room {
  id: string;
  players: {
    white?: string;  // socketId
    black?: string;
  };
  board: BoardState;
  battleLog: BattleLogEntry[];
  createdAt: number;
}

interface BattleLogEntry {
  timestamp: number;
  turn: number;
  player: PlayerColor;
  move: Move;
  capturedPiece?: Piece;
  message: string;
}

// WebSocket事件
type WSClientMessage = 
  | { type: 'join'; roomId: string }
  | { type: 'move'; roomId: string; move: Move; playerColor: PlayerColor };

type WSServerMessage =
  | { type: 'room_joined'; roomId: string; playerColor: PlayerColor; board: BoardState }
  | { type: 'player_joined'; playerColor: PlayerColor }
  | { type: 'state_update'; board: BoardState; battleLog: BattleLogEntry[] }
  | { type: 'move_invalid'; reason: string }
  | { type: 'game_over'; winner: PlayerColor; board: BoardState };
```

### 4.2 REST API 输入输出

**POST /api/rooms**
- Request: `{}`
- Response: `{ roomId: string; playerColor: 'white' }`

**GET /api/rooms/:roomId**
- Response: `{ roomId: string; hasWhite: boolean; hasBlack: boolean; board: BoardState; battleLog: BattleLogEntry[] }`

**POST /api/move/validate**
- Request: `{ roomId: string; move: Move; playerColor: PlayerColor }`
- Response: `{ valid: boolean; reason?: string; capturedPiece?: Piece }`

## 5. 服务器架构图

```mermaid
flowchart TD
    subgraph "Express App Layer"
        A["HTTP请求处理 REST路由"]
        B["WebSocket升级处理 ws库"]
    end
    
    subgraph "Room Manager Layer"
        C["房间Map Map<roomId, Room>"]
        D["房间生命周期 创建/加入/销毁"]
    end
    
    subgraph "Game Engine Layer (Pure Functions)"
        E["createInitialBoard 初始布局生成"]
        F["validateMove 走法合法性校验 国际象棋规则"]
        G["applyMove 执行移动 揭示棋子 判断吃子"]
        H["checkWinCondition 胜负判定"]
        I["generateLegalMoves 生成合法走法"]
    end
    
    A --> D
    B --> D
    D --> C
    D --> E
    D --> F
    D --> G
    D --> H
    D --> I
    F --> G
    G --> H
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    ROOM ||--o{ PLAYER : "has"
    ROOM ||--|| BOARD_STATE : "contains"
    ROOM ||--o{ BATTLE_LOG : "records"
    BOARD_STATE ||--o{ PIECE : "consists of"
    PIECE }|--|| PIECE_TYPE : "is"
    PIECE }|--|| PLAYER_COLOR : "belongs to"

    ROOM {
        string id PK
        datetime createdAt
    }
    
    PLAYER {
        string socketId PK
        string roomId FK
        enum color "white/black"
    }
    
    BOARD_STATE {
        string roomId PK
        enum currentTurn "white/black"
        int totalMoves
        enum winner "white/black/null"
        boolean isGameOver
    }
    
    PIECE {
        string id PK
        enum type "pawn/rook/knight/bishop/queen/king"
        enum color "white/black"
        boolean revealed
        int row
        int col
    }
    
    BATTLE_LOG {
        int id PK
        string roomId FK
        datetime timestamp
        int turnNumber
        enum player "white/black"
        string fromPosition
        string toPosition
        string capturedPieceType
        string message
    }
    
    PIECE_TYPE {
        enum name PK
        string symbol_white
        string symbol_black
    }
    
    PLAYER_COLOR {
        enum name PK
    }
```

### 6.2 游戏引擎核心逻辑说明

**初始布局**：
- 与国际象棋相同，白方(0-1行)、黑方(6-7行)，兵2-5列各8个，底线车、马、象、后、王
- 初始所有棋子 revealed=false

**走法校验**：
- 按国际象棋标准规则（兵、车、马、象、后、王各走法）
- 特殊规则：王车易位、吃过路兵——为简化不实现
- 兵升变：到达底线升变为后

**揭示逻辑**：
- 任意棋子移动后永久 revealed=true
- 目标格有棋子时，双方均 revealed=true
- 判断目标棋子是否为对方颜色，是则被吃

**胜负判定**：
- 王被吃 → 对方胜利
- 当前玩家无任何合法可走棋子（所有已揭示+未揭示己方棋子均无合法走法）→ 对方胜利
