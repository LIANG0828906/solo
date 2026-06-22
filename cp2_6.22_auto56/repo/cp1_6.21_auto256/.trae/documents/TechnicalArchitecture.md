## 1. 架构设计

```mermaid
graph TD
    "App.tsx" --> "CanvasRenderer.ts"
    "App.tsx" --> "ControlPanel.tsx"
    "App.tsx" --> "types.ts"
    "CanvasRenderer.ts" --> "types.ts"
    "ControlPanel.tsx" --> "types.ts"
    "styles.css" --> "App.tsx"
    "styles.css" --> "ControlPanel.tsx"
```

## 2. 技术描述
- 前端：React 18 + TypeScript + Vite
- 状态管理：React useState/useRef（轻量级，无需全局状态库）
- 渲染：Canvas 2D API，requestAnimationFrame驱动
- 音频：Web Audio API（OscillatorNode + GainNode）
- 样式：原生CSS，CSS变量控制主题

## 3. 文件结构
| 文件 | 用途 |
|------|------|
| package.json | 依赖与脚本配置 |
| index.html | 入口页面 |
| vite.config.js | Vite构建配置 |
| tsconfig.json | TypeScript严格模式配置 |
| src/App.tsx | 主组件，布局与状态协调 |
| src/CanvasRenderer.ts | 画布渲染类，粒子系统与音频引擎 |
| src/ControlPanel.tsx | 控制面板UI组件 |
| src/types.ts | 类型定义（粒子、主题、波形） |
| src/styles.css | 全局样式与动画 |

## 4. 类型定义

```typescript
// 波形类型
type WaveformType = 'sine' | 'square' | 'sawtooth' | 'triangle';

// 颜色主题
interface ColorTheme {
  name: string;
  colors: string[];
}

// 爆炸粒子
interface ExplosionParticle {
  id: number;
  x: number;
  y: number;
  startX: number;
  startY: number;
  targetX: number;
  targetY: number;
  radius: number;
  color: string;
  colorIndex: number;
  opacity: number;
  startTime: number;
  duration: number;
}

// 音符粒子（拖拽轨迹）
interface NoteParticle {
  id: number;
  x: number;
  y: number;
  radius: number;
  baseColor: string;
  colorIndex: number;
  brightness: number;
  opacity: number;
  createdAt: number;
  lifetime: number;
  fadeOutStart: number;
}
```

## 5. 性能优化
- 粒子数量上限200个，超出时优先移除最早的粒子
- requestAnimationFrame驱动渲染，目标帧率30FPS+
- 使用对象池复用粒子对象，减少GC
- 画布尺寸变化时只重算必要参数
