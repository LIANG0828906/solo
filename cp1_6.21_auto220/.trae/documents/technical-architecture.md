## 1. 架构设计

```mermaid
graph TD
    A["App.tsx (主组件)
    B["Editor.tsx (编辑面板)"]
    C["Preview.tsx (预览区)"]
    D["themeEngine.ts (颜色引擎)"]
    E["types.ts (类型定义)"]
    
    A --> B
    A --> C
    B --> D
    C --> D
    B --> E
    C --> E
    A --> E
```

## 2. 技术说明

- **前端框架**：React@18 + TypeScript@5 + Vite@5
- **初始化工具**：Vite
- **后端**：无（纯前端应用）
- **数据持久化**：localStorage 存储已保存主题
- **状态管理**：React useState/useCallback（轻量级应用，无需额外状态管理库）

## 3. 文件结构

| 文件 | 用途 |
|-----|------|
| package.json | 项目依赖和脚本 |
| index.html | 入口页面 |
| vite.config.js | Vite构建配置 |
| tsconfig.json | TypeScript配置 |
| src/App.tsx | 主组件，分栏布局和拖拽逻辑 |
| src/Editor.tsx | 主题编辑面板组件 |
| src/Preview.tsx | UI预览组件 |
| src/themeEngine.ts | 颜色处理工具函数 |
| src/types.ts | 类型定义和预置主题数据 |

## 4. 核心类型定义

```typescript
interface ColorTheme {
  name: string;
  primary: string;
  secondary: string;
  background: string;
  text: string;
  accent: string;
}

interface ColorVariants {
  light20: string;
  light40: string;
  light60: string;
  dark20: string;
  dark40: string;
  complementary: string;
}
```

## 5. 主题引擎核心功能

| 函数 | 功能 |
|-----|-----|
| `generateVariants(color) | 生成颜色的浅色/深色变体和补色 |
| `hexToRgb(hex)` | HEX转RGB |
| `rgbToHex(r, g, b)` | RGB转HEX |
| `adjustBrightness(hex, percent)` | 调整颜色亮度 |
| `setOpacity(hex, opacity)` | 设置颜色透明度 |
| `getComplementary(hex)` | 获取180度补色 |
| `themeToJSON(theme)` | 主题转JSON格式 |
| `exportThemeJSON(theme)` | 导出主题JSON文件 |
