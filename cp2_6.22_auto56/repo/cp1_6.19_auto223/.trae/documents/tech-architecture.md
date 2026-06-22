## 1. 架构设计

```mermaid
flowchart TD
    A["App.tsx (根组件) --> B["Hud.tsx (信息面板"]
    A --> C["GameCanvas.tsx (游戏画布)"]
    C --> D["requestAnimationFrame 游戏循环"]
    E["store.ts (Zustand 状态管理"]
    B --> E
    C --> E
    F["types.ts (类型定义"]
    D --> G["外星人位置更新"]
    D --> H["碰撞检测"]
    D --> I["渲染绘制区交互"]
    J["符文匹配算法"]
    D --> J
    E --> F
    B --> F
    C --> F
```

## 2. 技术描述

- 前端：React@18 + TypeScript@5 + Vite@5
- 状态管理：Zustand@4
- 动画库：Framer Motion@11
- 渲染：Canvas 2D API
- 构建工具：Vite
- 后端：无（纯前端游戏）

## 3. 项目结构

| 文件路径 | 说明 |
|-----------|------|
| package.json | 项目依赖配置 |
| vite.config.js | Vite 配置文件 |
| tsconfig.json | TypeScript 配置文件 |
| index.html | 入口 HTML |
| src/types.ts | 类型定义：外星人、符文、游戏状态 |
| src/store.ts | Zustand 全局状态管理 |
| src/components/GameCanvas.tsx | 游戏画布组件，核心游戏循环 |
| src/components/Hud.tsx | HUD信息显示组件 |
| src/App.tsx | 根组件，组装所有子组件 |

## 4. 类型定义

```typescript
// 外星人类型枚举
enum AlienType {
  NORMAL = 'normal',
  ARMORED = 'armored',
  BOSS = 'boss'
}

// 符文类型枚举
enum RuneType {
  CIRCLE = 'circle',
  TRIANGLE = 'triangle',
  LIGHTNING = 'lightning',
  SPIRAL = 'spiral',
  STAR = 'star'
}

// 游戏状态枚举
enum GameState {
  PLAYING = 'playing',
  GAME_OVER = 'game_over'
}

// 外星人接口
interface Alien {
  id: string;
  type: AlienType;
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  speed: number;
  size: number;
  path: BezierPoint[];
  pathProgress: number;
  lastShootTime: number;
}

// 符文轨迹点
interface TrajectoryPoint {
  x: number;
  y: number;
  timestamp: number;
}

// 弹幕接口
interface Bullet {
  id: string;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  speed: number;
}

// 魔法效果接口
interface MagicEffect {
  id: string;
  type: RuneType;
  x: number;
  y: number;
  startTime: number;
  duration: number;
}
```

## 5. 核心算法

### 5.1 符文匹配算法
- 轨迹重采样：将绘制轨迹标准化为固定点数（如32个点）
- 特征提取：计算每个点的方向角变化
- 模板匹配：与预定义的5种符文模板进行相似度比较
- 阈值判断：相似度超过阈值则匹配成功

### 5.2 贝塞尔曲线运动
- 使用三次贝塞尔曲线生成外星人下落路径
- 控制点随机生成，确保路径多样性
- 根据进度值计算当前位置

### 5.3 碰撞检测
- 圆形碰撞检测（外星人、弹幕、魔法效果）
- 矩形碰撞检测（魔法范围）

## 6. 状态管理（Zustand Store

```typescript
// Store 状态
{
  gameState: GameState;
  aliens: Alien[];
  bullets: Bullet[];
  magicEffects: MagicEffect[];
  energy: number;
  score: number;
  combo: number;
  currentTrajectory: TrajectoryPoint[];
  isDrawing: boolean;
  escapedCount: number;
  lastWaveTime: number;
  selectedRune: RuneType | null;
  matchFailFlash: boolean;
  comboBreakSound: boolean;
}

// Store Actions
{
  startGame: () => void;
  resetGame: () => void;
  spawnWave: () => void;
  addAlien: (alien: Alien) => void;
  removeAlien: (id: string) => void;
  updateAlien: (id: string, updates: Partial<Alien>) => void;
  addBullet: (bullet: Bullet) => void;
  removeBullet: (id: string) => void;
  addMagicEffect: (effect: MagicEffect) => void;
  removeMagicEffect: (id: string) => void;
  addTrajectoryPoint: (point: TrajectoryPoint) => void;
  clearTrajectory: () => void;
  setDrawing: (drawing: boolean) => void;
  consumeEnergy: (amount: number) => boolean;
  addEnergy: (amount: number) => void;
  addScore: (amount: number) => void;
  incrementCombo: () => void;
  resetCombo: () => void;
  incrementEscaped: () => void;
  setSelectedRune: (rune: RuneType | null) => void;
  triggerMatchFail: () => void;
  triggerComboBreak: () => void;
}
```

## 7. 性能优化

- 使用 Canvas 2D 批量绘制，减少 DOM 操作
- requestAnimationFrame 驱动游戏循环
- 轨迹点采样间隔15像素，减少计算量
- 对象池管理（可选）
- 离屏 Canvas 预渲染静态元素
- 避免在游戏循环中创建新对象
