## 1. 架构设计

```mermaid
graph TD
    A["前端 (React + TypeScript + Vite)"] --> B["状态管理 (Zustand)"]
    A --> C["UI组件 (Framer Motion动画)"]
    A --> D["HTTP客户端 (Fetch API)"]
    D --> E["后端 (Express + TypeScript)"]
    E --> F["API路由层"]
    F --> G["业务逻辑层"]
    G --> H["数据存储层 (内存存储)"]
```

## 2. 技术描述

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite（开发服务器端口5173）
- **状态管理**：Zustand
- **动画库**：Framer Motion
- **后端框架**：Express 4 + TypeScript
- **跨域处理**：CORS
- **数据存储**：内存存储（模拟数据）
- **包管理器**：npm

## 3. 路由定义

| 路由 | 用途 |
|-------|---------|
| / | 主应用页面，包含地图、文书卡片和历史面板 |

## 4. API 定义

### 4.1 类型定义

```typescript
// 急递铺站
interface PostStation {
  id: string;
  name: string;
  position: { x: number; y: number };
  soldiers: number;
  avgHandoverTime: number;
  order: number;
}

// 紧急等级
type UrgencyLevel = 'normal' | 'urgent' | 'express600';

// 文书状态
type DocumentStatus = 'pending' | 'transiting' | 'arrived' | 'completed' | 'overdue';

// 文书
interface Document {
  id: string;
  from: string;
  to: string;
  urgency: UrgencyLevel;
  status: DocumentStatus;
  createdAt: number;
  startedAt: number;
  timeLimit: number;
  currentStationIndex: number;
  totalStations: number;
  signatures: Signature[];
  isOverdue: boolean;
  overdueReason?: string;
}

// 签收记录
interface Signature {
  id: string;
  documentId: string;
  stationName: string;
  stationIndex: number;
  soldierName: string;
  timestamp: number;
}

// 历史记录
interface HistoryRecord {
  documentId: string;
  from: string;
  to: string;
  urgency: UrgencyLevel;
  totalTime: number;
  signatureCount: number;
  completedAt: number;
  isOverdue: boolean;
}
```

### 4.2 接口定义

| 方法 | 路径 | 描述 | 请求 | 响应 |
|------|------|------|------|------|
| GET | /api/stations | 获取所有急递铺站列表 | - | `PostStation[]` |
| GET | /api/documents/:id | 获取文书详情 | - | `Document` |
| GET | /api/documents | 获取所有文书 | - | `Document[]` |
| POST | /api/documents | 创建新文书 | `{ from, to, urgency }` | `Document` |
| POST | /api/documents/:id/sign | 签收文书 | `{ stationIndex, stationName }` | `Signature` |
| PUT | /api/documents/:id/next | 文书传往下一站 | - | `Document` |
| GET | /api/history | 获取历史记录 | `?startDate=&endDate=` | `HistoryRecord[]` |

## 5. 服务器架构图

```mermaid
graph TD
    A["客户端请求"] --> B["CORS中间件"]
    B --> C["Express路由"]
    C --> D["GET /api/stations"]
    C --> E["GET /api/documents"]
    C --> F["POST /api/documents"]
    C --> G["POST /api/documents/:id/sign"]
    C --> H["PUT /api/documents/:id/next"]
    C --> I["GET /api/history"]
    D --> J["数据服务层"]
    E --> J
    F --> J
    G --> J
    H --> J
    I --> J
    J --> K["内存数据存储"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    POST_STATION ||--o{ SIGNATURE : has
    DOCUMENT ||--o{ SIGNATURE : contains
    DOCUMENT ||--|| HISTORY_RECORD : becomes
    
    POST_STATION {
        string id PK
        string name
        number x
        number y
        number soldiers
        number avgHandoverTime
        number order
    }
    
    DOCUMENT {
        string id PK
        string from
        string to
        string urgency
        string status
        number createdAt
        number startedAt
        number timeLimit
        number currentStationIndex
        number totalStations
        boolean isOverdue
        string overdueReason
    }
    
    SIGNATURE {
        string id PK
        string documentId FK
        string stationName
        number stationIndex
        string soldierName
        number timestamp
    }
    
    HISTORY_RECORD {
        string documentId PK
        string from
        string to
        string urgency
        number totalTime
        number signatureCount
        number completedAt
        boolean isOverdue
    }
```

### 6.2 初始数据

急递铺站数据（10个，从北京到嘉峪关）：
1. 京师会同馆 - 北京
2. 通州驿
3. 保定驿
4. 真定驿
5. 太原驿
6. 平阳驿
7. 西安驿
8. 平凉驿
9. 兰州驿
10. 肃州嘉峪关

时限配置：
- 普通：5天（432000秒）
- 加急：3天（259200秒）
- 六百里加急：1天（86400秒）

## 7. 项目文件结构

```
.
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
├── src/
│   ├── App.tsx              # 主应用组件
│   ├── store.ts             # Zustand状态管理
│   ├── server.ts            # Express后端
│   ├── components/
│   │   ├── MapView.tsx      # 驿道地图组件
│   │   ├── DocumentCard.tsx # 文书卡片组件
│   │   └── HistoryPanel.tsx # 历史面板组件
│   └── types/
│       └── index.ts         # 类型定义
```

## 8. 前端状态管理（Zustand Store）

```typescript
interface AppState {
  stations: PostStation[];
  documents: Document[];
  history: HistoryRecord[];
  activeDocument: Document | null;
  timer: number;
  isTimerRunning: boolean;
  
  // Actions
  fetchStations: () => Promise<void>;
  fetchDocuments: () => Promise<void>;
  fetchHistory: (startDate?: number, endDate?: number) => Promise<void>;
  createDocument: (from: string, to: string, urgency: UrgencyLevel) => Promise<Document>;
  signDocument: (documentId: string, stationIndex: number, stationName: string) => Promise<void>;
  moveToNextStation: (documentId: string) => Promise<void>;
  setActiveDocument: (doc: Document | null) => void;
  startTimer: () => void;
  stopTimer: () => void;
  resetTimer: () => void;
}
```
