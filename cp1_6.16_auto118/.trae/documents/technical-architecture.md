## 1. 架构设计

```mermaid
flowchart TB
    subgraph Frontend["前端应用层"]
        App["App.tsx 主组件"]
        Library["剪纸素材库.tsx"]
        Canvas["创作画布.tsx"]
        Panel["属性面板.tsx"]
        Store["store.ts 状态管理"]
    end

    subgraph BrowserAPI["浏览器API层"]
        CanvasAPI["Canvas 2D API"]
        ClipboardAPI["Clipboard API"]
        FileSaver["file-saver 下载"]
    end

    App --> Library
    App --> Canvas
    App --> Panel
    Library --> Store
    Canvas --> Store
    Panel --> Store
    Canvas --> CanvasAPI
    Canvas --> FileSaver
    Canvas --> ClipboardAPI
```

## 2. 技术说明

- 前端：React@18 + TypeScript + Vite
- 初始化工具：vite-init (react-ts 模板)
- 状态管理：Zustand
- 文件下载：file-saver
- 后端：无
- 数据库：无

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 主页面，包含素材库、画布、属性面板 |

单页面应用，无需多路由。

## 4. API定义

无后端API，所有数据和逻辑在前端处理。

## 5. 服务器架构图

不适用

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    CanvasElement {
        string id PK
        string type
        number x
        number y
        number rotation
        number scale
        string color
        number opacity
        number width
        number height
    }
    CardSettings {
        string backgroundColor
        string blessingText
    }
    CanvasElement ||--o{ CardSettings : "画布元素组成贺卡"
```

### 6.2 数据定义

```typescript
interface CanvasElement {
  id: string;
  type: string;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  color: string;
  opacity: number;
  width: number;
  height: number;
}

interface CardSettings {
  backgroundColor: string;
  blessingText: string;
}

interface AppState {
  elements: CanvasElement[];
  selectedElementId: string | null;
  cardSettings: CardSettings;
  addElement: (type: string) => void;
  updateElement: (id: string, updates: Partial<CanvasElement>) => void;
  removeElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  setCardSettings: (settings: Partial<CardSettings>) => void;
}
```

8种剪纸元素类型：龙、凤、鱼、虎、鹤、鹿、蝙蝠、蝴蝶
