# 绘图应用架构说明

## 文件结构

```
├── index.html          # HTML结构
├── style.css           # 样式定义
├── brush.js            # 笔触模块
├── layer.js            # 图层管理模块
├── palette.js          # 调色板模块
├── main.js             # 主应用入口
└── ARCHITECTURE.md     # 架构说明文档
```

## 模块职责

### brush.js - 笔触模块
- **职责**：处理笔触绘制逻辑，包括速度映射、墨量衰减、笔触末端渐细效果
- **核心功能**：
  - 速度映射算法（慢速30px，快速3px）
  - 墨量衰减计算（初始100，随移动距离递减）
  - 枯笔效果（墨量<20时半透明）
  - 笔触末端渐细收尾
  - 蘸墨恢复动画（0.3秒渐入）

### layer.js - 图层管理模块
- **职责**：管理图层栈结构，支持最多5个图层
- **核心功能**：
  - 图层的添加、删除、上下移动
  - 可见性/锁定状态切换
  - 图层缩略图生成
  - 图层数据独立存储

### palette.js - 调色板模块
- **职责**：颜色选择和管理
- **核心功能**：
  - 色相圆环（12色）
  - 饱和度-亮度矩形面板
  - 最近使用颜色记录
  - 透明度调节
  - HSL/RGB/HEX颜色转换

### main.js - 主应用入口
- **职责**：整合所有模块，处理用户交互
- **核心功能**：
  - 初始化各模块
  - 事件监听和分发
  - 画布渲染和重绘
  - 撤销/重做功能（20步快照）
  - 画布缩放（0.5x-4x）

## 调用关系与数据流向

### 1. main.js → brush.js
```
main.js.handleMouseDown()
    └── brush.startDrawing(x, y)      // 开始绘制
        └── brush.ink > 0 ? 允许绘制 : 禁止绘制

main.js.handleMouseMove()
    ├── brush.updateDrawing(x, y)     // 更新位置和速度
    │       ├── 计算移动速度
    │       └── 更新墨量（brush.ink -= distance * decayRate）
    └── brush.draw(currentLayer.ctx, x, y)  // 在当前图层绘制
            └── brush.getBrushParams()      // 获取半径和透明度
                    ├── 速度映射: radius = 30 - 27 * normalizedVelocity
                    └── 墨量影响: opacity *= (ink / 20) when ink < 20

main.js.handleMouseUp()
    └── brush.draw(ctx, x, y, true)   // 绘制末端渐细效果
            └── brush.drawTrailEnd()   // 渐细收尾

main.js.handleKeyDown('R')
    └── brush.dipInk()                // 触发蘸墨动画（0.3秒渐入）
```

### 2. main.js → palette.js
```
main.js.setupPalette()
    ├── palette.drawHueRing(ctx, ...)      // 绘制色相环
    ├── palette.drawSLPanel(ctx)           // 绘制饱和度-亮度面板
    └── palette.onChange = (data) => {     // 颜色变化回调
            brush.setColor(data.color)     // 更新画笔颜色
        }

hueRing.addEventListener('click')
    ├── palette.getHueFromPosition(x, y)   // 获取色相值
    └── palette.setHue(hue)                // 设置色相

slPanel.addEventListener('click')
    ├── palette.getSLFromPosition(x, y)    // 获取饱和度和亮度
    ├── palette.setSaturation(s)
    └── palette.setLightness(l)

opacitySlider.addEventListener('input')
    └── palette.setOpacity(value)          // 设置透明度

colorGrid.addEventListener('click')
    └── palette.setColor(hex)              // 选择历史颜色
```

### 3. main.js → layer.js
```
main.js.constructor()
    └── layerManager.addLayer('背景层')    // 创建初始图层

main.setupLayerPanel()
    └── layerManager.onChange = () => {    // 图层变化回调
            renderLayers()                 // 更新图层UI
            redrawCanvas()                 // 重绘画布
        }

main.handleMouseDown()
    └── layerManager.getCurrentLayer()     // 获取当前图层
            └── currentLayer.locked ? 禁止绘制 : 允许绘制

main.redrawCanvas()
    └── layerManager.render(ctx)           // 渲染所有可见图层
            └── ctx.drawImage(layer.canvas, 0, 0)  // 逐层绘制

main.saveSnapshot()
    └── layer.getSnapshot()                // 获取图层像素数据

main.undo()
    └── layer.setSnapshot(imageData)       // 恢复图层快照

renderLayers()
    ├── layerManager.getLayers()           // 获取所有图层
    ├── layer.thumbnail                    // 获取缩略图
    └── layerManager.setCurrentLayer(idx)  // 切换当前图层
```

### 4. 图层操作数据流
```
添加图层:
    addLayerBtn.click → layerManager.addLayer() → onChange → renderLayers()

删除图层:
    deleteBtn.click → layerManager.removeLayer(idx) → onChange → renderLayers()

移动图层:
    upBtn.click → layerManager.moveLayerUp(idx) → onChange → renderLayers()
    downBtn.click → layerManager.moveLayerDown(idx) → onChange → renderLayers()

切换可见性:
    visibilityBtn.click → layerManager.toggleVisibility(idx) → onChange → redrawCanvas()

切换锁定:
    lockBtn.click → layerManager.toggleLock(idx) → onChange → renderLayers()
```

## 核心数据结构

### Brush 类
```javascript
{
  minRadius: 3,        // 最小笔触半径（快速）
  maxRadius: 30,       // 最大笔触半径（慢速）
  minOpacity: 0.5,     // 最小透明度（快速）
  maxOpacity: 1,       // 最大透明度（慢速）
  ink: 100,            // 当前墨量（初始100）
  maxInk: 100,         // 最大墨量
  inkDecayRate: 0.05,  // 墨量衰减率
  velocity: 0,         // 当前移动速度
  color: '#000000',    // 当前颜色
  tool: 'brush',       // 当前工具（brush/eraser）
  trail: [],           // 轨迹点数组
  recovering: false    // 是否正在蘸墨恢复
}
```

### Layer 类
```javascript
{
  id: 'layer-xxx',     // 图层ID
  name: '图层 1',      // 图层名称
  visible: true,       // 是否可见
  locked: false,       // 是否锁定
  canvas: HTMLCanvasElement,  // 图层画布
  ctx: CanvasRenderingContext2D,  // 绘图上下文
  thumbnail: HTMLCanvasElement    // 缩略图画布
}
```

### Palette 类
```javascript
{
  hue: 0,              // 色相（0-360）
  saturation: 100,     // 饱和度（0-100）
  lightness: 50,       // 亮度（0-100）
  opacity: 100,        // 透明度（0-100）
  recentColors: []     // 最近使用颜色数组（最多12个）
}
```

## 性能优化策略

### 1. 绘制优化
- 使用离屏Canvas进行图层绘制，避免直接操作主画布
- 绘制时使用requestAnimationFrame确保流畅
- 笔触轨迹使用数组缓存，减少重复计算

### 2. 撤销优化
- 快照只保存像素数据，不保存完整Canvas对象
- 限制撤销步数为20，避免内存溢出
- 使用索引指针管理撤销历史，避免频繁数组操作

### 3. 图层渲染优化
- 只渲染可见图层
- 缩略图按需更新，而非实时更新

### 4. 事件优化
- 使用事件委托减少事件监听器数量
- 触摸事件使用preventDefault避免滚动冲突

## 界面布局结构

```
┌─────────────────────────────────────────────────────────────────┐
│  sidebar-left (210px)    │  main-content (flex:1)              │  sidebar-right (220px)  │
│  ┌─────────────────────┐ │  ┌───────────────────────────────┐ │  ┌───────────────────┐ │
│  │     图层面板        │ │  │  toolbar (工具/缩放/撤销/墨量) │ │  │     调色板        │ │
│  │  - 添加图层按钮     │ │  ├───────────────────────────────┤ │  │  - 色相环         │ │
│  │  - 图层列表        │ │  │  canvas-container             │ │  │  - 饱和度-亮度    │ │
│  │    * 缩略图        │ │  │  ┌─────────────────────────┐   │ │  │  - 最近颜色      │ │
│  │    * 名称          │ │  │  │       mainCanvas        │   │ │  │  - 透明度滑块    │ │
│  │    * 可见/锁定按钮 │ │  │  │   (800x600, 缩放支持)   │   │ │  │  - 当前颜色预览  │ │
│  │    * 上下移动按钮  │ │  │  └─────────────────────────┘   │ │  └───────────────────┘ │
│  │    * 删除按钮      │ │  └───────────────────────────────┘ │ │                       │
│  └─────────────────────┘ │                                   │ │                       │
└───────────────────────────┴───────────────────────────────────┴───────────────────────────┘

响应式布局（宽度<900px）:
┌──────────────────────────────────────────────────────────────┐
│  [浮动按钮]  │          main-content (100%)                 │  [浮动按钮]  │
│  (图层)     │  ┌─────────────────────────────────────────┐  │  (调色板)   │
│             │  │  toolbar                                │  │             │
│             │  ├─────────────────────────────────────────┤  │             │
│             │  │  canvas-container                       │  │             │
│             │  │  ┌───────────────────────────────────┐  │  │             │
│             │  │  │           mainCanvas              │  │  │             │
│             │  │  └───────────────────────────────────┘  │  │             │
│             │  └─────────────────────────────────────────┘  │             │
└──────────────────────────────────────────────────────────────┘

点击浮动按钮 → 侧边栏滑入（transform: translateX(0)）
```

## 快捷键绑定

| 快捷键 | 功能 | 触发位置 |
|--------|------|----------|
| Ctrl+Z | 撤销 | `main.js.handleKeyDown()` |
| R | 蘸墨 | `main.js.handleKeyDown()` |

## 工具提示

所有按钮均支持 `title` 属性，鼠标悬停0.5秒后显示提示。