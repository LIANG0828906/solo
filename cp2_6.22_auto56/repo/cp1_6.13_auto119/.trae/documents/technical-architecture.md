# QuantumClash 量子对战游戏 - 技术架构文档

## 1. 技术栈

### 1.1 核心技术
- **语言**: TypeScript (严格模式, ES2020)
- **渲染**: Canvas API
- **构建工具**: Vite
- **包管理**: npm

### 1.2 开发规范
- 模块化架构，各模块职责单一
- 类型安全，TypeScript 严格模式
- 面向对象与函数式结合
- 事件驱动的动画系统

## 2. 项目结构

```
auto119/
├── package.json
├── index.html
├── tsconfig.json
├── vite.config.js
└── src/
    ├── gameField.ts      # 量子场模块
    ├── renderer.ts      # 渲染模块
    ├── interaction.ts   # 交互控制模块
    └── main.ts          # 入口与游戏循环
```

## 3. 模块架构

### 3.1 gameField.ts - 量子场模块

#### 核心数据结构
```typescript
type ParticleColor = 'red' | 'yellow' | 'blue';

interface SuperpositionParticle {
  id: string;
  color1: ParticleColor;
  color2: ParticleColor;
  pos1: { row: number; col: number };
  pos2: { row: number; col: number };
  state: 'superposition' | 'collapsing' | 'collapsed';
  collapsedColor?: ParticleColor;
  collapsedPos?: { row: number; col: number };
  owner: number; // 0 or 1
}

interface GameField {
  grid: (SuperpositionParticle | null)[][];
  particles: SuperpositionParticle[];
}
```

#### 暴露接口
- `initField()`: 初始化5x5网格
- `placeParticle(row, col, color1, color2, owner)`: 放置叠加态粒子
- `measureParticle(particleId)`: 测量粒子，触发坍缩和连锁反应
- `getNeighbors(row, col)`: 获取相邻格子
- `getParticlesAt(row, col)`: 获取某位置的粒子

#### 坍缩逻辑
1. 随机选择坍缩位置和颜色
2. 向四方向发射冲击波
3. 同色粒子湮灭（造成伤害）
4. 不同色粒子纠缠（颜色混合）

### 3.2 renderer.ts - 渲染模块

#### 核心类: Renderer
- `updateAndRender(deltaTime)`: 每帧更新和渲染
- `scheduleCollapseAnimation(particle)`: 调度坍缩动画
- `scheduleShockwave(x, y, color)`: 调度冲击波特效
- `scheduleShatterAnimation(x, y, color)`: 调度碎裂动画
- `scheduleColorTransition(particle, fromColor, toColor)`: 调度颜色渐变动画
- `updateHealthBar(player, health, maxHealth)`: 更新生命值条
- `showTurnIndicator(text)`: 显示回合提示
- `showDamageText(x, y, text, type)`: 显示伤害/纠缠文字
- `setSelectedCell(row, col)`: 设置选中格子高亮
- `setColorPanel(visible, colors)`: 设置颜色选择面板

#### 动画系统
- 基于时间的动画队列
- 每个动画有 start_time, duration, update 方法
- 每帧统一更新所有活动动画

### 3.3 interaction.ts - 交互控制模块

#### 核心类: InteractionManager
- `handleMouseMove(x, y)`: 处理鼠标移动
- `handleClick(x, y)`: 处理点击
- `getGamePhase()`: 获取当前游戏阶段（放置/测量）
- `setGamePhase(phase)`: 设置游戏阶段
- `onCellClick(callback)`: 格子点击回调
- `onColorSelect(callback)`: 颜色选择回调
- `onMeasure(callback)`: 测量触发回调

### 3.4 main.ts - 入口与游戏循环

#### 核心逻辑
- 初始化所有模块
- 启动 requestAnimationFrame 游戏循环
- 管理回合状态机
- 倒计时逻辑
- 超时自动操作

#### 游戏状态机
```
IDLE → PLAYER1_PLACE → PLAYER1_MEASURE → PLAYER2_PLACE → PLAYER2_MEASURE → ...
```

## 4. 性能优化策略

### 4.1 渲染优化
- 脏矩形渲染
- 离屏canvas缓存静态元素
- 粒子对象池复用

### 4.2 逻辑优化
- 空间分区检测
- 动画对象池
- 避免每帧创建新对象

## 5. 动画时序设计

### 5.1 坍缩动画
- 总时长: 0.5秒
- 闪烁次数: 3次（两色交替）
- 触发: measurement

### 5.2 冲击波动画
- 时长: 0.3秒
- 起始半径: 0
- 终止半径: 30px
- 透明度: 渐变消失

### 5.3 碎裂动画
- 时长: 0.4秒
- 碎片数量: 4片
- 运动: 向外飞散 + 旋转

### 5.4 颜色渐变动画
- 时长: 0.3秒
- 过渡: 线性插值

### 5.5 回合提示动画
- 淡入: 0.5秒（放大）
- 淡出: 0.5秒（缩小）

## 6. 颜色定义

| 颜色 | 色值 |
|------|------|
| 红色粒子 | #ff4444 |
| 黄色粒子 | #ffdd44 |
| 蓝色粒子 | #4488ff |
| 金色高亮 | #ffd700 |
| 背景深色 | #0a0a2e |
| 背景紫色 | #2a1a4e |
| 网格线 | rgba(255,255,255,0.1) |
