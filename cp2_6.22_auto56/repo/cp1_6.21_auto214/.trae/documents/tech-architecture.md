## 1. 架构设计

```mermaid
graph TD
    "App.tsx (主组件 + useReducer 状态管理)" --> "StyleEditor.tsx (样式编辑 + 拖拽排序)"
    "App.tsx" --> "AnimationPreview.tsx (预览区 + 播放控制 + rAF)"
    "App.tsx" --> "CodePreview.tsx (代码生成 + 高亮 + 复制)"
    "presets.ts (预设数据)" --> "App.tsx"
    "StyleEditor.tsx" --> "@hello-pangea/dnd (拖拽库)"
    "AnimationPreview.tsx" --> "requestAnimationFrame (动画驱动)"
```

## 2. 技术栈说明

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **状态管理**：React useReducer（集中管理步骤列表、播放状态、预设加载状态）
- **拖拽排序**：@hello-pangea/dnd
- **无后端、无数据库**，纯前端单页应用

### 2.1 依赖包

| 包名 | 用途 |
|-----|------|
| react, react-dom | UI 框架 |
| typescript | 类型安全 |
| vite | 构建工具 |
| @vitejs/plugin-react | Vite React 插件 |
| @hello-pangea/dnd | 关键帧步骤拖拽排序 |

## 3. 文件结构

```
auto214/
├── index.html
├── package.json
├── vite.config.js
├── tsconfig.json
└── src/
    ├── App.tsx              # 主组件：三列布局 + useReducer 全局状态
    ├── AnimationPreview.tsx # 预览区：播放/暂停/重置/速度/进度条
    ├── StyleEditor.tsx      # 编辑面板：属性选择/值输入/增删改/拖拽排序
    ├── CodePreview.tsx      # 代码预览：@keyframes 生成 + 语法高亮 + 复制
    └── presets.ts           # 预设动画模板数据
```

## 4. 核心数据模型

```typescript
type AnimationProperty =
  | 'transform'
  | 'opacity'
  | 'filter'
  | 'clip-path'
  | 'border-radius'
  | 'background-color';

interface AnimationStep {
  id: string;
  percentage: number;     // 0-100
  property: AnimationProperty;
  value: string;          // 如 rotate(360deg), 0.5, blur(8px)
}

interface AnimationPreset {
  name: string;
  steps: AnimationStep[];
  duration: number;       // 秒
}

interface AppState {
  steps: AnimationStep[];
  isPlaying: boolean;
  speed: number;          // 1x - 3x
  duration: number;       // 默认 2s
  activePreset: string | null;
}
```

## 5. 关键实现要点

### 5.1 动画播放（AnimationPreview）
- 使用 `requestAnimationFrame` 驱动，基于时间戳计算进度
- 动态注入 `<style>` 标签或使用 CSS-in-JS 生成 @keyframes
- 播放/暂停通过 `animationPlayState` CSS 属性控制
- 速度通过 `animationDuration = baseDuration / speed` 实现
- 进度条：`width = (currentTime / totalDuration) * 100%`

### 5.2 拖拽排序（StyleEditor）
- 使用 `@hello-pangea/dnd` 的 `<DragDropContext>`、`<Droppable>`、`<Draggable>`
- 拖拽时卡片样式：`transform: scale(0.95)` + `transition: 0.15s`
- 拖拽完成后重排数组并更新各步骤的 percentage（均匀分布）

### 5.3 代码生成（CodePreview）
- `crypto.randomUUID()` 生成唯一动画名（如 `anim-a1b2c3d4`）
- 将多个同百分比的属性合并到一个关键帧块
- 语法高亮：属性名用 `<span style="color:#82AAFF">`，属性值用 `<span style="color:#C3E88D">`
- 复制：`navigator.clipboard.writeText()` + toast 提示 2s

### 5.4 导入导出
- 导出：`JSON.stringify(state)` → Blob → URL.createObjectURL → `<a download>`
- 导入：隐藏 `<input type="file" accept=".json">` → FileReader → JSON.parse → dispatch 恢复

## 6. 性能优化
- 关键帧步骤变化时使用 `useMemo` 缓存生成的 CSS 字符串
- 动画播放使用 CSS 原生动画而非 JS 逐帧修改样式
- 预览更新通过 `useEffect` 依赖数组精确控制，避免不必要的重渲染
- 拖拽操作使用库的原生优化，不触发整棵树重渲染
