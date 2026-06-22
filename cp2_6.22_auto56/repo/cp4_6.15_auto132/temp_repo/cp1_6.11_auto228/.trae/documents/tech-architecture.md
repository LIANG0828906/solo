## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层（Canvas + TypeScript）"
        Main["main.ts<br/>主入口：初始化Canvas/Socket/事件分发"]
        PoemEngine["poemEngine.ts<br/>诗谜引擎：拆解/重组/匹配逻辑"]
        UIRenderer["uiRenderer.ts<br/>UI渲染器：绘制古风界面"]
    end

    subgraph "后端层（Node.js + Express + Socket.IO）"
        Server["server.ts<br/>WebSocket服务器：房间管理/消息广播"]
        Static["Express静态服务<br/>托管前端构建产物"]
    end

    subgraph "数据层"
        PoemDB["诗谜题库（内存）<br/>20首古诗+谜目+谜底"]
        RoomState["房间状态（内存）<br/>玩家列表/当前题目/倒计时"]
    end

    Main -->|"操作指令"| PoemEngine
    PoemEngine -->|"匹配度结果"| Main
    Main -->|"状态数据"| UIRenderer
    Main -->|"Socket发送"| Server
    Server -->|"Socket广播"| Main
    Server -->|"读写"| PoemDB
    Server -->|"读写"| RoomState
    Server -->|"托管"| Static
```

## 2. 技术说明

- **前端**：TypeScript + Canvas 2D API + Socket.IO Client，Vite构建
- **构建工具**：Vite，入口index.html，端口3000
- **后端**：Node.js + Express + Socket.IO，TypeScript编写
- **数据库**：无外部数据库，诗谜题库与房间状态均存放于内存
- **通信**：WebSocket（Socket.IO），消息延迟≤200ms
- **渲染**：Canvas 2D，requestAnimationFrame驱动，拖拽响应≤50ms，帧率≥40fps

## 3. 文件结构与职责

```
项目根目录/
├── package.json              # 依赖与启动脚本
├── vite.config.js            # Vite构建配置
├── tsconfig.json             # TypeScript严格模式配置
├── index.html                # 入口页面
├── server/
│   └── server.ts             # WebSocket服务器
├── src/
│   ├── main.ts               # 主入口
│   ├── poemEngine.ts         # 诗谜引擎
│   └── uiRenderer.ts         # UI渲染器
└── dist/                     # 构建输出
```

**文件间调用关系与数据流向：**

| 调用方 | 被调用方 | 数据流向 |
|--------|----------|----------|
| main.ts | uiRenderer.ts | 传递游戏状态→更新画布元素 |
| main.ts | poemEngine.ts | 传递操作指令→返回匹配度结果 |
| main.ts | server.ts（via Socket） | 发送用户操作→接收广播事件 |
| server.ts | 所有客户端（via Socket） | 接收消息→处理→广播给房间玩家 |
| poemEngine.ts | 内部 | 拆解/重组/全排列匹配算法 |

## 4. API定义（WebSocket事件）

### 4.1 客户端 → 服务器事件

```typescript
interface JoinRoomPayload {
  roomId: string;
  nickname: string;
}

interface SetRiddlePayload {
  roomId: string;
  poemIndex: number;
  category: 'flower' | 'medicine' | 'utensil' | 'place';
}

interface DecomposePayload {
  roomId: string;
  charIndex: number;
}

interface RecomposePayload {
  roomId: string;
  blockId: string;
  targetAngle: number;
}

interface JudgePayload {
  roomId: string;
}

interface ChatPayload {
  roomId: string;
  message: string;
}
```

### 4.2 服务器 → 客户端事件

```typescript
interface RoomJoinedPayload {
  roomId: string;
  players: Player[];
  yourId: string;
}

interface RiddleSetPayload {
  poem: string[];
  keywords: number[];
  category: string;
  timer: number;
}

interface PlayerDecomposedPayload {
  playerId: string;
  charIndex: number;
  blocks: DecomposedBlock[];
}

interface PlayerRecomposedPayload {
  playerId: string;
  blockId: string;
  ringOrder: string[];
}

interface JudgeResultPayload {
  success: boolean;
  answer: string;
  scores: Record<string, number>;
}

interface TimerTickPayload {
  remaining: number;
}

interface ChatMessagePayload {
  playerId: string;
  nickname: string;
  message: string;
}

interface AchievementPayload {
  playerId: string;
  achievement: string;
}

interface DecomposedBlock {
  id: string;
  char: string;
  sourceIndex: number;
  owner: string;
}

interface Player {
  id: string;
  nickname: string;
  score: number;
}
```

## 5. 服务器架构

```mermaid
graph LR
    subgraph "server.ts"
        ConnectionHandler["连接处理<br/>socket.io connection"]
        RoomManager["房间管理器<br/>创建/加入/离开"]
        EventRouter["事件路由<br/>分发客户端消息"]
        GameLogic["游戏逻辑<br/>出题/计时/评分"]
        Broadcaster["广播器<br/>向房间内玩家推送"]
    end

    ConnectionHandler --> RoomManager
    ConnectionHandler --> EventRouter
    EventRouter --> GameLogic
    GameLogic --> Broadcaster
    RoomManager --> Broadcaster
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    Room ||--o{ Player : contains
    Room ||--|| Riddle : "current riddle"
    Riddle ||--o{ Keyword : has
    Player ||--o{ DecomposedBlock : owns

    Room {
        string id PK
        string status
        number timer
        number createdAt
    }

    Player {
        string id PK
        string nickname
        number score
        string roomId FK
    }

    Riddle {
        number poemIndex
        string category
        string answer
        number[] keywordIndices
    }

    Keyword {
        number charIndex
        string char
    }

    DecomposedBlock {
        string id PK
        string char
        number sourceIndex
        string ownerId FK
    }
```

### 6.2 诗谜题库数据结构

```typescript
interface PoemRiddle {
  lines: string[];
  keywords: number[];
  answer: string;
  category: 'flower' | 'medicine' | 'utensil' | 'place';
  hint: string;
}

const POEM_DATABASE: PoemRiddle[] = [
  {
    lines: ['红豆生南国', '春来发几枝', '愿君多采撷', '此物最相思'],
    keywords: [0, 1],
    answer: '红豆',
    category: 'medicine',
    hint: '此物既可入药，亦表相思'
  },
];
```
