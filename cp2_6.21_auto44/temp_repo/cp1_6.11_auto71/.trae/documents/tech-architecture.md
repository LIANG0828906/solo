## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        "index.html" --> "main.ts"
        "main.ts" --> "gallery.ts"
        "main.ts" --> "card.ts"
        "gallery.ts" --> "card.ts"
    end
    subgraph "构建层"
        "vite.config.js" --> "TypeScript编译"
        "tsconfig.json" --> "TypeScript编译"
    end
    subgraph "运行时"
        "CSS 3D Transform" --> "透视投影渲染"
        "requestAnimationFrame" --> "动画循环"
        "DOM事件系统" --> "交互控制"
    end
```

## 2. 技术说明

- **前端**：TypeScript + 原生JavaScript，不依赖任何第三方库
- **构建工具**：Vite（仅用于开发服务器和TypeScript编译）
- **3D渲染方案**：纯CSS 3D Transform（perspective、transform-style: preserve-3d、rotateX/Y/Z、translate3d）
- **动画方案**：requestAnimationFrame + CSS transition 混合
- **状态管理**：Gallery类内部管理，无框架依赖

## 3. 文件结构

| 文件 | 职责 |
|------|------|
| `package.json` | 项目依赖（typescript, vite）和启动脚本 |
| `index.html` | 入口页面，全屏深色渐变背景，居中容器，加载动画 |
| `vite.config.js` | 构建配置，index.html作为入口，端口3000 |
| `tsconfig.json` | TypeScript严格模式，target ES2020，moduleResolution bundler |
| `src/card.ts` | Card类：几何属性、正反面纹理、翻转状态、交互事件 |
| `src/gallery.ts` | Gallery类：卡片集合、堆叠布局、透视相机、拖拽/缩放、添加/移除动画 |
| `src/main.ts` | 程序入口：初始化Gallery，绑定输入框事件，启动渲染循环 |

## 4. 核心类设计

### 4.1 Card类

```typescript
class Card {
  // 几何属性
  x, y, z: number          // 3D空间位置
  rotationX, rotationY: number  // 旋转角度
  width, height: number     // 卡片尺寸

  // 纹理属性
  url: string               // 网址
  title: string             // 标题
  description: string       // 描述
  frontTexture: string      // 正面抽象纹理(CSS渐变)

  // 状态
  isFlipped: boolean        // 是否翻转
  isHovered: boolean        // 是否悬停
  breathPhase: number       // 呼吸动画相位

  // DOM
  element: HTMLElement      // 卡片DOM元素

  // 方法
  generateTexture(): string  // Unicode→HSL映射生成纹理
  flip(): void              // 翻转动画
  update(deltaTime): void   // 更新呼吸动画
  dispose(): void           // 销毁
}
```

### 4.2 Gallery类

```typescript
class Gallery {
  // 卡片集合
  cards: Card[]
  maxCards: number = 36

  // 相机/视角
  perspective: number
  cameraRotX: number = -30°  // 俯视30度
  cameraRotY: number
  zoom: number = 1.0          // 缩放0.5-3

  // 拖拽状态
  isDragging: boolean
  dragSensitivity: number = 0.1
  inertiaDamping: number = 0.85
  velocityX, velocityY: number

  // 方法
  addCard(url: string): void       // 添加卡片(弹射动画)
  removeOldestCard(): void         // 移除最早卡片(淡出动画)
  layout(): void                   // 堆叠布局算法
  handleDrag(event): void          // 拖拽旋转
  handleZoom(event): void          // 滚轮缩放
  update(deltaTime): void          // 动画循环更新
  render(): void                   // 渲染
}
```

## 5. 关键算法

### 5.1 Unicode→HSL纹理映射

- 遍历URL中每个字符的charCode
- charCode % 360 → HSL色相
- 多层渐变叠加：线性渐变 + 径向渐变 + 随机角度
- 生成唯一CSS背景属性

### 5.2 堆叠布局算法

- 卡片沿Z轴堆叠，层间距随zoom动态调整
- 每张卡片随机偏移X/Y，模拟自然散落
- 相机俯视30度，透视投影近大远小

### 5.3 动画系统

- **呼吸摇摆**：sin(time * speed) * 0.03弧度，每张卡片相位随机偏移
- **弹射飞入**：cubic-bezier先加速后减速，从输入框位置到目标位置
- **翻转动画**：CSS transition rotateY 180°，0.6s ease-out
- **淡出移除**：opacity 1→0，0.3s

## 6. 性能策略

- 使用CSS transform和will-change: transform触发GPU加速
- requestAnimationFrame驱动动画循环，避免setTimeout
- 拖拽/缩放时跳过非必要重绘
- 卡片DOM复用，避免频繁创建销毁
- 36张卡片上限保证DOM节点数可控
