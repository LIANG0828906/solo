## 1. 架构设计

```mermaid
flowchart TD
    "index.html 入口" --> "main.ts 主游戏循环"
    "main.ts 主游戏循环" --> "energySystem.ts 能量调配"
    "main.ts 主游戏循环" --> "gameObjects.ts 游戏对象"
    "main.ts 主游戏循环" --> "uiRenderer.ts UI渲染"
    "energySystem.ts 能量调配" --> "EnergyManager 类"
    "gameObjects.ts 游戏对象" --> "ObjectPool 类"
    "gameObjects.ts 游戏对象" --> "陨石/敌舰对象"
    "uiRenderer.ts UI渲染" --> "Canvas绘制"
    "uiRenderer.ts UI渲染" --> "脏矩形更新"
```

## 2. 技术说明

- 前端：TypeScript + HTML5 Canvas + Vite
- 初始化工具：Vite
- 后端：无
- 数据库：无
- 构建工具：Vite（支持TypeScript热更新）

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 游戏主页面（单页应用） |

## 4. 文件结构

```
├── package.json          # 依赖与脚本
├── vite.config.js        # Vite构建配置
├── tsconfig.json         # TypeScript配置
├── index.html            # 入口HTML
└── src/
    ├── main.ts           # 主游戏循环、Canvas初始化、交互事件、帧率控制
    ├── energySystem.ts   # EnergyManager类：总能量、分配比例、恢复/消耗速率
    ├── uiRenderer.ts     # UI渲染：背景、星点、能量面板、摇杆、粒子爆炸
    └── gameObjects.ts    # 游戏对象：陨石、敌舰、ObjectPool、碰撞检测
```

## 5. 核心类设计

### 5.1 EnergyManager（energySystem.ts）
- `totalEnergy: number` — 总能量值（默认100）
- `shield: number` — 护盾能量占比
- `engine: number` — 引擎能量占比
- `weapon: number` — 武器能量占比
- `allocateEnergy(joystickX, joystickY): void` — 摇杆坐标映射到分配比例
- `update(deltaTime): void` — 每帧更新能量消耗与恢复

### 5.2 ObjectPool（gameObjects.ts）
- `pool: GameObject[]` — 对象池
- `acquire(): GameObject` — 获取可用对象
- `release(obj): void` — 归还对象到池中

### 5.3 UIRenderer（uiRenderer.ts）
- `drawBackground(ctx): void` — 径向渐变背景+星点
- `drawEnergyPanels(ctx, energy): void` — 三块能量面板
- `drawJoystick(ctx, x, y): void` — 混合摇杆
- `drawInterceptButton(ctx): void` — 拦截按钮
- `drawExplosion(ctx, particles): void` — 爆炸粒子

### 5.4 主循环（main.ts）
- `init()` — 初始化Canvas与事件
- `gameLoop(timestamp)` — requestAnimationFrame主循环
- `handleInput()` — 摇杆与按钮输入
- `update(deltaTime)` — 协调各子系统更新
- `render()` — 调用UIRenderer绘制
