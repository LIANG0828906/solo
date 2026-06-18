## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        "App.tsx<br/>主应用入口"
        "ControlPanel.tsx<br/>UI交互控制"
        "CityScene.tsx<br/>3D场景渲染"
        "Building.tsx<br/>建筑组件"
    end
    subgraph "核心层"
        "cityGenerator.ts<br/>城市数据生成"
        "eventBus.ts<br/>事件总线"
    end
    "ControlPanel.tsx" -->|"滑块数据"| "eventBus.ts"
    "eventBus.ts" -->|"建筑数据"| "CityScene.tsx"
    "eventBus.ts" -->|"建筑数据"| "Building.tsx"
    "cityGenerator.ts" -->|"生成布局"| "eventBus.ts"
    "App.tsx" --> "CityScene.tsx"
    "App.tsx" --> "ControlPanel.tsx"
```

## 2. 技术说明

- 前端：React@18 + TypeScript + Three.js + @react-three/fiber + @react-three/drei
- 状态管理：zustand
- 构建工具：Vite + @vitejs/plugin-react
- UI库：leva（滑块控制）、react-icons（图标）、react-hot-toast（通知）
- 初始化工具：vite-init（react-ts模板）
- 无后端、无数据库

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 单页应用，包含3D城市场景和控制面板 |

## 4. 模块通信机制

事件总线（eventBus.ts）负责模块间解耦通信：

| 事件名 | 数据 | 发布者 | 订阅者 |
|--------|------|--------|--------|
| ZONE_INTENSITY_CHANGE | {commercial: number, residential: number, industrial: number} | ControlPanel | cityGenerator |
| GROWTH_SPEED_CHANGE | {speed: number} | ControlPanel | CityScene/Building |
| CITY_DATA_UPDATE | BuildingData[] | cityGenerator | CityScene |
| RESET_CITY | null | ControlPanel | CityScene/Building |
| BUILDING_CLICK | {buildingId: string, position: Vector3, data: BuildingData} | Building | App(信息卡) |

## 5. 数据模型

### 5.1 核心类型定义

```typescript
interface BuildingData {
  id: string;
  x: number;
  z: number;
  type: 'commercial' | 'residential' | 'industrial';
  targetHeight: number;
  currentHeight: number;
  color: [number, number, number];
  zone: { row: number; col: number };
}
```

### 5.2 元胞自动机规则

- 50x50网格初始化：中心区域倾向商业，外围倾向工业，中间层倾向住宅
- 邻居规则：每个格子检查8邻域，若同类≥5则保持，否则可能转换
- 开发强度映射：滑块值→建筑密度（有建筑格子占比）和高度上限
- 商业区高度上限：10-80单位，住宅区：6-30单位，工业区：4-20单位

## 6. 性能策略

- InstancedMesh渲染2500个建筑（单次draw call）
- 粒子系统BufferGeometry + PointsMaterial，总数≤200
- 建筑动画通过更新InstancedMesh矩阵实现，非逐对象
- 使用useFrame钩子统一更新动画帧
