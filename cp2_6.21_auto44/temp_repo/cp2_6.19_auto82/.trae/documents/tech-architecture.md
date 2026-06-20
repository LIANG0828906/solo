## 1. 架构设计

```mermaid
graph TB
    subgraph "前端 (Browser)"
        "App.tsx<br/>状态管理 + 布局组合"
        "colorExtractor.ts<br/>CSS解析模块"
        "forceLayout.ts<br/>力导向布局引擎"
        "graphCanvas.ts<br/>Canvas渲染模块"
        "ThemePanel.tsx<br/>主题重构面板"
    end

    "用户CSS输入" --> "App.tsx"
    "App.tsx" --> "colorExtractor.ts"
    "colorExtractor.ts" --> "结构化颜色数据"
    "结构化颜色数据" --> "forceLayout.ts"
    "结构化颜色数据" --> "ThemePanel.tsx"
    "forceLayout.ts" --> "布局坐标数据"
    "布局坐标数据" --> "graphCanvas.ts"
    "graphCanvas.ts" --> "Canvas画布渲染"
    "ThemePanel.tsx" --> "颜色替换操作"
    "颜色替换操作" --> "App.tsx"
```

## 2. 技术说明

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite + @vitejs/plugin-react
- **力导向算法**：d3-force（d3-force-3d无需，仅用d3-force）
- **唯一标识**：uuid
- **状态管理**：React useState/useReducer（按需求约束）
- **样式方案**：CSS Modules / 内联样式（Canvas渲染为主，少量UI用CSS）
- **无后端**：所有数据处理在浏览器端完成

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 单页应用，所有功能在一个页面中完成 |

## 4. 数据流向

```
用户CSS输入
    ↓
colorExtractor.ts → {selector, color, lineNum}[]
    ↓                           ↓
forceLayout.ts              ThemePanel.tsx
    ↓                           ↓
{nodes[], edges[]}          颜色替换指令
    ↓                           ↓
graphCanvas.ts → Canvas渲染 ← App.tsx状态更新
                                  ↓
                            导出新CSS文件
```

### 4.1 核心数据类型

```typescript
interface ColorEntry {
  selector: string;
  color: string;
  lineNum: number;
}

interface GraphNode {
  id: string;
  type: 'color' | 'selector';
  label: string;
  color?: string;
  usageCount: number;
  x: number;
  y: number;
  radius: number;
}

interface GraphEdge {
  source: string;
  target: string;
  lineNum: number;
  count: number;
}

interface ReplaceAction {
  oldColor: string;
  newColor: string;
}
```

## 5. 文件结构与调用关系

```
项目根目录/
├── package.json                    # 依赖: react, react-dom, d3-force, uuid, typescript, vite, @vitejs/plugin-react
├── index.html                      # 入口页面，root挂载点
├── vite.config.js                  # 构建配置，React插件
├── tsconfig.json                   # 严格模式，ES2020模块
└── src/
    ├── main.tsx                    # 入口，渲染App到root
    ├── App.tsx                     # 主组件：状态管理、组合模块、文件上传区、弹性布局
    ├── parser/
    │   └── colorExtractor.ts       # CSS解析：正则提取颜色+选择器 → ColorEntry[]
    ├── graph/
    │   └── forceLayout.ts          # 力导向布局：d3-force计算 → nodes[] + edges[]
    ├── renderer/
    │   └── graphCanvas.ts          # Canvas渲染：绘制节点、边、动画、交互
    └── components/
        └── ThemePanel.tsx          # 主题面板：颜色列表、批量替换、导出报告
```

### 调用关系

- `App.tsx` → 调用 `colorExtractor.ts` 解析CSS
- `App.tsx` → 将解析结果传给 `forceLayout.ts` 计算布局
- `App.tsx` → 将布局数据传给 `graphCanvas.ts` 渲染
- `App.tsx` → 将解析结果传给 `ThemePanel.tsx` 展示
- `ThemePanel.tsx` → 用户替换操作回调 → `App.tsx` 更新状态 → 重新触发布局和渲染
- `graphCanvas.ts` → 用户交互事件（点击/悬停/拖拽）→ 回调通知 `App.tsx`

## 6. 性能策略

- CSS解析：正则匹配 + 单次遍历，1000行内200ms完成
- 力导向布局：d3-force simulation，100节点内30fps以上
- 批量替换后重渲染：增量更新布局数据，100ms内完成
- Canvas渲染：requestAnimationFrame驱动，避免不必要重绘
