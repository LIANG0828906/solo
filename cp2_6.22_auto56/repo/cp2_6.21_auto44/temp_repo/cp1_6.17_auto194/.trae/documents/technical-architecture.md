## 1. 架构设计

```mermaid
flowchart TB
    subgraph Frontend["前端 React + TypeScript"]
        UI["UI组件层"]
        AM["AssetManager 素材管理"]
        SE["SceneEditor 场景编辑"]
        AN["Animator 动画播放"]
        EB["EventBus 事件总线"]
        ST["Zustand Store 状态管理"]
    end

    subgraph Backend["后端 Node.js + Express"]
        API["API路由"]
        AssetCtrl["素材控制器"]
        ProjectCtrl["项目控制器"]
    end

    UI --> AM
    UI --> SE
    UI --> AN
    AM --> EB
    SE --> EB
    AN --> EB
    EB --> ST
    UI --> ST
    Frontend -->|"HTTP请求"| Backend
    API --> AssetCtrl
    API --> ProjectCtrl
```

## 2. 技术说明
- 前端：React@18 + TypeScript + TailwindCSS@3 + Vite
- 初始化工具：vite-init（react-express-ts模板）
- 后端：Express@4 + TypeScript + CORS
- 数据库：无数据库，JSON文件存储 + 内存缓存
- 状态管理：Zustand
- 通信机制：EventBus（发布/订阅模式）

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 主编辑页面，包含画布、面板、时间轴 |

## 4. API定义

```typescript
interface AssetItem {
  id: string;
  name: string;
  category: 'sprite' | 'prop' | 'bubble';
  width: number;
  height: number;
  pixelData: string;
}

interface SceneElement {
  id: string;
  assetId: string;
  x: number;
  y: number;
  scale: number;
  opacity: number;
}

interface Frame {
  id: string;
  index: number;
  elements: SceneElement[];
  thumbnail?: string;
}

interface Project {
  id: string;
  name: string;
  canvasWidth: number;
  canvasHeight: number;
  gridSize: number;
  frames: Frame[];
  createdAt: string;
  updatedAt: string;
}

// GET /api/assets - 获取素材列表
// Response: { sprites: AssetItem[], props: AssetItem[], bubbles: AssetItem[] }

// POST /api/projects - 保存项目
// Request: Project
// Response: { success: boolean, id: string }

// GET /api/projects/:id - 加载项目
// Response: Project
```

## 5. 服务端架构图

```mermaid
flowchart LR
    R["路由层 Router"] --> C["控制器层 Controller"]
    C --> S["服务层 Service"]
    S --> FS["文件系统 JSON"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    Project ||--o{ Frame : "contains"
    Frame ||--o{ SceneElement : "contains"
    SceneElement }o--|| AssetItem : "references"

    Project {
        string id PK
        string name
        number canvasWidth
        number canvasHeight
        number gridSize
        string createdAt
        string updatedAt
    }

    Frame {
        string id PK
        number index
        string projectId FK
    }

    SceneElement {
        string id PK
        string assetId FK
        string frameId FK
        number x
        number y
        number scale
        number opacity
    }

    AssetItem {
        string id PK
        string name
        string category
        number width
        number height
        string pixelData
    }
```

### 6.2 模块通信机制

```mermaid
sequenceDiagram
    participant UI as UI组件
    participant AM as AssetManager
    participant SE as SceneEditor
    participant AN as Animator
    participant EB as EventBus
    participant Store as Zustand Store

    UI->>AM: 加载素材
    AM->>EB: emit('assets:loaded')
    EB->>UI: 素材就绪

    UI->>SE: 添加元素
    SE->>EB: emit('element:added')
    EB->>Store: 更新帧数据
    EB->>UI: 重新渲染

    UI->>AN: 播放动画
    AN->>EB: emit('frame:change')
    EB->>Store: 更新当前帧索引
    EB->>UI: 切换帧显示
```
