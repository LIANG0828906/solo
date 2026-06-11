## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        "index.html[入口页面]"
        "main.ts[主控制器]"
        "colorHarmony.ts[配色算法模块]"
        "canvasRenderer.ts[渲染模块]"
    end

    "index.html" --> "main.ts"
    "main.ts" --> "colorHarmony.ts"
    "main.ts" --> "canvasRenderer.ts"
    "colorHarmony.ts" --> "canvasRenderer.ts"

    subgraph "数据流"
        "用户交互事件" --> "main.ts"
        "main.ts" --> "色相角度+坐标"
        "色相角度+坐标" --> "colorHarmony.ts"
        "colorHarmony.ts" --> "HSL配色数据"
        "HSL配色数据" --> "canvasRenderer.ts"
        "canvasRenderer.ts" --> "Canvas绘制输出"
    end
```

## 2. 技术说明

- **前端**：TypeScript + 原生JavaScript（无框架），Canvas 2D API
- **构建工具**：Vite + TypeScript
- **依赖**：typescript, vite（无其他第三方依赖）
- **后端**：无

## 3. 文件结构与职责

| 文件 | 职责 | 调用关系 |
|------|------|----------|
| package.json | 依赖管理，启动脚本 `npm run dev` | - |
| vite.config.js | 构建配置，入口index.html，端口3000 | - |
| tsconfig.json | TypeScript严格模式，target ES2020 | - |
| index.html | 入口页面，全屏浅灰渐变背景，居中布局 | 引用src/main.ts |
| src/main.ts | 主控制器，初始化Canvas，事件分发，数据流管理 | 调用colorHarmony.ts, canvasRenderer.ts |
| src/colorHarmony.ts | 核心算法，输入色相角度输出配色HSL值列表 | 被main.ts调用 |
| src/canvasRenderer.ts | 渲染模块，绘制色相环/滑块/卡片/渐变条 | 被main.ts调用，接收colorHarmony数据 |

### 3.1 数据流向

```
用户拖拽滑块 → main.ts捕获事件 → 计算色相角度
    → colorHarmony.computeHarmonies(hue, lockedColors) → 返回配色数据
    → canvasRenderer.renderAll(hue, harmonies, lockedStates) → Canvas重绘
```

### 3.2 模块接口定义

**colorHarmony.ts 导出接口：**
```typescript
interface HarmonyResult {
  complementary: HSLColor[];   // 互补色方案
  analogous: HSLColor[];      // 类似色方案
  triadic: HSLColor[];        // 三角色方案
}

interface HSLColor {
  h: number;  // 0-360
  s: number;  // 0-100
  l: number;  // 0-100
}

function computeHarmonies(hue: number, lockedColors: Map<string, HSLColor>): HarmonyResult;
function computeGradients(colors: HSLColor[]): GradientConfig[];
```

**canvasRenderer.ts 导出接口：**
```typescript
interface RenderState {
  hue: number;
  harmonies: HarmonyResult;
  lockedCards: Set<string>;
  lockedSliders: Map<string, number>;  // cardId → hue
}

function initRenderer(canvas: HTMLCanvasElement): void;
function renderAll(state: RenderState): void;
function renderHueWheel(hue: number, lockedSliders: Map<string, number>): void;
function renderCards(harmonies: HarmonyResult, lockedCards: Set<string>): void;
function renderGradients(gradients: GradientConfig[]): void;
```

## 4. 性能优化策略

1. **离屏Canvas缓存**：色相环静态部分（360度渐变）绘制到离屏Canvas，拖拽时仅重绘滑块层
2. **增量渲染**：渐变色条使用离屏Canvas缓存，仅当配色方案变化时重新生成
3. **requestAnimationFrame**：滑块拖拽事件通过RAF节流，确保16ms帧预算
4. **避免GC**：预分配渲染状态对象，减少拖拽过程中的对象创建

## 5. 响应式实现

- CSS媒体查询 `@media (max-width: 767px)` 控制分栏布局切换
- Canvas尺寸通过JS动态计算，监听 `resize` 事件
- 色相环直径：桌面端300px，移动端180px（Canvas 2x DPR适配）
