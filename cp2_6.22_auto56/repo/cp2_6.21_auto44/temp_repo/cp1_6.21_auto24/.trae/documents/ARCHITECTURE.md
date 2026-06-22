## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层"
        A["App.tsx 主组件<br/>(路由/全局状态)"]
        B["Scene.tsx 3D场景<br/>(@react-three/fiber)"]
        C["InteractionManager.ts<br/>(交互管理)"]
        D["PhysicsEngine.ts<br/>(物理引擎)"]
        E["levelService.ts<br/>(关卡服务)"]
        F["UI组件<br/>(按钮/面板/提示)"]
    end
    subgraph "后端层"
        G["Express 服务器<br/>(server/index.js)"]
        H["关卡数据存储<br/>(内存数组)"]
    end
    A -->|"渲染"| B
    A -->|"调用"| E
    B -->|"事件"| C
    B -->|"每帧调用"| D
    C -->|"更新状态"| B
    D -->|"返回状态"| B
    E -->|"REST API"| G
    G -->|"读写"| H
    A -->|"渲染"| F
```

## 2. 技术说明

- **前端框架**：React 18 + TypeScript + Vite
- **3D渲染**：Three.js + @react-three/fiber + @react-three/drei
- **状态管理**：React useState/useRef（组件级状态），无全局状态管理库需求
- **后端服务**：Express 4 + CORS + UUID
- **数据存储**：后端内存数组（开发/演示用途）
- **构建工具**：Vite，配置代理将 `/api` 转发至后端 3001 端口

## 3. 路由定义

| 路由 | 用途 |
|-------|---------|
| `/` | 游戏主界面，包含3D场景和所有UI控制 |

本游戏为单页应用，通过内部状态切换关卡和编辑模式，无需多路由。

## 4. API 定义

### 4.1 类型定义

```typescript
interface Position {
  x: number;
  y: number;
  z: number;
}

interface Obstacle {
  position: Position;
  rotation?: Position;
}

interface PortalConfig {
  position: Position | null;
}

interface Level {
  id: string;
  name: string;
  startPosition: Position;
  endPosition: Position;
  obstacles: Obstacle[];
  initialPortals?: {
    blue: PortalConfig;
    orange: PortalConfig;
  };
}
```

### 4.2 接口定义

#### GET /api/levels
返回所有关卡列表

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid-1",
      "name": "第一关 - 初见",
      "startPosition": { "x": -3, "y": 0.5, "z": -3 },
      "endPosition": { "x": 3, "y": 0, "z": 3 },
      "obstacles": []
    }
  ]
}
```

#### GET /api/levels/:id
返回指定关卡详细配置

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "uuid-1",
    "name": "第一关 - 初见",
    "startPosition": { "x": -3, "y": 0.5, "z": -3 },
    "endPosition": { "x": 3, "y": 0, "z": 3 },
    "obstacles": [],
    "initialPortals": {
      "blue": { "position": null },
      "orange": { "position": null }
    }
  }
}
```

#### POST /api/levels
保存新关卡，使用 uuid 生成 ID

**请求体：**
```json
{
  "name": "自定义关卡",
  "startPosition": { "x": 0, "y": 0.5, "z": -4 },
  "endPosition": { "x": 0, "y": 0, "z": 4 },
  "obstacles": [
    { "position": { "x": 0, "y": 0.5, "z": 0 } }
  ]
}
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "new-uuid",
    "name": "自定义关卡",
    ...
  }
}
```

## 5. 服务端架构

```mermaid
graph TD
    A["API 路由层<br/>server/index.js"] --> B["关卡控制器"]
    B --> C["数据存储层<br/>内存数组"]
    C --> D["5个预设关卡初始数据"]
```

## 6. 数据模型

### 6.1 实体关系

```mermaid
erDiagram
    LEVEL {
        string id PK
        string name
        Position startPosition
        Position endPosition
        Obstacle[] obstacles
    }
    OBSTACLE {
        Position position
        Position rotation
    }
    POSITION {
        number x
        number y
        number z
    }
    LEVEL ||--o{ OBSTACLE : contains
    LEVEL ||--|| POSITION : startPosition
    LEVEL ||--|| POSITION : endPosition
```

### 6.2 预设关卡数据

后端启动时初始化5个难度递增的预设关卡，存储于全局 `levels` 数组中。
