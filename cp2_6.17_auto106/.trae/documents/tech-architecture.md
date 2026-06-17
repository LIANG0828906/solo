## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        A["App.tsx 主应用"]
        B["Toolbar 工具栏"]
        C["EditorPanel 编辑器"]
        D["PreviewPanel 预览"]
        E["Sidebar 侧边栏"]
        F["Zustand Store"]
    end
    subgraph "执行层（纯前端模拟）"
        G["CodeExecutor 代码执行引擎"]
        H["Brython Python 运行时"]
        I["Sandbox iframe JS 沙箱"]
    end
    subgraph "存储层"
        J["StorageManager localStorage 管理器"]
        K["localStorage"]
    end
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    F --> G
    G --> H
    G --> I
    F --> J
    J --> K
```

## 2. 技术说明
- 前端框架：React@18 + TypeScript
- 构建工具：Vite
- 状态管理：Zustand
- 代码编辑器：CodeMirror@6 + @codemirror/lang-javascript + @codemirror/lang-python
- Python 运行时：Brython（浏览器端执行）
- JavaScript 执行：沙箱 iframe eval
- ID 生成：uuid
- 样式方案：CSS Modules / 内联样式（暗色科幻主题）
- 存储：浏览器 localStorage
- 后端：无（纯前端模拟，延迟500ms模拟网络请求）

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 单页应用主界面，包含编辑器、预览、工具栏、侧边栏 |

本项目为单页应用，无需多路由。

## 4. API 定义（无后端，纯前端模拟）

### 4.1 模拟执行接口
```typescript
interface ExecuteRequest {
  code: string;
  language: 'python' | 'javascript';
}

interface ExecuteResponse {
  output: string;
  error: boolean;
}
```

### 4.2 存储接口
```typescript
interface Snippet {
  id: string;
  name: string;
  code: string;
  language: 'python' | 'javascript';
  lastModified: string;
}
```

## 5. 数据模型

```mermaid
erDiagram
    Snippet {
        string id PK
        string name
        string code
        string language
        string lastModified
    }
    localStorage {
        string key
        string value
    }
    Snippet ||--o| localStorage : "序列化存储为 JSON"
```

## 6. 文件结构

```
CodeCanvas/
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
└── src/
    ├── App.tsx
    ├── types.ts
    ├── modules/
    │   ├── editor/
    │   │   ├── EditorPanel.tsx
    │   │   └── PreviewPanel.tsx
    │   ├── executor/
    │   │   └── CodeExecutor.ts
    │   ├── storage/
    │   │   └── StorageManager.ts
    │   └── ui/
    │       ├── Sidebar.tsx
    │       └── Toolbar.tsx
```
