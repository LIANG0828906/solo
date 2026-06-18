## 1. 架构设计

```mermaid
graph TD
    A["React App"] --> B["Zustand Store"]
    A --> C["Canvas Renderer"]
    B --> D["Game State"]
    C --> E["Map Generator"]
    C --> F["Sonar System"]
    C --> G["Entity System"]
    C --> H["Audio System"]
    D --> I["Player"]
    D --> J["Monsters"]
    D --> K["Sonar Waves"]
    D --> L["Markers"]
    D --> M["Darts"]
    E --> N["Perlin Noise"]
    F --> O["Collision Detection"]
    G --> P["Monster AI"]
    G --> Q["Tracking Dart"]
    H --> R["Web Audio API"]
```

## 2. 技术说明
- 前端：React 18 + TypeScript + Vite
- 状态管理：Zustand
- 渲染：Canvas 2D API
- 音效：Web Audio API
- 构建工具：Vite

## 3. 路由定义
| 路由 | 用途 |
|-----|-----|
| / | 游戏主界面 |

## 4. 数据模型
### 4.1 数据模型定义

```mermaid
erDiagram
    PLAYER {
        number x
        number y
        number lives
        boolean invincible
        number invincibleTimer
    }
    MONSTER {
        string id
        string type
        number x
        number y
        number vx
        number vy
        boolean marked
        number markTimer
        number state
        number speed
        number stateTimer
    }
    SONAR_WAVE {
        string id
        number x
        number y
        number radius
        number maxRadius
        number speed
        string color
    }
    DART {
        string id
        number x
        number y
        string targetId
    }
    MAP_ELEMENT {
        string type
        number x
        number y
        number width
        number height
    }
```

## 5. 文件结构
```
src/
├── game/
│   ├── store.ts       # Zustand状态管理
│   ├── map.ts       # 地图生成与碰撞检测
│   ├── sonar.ts     # 声波系统
│   ├── entities.ts  # 实体（怪物、飞镖）
│   └── renderer.ts # 渲染循环
├── App.tsx          # 根组件
└── main.tsx         # 入口文件
```
