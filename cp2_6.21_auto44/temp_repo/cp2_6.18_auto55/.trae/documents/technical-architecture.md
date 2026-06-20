## 1. 架构设计

```mermaid
flowchart TB
    subgraph Frontend["前端层"]
        App["App.tsx 主布局"]
        Editor["Editor.tsx 编辑器"]
        Preview["Preview.tsx 预览"]
        Sidebar["Sidebar.tsx 文档边栏"]
        Toolbar["Toolbar.tsx 工具栏"]
    end

    subgraph State["状态层"]
        Store["documentStore.ts Zustand Store"]
    end

    subgraph Persistence["持久化层"]
        LS["localStorage"]
    end

    App --> Editor
    App --> Preview
    App --> Sidebar
    Editor --> Toolbar
    Editor -->|"updateContent"| Store
    Sidebar -->|"createDoc / deleteDoc / switchDoc"| Store
    Store -->|"文档内容"| Preview
    Store -->|"文档列表"| Sidebar
    Store -->|"读写"| LS
```

## 2. 技术说明
- 前端：React@18 + TypeScript + Vite + Tailwind CSS@3
- 初始化工具：vite-init (react-ts 模板)
- 状态管理：Zustand
- 后端：无（纯前端应用）
- 数据库：无（使用 localStorage 持久化）
- 图标库：lucide-react

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 编辑器主页面，包含编辑区、预览区、文档边栏 |

（单页应用，无需路由）

## 4. API 定义
无后端API，所有数据操作通过 Zustand Store + localStorage 完成。

## 5. 服务器架构图
无后端服务器。

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    Document {
        string id "文档唯一标识 (uuid)"
        string title "文档标题"
        string content "文档HTML内容"
        string[] formatMarks "格式化标记列表"
        number updatedAt "最后修改时间戳"
        number createdAt "创建时间戳"
    }
```

### 6.2 数据结构定义

```typescript
interface Document {
  id: string;
  title: string;
  content: string;
  formatMarks: string[];
  updatedAt: number;
  createdAt: number;
}

interface DocumentState {
  documents: Document[];
  activeDocId: string | null;
  content: string;
  title: string;
  formatMarks: string[];
  createDoc: (title: string) => void;
  deleteDoc: (id: string) => void;
  switchDoc: (id: string) => void;
  updateContent: (content: string) => void;
  updateTitle: (title: string) => void;
  updateFormatMarks: (marks: string[]) => void;
}
```

### 6.3 文件结构与调用关系

```
quickdoc/
├── index.html                    # 入口页面
├── package.json                  # 依赖配置
├── vite.config.ts                # Vite配置
├── tsconfig.json                 # TypeScript配置
├── src/
│   ├── main.tsx                  # 入口，挂载App
│   ├── App.tsx                   # 主布局，左右分栏
│   ├── store/
│   │   └── documentStore.ts      # Zustand状态管理
│   ├── components/
│   │   ├── Editor.tsx            # 富文本编辑区
│   │   ├── Preview.tsx           # HTML预览区
│   │   ├── Sidebar.tsx           # 文档管理边栏
│   │   └── Toolbar.tsx           # 格式化工具栏
│   └── utils/
│       └── exportHtml.ts         # HTML导出工具
```

**数据流向**：
- 编辑器组件 → `store.updateContent()` → Zustand Store → 预览组件重新渲染
- 边栏组件 → `store.createDoc/deleteDoc/switchDoc()` → Store → 边栏列表更新
- Store → `localStorage` 持久化读写（每次状态变更自动同步）
- 导出按钮 → `exportHtml()` → 生成HTML文件下载
