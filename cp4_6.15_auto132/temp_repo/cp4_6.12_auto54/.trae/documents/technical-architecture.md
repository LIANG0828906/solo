## 1. 架构设计

```mermaid
graph TD
    A["index.html 入口"] --> B["App.tsx 主应用"]
    B --> C["ColorPicker.tsx 色板选择"]
    B --> D["TextureCanvas.tsx 纹理画布"]
    C -->|色板数组 [6 colors]| B
    B -->|色板 + 速度| D
    D -->|p5.js 渲染| E["浏览器Canvas"]
    F["预设主题数据"] --> C
    G["导出工具函数"] --> B
```

## 2. 技术描述

- **前端框架**：React 18 + TypeScript 5
- **构建工具**：Vite 5
- **图形渲染**：p5.js + react-p5-wrapper
- **样式方案**：原生 CSS + CSS 变量（不使用 Tailwind，满足自定义玻璃效果需求）
- **状态管理**：React useState/useRef（简单场景无需 Zustand）

### 核心依赖包
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "p5": "^1.9.0",
  "react-p5-wrapper": "^4.1.2",
  "typescript": "^5.3.0",
  "vite": "^5.0