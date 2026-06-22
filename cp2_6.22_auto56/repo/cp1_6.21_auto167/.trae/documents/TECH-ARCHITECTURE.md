## 1. 架构设计

```mermaid
flowchart TB
    subgraph "Frontend"
        A["React 18 + TypeScript"] --> B["App.tsx (状态管理)"]
        B --> C["LensPanel.tsx (镜头列表)"]
        B --> D["DetailPanel.tsx (详情面板)"]
        B --> E["StatsBall.tsx (统计图表)"]
        F["useLensData.ts (数据Hook)"] --> B
    end
    subgraph "Backend"
        G["Express.js"] --> H["GET /api/lenses"]
        G --> I["POST /api/lenses"]
        G --> J["PUT /api/lenses/:id"]
        G --> K["DELETE /api/lenses/:id"]
    end
    subgraph "Data"
        L["server/data/lenses.json"]
    end
    F --> G
    H --> L
    I --> L
    J --> L
    K --> L
```

## 2. 技术描述
- **前端**：React@18 + TypeScript + Vite
- **初始化工具**：vite-init
- **后端**：Express@4
- **数据存储**：JSON 文件持久化（server/data/lenses.json）
- **HTTP 客户端**：axios
- **唯一 ID**：uuid

## 3. 路由定义

| 路由 | 用途 |
|-------|---------|
| / | 主应用界面（单页应用） |

## 4. API 定义

### 4.1 类型定义

```typescript
type LensStatus = 'pending' | 'approved' | 'reshoot';
type LensType = 'video' | 'image';

interface Lens {
  id: string;
  name: string;
  type: LensType;
  status: LensStatus;
  uploadTime: string;
  thumbnail?: string;
  format?: string;
  dimensions?: string;
  duration?: string;
  reviewNotes?: string;
}
```

### 4.2 接口规范

| 方法 | 路径 | 请求 | 响应 | 描述 |
|------|------|------|------|------|
| GET | /api/lenses | - | Lens[] | 获取全部镜头列表 |
| POST | /api/lenses | Partial<Lens> (multipart/form-data) | Lens | 上传新镜头 |
| PUT | /api/lenses/:id | { status: LensStatus, reviewNotes?: string } | Lens | 更新镜头状态/评审意见 |
| DELETE | /api/lenses/:id | - | { success: boolean } | 删除指定镜头 |

## 5. 服务端架构图

```mermaid
flowchart LR
    A["Express Routes (server/index.js)"] --> B["File System I/O"]
    B --> C["server/data/lenses.json"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    LENS {
        string id PK
        string name
        string type
        string status
        string uploadTime
        string thumbnail
        string format
        string dimensions
        string duration
        string reviewNotes
    }
```

### 6.2 初始数据

`server/data/lenses.json` 初始化包含若干示例镜头数据，覆盖三种状态（pending/approved/reshoot）和两种类型（video/image），便于前端演示。
