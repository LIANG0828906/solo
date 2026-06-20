## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        "App.tsx" --> "FontInput.tsx"
        "App.tsx" --> "StyleSelector.tsx"
        "App.tsx" --> "CanvasRenderer.tsx"
    end
    subgraph "状态层"
        "Zustand Store" --> "text: string"
        "Zustand Store" --> "style: FontEffectType"
        "Zustand Store" --> "exportState: ExportState"
    end
    subgraph "工具层"
        "fontEffects.ts" --> "NeonEffect"
        "fontEffects.ts" --> "PixelEffect"
        "fontEffects.ts" --> "HandwrittenEffect"
        "fontEffects.ts" --> "Relief3DEffect"
        "fontEffects.ts" --> "GlitchEffect"
    end
    "FontInput.tsx" --> "Zustand Store"
    "StyleSelector.tsx" --> "Zustand Store"
    "CanvasRenderer.tsx" --> "Zustand Store"
    "CanvasRenderer.tsx" --> "fontEffects.ts"
```

## 2. 技术说明

- **前端**：React 18 + TypeScript + Vite + Zustand
- **初始化工具**：vite-init (react-ts模板)
- **后端**：无
- **数据库**：无
- **样式方案**：CSS Modules + 内联样式（深色主题自定义性强）
- **Canvas渲染**：Canvas 2D API绘制文字特效
- **状态管理**：Zustand（轻量级，管理文本、样式、导出状态）

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 主页面，包含输入区、样式选择器和画布渲染 |

## 4. 文件结构

```
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
└── src/
    ├── App.tsx
    ├── components/
    │   ├── FontInput.tsx
    │   ├── StyleSelector.tsx
    │   └── CanvasRenderer.tsx
    └── utils/
        └── fontEffects.ts
```

## 5. 核心数据类型

```typescript
type FontEffectType = 'neon' | 'pixel' | 'handwritten' | 'relief3d' | 'glitch';

interface FontEffect {
  draw(ctx: CanvasRenderingContext2D, text: string, x: number, y: number): void;
}

interface AppState {
  text: string;
  style: FontEffectType;
  exportState: 'idle' | 'loading' | 'success';
  setText: (text: string) => void;
  setStyle: (style: FontEffectType) => void;
  setExportState: (state: 'idle' | 'loading' | 'success') => void;
}
```

## 6. 性能策略

- **防抖**：输入文本使用100ms防抖，确保按键到画布更新延迟<50ms
- **Canvas重绘**：仅在text或style变化时重绘，使用requestAnimationFrame
- **过渡动画**：样式切换时画布opacity淡入淡出0.3s，确保30fps+
- **导出**：创建独立2x分辨率画布绘制后导出，不影响预览画布
