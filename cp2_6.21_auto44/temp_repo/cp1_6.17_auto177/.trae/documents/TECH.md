## 1. 架构设计

```mermaid
graph TD
    subgraph "表现层 (UI)"
        A["Canvas.tsx<br/>画布UI组件"]
        B["Gallery.tsx<br/>画廊UI组件"]
        C["Toolbar.tsx<br/>工具栏组件"]
        D["ColorPalette.tsx<br/>色盘组件"]
        E["App.tsx<br/>主应用/路由"]
    end
    subgraph "业务逻辑层"
        F["WatercolorEngine.ts<br/>水彩绘画引擎"]
        G["GalleryManager.ts<br/>画廊管理模块"]
    end
    subgraph "通信层"
        H["EventBus.ts<br/>全局事件总线"]
    end
    subgraph "状态管理层"
        I["Zustand Store<br/>绘画参数状态"]
        J["Zustand Store<br/>画廊状态"]
    end
    subgraph "数据持久层"
        K["localStorage<br/>作品存储"]
    end
    A -->|鼠标/触控坐标| F
    F -->|像素颜色矩阵| A
    F -->|emit(save)| H
    H -->|on(save)| G
    G -->|读写| K
    G -->|作品列表| B
    I -->|参数| F
    J -->|状态| B
    E --> A
    E --> B
    E --> C
    E --> D
```

## 2. 技术说明

- **前端框架**：React@18 + TypeScript@5
- **构建工具**：Vite@5 + @vitejs/plugin-react@4
- **状态管理**：Zustand@4（轻量级状态管理，适合绘画参数和画廊状态）
- **唯一ID**：uuid@9
- **UI样式**：CSS Modules + 全局CSS变量（无UI库依赖，确保自定义水彩风格）
- **路由**：React Router（SPA页面切换：画布/画廊/详情）
- **初始化方式**：npm create vite@latest 手动配置TypeScript

## 3. 路由定义

| 路由 | 用途 | 页面组件 |
|------|------|----------|
| / | 重定向至画布页 | - |
| /canvas | 水彩绘画画布主页 | CanvasPage |
| /gallery | 作品画廊瀑布流 | GalleryPage |
| /gallery/:id | 作品详情与评论页 | GalleryDetail |

## 4. 核心模块文件结构与调用关系

```
src/
├── main.tsx                      # 应用入口，挂载React
├── App.tsx                       # 路由配置 + 全局布局（导航栏）
├── types/
│   └── index.ts                  # 全局TypeScript类型定义
├── EventBus.ts                   # emit/on事件总线，WatercolorEngine→GalleryManager
├── WatercolorEngine.ts           # 核心类：颜色混合、颜料扩散、纸张吸附算法
├── GalleryManager.ts             # 单例类：作品CRUD、点赞、评论、localStorage操作
├── store/
│   ├── paintStore.ts             # Zustand：笔刷参数、当前颜色、撤销栈
│   └── galleryStore.ts           # Zustand：作品列表、当前作品、评论面板状态
├── components/
│   ├── Layout.tsx                # 顶部导航栏布局组件
│   ├── Canvas/
│   │   ├── Canvas.tsx            # 画布渲染 + 事件转发给WatercolorEngine
│   │   ├── Toolbar.tsx           # 左侧可展开工具栏（滑块+纹理+吸管）
│   │   └── ColorPalette.tsx      # 底部12色色盘 + RGB显示
│   └── Gallery/
│       ├── Gallery.tsx           # 瀑布流主容器
│       ├── ArtworkCard.tsx       # 作品卡片（缩略图/点赞/评论）
│       ├── CommentPanel.tsx      # 右侧滑入评论面板
│       └── GalleryDetail.tsx     # 详情页：大图+评论列表+输入框
└── styles/
    ├── global.css                # CSS变量、全局样式、字体
    ├── canvas.module.css         # 画布相关样式
    ├── toolbar.module.css        # 工具栏样式（滑块发光、展开动画）
    └── gallery.module.css        # 瀑布流、卡片悬浮、评论面板样式
```

### 数据流向说明
1. **绘画主循环**：`Canvas.tsx` 监听 `mousemove/touchmove` → 坐标 + 速度传入 `WatercolorEngine.stroke()` → 引擎调用 `diffuse()` 和 `blendColors()` → 返回 `ImageData` 像素矩阵 → `Canvas.tsx` 用 `ctx.putImageData()` 渲染
2. **保存流程**：点击保存 → `Canvas.tsx` 调用 `WatercolorEngine.exportBase64()` → `EventBus.emit({type:'save', payload})` → `GalleryManager.ts` 监听并写入 `localStorage` → `galleryStore` 更新列表
3. **画廊读取**：`Gallery.tsx` 挂载时调 `GalleryManager.getAll()` → 作品快照 + 缩略图 → 瀑布流 Masonry 布局渲染

## 5. 核心算法说明

### 5.1 WatercolorEngine 核心方法
| 方法 | 说明 |
|------|------|
| `constructor(width, height, texture)` | 初始化像素缓冲区、四叉树空间索引 |
| `stroke(x, y, pressure, speed, color, params)` | 单次笔触：计算颜料浓度，调用扩散与混合 |
| `diffuse(centerX, centerY, radius, concentration)` | 四叉树加速的相邻像素扩散：高斯衰减分布颜料 |
| `blendColors(basePixel, newPaint, waterContent)` | 基于颜料含水量的alpha叠加与色相混合算法 |
| `applyPaperTexture(pixel, textureStrength)` | 按纸张纹理强度给像素添加颗粒噪声吸附 |
| `finalizeDiffusion()` | 松开鼠标后0.5秒内继续完成渗入扩散（requestAnimationFrame） |
| `exportBase64()` | 将像素矩阵→canvas→toDataURL()返回Base64 |
| `getPixelColor(x, y)` | 吸管工具：取3x3区域平均RGB |

### 5.2 性能优化
- **四叉树加速**：扩散半径内像素遍历从O(n²)降至O(n log n)，保证每帧<16ms
- **离屏Canvas**：纹理图层预渲染，切换时仅更换滤镜
- **缩略图预生成**：保存时同步生成220px宽缩略图存入localStorage，画廊首屏<1s
- **撤销栈**：差分存储而非全帧快照，20步内存可控

## 6. 数据模型

### 6.1 类型定义

```typescript
// 颜料/像素颜色
interface RGB {
  r: number; g: number; b: number; a?: number;
}

// 笔刷参数状态
interface BrushParams {
  size: number;           // 8-80
  waterContent: number;   // 0-100
  textureStrength: number;// 0-100
  paperType: PaperType;
  currentColor: RGB;
}

// 纸张类型
type PaperType = 'fine' | 'medium' | 'rough' | 'cold' | 'hot';

// 作品存储结构
interface Artwork {
  id: string;                      // uuid
  title: string;
  author: string;                  // 默认"匿名画师"
  thumbnail: string;               // 220px宽缩略图 Base64
  fullImage: string;               // 全尺寸 Base64
  width: number;
  height: number;
  paperType: PaperType;
  likes: number;
  isLiked: boolean;
  comments: Comment[];
  createdAt: number;               // timestamp
}

// 评论
interface Comment {
  id: string;
  author: string;
  avatar: string;                  // emoji头像
  content: string;
  timestamp: number;
}

// EventBus消息
interface BusEvent {
  type: 'paint' | 'save' | 'delete' | 'like';
  payload: Partial<Artwork> | { id: string } | any;
}
```

### 6.2 localStorage 键结构
- `watercolor_artworks`：`Artwork[]` 序列化JSON
- `watercolor_undo_stack`：`string[]` 20帧Base64快照（循环覆盖）
