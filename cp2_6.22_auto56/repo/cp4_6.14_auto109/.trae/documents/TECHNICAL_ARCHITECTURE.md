## 1. 架构设计

```mermaid
graph TD
    "main.tsx" --> "App组件"
    "App组件" --> "DesignTokensContext.Provider"
    "DesignTokensContext.Provider" --> "TokenEditor模块"
    "DesignTokensContext.Provider" --> "ComponentPreview模块"
    "ComponentPreview模块" --> "cssVarGenerator工具"
    "TokenEditor模块" --> "更新Context状态"
    "更新Context状态" --> "ComponentPreview模块"
```

## 2. 技术描述

- 前端框架：React@18 + TypeScript
- 构建工具：Vite
- 状态管理：React Context（DesignTokensContext）
- 图标库：lucide-react
- 样式方案：原生CSS + CSS变量 + 内联样式（动态令牌）
- 无后端、无数据库，纯前端应用

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 主页面，包含令牌编辑面板与组件预览区域 |

## 4. 数据模型

### 4.1 设计令牌类型定义

```typescript
interface ColorTokens {
  primary: string;
  accent: string;
  background: string;
  text: string;
}

interface SpacingTokens {
  xs: number;
  s: number;
  m: number;
  l: number;
  xl: number;
}

interface FontTokens {
  heading: 'serif' | 'sans-serif' | 'monospace';
  body: 'serif' | 'sans-serif' | 'monospace';
}

interface ShadowTokens {
  sm: number;
  md: number;
  lg: number;
}

interface DesignTokens {
  colors: ColorTokens;
  spacing: SpacingTokens;
  fonts: FontTokens;
  shadows: ShadowTokens;
}
```

## 5. 文件结构与调用关系

```
src/
├── main.tsx                          # React入口，渲染App（被index.html引用）
├── App.tsx                           # 根组件，布局容器，包裹Provider（被main.tsx引用）
├── context/
│   └── DesignTokensContext.tsx       # Context定义与Provider（被App.tsx、TokenEditor、ComponentPreview引用）
├── modules/
│   ├── token-editor/
│   │   ├── TokenEditor.tsx           # 令牌编辑面板（被App.tsx引用）
│   │   ├── ColorGroup.tsx            # 颜色分组（被TokenEditor引用）
│   │   ├── SpacingGroup.tsx          # 间距分组（被TokenEditor引用）
│   │   ├── FontGroup.tsx             # 字体分组（被TokenEditor引用）
│   │   ├── ShadowGroup.tsx           # 阴影分组（被TokenEditor引用）
│   │   └── ColorPicker.tsx           # 取色器组件（被ColorGroup引用）
│   └── component-preview/
│       ├── ComponentPreview.tsx      # 预览容器（被App.tsx引用）
│       ├── PreviewButton.tsx         # 按钮预览组件（被ComponentPreview引用）
│       ├── PreviewCard.tsx           # 卡片预览组件（被ComponentPreview引用）
│       ├── PreviewNavbar.tsx         # 导航栏预览组件（被ComponentPreview引用）
│       └── ExportModal.tsx           # 导出模态框（被ComponentPreview引用）
└── utils/
    ├── cssVarGenerator.ts            # 令牌转CSS变量（被ComponentPreview引用）
    └── contrastChecker.ts            # WCAG对比度计算（被ColorGroup引用）
```

## 6. 数据流向

1. **TokenEditor → Context**：用户输入 → 调用 `updateTokens` → `DesignTokensContext` state 更新
2. **Context → ComponentPreview**：Context state 变化 → `useContext` 订阅方重新渲染 → `cssVarGenerator` 生成CSS变量 → 组件样式更新
3. **导出流程**：点击导出按钮 → 从 Context 读取当前 tokens → JSON.stringify → 展示在模态框中
4. **重置流程**：点击重置 → 调用 `resetTokens` → Context 恢复为 DEFAULT_TOKENS → 所有预览组件 0.3s 动画过渡
