## 1. 架构设计

```mermaid
graph TD
    "PlayerController.ts" -->|"输入状态"| "GameEngine.ts"
    "LevelGenerator.ts" -->|"障碍物/金币数据"| "GameEngine.ts"
    "GameEngine.ts" -->|"游戏状态快照"| "LevelRenderer.ts"
    "GameEngine.ts" <--> "Zustand Store"
    "React App.tsx" -->|"Canvas引用"| "LevelRenderer.ts"
    "React App.tsx" -->|"初始化"| "PlayerController.ts"
```

**数据流说明：**
- 玩家输入 → PlayerController 采集 → GameEngine 消费
- LevelGenerator 在 GameEngine 运行时按需生成新地形/金币/陷阱
- GameEngine 每帧输出 GameState 快照给 LevelRenderer 绘制
- 全局状态（游戏阶段、得分等）通过 Zustand Store 管理

## 2. 技术描述

- 前端框架：React@18 + TypeScript
- 构建工具：Vite
- 状态管理：zustand@^4
- 工具库：uuid（用于生成实体唯一ID）
- 渲染：HTML5 Canvas 2D API
- 游戏循环：requestAnimationFrame + 固定物理步长（16.67ms）+ 插值渲染

**核心常量：**
- 画布尺寸：800 × 400 px
- 1格 = 60 px
- 角色尺寸：20 × 20 px
- 角色水平速度：240 px/s（冲刺 480 px/s）
- 跳跃初速度：360 px/s
- 重力加速度：900 px/s²
- 冲刺持续：0.5 秒，冷却 2 秒

## 3. 文件结构与职责

| 文件路径 | 职责 |
|---------|------|
| `package.json` | 依赖：react@18, react-dom@18, zustand, uuid；脚本：dev/build/preview |
| `vite.config.js` | Vite 基础配置 + @vitejs/plugin-react |
| `tsconfig.json` | 严格模式 + noUnusedLocals |
| `index.html` | 入口页面 |
| `src/main.tsx` | React 入口，挂载 <App /> |
| `src/App.tsx` | 游戏容器，Canvas 布局，Zustand 状态渲染覆盖层（开始/结束界面），移动触控支持 |
| `src/store/gameStore.ts` | Zustand store：gameStatus(START/PLAYING/GAMEOVER)、score、actions |
| `src/types/index.ts` | 共享 TypeScript 类型定义 |
| `src/PlayerController.ts` | 监听 KeyDown/KeyUp、触摸事件，输出 InputState（jumpPressed、dashHeld） |
| `src/LevelGenerator.ts` | 程序化生成平台、金币、尖刺（含警示）、高度梯度变化逻辑 |
| `src/GameEngine.ts` | 固定步长物理循环（requestAnimationFrame）、AABB 碰撞、角色状态、金币收集、死亡判定、粒子系统更新、冲刺冷却、输出 GameState 快照 |
| `src/LevelRenderer.ts` | 接收 GameState，Canvas 绘制：天空渐变、山丘漂移、平台、金币（旋转动画+收集动画）、尖刺（警示）、角色（拖尾/冲刺半透明红/速度线）、得分、粒子、冲刺冷却指示器 |

## 4. 类型定义

```ts
type GameStatus = 'START' | 'PLAYING' | 'GAMEOVER';

interface Rect { x: number; y: number; w: number; h: number; }
interface Platform extends Rect { id: string; }
interface Coin {
  id: string; x: number; y: number; r: number;
  collected?: boolean; collectT?: number;
}
interface Spike extends Rect { id: string; warnT?: number; }
interface Particle {
  id: string; x: number; y: number; vx: number; vy: number;
  size: number; alpha: number; life: number; maxLife: number;
  color: string;
}
interface DashIndicator { cooldown: number; maxCooldown: number; }

interface InputState {
  jumpPressed: boolean;
  dashHeld: boolean;
}

interface PlayerState {
  x: number; y: number;
  vx: number; vy: number;
  w: number; h: number;
  onGround: boolean;
  dashT: number;
  dashCooldown: number;
  trail: { x: number; y: number; alpha: number }[];
  speedLines: { x: number; y: number; len: number }[];
}

interface GameState {
  player: PlayerState;
  platforms: Platform[];
  coins: Coin[];
  spikes: Spike[];
  particles: Particle[];
  dashIndicator: DashIndicator;
  cameraX: number;
  score: number;
  deathFlash: number;
  time: number;
  status: GameStatus;
}
```

## 5. 核心算法

### 5.1 碰撞检测（AABB）
```
aabb(a, b) = a.x < b.x + b.w && a.x + a.w > b.x
          && a.y < b.y + b.h && a.y + a.h > b.y
```
角色与平台：先处理水平位移，再处理垂直位移（分离轴），落地时 vy=0 且 onGround=true。

### 5.2 固定步长物理
- `accumulator += deltaTime`，循环 `step(1/60)` 直到 `accumulator < 1/60`
- `alpha = accumulator / (1/60)` 用于渲染插值
- 帧率波动 ±10% 时启用插值渲染

### 5.3 地形生成
- 维护 lastPlatform: {x, y, w, consecutiveSameHeight}
- 空隙 30-80px 随机
- 同一高度连续 ≤ 3 个平台
- 每 10 个平台高度梯度变化 ±(30-60)px，保证可跳跃到达
- 每 3 个平台后 40% 概率生成尖刺（尖刺前 0.5s 红色警示）

### 5.4 粒子系统（冲刺增强）
- 独立 particles 数组，不参与碰撞
- 普通移动：5 粒子/秒；冲刺中：15 粒子/秒
- 粒子颜色：红色(#E74C3C)→橙色(#F39C12)渐变
- 大小 2-4px 随机，life 0.3s，生成于角色身后（左侧）
- 每帧更新位置、生命衰减、透明度线性递减

### 5.5 冲刺冷却指示器
- 16×16px 白色圆环，角色底部中心下方 5px
- 冷却中显示进度弧，冷却完成后持续显示 2 秒
- 通过 Canvas arc 绘制进度（0→2π）

## 6. 性能约束

- 固定物理步长 16.67ms，渲染支持插值
- 单帧物理+渲染总耗时 ≤ 8ms
- 每帧清理屏幕外（cameraX < x - 200）的实体释放内存
- 粒子池上限：最多 200 个活跃粒子，超出后丢弃最旧粒子
