## 1. 架构设计

```mermaid
graph TD
    A["React UI层] --> B["Zustand Store
状态管理"]
    B --> C["物理引擎模块
纯函数"]
    A --> D["Canvas 2D渲染"]
    D --> E["球台绘制"]
    D --> F["球体绘制"]
    D --> G["特效绘制"]
```

## 2. 技术描述

- **前端框架**：React@18 + TypeScript
- **构建工具**：Vite
- **状态管理**：Zustand
- **渲染技术**：Canvas 2D
- **物理引擎**：自研纯函数物理模块
- **唯一ID生成**：uuid

## 3. 文件结构

```
d:\P\tasks\auto65/
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx          # React入口
    ├── App.tsx           # 根组件
    ├── game/
    │   ├── physics.ts    # 物理引擎模块
    │   └── types.ts      # 类型定义
    ├── store/
    │   └── gameStore.ts # Zustand状态管理
    └── ui/
        ├── GameBoard.tsx # Canvas游戏画布
        └── ScorePanel.tsx # 顶部计分面板
```

## 4. 数据模型

### 4.1 球 (Ball)
- id: string
- x: number (x坐标)
- y: number (y坐标)
- vx: number (x方向速度)
- vy: number (y方向速度)
- radius: number (半径)
- number: number (球号，0为母球)
- color: string (颜色)
- pocketed: boolean (是否入袋)

### 4.2 玩家 (Player)
- id: number
- name: string
- score: number
- lowBalls: number[] (已入袋的低分区球)
- highBalls: number[] (已入袋的高分区球)
- eightBallPocketed: boolean

### 4.3 游戏状态 (GameState)
- balls: Ball[]
- players: Player[]
- currentPlayer: number
- isAiming: boolean
- aimAngle: number
- power: number
- gamePhase: 'waiting' | 'aiming' | 'shooting' | 'moving' | 'gameOver'
- winner: number | null
- particles: Particle[]
- ripples: Ripple[]
- trail: Point[]

## 5. 物理引擎设计

### 5.1 核心功能
- 碰撞检测：球与球、球与库边
- 动量守恒：弹性碰撞计算
- 摩擦力：恒定减速度0.98
- 恢复系数：球与库边碰撞0.85
- 球袋检测：6个球袋位置

### 5.2 更新循环
- 物理更新频率60FPS
- 固定时间步长
- 球速阈值检测静止状态
