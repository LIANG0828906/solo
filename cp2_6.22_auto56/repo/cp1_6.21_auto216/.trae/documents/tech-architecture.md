## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        "React App" --> "GameCanvas组件"
        "React App" --> "HUD组件"
        "React App" --> "StartScreen组件"
        "React App" --> "GameOverScreen组件"
    end
    subgraph "游戏核心层"
        "GameEngine" --> "PlayerController"
        "GameEngine" --> "BulletManager"
        "GameEngine" --> "BarrageGenerator"
        "GameEngine" --> "CollisionDetector"
        "GameEngine" --> "ParticleSystem"
        "GameEngine" --> "ScoreManager"
    end
    subgraph "渲染层"
        "GameEngine" --> "Canvas Renderer"
    end
    "GameCanvas组件" --> "GameEngine"
    "GameEngine" -->|"状态回调"| "HUD组件"
```

## 2. 技术说明

- 前端：React@18 + TypeScript + Vite + Canvas 2D
- 初始化工具：vite-init (react-ts模板)
- 后端：无
- 数据库：无
- 状态管理：React useState + 游戏引擎内部状态

## 3. 文件结构与调用关系

```
project/
├── index.html                          # 入口页面
├── package.json                        # 依赖配置
├── vite.config.js                      # Vite构建配置
├── tsconfig.json                       # TypeScript配置
├── src/
│   ├── main.tsx                        # React入口 → 挂载App
│   ├── App.tsx                         # 主组件 → 管理游戏状态和界面切换
│   ├── components/
│   │   ├── GameCanvas.tsx              # Canvas容器 → 创建/管理GameEngine实例
│   │   ├── HUD.tsx                     # HUD覆盖层 ← 接收GameEngine回调数据
│   │   ├── StartScreen.tsx             # 开始界面
│   │   └── GameOverScreen.tsx          # 结束界面
│   └── core/
│       ├── GameEngine.ts               # 游戏主循环 → 协调所有子系统
│       ├── PlayerController.ts         # 玩家控制 ← 键盘/鼠标输入
│       ├── BulletManager.ts            # 子弹管理 ← 玩家射击/子弹更新
│       ├── BarrageGenerator.ts         # 弹幕生成器 → 生成各种样式弹幕
│       ├── CollisionDetector.ts        # 碰撞检测 → 子弹-弹幕/弹幕-玩家
│       ├── ParticleSystem.ts           # 粒子系统 → 爆炸粒子效果
│       ├── ScoreManager.ts             # 分数管理 ← 连击/分数计算
│       └── types.ts                    # 类型定义 ← 所有模块共享
```

数据流向：
- **输入流**：键盘/鼠标事件 → PlayerController → 更新玩家位置/射击状态
- **弹幕流**：BarrageGenerator → 生成弹幕实体 → GameEngine主循环更新位置
- **碰撞流**：CollisionDetector → 检测碰撞 → 触发粒子效果/扣血/分数更新
- **渲染流**：GameEngine → 每帧清空Canvas → 绘制背景/星星/飞船/弹幕/子弹/粒子
- **UI流**：GameEngine → 状态回调 → React HUD更新

## 4. 性能约束

- 游戏主循环稳定60FPS，使用requestAnimationFrame
- Canvas渲染每帧耗时≤3ms
- 粒子系统同时活动粒子数≤200，超过时优先淘汰生命周期最短的粒子
- 弹幕和子弹使用对象池减少GC压力
