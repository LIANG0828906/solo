
## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端 (React + TypeScript + Vite)"
        A["App.tsx 主布局"] --> B["控制面板组件"]
        A --> C["画布渲染组件"]
        A --> D["导出模态框组件"]
        B --> E["噪声类型选择器"]
        B --> F["参数滑块组"]
        B --> G["颜色映射调色板"]
        B --> H["预设列表"]
        C --> I["CanvasRenderer.ts 渲染模块"]
        J["NoiseEngine.ts 噪声算法"]
        K["api.ts API调用模块"]
    end
    subgraph "后端 (Express + TypeScript)"
        L["server/index.ts Express服务"]
        M["内存存储 presets[]"]
        L --> M
    end
    subgraph "数据流"
        J -->|"本地计算"| I
        J -->|"或API获取"| I
        K <-->|"REST API"| L
    end
```

## 2. 技术描述

- **前端框架**：React@18 + TypeScript@5 + Vite@5
- **构建工具**：Vite，使用@vitejs/plugin-react
- **状态管理**：React useState/useRef（局部状态）
- **HTTP客户端**：axios
- **后端框架**：Express@4 + TypeScript
- **跨域处理**：cors
- **ID生成**：uuid
- **渲染方式**：HTML5 Canvas 2D API
- **数据存储**：后端内存存储（开发阶段）

## 3. 文件结构

```
auto113/
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── NoiseEngine.ts
│   ├── CanvasRenderer.ts
│   └── api.ts
└── server/
    └── index.ts
```

## 4. API 定义

### 类型定义

```typescript
interface ColorStop {
  position: number; // 0.0 - 1.0
  color: string;    // hex color
}

interface Preset {
  id: string;
  name: string;
  noiseType: 'perlin' | 'simplex' | 'worley';
  frequency: number;
  octaves: number;
  seed: number;
  colorStops: ColorStop[];
  createdAt: number;
}
```

### API 端点

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/presets | 获取所有预设列表 |
| POST | /api/presets | 保存新的预设配置 |

### 请求/响应模式

**GET /api/presets**
- 响应: `{ presets: Preset[] }`

**POST /api/presets**
- 请求体: `{ name: string, noiseType, frequency, octaves, seed, colorStops }`
- 响应: `{ success: true, preset: Preset }`

## 5. 服务器架构

```mermaid
flowchart LR
    A["Express Router"] --> B["GET /api/presets"]
    A --> C["POST /api/presets"]
    B --> D["内存存储 presets[]"]
    C --> D
```

## 6. 核心模块说明

### 6.1 NoiseEngine.ts
- `generateNoise(type, width, height, seed, frequency, octaves): Float32Array`
- 实现 Perlin、Simplex、Worley 三种噪声算法
- 输出归一化的噪声值矩阵 (0.0 - 1.0)

### 6.2 CanvasRenderer.ts
- `render(canvas, noiseData, colorStops, fadeInProgress?): void`
- 将噪声数据映射到颜色渐变
- 支持淡入过渡动画

### 6.3 性能优化
- 使用 requestAnimationFrame 节流渲染
- 参数调节使用 debounce 避免过度计算
- Canvas 直接操作 ImageData 提升性能
