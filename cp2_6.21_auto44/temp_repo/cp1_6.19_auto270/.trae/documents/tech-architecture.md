## 1. 架构设计

```mermaid
flowchart TD
    "A[React 前端]" --> "B[Vite 构建工具]"
    "A" --> "C[Zustand 状态管理]"
    "A" --> "D[Framer Motion 动画]"
    "A" --> "E[Canvas API 图像处理]"
    "E" --> "F[背景消除算法]"
    "E" --> "G[文字增强滤镜]"
    "E" --> "H[旋转与裁剪]"
    "C" --> "I[编辑历史栈（撤销/重做）]"
```

纯前端架构，无后端服务。所有图像处理在客户端通过Canvas API完成，状态通过Zustand管理。

## 2. 技术说明
- **前端**：React 18 + TypeScript + Vite
- **状态管理**：Zustand（信件图像数据、编辑历史、当前模板ID、旋转角度、对比度/亮度值）
- **动画**：Framer Motion（按钮回弹、模板切换、导出加载动画）
- **图像处理**：Canvas API（背景消除、滤镜、旋转、裁剪、导出）
- **构建工具**：Vite（resolve.alias指向src目录）
- **后端**：无
- **数据库**：无

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 应用主页，包含编辑区和模板面板 |

单页应用，无需路由。

## 4. 核心数据流

```
用户上传照片 → Image对象加载 → Canvas绘制 → 
背景消除处理 → 更新Store(图像数据+历史) → 
画布重绘(应用滤镜+旋转+裁剪) → 用户调节参数 → 
更新Store → 画布重绘 → 选择模板 → 更新Store → 
导出(创建离屏Canvas → 应用模板 → toBlob下载)
```

## 5. 文件结构

```
├── package.json
├── index.html
├── tsconfig.json
├── vite.config.js
└── src/
    ├── App.tsx                  # 主组件，布局容器
    ├── main.tsx                 # 入口
    ├── store/
    │   └── editorStore.ts       # Zustand store
    └── components/
        ├── EditorCanvas.tsx     # 画布编辑区组件
        └── TemplatePanel.tsx    # 模板选择面板组件
```

## 6. Zustand Store 设计

```typescript
interface EditorState {
  // 图像数据
  originalImage: HTMLImageElement | null;
  processedImageData: ImageData | null;
  
  // 编辑参数
  brightness: number;       // -50 ~ +50
  contrast: number;         // -50 ~ +50
  rotation: number;         // 0, 90, 180, 270
  fineRotation: number;     // -15 ~ +15, 步长0.5
  isEnhanced: boolean;
  
  // 模板
  currentTemplateId: string;
  signatureText: string;
  signatureFont: 'kaiti' | 'songti' | 'handwriting';
  signatureSize: number;    // 12 ~ 28
  
  // 手动裁剪
  cropRect: { x: number; y: number; w: number; h: number } | null;
  isCropping: boolean;
  
  // 历史记录
  history: HistoryEntry[];
  historyIndex: number;
  
  // 导出状态
  isExporting: boolean;
}
```

## 7. 模板定义

| 模板ID | 名称 | 信封色 | 边框 | 特色 |
|--------|------|--------|------|------|
| kraft | 牛皮纸信封 | #C19A6B | 无 | 带纹理 |
| parchment | 复古羊皮纸 | #EFE4C6 | 无 | 四角装饰棕色花纹 |
| modern | 现代简约白 | #FFFFFF | 2px #CCCCCC | 简洁灰边框 |
| business | 极黑商务 | #1A1A1A | #C9A96E金色细边 | 商务质感 |
