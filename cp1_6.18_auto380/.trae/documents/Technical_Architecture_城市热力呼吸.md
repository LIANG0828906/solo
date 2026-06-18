## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层"
        A["React 18 + TypeScript"] --> B["Vite 构建工具"]
        A --> C["Zustand 状态管理"]
        A --> D["Three.js 3D渲染"]
        D --> E["@react-three/fiber 渲染器"]
        D --> F["@react-three/drei 工具集"]
    end
    subgraph "数据层"
        G["dataGenerator.ts 模拟数据"] --> H["城市坐标/碳排放/区域类型"]
    end
    subgraph "组件层"
        I["App.tsx 根组件"] --> J["CityMap.tsx 3D场景"]
        I --> K["InfoPanel.tsx 信息面板"]
        I --> L["Timeline 时间轴"]
        J --> M["HeatColumn 热力柱"]
        J --> N["ParticleSystem.tsx 粒子系统"]
    end
    subgraph "状态层"
        O["cityStore.ts Zustand"] --> P["城市列表/选中区域/时间轴数据"]
    end
```

## 2. 技术描述
- 前端: React@18 + TypeScript@5 + Vite@5
- 3D引擎: three@0.160 + @react-three/fiber@8 + @react-three/drei@9
- 状态管理: zustand@4
- 工具库: uuid@9
- 数据: 纯前端模拟数据，无需后端服务

## 3. 目录结构
```
d:\Pro\tasks\auto380
├── package.json
├── index.html
├── tsconfig.json
├── vite.config.js
└── src
    ├── main.tsx
    ├── App.tsx
    ├── store
    │   └── cityStore.ts
    ├── components
    │   ├── CityMap.tsx
    │   ├── ParticleSystem.tsx
    │   └── InfoPanel.tsx
    └── utils
        └── dataGenerator.ts
```

## 4. 核心数据模型

### 4.1 数据模型定义
```mermaid
erDiagram
    CITY {
        string id "城市/区域ID"
        string name "区域名称"
        number x "X坐标"
        number z "Z坐标"
        string type "区域类型: 商业/工业/住宅/交通"
        number[] emissions "24小时碳排放量数组"
    }
    SELECTED_CITY {
        string id "选中城市ID"
        number hour "当前小时"
    }
```

### 4.2 TypeScript类型定义
```typescript
interface City {
  id: string;
  name: string;
  x: number;
  z: number;
  type: 'commercial' | 'industrial' | 'residential' | 'transport';
  emissions: number[]; // 24小时数据
}

interface CityStore {
  cities: City[];
  selectedCityId: string | null;
  currentHour: number;
  setSelectedCity: (id: string | null) => void;
  setCurrentHour: (hour: number) => void;
  getCityEmission: (cityId: string) => number;
}

interface ParticleData {
  id: string;
  cityId: string;
  angle: number;
  radius: number;
  height: number;
  speed: number;
}
```

## 5. 性能优化策略
| 优化点 | 策略 | 目标 |
|--------|------|------|
| 粒子数量 | 限制最大300个，使用BufferGeometry | 帧率≥40FPS |
| 热力柱数量 | 限制最大30个，复用几何体 | 交互延迟<50ms |
| 渲染优化 | 使用InstancedMesh批量渲染热力柱 | 降低Draw Call |
| 动画优化 | 使用useFrame节流，requestAnimationFrame | 平滑60fps动画 |
| 材质复用 | 共享材质实例，避免重复创建 | 减少内存占用 |
