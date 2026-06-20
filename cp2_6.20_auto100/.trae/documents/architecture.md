## 1. 架构设计

```mermaid
graph TD
    subgraph "前端应用 (React + TypeScript)
        A["App.tsx 路由与全局状态]
        A --> B["DataInput.tsx 数据输入模块"]
        A --> C["PosterCanvas.tsx 海报画布模块"]
        B --> D["audioEngine.ts Web Audio API"]
        C --> E["posterExport.ts 导出工具"]
    end
    
    subgraph "外部资源"
        F["Google Fonts - Playfair Display"]
        G["html2canvas - PNG渲染"]
        H["jsPDF - PDF生成"]
    end
    
    A --> F
    C --> G
    C --> H
```

## 2. 技术说明
- 前端框架: React 18 + TypeScript 5
- 构建工具: Vite 5
- 状态管理: React useState/useContext
- 音频处理: Web Audio API
- 海报导出: html2canvas + jsPDF
- 字体: Google Fonts (Playfair Display)
- ID生成: uuid

## 3. 文件结构

```
├── package.json
├── index.html
├── vite.config.js
├── tsconfig.json
└── src/
    ├── App.tsx
    ├── components/
    │   ├── DataInput.tsx
    │   └── PosterCanvas.tsx
    └── utils/
    │   ├── audioEngine.ts
    │   └── posterExport.ts
    └── styles/
        └── global.css
```

## 4. 类型定义

### 4.1 数据类型

```typescript
interface Song {
  id: string;
  name: string;
  artist: string;
  album: string;
  playCount: number;
  duration: number;
  genres: string[];
  lyrics: string;
  color: string;
}

interface GradientScheme {
  id: string;
  name: string;
  colors: string[];
}

interface PosterData {
  songs: Song[];
  topArtist: string;
  totalDuration: number;
  genres: string[];
  selectedGradient: GradientScheme;
  lyricsStartTime: number;
}
```

## 5. 核心实现要点

### 5.1 Web Audio API 音频生成
- 使用 OscillatorNode 创建简单旋律
- 生成 15 秒音乐片段
- 频率根据歌曲索引生成不同旋律

### 5.2 歌词动画实现
- 使用 requestAnimationFrame 实现高性能动画
- 打字机效果: 逐词显示，随机延迟 50-150ms
- 当前词放大 1.05 倍并带有颜色渐变上浮动画

### 5.3 海报渲染
- 使用 Canvas API 直接渲染海报内容
- html2canvas 捕获 DOM 元素转 PNG
- jsPDF 生成 A4 比例 PDF

### 5.4 性能优化
- CSS transform + opacity 实现硬件加速动画
- 歌词动画使用 CSS transitions 而非频繁重排
- 防抖处理用户交互事件
