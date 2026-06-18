## 1. 架构设计

```mermaid
flowchart TD
    subgraph "前端 (React + TypeScript)"
        A["App.tsx - 主容器状态管理"]
        B["UndergroundScene.tsx - 3D场景"]
        C["ControlPanel.tsx - 控制面板UI"]
        D["undergroundData.ts - 模拟数据"]
        E["管线详情弹窗组件"]
        F["悬浮标签组件"]
    end
    subgraph "3D渲染层 (Three.js + R3F)"
        G["地层几何体 (分层Box)"]
        H["管线几何体 (合并Cylinders)"]
        I["裁剪平面 (Clipping Planes)"]
        J["发光边界线"]
    end
    subgraph "数据层"
        K["管线坐标数组"]
        L["地层分界数据"]
        M["管线属性数据"]
    end
    A --> B
    A --> C
    A --> E
    B --> G
    B --> H
    B --> I
    B --> J
    B --> F
    D --> K
    D --> L
    D --> M
    K --> H
    L --> G
```

## 2. 技术说明
- **前端框架**：React@18 + TypeScript
- **3D引擎**：three@0.160 + @react-three/fiber@8 + @react-three/drei@9
- **构建工具**：Vite@5 + @vitejs/plugin-react@4
- **UI增强**：react-hot-toast@2（提示反馈）、react-icons@5（图标）
- **初始化方式**：Vite react-ts模板
- **后端**：无，纯前端应用，使用模拟数据

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 主页面，包含完整3D场景和控制面板 |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    PIPELINE {
        string id "管线ID"
        string type "管线类型: water/drain/gas/power/telecom"
        string name "管线名称"
        string material "材质: 连续铸铁/球墨铸铁/PVC/钢管"
        number installYear "安装年份"
        number totalLength "全长(米)"
        string lastInspection "最近检修日期"
        string status "状态: normal/repair/abandoned"
        Point3D[] points "三维坐标点数组"
        number diameter "直径(米)"
        number[] depthRange "埋深范围[min, max]"
    }
    STRATUM {
        string id "地层ID"
        string name "地层名称"
        number[] depthRange "深度范围[top, bottom]"
        string color "颜色HEX"
        number opacity "透明度"
        string textureLabel "材质标签"
    }
```

### 4.2 数据结构说明
- **管线数据**：每条管线由多个三维坐标点[x,y,z]组成路径，y轴表示深度（向下为正），直径随深度变化0.08-0.15米
- **地层数据**：共5层（地表植被+4层地下），每层定义深度范围、颜色、透明度和材质标签
- **管线类型映射**：water(#3B82F6蓝色)、drain(#10B981绿色)、gas(#F59E0B黄色)、power(#EF4444红色)、telecom(#F97316橙色)

## 5. 项目文件结构
```
auto76/
├── package.json
├── index.html
├── tsconfig.json
├── vite.config.ts
└── src/
    ├── App.tsx              # 主应用容器，状态管理中心
    ├── main.tsx             # 应用入口
    ├── index.css            # 全局样式
    ├── Scenes/
    │   └── UndergroundScene.tsx  # 3D地下场景
    ├── Components/
    │   ├── ControlPanel.tsx      # 控制面板
    │   ├── PipelineDetail.tsx    # 管线详情弹窗
    │   └── HoverLabel.tsx        # 悬浮标签
    └── Data/
        └── undergroundData.ts    # 模拟数据
```
