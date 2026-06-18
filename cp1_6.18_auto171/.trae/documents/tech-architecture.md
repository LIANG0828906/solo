## 1. 架构设计

```mermaid
graph TB
    subgraph Frontend["前端 - React + TypeScript + Vite"]
        UI["React组件层<br/>Toolbar / Board / HistoryPanel"]
        Store["状态管理层<br/>Zustand - boardStore"]
        Engine["引擎层<br/>boardEngine / collaborationEngine"]
        Data["数据层<br/>boardData"]
    end

    subgraph Backend["后端 - Node.js + Express + Socket.IO"]
        HTTP["Express HTTP服务<br/>静态资源托管"]
        WS["Socket.IO WebSocket服务<br/>实时协作通信"]
        Room["房间管理<br/>roomManager"]
    end

    UI --> Store
    Store --> Engine
    Engine --> Data
    Engine -->|"WebSocket"| WS
    WS --> Room
    HTTP -->|"托管构建产物"| UI
```

## 2. 技术说明

- **前端**：React 18 + TypeScript + Vite + Zustand + Tailwind CSS
- **初始化工具**：vite-init (react-express-ts模板)
- **后端**：Express 4 + Socket.IO
- **实时通信**：Socket.IO（WebSocket协议）
- **数据存储**：内存存储（房间元素数据 + 版本快照）
- **构建工具**：Vite

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| `/` | 首页，创建/加入白板房间 |
| `/board/:roomId` | 白板主界面，roomId区分不同协作房间 |

## 4. API定义

### 4.1 WebSocket事件

```typescript
interface ServerToClientEvents {
  "room:state": (data: { elements: BoardElement[]; snapshots: Snapshot[] }) => void;
  "room:element:add": (element: BoardElement) => void;
  "room:element:update": (element: BoardElement) => void;
  "room:element:delete": (elementId: string) => void;
  "room:clear": () => void;
  "room:snapshot": (snapshot: Snapshot) => void;
  "room:rollback": (data: { elements: BoardElement[]; expiredSnapshotIds: string[] }) => void;
  "room:user:join": (userId: string) => void;
  "room:user:leave": (userId: string) => void;
}

interface ClientToServerEvents {
  "room:join": (roomId: string) => void;
  "room:element:add": (element: BoardElement) => void;
  "room:element:update": (element: BoardElement) => void;
  "room:element:delete": (elementId: string) => void;
  "room:clear": () => void;
  "room:rollback": (snapshotId: string) => void;
}
```

### 4.2 HTTP接口

| 方法 | 路径 | 用途 |
|------|------|------|
| GET | `/api/room/:roomId` | 获取房间信息 |
| POST | `/api/room` | 创建新房间 |

## 5. 服务端架构

```mermaid
graph LR
    A["Express HTTP Server"] --> B["静态资源托管"]
    A --> C["API路由"]
    C --> D["房间管理 roomManager"]
    E["Socket.IO Server"] --> F["事件处理"]
    F --> D
    D --> G["内存存储<br/>元素列表 / 快照列表 / 用户列表"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    BoardElement {
        string id PK
        string type "path | sticky | image"
        number x
        number y
        number width
        number height
        string color
        number strokeWidth
        object points "路径点集合"
        string text "便签文本"
        string imageUrl "图片URL"
        string dataUrl "图片base64"
        number opacity
        number zIndex
        number createdAt
        number updatedAt
    }

    Snapshot {
        string id PK
        number timestamp
        array elements "元素快照"
        boolean expired
    }

    Room {
        string roomId PK
        array elements "当前元素列表"
        array snapshots "快照列表"
        array users "在线用户列表"
        number lastSnapshotTime
    }
```

### 6.2 核心数据类型

```typescript
type ElementType = "path" | "sticky" | "image";

interface PathPoint {
  x: number;
  y: number;
}

interface BoardElement {
  id: string;
  type: ElementType;
  x: number;
  y: number;
  width: number;
  height: number;
  color?: string;
  strokeWidth?: number;
  points?: PathPoint[];
  text?: string;
  imageUrl?: string;
  dataUrl?: string;
  opacity: number;
  zIndex: number;
  createdAt: number;
  updatedAt: number;
}

interface Snapshot {
  id: string;
  timestamp: number;
  elements: BoardElement[];
  expired: boolean;
}

interface HistoryEntry {
  type: "add" | "update" | "delete" | "clear";
  element?: BoardElement;
  previousElement?: BoardElement;
  clearedElements?: BoardElement[];
}
```
