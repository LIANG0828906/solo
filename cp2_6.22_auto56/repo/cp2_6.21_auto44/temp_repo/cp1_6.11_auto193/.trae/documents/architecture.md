## 1. 架构设计

```mermaid
graph TD
    "浏览器" --> "index.html 入口"
    "index.html 入口" --> "main.ts 场景初始化"
    "main.ts 场景初始化" --> "HunTianYiModel.ts 3D模型构建"
    "main.ts 场景初始化" --> "InteractionManager.ts 交互管理"
    "main.ts 场景初始化" --> "UIOverlay.ts UI层"
    "HunTianYiModel.ts 3D模型构建" --> "Three.js 渲染循环"
    "InteractionManager.ts 交互管理" --> "Three.js 渲染循环"
    "UIOverlay.ts UI层" --> "Three.js 渲染循环"
```

## 2. 技术描述

- **前端框架**：原生 TypeScript + Three.js
- **构建工具**：Vite
- **3D引擎**：Three.js（@types/three类型定义）
- **UI方案**：原生 DOM + CSS Flex 布局
- **音频**：Web Audio API 合成金属摩擦音效

## 3. 文件结构

| 文件路径 | 用途 |
|---------|------|
| `package.json` | 项目依赖与脚本配置 |
| `index.html` | 入口HTML页面 |
| `vite.config.js` | Vite构建配置 |
| `tsconfig.json` | TypeScript编译配置 |
| `src/main.ts` | 主入口：初始化场景、相机、渲染器，启动动画循环 |
| `src/HunTianYiModel.ts` | 浑天仪模型：三环、地球、恒星、枢轴、观测孔构建 |
| `src/InteractionManager.ts` | 交互管理：拖拽旋转、视角控制、Raycaster拾取 |
| `src/UIOverlay.ts` | UI覆盖层：信息栏、工具栏、按钮DOM元素 |

## 4. 核心类与接口

### 4.1 HunTianYiModel

```typescript
class HunTianYiModel {
  group: THREE.Group;
  horizonRing: THREE.Group;    // 地平环 (直径6)
  equatorRing: THREE.Group;    // 赤道环 (直径5)
  eclipticRing: THREE.Group;   // 黄道环 (直径4)
  earth: THREE.Mesh;           // 中心地球
  stars: THREE.Points;         // 周围恒星
  observationHole: THREE.Mesh; // 观测孔

  getRingAngles(): { horizon: number; equator: number; ecliptic: number };
  rotateHorizon(angle: number): void;
  rotateEquator(angle: number): void;
  rotateEcliptic(angle: number): void;
  animate(delta: number): void;
}
```

### 4.2 InteractionManager

```typescript
class InteractionManager {
  constructor(
    camera: THREE.PerspectiveCamera,
    renderer: THREE.WebGLRenderer,
    model: HunTianYiModel,
    onAngleChange: (angles: RingAngles) => void
  );
  setAutoRotate(enabled: boolean): void;
  resetCamera(): void;
  captureScreenshot(): string;
  dispose(): void;
}
```

### 4.3 UIOverlay

```typescript
class UIOverlay {
  constructor(
    container: HTMLElement,
    callbacks: {
      onReset: () => void;
      onAutoRotate: (enabled: boolean) => void;
      onScreenshot: () => void;
      onObserve: () => void;
    }
  );
  updateAngles(angles: RingAngles): void;
  updateTimeInfo(shichen: string, jieqi: string): void;
  showConstellation(name: string): void;
  dispose(): void;
}
```

## 5. 性能优化策略

- 复用几何体和材质，减少DrawCalls
- 使用BufferGeometry存储粒子数据
- 环圈刻度使用InstancedMesh或合并几何体
- 合理设置像素比（不超过设备像素比上限）
- 视锥体剔除保持开启
- 音效按需创建，避免内存泄漏
