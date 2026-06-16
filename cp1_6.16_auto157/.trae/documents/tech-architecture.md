## 1. 架构设计

```mermaid
graph TB
    subgraph "前端展示层"
        UI["controlPanel.ts<br/>左侧参数面板"]
        SCENE["roomScene.ts<br/>Three.js 3D场景"]
        HEAT["heatmapRenderer.ts<br/>Canvas 2D热力图"]
        WAVE["waveAnimation.ts<br/>声波扩散动画"]
    end

    subgraph "模拟计算层"
        PHYS["wavePhysics.ts<br/>波动方程与反射计算"]
    end

    subgraph "状态管理层"
        STORE["Zustand Store<br/>全局状态"]
    end

    subgraph "入口层"
        MAIN["main.ts<br/>应用初始化与绑定"]
    end

    MAIN --> UI
    MAIN --> SCENE
    MAIN --> HEAT
    UI --> STORE
    SCENE --> STORE
    HEAT --> PHYS
    WAVE --> SCENE
    SCENE --> PHYS
    UI --> SCENE
    UI --> HEAT
```

## 2. 技术说明
- 前端：TypeScript + Three.js + Canvas 2D + Zustand
- 构建工具：Vite（支持TypeScript）
- 状态管理：Zustand（管理元素列表、模拟状态等全局状态）
- 3D渲染：Three.js（场景初始化、元素管理、声波动画）
- 2D渲染：Canvas 2D API（热力图色阶映射与渲染）
- 依赖：three, @types/three, typescript, vite, zustand, uuid, lil-gui
- 无后端服务

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 单页面应用，所有功能在主页面完成 |

## 4. API定义
无后端API，所有计算在客户端完成。

## 5. 数据模型

### 5.1 数据模型定义

```mermaid
erDiagram
    SceneElement ||--o{ SoundSource : contains
    SceneElement ||--o{ Obstacle : contains
    SceneElement ||--o{ Absorber : contains
    SoundSource {
        string id
        number x
        number z
        number frequency
        number amplitude
    }
    Obstacle {
        string id
        number x
        number z
        number width
        number height
        number rotation
    }
    Absorber {
        string id
        number x
        number z
        number width
        number height
        number absorptionCoeff
    }
    SimulationResult {
        number[][] pressureField
        number maxSPL
        number minSPL
        number avgSPL
    }
```

### 5.2 数据定义

**全局状态（Zustand Store）**：
- `elements`: 场景元素数组（音源、障碍物、吸音棉）
- `isSimulating`: 模拟运行状态
- `simulationResult`: 当前模拟结果（声压场数据）

**元素类型**：
- `SoundSource`: { id, type:'source', x, z, frequency, amplitude }
- `Obstacle`: { id, type:'obstacle', x, z, width, depth, rotation }
- `Absorber`: { id, type:'absorber', x, z, width, depth, absorptionCoeff }

**模拟结果**：
- `pressureField`: 二维数组（声压级网格）
- `maxSPL`, `minSPL`, `avgSPL`: 统计摘要

**导出JSON格式**：
```json
{
  "timestamp": "ISO时间戳",
  "elements": [...],
  "simulationResult": {
    "pressureField": [[...]],
    "maxSPL": number,
    "minSPL": number,
    "avgSPL": number
  }
}
```
