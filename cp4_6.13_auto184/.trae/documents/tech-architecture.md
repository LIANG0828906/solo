## 1. 架构设计

```mermaid
flowchart TD
    "A[index.html 入口页面]" --> "B[main.ts 初始化调度]"
    "B" --> "C[parser.ts 代码解析器]"
    "B" --> "D[graph-manager.ts 图管理器]"
    "B" --> "E[renderer.ts Canvas 渲染器]"
    "B" --> "F[control-panel.ts 控制面板]"
    "C -->|节点和边数据| "D"
    "D -->|布局位置数据| "E"
    "F -->|布局切换/参数调整| "D"
    "D -->|导出请求| "G[JSON 文件下载]"
```

纯客户端架构，无后端服务。所有依赖解析、布局计算和渲染均在浏览器端完成。

## 2. 技术说明

- 前端：TypeScript + 原生 Canvas API + Vite
- 构建工具：Vite
- 包管理器：npm
- 无需后端、无需数据库
- 力导向布局算法：自实现（基于速度 Verlet 积分）
- 增量计算：requestAnimationFrame，每帧计算 1/5 节点

## 3. 文件结构

| 文件路径 | 职责 |
|---------|------|
| `package.json` | 项目依赖（typescript、vite）和脚本 |
| `vite.config.js` | Vite 配置，TypeScript 支持 |
| `tsconfig.json` | TypeScript 配置，strict 模式，target ES2020 |
| `index.html` | 入口 HTML 页面 |
| `src/main.ts` | 初始化 Canvas、控制面板 DOM 绑定、事件注册，调度 graph-manager 和 renderer |
| `src/parser.ts` | 解析 import/require/export 语句，返回节点和边列表 |
| `src/graph-manager.ts` | 管理节点位置、布局算法（力导向/同心圆/树状）、节点大小计算、导出 JSON |
| `src/renderer.ts` | Canvas 绘制节点、连接线、信息卡、动画过渡 |
| `src/control-panel.ts` | 生成侧边栏 DOM 元素，绑定滑块和按钮事件，回调通知 graph-manager |

## 4. 数据模型

### 4.1 节点数据结构

```typescript
interface DependencyNode {
  id: string;
  label: string;
  type: 'local' | 'third-party' | 'builtin';
  size: number;
  exports: string[];
  x: number;
  y: number;
  vx: number;
  vy: number;
  referencedBy: string[];
}
```

### 4.2 边数据结构

```typescript
interface DependencyEdge {
  source: string;
  target: string;
  type: 'local' | 'third-party' | 'builtin';
}
```

### 4.3 导出 JSON 格式

```typescript
interface ExportData {
  nodes: Array<{
    id: string;
    label: string;
    type: string;
    size: number;
    exports: string[];
  }>;
  edges: Array<{
    source: string;
    target: string;
    type: string;
  }>;
}
```

## 5. 核心算法

### 5.1 力导向布局

- 库仑斥力：节点间排斥力，与距离平方成反比
- 胡克引力：连接节点间吸引力，与距离成正比
- 阻尼系数：0.8，逐帧衰减速度
- 增量计算：每帧只计算 1/5 节点，5 帧完成全图

### 5.2 同心圆布局

- 按依赖层级（入度/出度）从内到外排列
- 内层为被依赖最多的模块

### 5.3 树状布局

- 从左到右展开，根节点为入口模块
- 子节点按依赖深度递归排列

## 6. 性能目标

- 100 个节点以内拖动和缩放帧率 ≥ 30fps
- 力导向布局使用 requestAnimationFrame 增量更新
- Canvas 仅重绘可见区域
