# 策略卡牌对战应用 - 技术架构文档

## 1. 技术栈选型

| 类别 | 技术 | 说明 |
|------|------|------|
| 编程语言 | TypeScript 5.x | 严格模式，类型安全 |
| 前端框架 | Vue 3.x | Composition API + `<script setup>` |
| 构建工具 | Vite 5.x | HMR 快速开发 |
| 状态管理 | Pinia 2.x | 模块化 Store |
| 路由 | Vue Router 4.x | 页面路由（预留） |
| CSS 方案 | Scoped CSS + CSS Variables | 组件化样式 |

---

## 2. 目录结构

```
auto85/
├── package.json
├── index.html
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── main.ts
    └── game/
        ├── types.ts
        ├── cardStore.ts
        ├── aiService.ts
        └── CardGame.vue
```

### 2.1 文件职责

| 文件 | 职责 |
|------|------|
| `package.json` | 项目依赖与脚本配置 |
| `index.html` | 入口HTML，背景与字体引入 |
| `vite.config.ts` | Vite构建配置 |
| `tsconfig.json` | TypeScript严格模式配置 |
| `src/main.ts` | Vue应用入口，Pinia/Router挂载 |
| `src/game/types.ts` | 类型定义：Card/GridCell/GameState接口 |
| `src/game/cardStore.ts` | Pinia Store：卡牌生成、手牌、法力、攻防结算 |
| `src/game/aiService.ts` | AI策略：最优出牌、目标选择、位置决策 |
| `src/game/CardGame.vue` | 主组件：战场渲染、拖拽逻辑、回合管理、动画 |

---

## 3. 核心数据模型

### 3.1 Card 卡牌接口

```typescript
interface Card {
  id: string;
  name: string;
  cost: number;        // 法力消耗
  attack: number;      // 攻击力
  health: number;      // 当前生命值
  maxHealth: number;   // 最大生命值
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  skill?: 'combo' | 'taunt' | 'heal';
  skillValue?: number; // 技能数值（治疗量、连击次数）
  owner: 'player' | 'enemy';
  position?: { row: number; col: number };
  canAttack: boolean;  // 本回合是否可攻击
  justPlaced: boolean; // 刚入场标记
}
```

### 3.2 GridCell 格子类型

```typescript
type CellZone = 'player' | 'enemy' | 'neutral';

interface GridCell {
  row: number;
  col: number;
  zone: CellZone;
  card: Card | null;
  isHighlighted: boolean;
  isValidTarget: boolean;
}
```

### 3.3 GameState 游戏状态

```typescript
interface GameState {
  turn: number;
  phase: 'player' | 'enemy' | 'ended';
  winner: 'player' | 'enemy' | null;

  playerHealth: number;
  playerMaxHealth: number;
  playerMana: number;
  playerMaxMana: number;

  enemyHealth: number;
  enemyMaxHealth: number;
  enemyMana: number;
  enemyMaxMana: number;

  playerHand: Card[];
  enemyHand: Card[];
  playerDeck: Card[];
  enemyDeck: Card[];

  grid: GridCell[][];  // grid[row][col], 3行5列

  stats: {
    playerDamage: number;
    enemyDamage: number;
    playerKills: number;
    enemyKills: number;
    playerHeal: number;
    enemyHeal: number;
  };
}
```

---

## 4. 架构设计

### 4.1 状态管理（Pinia Store）

**cardStore.ts 核心动作：**

| Action | 功能 |
|--------|------|
| `initGame()` | 初始化游戏，生成牌库、发初始手牌 |
| `drawCard(owner)` | 从牌库抽一张牌到手牌 |
| `playCard(cardId, row, col)` | 放置卡牌到战场格子 |
| `attack(attackerId, targetId)` | 执行攻击结算 |
| `endTurn()` | 结束当前回合，切换到对方 |
| `startPlayerTurn()` | 开始玩家回合，增加法力、恢复可攻击 |
| `generateCard(owner)` | 生成随机卡牌 |

**Getters：**
- `canPlayCard(cost)`: 检查法力是否足够
- `validPlaceCells`: 可放置卡牌的格子
- `playerFieldCards` / `enemyFieldCards`: 场上卡牌

### 4.2 AI 策略服务（aiService.ts）

**决策优先级：**
1. 计算所有可出的牌（法力足够）
2. 评估出牌位置（靠近敌方嘲讽/低血量目标）
3. 攻击优先级：嘲讽 > 低血量 > 直接打脸
4. 保持场上卡牌数量优势（优先铺场）

**导出函数：**

| 函数 | 功能 |
|------|------|
| `getAIPlayDecision(state)` | 获取AI出牌决策：{ card, row, col } |
| `getAIAttackDecision(state)` | 获取AI攻击决策：{ attacker, target } |
| `executeAITurn(state, store)` | 执行完整AI回合 |

### 4.3 主组件（CardGame.vue）

**核心逻辑分区：**
- **拖拽系统**：HTML5 Drag & Drop API + Vue响应式
- **动画系统**：CSS Transitions + Keyframes + requestAnimationFrame
- **战斗特效**：飘字伤害、粒子效果（CSS实现）
- **回合管理**：watch + setTimeout 驱动AI行动

**组件子结构：**
```
CardGame.vue
├── .game-container
│   ├── .starfield (星空背景层)
│   ├── .nebula (星云粒子层)
│   ├── .top-bar
│   │   ├── .enemy-info (头像/血条/法力)
│   │   └── .player-info
│   ├── .battlefield (5x3网格)
│   │   └── .grid-cell ×15
│   │       └── .card (战场卡牌)
│   ├── .hand-area
│   │   └── .card (手牌，可拖拽)
│   ├── .end-turn-btn
│   ├── .stats-drawer (结算面板)
│   └── .victory-overlay / .defeat-overlay
```

---

## 5. 关键实现策略

### 5.1 拖拽系统
- 使用原生 `dragstart` / `dragover` / `drop` 事件
- 拖拽时：`opacity: 0.6` + `transform: scale(1.08)`
- 有效放置格子高亮：`box-shadow` + 背景色渐变

### 5.2 卡牌入场动画
- CSS Keyframes: `flipIn` (rotateY 90°→0°) + `floatUp` (translateY 30px→0)
- 粒子效果：伪元素 `::after` 配合多层 box-shadow 模拟

### 5.3 飘字伤害
- 动态创建 DOM 元素，absolute 定位
- CSS Animation: `damageFloat` (translateY 0→-60px, opacity 1→0)
- 动画结束后自动 remove

### 5.4 星空与星云背景
- 两层独立背景容器
- 星空：CSS radial-gradient 多层叠加
- 星云：`animation: nebulaRotate 120s linear infinite`

### 5.5 法力水晶
- 使用 SVG 绘制水晶形状
- 剩余法力：`fill: #4fc3f7` + `filter: drop-shadow(0 0 6px #4fc3f7)`
- 消耗法力：`fill: #37474f` + 无发光

---

## 6. 性能优化

| 优化点 | 方案 |
|--------|------|
| 动画性能 | 优先使用 `transform` / `opacity` 动画（GPU加速） |
| 重绘控制 | 避免频繁 layout，卡牌使用 will-change |
| 拖拽响应 | 拖拽数据在 dragstart 一次性设置，dragover 轻量判断 |
| 粒子效果 | 限制同时存在的粒子数量（≤ 30），及时回收 |
| 状态更新 | Pinia 批量更新，减少 watcher 触发次数 |

---

## 7. 构建与运行

```bash
# 安装依赖
npm install

# 开发模式
npm run dev

# 默认端口：5173
# 访问：http://localhost:5173
```
