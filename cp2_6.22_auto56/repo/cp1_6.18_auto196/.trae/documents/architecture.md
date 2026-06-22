# 渐变调色盘 - 技术架构文档

## 1. 技术选型

### 1.1 核心技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| React | ^18.2.0 | UI框架 |
| TypeScript | ^5.0.0 | 类型安全 |
| Vite | ^5.0.0 | 构建工具 |
| Zustand | ^4.4.0 | 状态管理 |
| react-colorful | ^5.6.1 | 颜色选择器 |

### 1.2 选择理由
- **Vite**：极速冷启动和HMR，适合需要高频实时预览的场景
- **Zustand**：轻量级状态管理，API简洁，支持时间旅行（撤销/重做）
- **react-colorful**：体积小（<2KB），性能优秀，支持多种颜色模式
- **TypeScript**：提供完整的类型系统，减少运行时错误

---

## 2. 目录结构

```
auto196/
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
└── src/
    ├── engine/
    │   └── ColorEngine.ts       # 核心色彩引擎
    ├── ui/
    │   ├── ColorPicker.tsx      # 色标编辑器
    │   ├── GradientCanvas.tsx   # 渐变预览画布
    │   └── GalleryPanel.tsx     # 瀑布流画廊
    ├── store/
    │   └── useGradientStore.ts  # Zustand状态管理
    ├── types/
    │   └── index.ts             # 类型定义
    ├── utils/
    │   └── colorUtils.ts        # 颜色工具函数
    ├── App.tsx                  # 主应用组件
    ├── main.tsx                 # 入口文件
    └── index.css                # 全局样式
```

---

## 3. 核心模块设计

### 3.1 ColorEngine (色彩引擎)
**文件**：[src/engine/ColorEngine.ts](file:///d:/Pro/tasks/auto196/src/engine/ColorEngine.ts)

**职责**：
- 色标管理（添加、删除、排序）
- 颜色插值计算（RGB/HSV/LAB空间）
- 步长生成算法
- 渐变CSS字符串生成

**核心接口**：
```typescript
interface ColorStop {
  id: string;
  color: string;
  position: number; // 0-100
}

interface GradientConfig {
  stops: ColorStop[];
  angle: number;    // 0-360
  steps: number;    // 10-100
}

class ColorEngine {
  generateColors(config: GradientConfig): string[];
  generateCSSGradient(config: GradientConfig): string;
  addStop(stops: ColorStop[], color: string, position: number): ColorStop[];
  removeStop(stops: ColorStop[], id: string): ColorStop[];
  validateStops(stops: ColorStop[]): boolean;
}
```

### 3.2 ColorPicker (色标编辑器)
**文件**：[src/ui/ColorPicker.tsx](file:///d:/Pro/tasks/auto196/src/ui/ColorPicker.tsx)

**职责**：
- 渲染渐变条背景
- 渲染可拖拽的圆形色标
- 集成react-colorful颜色选择器
- 处理色标拖拽事件

**核心交互**：
- `mousedown` 开始拖拽
- `mousemove` 更新位置
- `mouseup` 结束拖拽
- 点击色标弹出颜色选择器

### 3.3 GradientCanvas (渐变预览画布)
**文件**：[src/ui/GradientCanvas.tsx](file:///d:/Pro/tasks/auto196/src/ui/GradientCanvas.tsx)

**职责**：
- Canvas渲染大尺寸渐变色块
- 支持鼠标拖动平移
- 支持滚轮缩放
- 渲染颜色值标签

**性能优化**：
- 使用`requestAnimationFrame`确保60FPS
- 离屏Canvas预渲染渐变
- 颜色标签缓存避免重复计算

### 3.4 GalleryPanel (瀑布流画廊)
**文件**：[src/ui/GalleryPanel.tsx](file:///d:/Pro/tasks/auto196/src/ui/GalleryPanel.tsx)

**职责**：
- 瀑布流布局计算
- 收藏卡片渲染
- 卡片展开/收起
- CSS代码复制

**性能优化**：
- 使用`requestIdleCallback`进行布局计算
- 虚拟滚动（可选，根据收藏数量动态启用）
- 卡片缩略图预生成

---

## 4. 状态管理

### 4.1 Zustand Store 设计
**文件**：[src/store/useGradientStore.ts](file:///d:/Pro/tasks/auto196/src/store/useGradientStore.ts)

```typescript
interface GradientState {
  // 当前状态
  stops: ColorStop[];
  angle: number;
  steps: number;
  
  // 历史记录
  history: GradientConfig[];
  historyIndex: number;
  maxHistory: number;
  
  // 收藏列表
  favorites: SavedGradient[];
  
  // Actions
  setStops: (stops: ColorStop[]) => void;
  updateStop: (id: string, updates: Partial<ColorStop>) => void;
  addStop: (color: string, position: number) => void;
  removeStop: (id: string) => void;
  setAngle: (angle: number) => void;
  setSteps: (steps: number) => void;
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  addFavorite: () => void;
  removeFavorite: (id: string) => void;
}
```

### 4.2 撤销/重做实现
```typescript
// 每次状态变化前保存
const saveToHistory = () => {
  const newHistory = history.slice(0, historyIndex + 1);
  newHistory.push({ stops, angle, steps });
  
  if (newHistory.length > maxHistory) {
    newHistory.shift();
  } else {
    set({ historyIndex: historyIndex + 1 });
  }
  
  set({ history: newHistory });
};

const undo = () => {
  if (historyIndex > 0) {
    const prevState = history[historyIndex - 1];
    set({
      ...prevState,
      historyIndex: historyIndex - 1
    });
  }
};
```

---

## 5. 数据结构

### 5.1 核心类型
**文件**：[src/types/index.ts](file:///d:/Pro/tasks/auto196/src/types/index.ts)

```typescript
export interface ColorStop {
  id: string;
  color: string;
  position: number; // 0-100
}

export interface GradientConfig {
  stops: ColorStop[];
  angle: number;
  steps: number;
}

export interface SavedGradient extends GradientConfig {
  id: string;
  createdAt: number;
  name?: string;
}

export interface Point {
  x: number;
  y: number;
}
```

### 5.2 本地存储
- **存储键**：`gradient-palette-favorites`
- **数据格式**：JSON序列化的`SavedGradient[]`
- **持久化时机**：收藏/删除操作后立即写入

---

## 6. 性能优化策略

### 6.1 实时渲染优化
1. **防抖与节流**：
   - 颜色选择器使用`useMemo`缓存计算结果
   - 拖拽事件使用`requestAnimationFrame`批量更新

2. **React优化**：
   - 组件使用`React.memo`包装
   - 回调函数使用`useCallback`
   - 复杂计算使用`useMemo`缓存

### 6.2 瀑布流布局优化
```typescript
// 使用 requestIdleCallback 避免阻塞主线程
const calculateLayout = (items: SavedGradient[]) => {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      // 计算每列高度，分配卡片位置
    });
  } else {
    setTimeout(() => {
      // 降级方案
    }, 0);
  }
};
```

### 6.3 Canvas渲染优化
1. **离屏渲染**：渐变纹理预渲染到离屏Canvas
2. **脏矩形**：只重绘变化区域
3. **缩放优化**：使用CSS transform而非Canvas重绘

---

## 7. 组件数据流

```
                        ┌─────────────────────┐
                        │   useGradientStore  │
                        │   (Zustand Store)   │
                        └─────────┬───────────┘
                                  │
            ┌─────────────────────┼─────────────────────┐
            ▼                     ▼                     ▼
  ┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
  │   ColorPicker   │   │ GradientCanvas  │   │  GalleryPanel   │
  │  (色标编辑器)    │   │  (渐变预览)      │   │  (瀑布流画廊)    │
  └─────────┬───────┘   └─────────────────┘   └─────────┬───────┘
            │                                           │
            └───────────────────┬───────────────────────┘
                                ▼
                        ┌─────────────────────┐
                        │    ColorEngine      │
                        │  (色彩计算引擎)     │
                        └─────────────────────┘
```

---

## 8. 构建与部署

### 8.1 构建配置
- **Vite配置**：启用React插件，配置路径别名
- **TypeScript配置**：严格模式，target ES2020
- **生产构建**：代码分割、Tree Shaking、资源压缩

### 8.2 开发脚本
```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview"
}
```
