## 1. 架构设计

```mermaid
graph TD
    subgraph "前端 (React + TypeScript + Vite)"
        A["App.tsx (根组件)"]
        B["组件层"]
        C["上下文状态管理"]
        D["工具函数层"]
        B1["BookmarkTree.tsx"]
        B2["SearchPanel.tsx"]
        B3["Toolbar / Modal / ContextMenu"]
        C1["AppContext.tsx"]
        D1["api.ts"]
    end

    subgraph "后端 (Node.js + Express + TypeScript)"
        E["server/index.ts"]
        F["RESTful API 路由"]
        G["内存数据存储"]
        H["撤销栈 (Stack)"]
    end

    C1 --> A
    B1 --> A
    B2 --> A
    B3 --> A
    D1 --> C1
    D1 --> B
    D1 -- HTTP/JSON --> F
    F --> E
    G --> F
    H --> F
```

## 2. 技术说明

- **前端**：React 18 + TypeScript + Vite + lucide-react 图标库
- **构建工具**：Vite (@vitejs/plugin-react)
- **后端**：Express 4 + TypeScript + CORS 中间件
- **数据存储**：服务端内存存储（树结构书签数据 + 标签映射 + 撤销操作栈）
- **状态管理**：React Context (AppContext) 管理全局书签数据、选中状态、搜索状态、撤销栈

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 应用主页面（单页应用，所有功能在同一页面） |

## 4. API 定义

```typescript
// 书签节点类型
interface BookmarkNode {
  id: string;
  type: 'folder' | 'bookmark';
  title: string;
  url?: string;
  parentId: string | null;
  children: BookmarkNode[];
  tags: string[];
  source?: 'chrome' | 'firefox' | 'edge' | 'safari' | 'import-html' | 'import-json' | 'manual';
  createdAt: number;
  updatedAt: number;
}

// 导入请求
interface ImportRequest {
  format: 'html' | 'json';
  data: string; // HTML 字符串或 JSON 字符串
  targetFolderId?: string | null;
}

// 导入响应
interface ImportResponse {
  success: boolean;
  imported: number;
  duplicates: number;
  bookmarks: BookmarkNode[];
}

// 搜索响应
interface SearchResult {
  id: string;
  title: string;
  url?: string;
  tags: string[];
  matches: { field: 'title' | 'url'; indices: [number, number][] }[];
}

// 导出请求
interface ExportRequest {
  format: 'html' | 'json';
  scope: 'all' | 'folder';
  folderId?: string;
}

// 导出响应
interface ExportResponse {
  format: 'html' | 'json';
  filename: string;
  data: string; // HTML 或 JSON 字符串
}
```

### REST API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/import | 批量导入书签，自动去重 |
| GET | /api/bookmarks | 获取完整书签树 |
| PUT | /api/bookmarks/:id | 更新单个书签/文件夹 |
| DELETE | /api/bookmarks/:id | 删除单个书签/文件夹 |
| POST | /api/export | 导出书签为 HTML/JSON |
| GET | /api/search?q= | 实时模糊搜索书签 |

## 5. 服务端架构图

```mermaid
graph TD
    A["Express HTTP 服务器"] --> B["API 路由层"]
    B --> C["业务逻辑层"]
    C --> D["内存数据存储"]
    C --> E["去重清洗模块"]
    C --> F["标签自动分类模块"]
    C --> G["模糊搜索模块"]
    C --> H["撤销操作栈 (Stack)"]
    D --> I["书签树 (Map<string, BookmarkNode>)"]
    D --> J["标签索引 (Map<string, Set<string>>)"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    BOOKMARK_NODE {
        string id PK
        string type "folder | bookmark"
        string title
        string url "nullable, 仅 bookmark 类型"
        string parentId FK "nullable, 根节点为 null"
        array children "子节点数组"
        array tags "标签数组, 最多 5 个"
        string source "来源标识"
        number createdAt
        number updatedAt
    }

    TAG_INDEX {
        string tagName PK
        array bookmarkIds "关联的书签 ID 集合"
    }

    UNDO_STACK {
        number id PK
        string action "create | update | delete | move"
        object before "操作前快照"
        object after "操作后快照"
        number timestamp
    }
```

### 6.2 内存数据结构

```typescript
// 服务端内存存储
interface ServerStore {
  // 书签节点存储 (id -> node)
  nodes: Map<string, BookmarkNode>;
  
  // 根节点 ID 列表
  rootIds: string[];
  
  // 标签反向索引 (tag -> Set<bookmarkId>)
  tagIndex: Map<string, Set<string>>;
  
  // URL 去重索引 (normalizedUrl -> bookmarkId)
  urlIndex: Map<string, string>;
  
  // 撤销操作栈
  undoStack: UndoOperation[];
}
```
