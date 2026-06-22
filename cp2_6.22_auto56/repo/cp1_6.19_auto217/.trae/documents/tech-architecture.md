## 1. 架构设计

```mermaid
flowchart TD
    subgraph "前端层"
        A["React + TypeScript + Vite"]
        B["Zustand 状态管理"]
        C["Framer Motion 动画"]
    end
    subgraph "组件层"
        D["LeftPanel 组件面板"]
        E["CanvasArea 画布区"]
        F["RightPanel 动作面板"]
        G["EditModal 编辑弹窗"]
    end
    subgraph "数据层"
        H["componentStore 状态仓库"]
        I["localStorage 持久化"]
        J["JSON 导出工具"]
    end
    A --> D
    A --> E
    A --> F
    A --> G
    D --> B
    E --> B
    F --> B
    G --> B
    B --> H
    H --> I
    H --> J
    E --> C
    F --> C
    G --> C
```

## 2. 技术说明

- 前端：React 18 + TypeScript + Vite
- 状态管理：Zustand（轻量级全局状态，支持持久化中间件）
- 动画：Framer Motion（组件过渡、拖拽、模态动画）
- 初始化工具：vite-init（react-ts 模板）
- 后端：无（纯前端应用）
- 数据存储：localStorage（组件库持久化）
- 依赖：react、react-dom、vite、@vitejs/plugin-react、typescript、@types/react、@types/react-dom、zustand、framer-motion、uuid

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 主工作台页面，包含组件面板、画布、动作面板 |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    ComponentItem ||--o{ CanvasComponent : "拖入画布"
    PoseTemplate ||--o{ ComponentPose : "包含"
    ComponentItem {
        string id
        string name
        string category
        string svgPath
        string color
        number width
        number height
    }
    CanvasComponent {
        string id
        string componentId
        number x
        number y
        number scale
        number rotation
        boolean flipH
        boolean flipV
        string color
    }
    PoseTemplate {
        string id
        string name
        string thumbnail
    }
    ComponentPose {
        string poseId
        string componentId
        number x
        number y
        number scale
        number rotation
    }
```

### 4.2 数据定义

```typescript
interface ComponentItem {
  id: string;
  name: string;
  category: 'head' | 'torso' | 'limbs' | 'accessories';
  svgPath: string;
  color: string;
  width: number;
  height: number;
}

interface CanvasComponent {
  id: string;
  componentId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
  flipH: boolean;
  flipV: boolean;
  color: string;
}

interface PoseTemplate {
  id: string;
  name: string;
  thumbnail: string;
  components: ComponentPose[];
}

interface ComponentPose {
  canvasComponentId: string;
  x: number;
  y: number;
  scale: number;
  rotation: number;
}
```

## 5. 文件结构

```
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
└── src/
    ├── App.tsx                    # 主布局与三栏面板
    ├── main.tsx                   # 入口文件
    ├── store/
    │   └── componentStore.ts      # Zustand 状态管理
    ├── components/
    │   ├── LeftPanel.tsx          # 组件分类面板与拖拽初始化
    │   ├── CanvasArea.tsx         # 画布渲染、拖拽与缩放、动作过渡
    │   ├── RightPanel.tsx         # 动作卡片列表
    │   └── EditModal.tsx          # 模态编辑面板
    └── utils/
        └── export.ts              # 导出JSON逻辑
```
