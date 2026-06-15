## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        "TextPanel" --> "Zustand Store"
        "IconPanel" --> "Zustand Store"
        "DecorPanel" --> "Zustand Store"
        "Zustand Store" --> "Canvas"
        "Canvas" --> "html-to-image"
    end
    subgraph "状态管理层"
        "Zustand Store"
    end
    subgraph "导出层"
        "html-to-image" --> "SVG导出"
        "html-to-image" --> "PNG导出"
    end
```

## 2. 技术说明

- 前端：React 18 + TypeScript + Vite
- 状态管理：Zustand
- 导出：html-to-image
- 样式：CSS Modules + CSS变量（深色主题）
- 初始化工具：vite-init（react-ts模板）

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 设计器主页（单页应用） |

## 4. 文件结构

```
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── store/
    │   └── useDesignStore.ts
    └── components/
        ├── Canvas.tsx
        ├── TextPanel.tsx
        ├── IconPanel.tsx
        └── DecorPanel.tsx
```

## 5. 状态模型（Zustand Store）

```typescript
interface PlacedIcon {
  id: string;
  iconType: string;
  x: number;
  y: number;
  size: number;
  rotation: number;
}

interface DesignState {
  text: string;
  fontFamily: string;
  textColor: string;
  placedIcons: PlacedIcon[];
  borderStyle: string;
  backgroundTexture: string;
}

interface DesignActions {
  setText: (text: string) => void;
  setFontFamily: (font: string) => void;
  setTextColor: (color: string) => void;
  addIcon: (icon: PlacedIcon) => void;
  updateIcon: (id: string, updates: Partial<PlacedIcon>) => void;
  removeIcon: (id: string) => void;
  setBorderStyle: (style: string) => void;
  setBackgroundTexture: (texture: string) => void;
  resetDesign: () => void;
}
```

## 6. 性能目标

- 字体和图标库首次加载 ≤ 2秒
- 拖拽和滑块调节时渲染帧率 ≥ 50fps
- 导出PNG响应时间 < 1秒
