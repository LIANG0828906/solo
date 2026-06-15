## 1. 架构设计

```mermaid
graph TB
    subgraph "前端渲染层"
        "App.tsx" --> "R3F Canvas"
        "R3F Canvas" --> "EarthModel"
        "R3F Canvas" --> "AuroraBelts"
        "R3F Canvas" --> "HeatmapOverlay"
        "R3F Canvas" --> "StationMarkers"
        "R3F Canvas" --> "StarField"
    end
    subgraph "UI层"
        "App.tsx" --> "ControlPanel"
        "App.tsx" --> "StationDetailPanel"
    end
    subgraph "状态管理层"
        "Zustand Store" --- "地磁数据"
        "Zustand Store" --- "极光坐标"
        "Zustand Store" --- "观测站状态"
        "Zustand Store" --- "控制参数"
    end
    subgraph "数据服务层"
        "GeomagneticService" --> "Zustand Store"
    end
```

## 2. 技术说明

- 前端：React@18 + TypeScript + Vite
- 3D渲染：Three@0.160 + @react-three/fiber@8 + @react-three/drei@9
- 状态管理：Zustand@4
- 初始化工具：vite-init (react-ts模板)
- 后端：无（内置JSON数据模拟）
- 数据库：无（内存中模拟数据）

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 主页面，包含三维场景与控制面板 |

## 4. 数据模型

### 4.1 核心类型定义

```typescript
interface GeomagneticData {
  kpIndex: number;
  timestamp: number;
  heatmapGrid: number[][]; // 20x20
  auroraCoordinates: AuroraPoint[];
}

interface AuroraPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface Station {
  id: string;
  name: string;
  lat: number;
  lng: number;
  status: 'normal' | 'warning' | 'critical';
  currentReading: number;
  history: { timestamp: number; value: number }[];
}

interface ControlState {
  isPlaying: boolean;
  simulationSpeed: number;
  auroraFilter: 'natural' | 'enhanced' | 'infrared';
  panelCollapsed: boolean;
  selectedStation: string | null;
}
```

## 5. 文件结构

```
src/
├── data/
│   └── GeomagneticService.ts    # 数据模拟服务，通过store.set更新数据
├── renderer/
│   ├── EarthModel.tsx           # 地球球体+着色器(经纬网格+大陆轮廓)
│   ├── AuroraBelts.tsx          # 极光环带粒子系统(Kp动态调整)
│   ├── HeatmapOverlay.tsx       # 20x20热力图(缓动过渡)
│   ├── StationMarkers.tsx       # 观测站标记+交互
│   └── StarField.tsx            # 星空粒子背景
├── components/
│   ├── ControlPanel.tsx         # 左侧控制面板
│   └── StationDetailPanel.tsx   # 观测站详情面板(含折线图)
├── store/
│   └── store.ts                 # Zustand store
├── App.tsx                      # 根组件
└── main.tsx                     # 入口
```
