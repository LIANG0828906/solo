## 1. 架构设计

```mermaid
flowchart TD
    "React前端" --> "Zustand状态管理"
    "Zustand状态管理" --> "渐变色层数据"
    "Zustand状态管理" --> "预设主题数据"
    "Zustand状态管理" --> "导出功能"
    "React前端" --> "GradientLayer组件"
    "React前端" --> "PreviewPanel组件"
    "React前端" --> "ColorPicker组件"
    "GradientLayer组件" --> "角度旋钮"
    "GradientLayer组件" --> "停止点滑块"
    "GradientLayer组件" --> "拖拽排序"
    "PreviewPanel组件" --> "渐变叠加渲染"
    "PreviewPanel组件" --> "鼠标拾色"
    "ColorPicker组件" --> "14×14色板"
    "ColorPicker组件" --> "吸管按钮"
    "react-colorful" --> "ColorPicker组件"
```

## 2. 技术说明

- 前端：React@18 + TypeScript + Vite
- 状态管理：Zustand
- 颜色选择器：react-colorful
- 初始化工具：vite-init (react-ts模板)
- 后端：无
- 数据库：无

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 单页应用，所有功能在一个页面内完成 |

## 4. 数据模型

### 4.1 核心数据结构

```typescript
interface GradientLayer {
  id: string;
  startColor: string;
  endColor: string;
  angle: number;
  stop1: number;
  stop2: number;
}

interface PresetTheme {
  id: string;
  name: string;
  icon: 'circle' | 'triangle' | 'star';
  layers: GradientLayer[];
}
```

### 4.2 预设主题初始数据

6个预设主题：日落红橙、海洋蓝绿、极光紫绿、火焰红黄、森林绿棕、星系紫蓝

## 5. 文件结构

```
├── package.json
├── index.html
├── tsconfig.json
├── vite.config.js
└── src/
    ├── App.tsx                    # 主应用组件
    ├── components/
    │   ├── GradientLayer.tsx      # 渐变色层组件
    │   ├── PreviewPanel.tsx       # 预览区组件
    │   └── ColorPicker.tsx        # 颜色选择器组件
    ├── store/
    │   └── useGradientStore.ts    # Zustand状态管理
    └── utils/
        └── gradientUtils.ts       # 工具函数
```

## 6. 关键实现细节

### 6.1 拖拽排序
- 使用HTML5 Drag and Drop API
- 拖拽时显示蓝色高亮插入标记（300ms CSS transition）
- 释放后弹性动画（CSS spring animation, 0.5s）

### 6.2 角度旋钮
- 自定义圆形旋钮组件
- requestAnimationFrame驱动旋转动画
- 外圈30°间隔刻度线用SVG绘制
- 拖拽时计算鼠标相对于旋钮中心的角度

### 6.3 颜色拾取
- 使用Canvas API的getImageData获取像素颜色
- 吸管模式：鼠标变为crosshair，点击拾取颜色
- Esc键退出吸管模式

### 6.4 渐变色代码生成
- 格式：`background: linear-gradient(angle, color1 stop1%, color2 stop2%, ...)`
- 多层叠加时按顺序拼接

### 6.5 预设切换动画
- opacity从0到1，500ms CSS transition
- 切换时渐变色层和预览区同步动画
