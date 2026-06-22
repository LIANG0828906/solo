# 极光动画项目 - 技术架构文档

## 1. 技术栈选型

| 技术 | 选型理由 |
|------|----------|
| **TypeScript** | 类型安全，提升代码可维护性，严格模式确保代码质量 |
| **Vite** | 极速开发体验，原生ES模块支持，配置简单 |
| **Canvas 2D API** | 高性能2D图形渲染，适合粒子和曲线动画 |
| **原生DOM API** | 轻量级UI控制，无需额外框架依赖 |

## 2. 架构设计

### 2.1 整体架构图

```
┌─────────────────────────────────────────────────────────┐
│                         main.ts                         │
│  初始化Canvas、AuroraRenderer、UIController、AppState  │
└─────────────────────┬─────────────────┬─────────────────┘
                      │                 │
                      ▼                 ▼
        ┌─────────────────────┐ ┌─────────────────────┐
        │   AuroraRenderer    │ │    UIController     │
        │  - 光带生成逻辑     │ │  - 控制面板渲染     │
        │  - 逐帧更新逻辑     │ │  - 滑块事件绑定     │
        │  - Canvas绘制逻辑   │ │  - 全屏按钮控制     │
        └─────────┬───────────┘ └──────────┬──────────┘
                  │                         │
                  ▼                         ▼
        ┌─────────────────────────────────────────────┐
        │                AppState (单例)              │
        │  - colorSpeed: Observable<number>           │
        │  - flowSpeed: Observable<number>            │
        │  - brightness: Observable<number>           │
        │  - subscribe(key, callback)                 │
        │  - set(key, value)                          │
        └─────────────────────────────────────────────┘
```

### 2.2 核心模块职责

#### AuroraRenderer (aurora.ts)
- **光带数据结构**：每个光带包含控制点数组、颜色索引、相位、速度等属性
- **贝塞尔曲线生成**：通过控制点生成平滑的三次贝塞尔曲线
- **动画更新**：每帧更新控制点位置、相位、透明度
- **Canvas绘制**：使用渐变填充绘制光带，应用亮度和透明度

#### UIController (ui.ts)
- **DOM创建**：动态创建控制面板、滑块、标签、全屏按钮
- **事件绑定**：滑块input事件、全屏按钮click事件、鼠标悬停效果
- **状态同步**：将UI变更同步到AppState
- **动画效果**：数值标签淡入淡出、按钮过渡动画

#### AppState (state.ts)
- **单例模式**：全局唯一状态管理实例
- **可观察属性**：三个滑块参数均可订阅变化
- **发布-订阅**：参数变化时通知所有订阅者
- **类型安全**：完整的TypeScript类型定义

## 3. 数据结构设计

### 3.1 AuroraBand 光带数据结构

```typescript
interface AuroraBand {
  controlPoints: Point[];      // 8-12个控制点
  colors: string[];            // 渐变颜色数组
  width: number;               // 60-120px
  alpha: number;               // 0.1-0.4
  phase: number;               // 动画相位 0-1
  speed: number;               // 飘动速度系数
  colorShiftSpeed: number;     // 色彩变换速度系数
  flowDirection: 'top' | 'left' | 'right';  // 生成方向
  turbulence: number[];        // 每个控制点的扰动值
}
```

### 3.2 AppState 状态结构

```typescript
interface AppStateData {
  colorSpeed: number;     // 0.1 - 3.0
  flowSpeed: number;      // 0.1 - 3.0
  brightness: number;     // 0.1 - 1.0
}
```

## 4. 核心算法

### 4.1 贝塞尔曲线绘制
使用二次或三次贝塞尔曲线连接控制点，通过`lineTo`和`bezierCurveTo`绘制平滑曲线。

### 4.2 光带流动效果
- 控制点沿垂直方向缓慢移动
- 每个控制点添加随机扰动模拟飘动
- 相位控制整体动画进度

### 4.3 色彩变换
- 使用HSL颜色空间进行色相偏移
- 三种主色之间平滑过渡
- 透明度随时间正弦波动实现闪烁效果

### 4.4 性能优化
- 使用`requestAnimationFrame`进行动画循环
- 离屏Canvas预渲染渐变
- 对象池复用光带对象，避免频繁GC

## 5. 构建配置

### 5.1 TypeScript 配置
- 严格模式（strict: true）
- ESNext模块系统
- 目标ES2020
- 开启noImplicitAny、strictNullChecks等

### 5.2 Vite 配置
- 基础配置，指定root和outDir
- 开发服务器端口默认5173
- 生产构建启用压缩和sourcemap

## 6. 开发流程

1. **初始化**：创建package.json、安装依赖
2. **配置**：tsconfig.json、vite.config.js、index.html
3. **状态层**：实现AppState单例和订阅机制
4. **渲染层**：实现AuroraRenderer的光带生成和绘制
5. **UI层**：实现UIController的控制面板和交互
6. **入口**：main.ts整合所有模块
7. **测试**：运行dev服务器，验证效果和性能
