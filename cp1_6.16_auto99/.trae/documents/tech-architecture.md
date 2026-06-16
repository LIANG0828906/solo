## 1. 架构设计
本应用采用纯前端架构，基于React + TypeScript + Vite构建，使用Canvas API进行图像处理和矢量路径绘制。核心分为两大模块：图像处理与路径生成模块（负责算法实现）和用户交互模块（负责界面渲染和交互逻辑），通过zustand状态管理实现数据同步。

```mermaid
graph TD
    subgraph "用户交互层 (src/ui)"
        A["CanvasView.tsx"] -->|渲染/交互| B["画布渲染引擎"]
        C["PathPanel.tsx"] -->|操作| B
        D["App.tsx"] -->|组装| A
        D -->|组装| C
    end
    
    subgraph "核心算法层 (src/core)"
        E["edgeDetector.ts"] -->|边缘点| F["pathExtractor.ts"]
        F -->|路径数据| G["Bezier拟合器"]
    end
    
    subgraph "状态管理层 (src/store)"
        H["usePathStore.ts"] <-->|状态同步| A
        H <-->|状态同步| C
        H -->|调用| F
    end
    
    subgraph "外部输入输出"
        I["图片URL输入"] --> D
        J["SVG导出"] <-- D
    end
```

## 2. 技术描述
- 前端框架：React@18.2.0 + TypeScript@5.0.0
- 构建工具：Vite@5.0.0
- 状态管理：zustand@4.4.0 + immer@10.0.0
- 图像处理：HTML5 Canvas API + 自定义Sobel算子实现
- 路径算法：Ramer-Douglas-Peucker简化 + Bezier曲线拟合
- 唯一标识：uuid@9.0.0
- 样式方案：原生CSS + CSS Variables，无UI组件库
- 图标库：lucide-react@0.294.0

## 3. 目录结构
```
auto99/
├── src/
│   ├── core/                  # 核心算法模块
│   │   ├── edgeDetector.ts    # Sobel边缘检测
│   │   └── pathExtractor.ts   # 路径提取与Bezier拟合
│   ├── ui/                    # 用户界面模块
│   │   ├── CanvasView.tsx     # 画布组件（渲染+交互）
│   │   └── PathPanel.tsx      # 路径管理面板
│   ├── store/                 # 状态管理
│   │   └── usePathStore.ts    # 全局路径状态
│   ├── types/                 # 类型定义
│   │   └── index.ts           # 公共类型接口
│   ├── utils/                 # 工具函数
│   │   └── svgExport.ts       # SVG导出工具
│   ├── App.tsx                # 主应用组件
│   ├── main.tsx               # 入口文件
│   └── index.css              # 全局样式
├── package.json
├── vite.config.js
├── tsconfig.json
└── index.html
```

## 4. 核心数据结构
```typescript
// 坐标点
interface Point {
  x: number;
  y: number;
}

// Bezier曲线节点
interface BezierNode extends Point {
  id: string;
  controlIn?: Point;   // 入控制点
  controlOut?: Point;  // 出控制点
}

// 矢量路径
interface VectorPath {
  id: string;
  nodes: BezierNode[];
  color: string;       // 显示颜色
  length: number;      // 路径长度
  isClosed: boolean;   // 是否闭合
  thumbnail?: string;  // 缩略图dataURL
}

// 应用状态
interface PathState {
  paths: VectorPath[];
  selectedPathId: string | null;
  hoveredNodeId: string | null;
  draggingNodeId: string | null;
  imageUrl: string | null;
  imageTransform: {
    x: number;
    y: number;
    scale: number;
  };
  isProcessing: boolean;
}
```

## 5. 核心算法流程

### 5.1 Sobel边缘检测
1. 加载图像到离屏Canvas，获取ImageData像素数据
2. 灰度化处理：`gray = 0.299*R + 0.587*G + 0.114*B`
3. 应用Sobel算子计算梯度：
   - Gx = [[-1,0,1],[-2,0,2],[-1,0,1]]
   - Gy = [[-1,-2,-1],[0,0,0],[1,2,1]]
4. 梯度幅值：`mag = sqrt(Gx² + Gy²)`
5. 阈值分割（默认阈值100，可配置），输出边缘点坐标数组

### 5.2 路径提取与拟合
1. 轮廓跟踪：从边缘点中提取独立连续轮廓
2. RDP算法简化：设置epsilon阈值，去除冗余点
3. Bezier拟合：使用切线法估计控制点，生成三次Bezier曲线
4. 路径长度计算：基于曲线积分估算

### 5.3 节点拖拽实时更新
1. mousedown 捕获拖拽节点ID
2. mousemove 实时更新节点坐标
3. 使用相邻节点重新计算控制点，保证曲线平滑
4. requestAnimationFrame 确保60FPS渲染
5. mouseup 更新路径状态，触发重渲染

## 6. 性能优化策略
- 离屏Canvas预处理图像数据，避免阻塞主线程
- Web Worker 处理边缘检测和路径生成（可选，针对大图像）
- requestAnimationFrame 统一调度渲染
- 增量更新：仅重绘修改的路径段
- 节点热区检测使用空间分区（网格索引）
- 路径缩略图缓存，避免重复生成

## 7. 响应式布局实现
- 使用CSS Grid + Flexbox混合布局
- 媒体查询断点：`@media (max-width: 1200px)` 和 `@media (max-width: 800px)`
- Canvas尺寸动态计算：`ResizeObserver` 监听容器变化
- 触摸设备检测：`navigator.maxTouchPoints > 0` 增大节点热区

## 8. 接口定义
```typescript
// edgeDetector.ts
export function detectEdges(imageData: ImageData, threshold: number): Point[];

// pathExtractor.ts
export function extractPaths(edgePoints: Point[], rdpEpsilon: number): VectorPath[];
export function refitPath(nodes: BezierNode[], closed: boolean): BezierNode[];

// usePathStore.ts
export const usePathStore = create<PathState & {
  setImage: (url: string) => void;
  generatePaths: () => Promise<void>;
  selectPath: (id: string | null) => void;
  deletePath: (id: string) => void;
  clearPaths: () => void;
  updateNode: (pathId: string, nodeId: string, pos: Point) => void;
  setHoveredNode: (nodeId: string | null) => void;
  setDraggingNode: (nodeId: string | null) => void;
  setImageTransform: (t: Partial<{x:number; y:number; scale:number}>) => void;
  exportSVG: () => string;
}>()
```
