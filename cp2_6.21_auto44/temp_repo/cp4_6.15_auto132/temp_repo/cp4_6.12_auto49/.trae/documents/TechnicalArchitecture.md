# 桌面图标自动艺术化排列工具 - 技术架构文档

## 1. 技术选型

| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| React | ^18.2.0 | UI框架 | 组件化开发，生态成熟，适合交互密集型应用 |
| TypeScript | ^5.0.0 | 类型系统 | 提供类型安全，减少运行时错误 |
| Vite | ^5.0.0 | 构建工具 | 快速冷启动，热更新，支持TypeScript |
| p5.js | ^1.7.0 | 图形绘制 | 强大的Canvas绘图能力，适合创意编程 |
| react-p5-wrapper | ^3.3.0 | React封装 | 简化p5.js在React中的集成 |

---

## 2. 项目结构

```
auto49/
├── package.json              # 项目依赖配置
├── index.html                # 入口HTML
├── vite.config.js            # Vite构建配置
├── tsconfig.json             # TypeScript配置
└── src/
    ├── App.tsx               # 根组件，状态管理中心
    ├── main.tsx              # 应用入口
    ├── components/
    │   ├── CanvasRenderer.tsx    # p5.js画布渲染组件
    │   └── ControlPanel.tsx      # 控制面板组件
    ├── utils/
    │   └── patterns.ts           # 排列算法纯函数
    ├── types/
    │   └── index.ts              # TypeScript类型定义
    └── styles/
        └── global.css            # 全局样式
```

---

## 3. 核心数据结构

### 3.1 图标数据结构
```typescript
interface IconItem {
  id: string;
  name: string;
  type: 'emoji' | 'image';
  content: string; // emoji字符或图片base64/data URL
}
```

### 3.2 图标位置数据结构
```typescript
interface IconPosition {
  x: number;
  y: number;
  rotation?: number;
  alpha?: number;
  scale?: number;
}
```

### 3.3 颜色主题
```typescript
interface ColorTheme {
  name: string;
  background: string;
  primaryColors: [string, string];
  accentColor: string;
}
```

### 3.4 排列模式
```typescript
type PatternMode = 'wave' | 'spiral' | 'random';
```

---

## 4. 模块职责与调用关系

### 4.1 App.tsx - 根组件
**职责**：
- 管理全局状态（图标列表、排列模式、颜色主题、密度、图标大小）
- 初始化画布和UI面板布局
- 状态变更时触发CanvasRenderer重绘

**状态**：
```typescript
- icons: IconItem[]
- patternMode: PatternMode
- colorTheme: ColorTheme
- density: number (50-200)
- iconSize: number (30-80)
- selectedIconId: string | null
```

**数据流**：
```
ControlPanel.onXxxChange → App.setState → CanvasRenderer.props更新 → 重绘画布
```

### 4.2 ControlPanel.tsx - 控制面板
**职责**：
- 图标拖放上传区
- 排列模式选择器
- 颜色主题下拉菜单
- 密度和大小滑块
- 导出按钮

**Props**：
```typescript
interface ControlPanelProps {
  icons: IconItem[];
  patternMode: PatternMode;
  colorTheme: ColorTheme;
  density: number;
  iconSize: number;
  onIconsChange: (icons: IconItem[]) => void;
  onPatternModeChange: (mode: PatternMode) => void;
  onColorThemeChange: (theme: ColorTheme) => void;
  onDensityChange: (density: number) => void;
  onIconSizeChange: (size: number) => void;
  onExport: () => void;
}
```

### 4.3 CanvasRenderer.tsx - 画布渲染
**职责**：
- 使用p5.js绘制图标图案
- 接收图标列表和排列参数
- 调用排列算法计算每个图标的位置
- 处理鼠标悬停放大交互
- 处理点击选中动画
- 处理位置过渡动画

**Props**：
```typescript
interface CanvasRendererProps {
  icons: IconItem[];
  patternMode: PatternMode;
  colorTheme: ColorTheme;
  density: number;
  iconSize: number;
  selectedIconId: string | null;
  onIconClick: (id: string | null) => void;
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>;
}
```

**渲染流程**：
1. p5.js setup() - 初始化画布
2. p5.js draw() - 每帧调用：
   - 绘制背景（带渐变过渡）
   - 调用patterns.ts计算当前模式的图标位置
   - 对每个图标计算当前帧的插值位置（过渡动画）
   - 绘制图标（圆形裁剪、边框、旋转、缩放、透明度）
   - 处理悬停检测和放大
   - 处理选中状态的弹起动画
   - 绘制选中图标的信息弹窗

### 4.4 patterns.ts - 排列算法
**职责**：纯函数模块，无副作用，根据参数计算图标位置。

**导出函数**：

```typescript
// 波浪模式
export function generateWavePattern(
  count: number,
  width: number,
  height: number,
  density: number
): IconPosition[]

// 螺旋模式
export function generateSpiralPattern(
  count: number,
  width: number,
  height: number,
  density: number
): IconPosition[]

// 随机散点模式
export function generateRandomPattern(
  count: number,
  width: number,
  height: number,
  density: number
): IconPosition[]
```

---

## 5. 核心算法设计

### 5.1 波浪排列算法
```
参数：图标数量n，画布宽W，高H，密度d
1. 波长 = d * 3
2. 振幅 = H * 0.2
3. 水平间距 = d
4. 对每个图标i (0到n-1):
   x = (i * 水平间距) % (W - 100) + 50
   y = H/2 + sin(x / 波长 * 2π) *振幅
   rotation = random(-15°, 15°)
   alpha = 0.8 + random(0.2)
```

### 5.2 螺旋排列算法
```
参数：图标数量n，画布宽W，高H，密度d
1. 中心(cx, cy) = (W/2, H/2)
2. 螺旋圈数 = n / 10
3. 对每个图标i (0到n-1):
   t = i / n * 螺旋圈数 * 2π
   r = d * t / (2π)
   x = cx + r * cos(t)
   y = cy + r * sin(t)
   rotation = t * 180/π (跟随螺旋角度)
   scale = 1.0 - (i / n) * 0.4 (从1.0递减到0.6)
```

### 5.3 随机散点算法
```
参数：图标数量n，画布宽W，高H，密度d
1. 最小间距 = max(20px, d/2)
2. 目标覆盖率 = 60%
3. 尝试次数 = 0
4. 已放置图标列表positions = []
5. while positions.length < n 且 尝试次数 < n*100:
   随机生成(x, y)在画布范围内
   检查与所有已放置图标的距离 >= 最小间距
   如果满足:
     添加到positions
   尝试次数++
6. 如果positions.length < n:
   适当减小最小间距后重试
7. 返回positions
```

---

## 6. 动画系统

### 6.1 位置过渡动画
```
- 目标位置: targetPositions[]
- 当前位置: currentPositions[]
- 动画时长: 500ms
- 缓动函数: ease-out
- 每帧更新:
  for each icon i:
    t = (currentTime - startTime) / duration
    t = clamp(t, 0, 1)
    easedT = 1 - (1 - t)^3
    currentPositions[i].x = lerp(prevPos[i].x, targetPos[i].x, easedT)
    currentPositions[i].y = lerp(prevPos[i].y, targetPos[i].y, easedT)
```

### 6.2 背景色过渡动画
```
- 目标背景色: targetBg
- 当前背景色: currentBg
- 动画时长: 1000ms
- 每帧更新:
  t = clamp((currentTime - startTime) / 1000, 0, 1)
  currentBg.r = lerp(prevBg.r, targetBg.r, t)
  currentBg.g = lerp(prevBg.g, targetBg.g, t)
  currentBg.b = lerp(prevBg.b, targetBg.b, t)
```

### 6.3 图标点击动画
```
- 状态: idle / animating / selected
- 动画时长: 300ms
- 缓动: ease-out
- 动画过程:
  0%: scale=1.0, y=0
  100%: scale=1.3, y=-20 (弹起)
```

---

## 7. 性能优化策略

### 7.1 绘制优化
- 图标图片预加载并缓存到p5.Image对象
- 离屏画布缓存已绘制的图标
- 只在参数变化时重新计算排列位置
- 使用requestAnimationFrame确保帧率稳定

### 7.2 计算优化
- 排列算法使用纯函数，结果可缓存
- 随机模式使用空间分区（网格）加速碰撞检测
- 动画插值计算使用简单的线性插值

### 7.3 内存优化
- 及时清理不再使用的图片资源
- 限制最大图标数量为20
- 避免在draw()中创建新对象

---

## 8. 响应式设计

### 8.1 断点
- 桌面: >=