## 1. 技术架构设计

本项目为纯前端3D交互应用，采用TypeScript + Three.js + Vite技术栈。

```mermaid
graph TD
    subgraph "前端层"
        A["index.html 入口"] --> B["main.ts 主控制器"]
        B --> C["modelData.ts 模型数据"]
        B --> D["interaction.ts 交互控制"]
        B --> E["infoPanel.ts UI面板"]
        F["style.css 样式"]
    end
    
    subgraph "渲染层"
        G["Three.js 3D引擎"]
        H["WebGL渲染器"]
        I["场景/相机/光照"]
    end
    
    subgraph "数据流"
        C -->|"提供分段数据" B
        D -->|"调用更新" E
        B -->|"注册事件监听" D
        D -->|"选中分段数据" E
    end
```

**数据流向说明：
1. `main.ts` 读取 `modelData.ts` 中的沉船分段配置数据，用于创建各个船段网格
2. `main.ts` 将鼠标事件绑定到 `interaction.ts` 中的交互处理函数
3. 用户点击船段时，`interaction.ts` 通过Raycaster检测到命中的分段后，调用 `infoPanel.ts` 的 `update` 方法传入该分段的考古详情数据
4. `infoPanel.ts` 根据接收到的数据更新DOM，展示信息面板

## 2. 技术栈说明

- **前端框架**：原生TypeScript（无React/Vue，轻量级3D应用）
- **3D引擎**：Three.js (r160+)
- **构建工具**：Vite 5.x
- **类型定义**：@types/three
- **静态资源插件**：vite-plugin-static-copy
- **语言**：TypeScript 5.x（严格模式）
- **模块系统**：ES Module

## 3. 文件结构与职责

| 文件路径 | 职责描述 | 依赖关系 |
|----------|----------|----------|
| `package.json` | 项目依赖和脚本配置 | 无 |
| `vite.config.js` | Vite构建配置（base: '', outDir: 'dist'） | 无 |
| `tsconfig.json` | TypeScript配置（严格模式，ES模块） | 无 |
| `index.html` | 应用入口，包含全屏容器 `<div id="app"></div>` | 引入main.ts |
| `src/main.ts` | 初始化场景、相机、渲染器，创建船段网格，启动动画循环 | 依赖 modelData.ts, interaction.ts, infoPanel.ts |
| `src/modelData.ts` | 导出沉船分段数据：位置、尺寸、颜色材质、考古注释 | 无（被main.ts导入） |
| `src/interaction.ts` | Raycaster点击检测、拖拽旋转、船段高亮、注释气泡展开/收起 | 被main.ts注册为事件监听器，调用infoPanel.ts |
| `src/infoPanel.ts` | 生成并更新右侧信息面板，操作DOM展示考古详情 | 被interaction.ts调用 |
| `src/style.css` | 全局样式，深海背景、信息面板毛玻璃效果、响应式布局 | 被index.html引入 |

## 4. 核心模块设计

### 4.1 数据模型定义

**ShipSegment（船段数据接口）

```typescript
interface ShipSegment {
  id: string;
  name: string;
  position: { x: number; y: number; z: number };
  size: { width: number; height: number; depth: number };
  color: number;
  archaeology: {
    era: string;
    material: string;
    usage: string;
    description: string;
  };
}
```

**6个船段定义**：
1. 龙骨（Keel）：船体底部纵向结构
2. 船首（Bow）：船体前端
3. 船尾（Stern）：船体后端
4. 船舷（Hull Side）：船体两侧
5. 甲板（Deck）：船体顶部平面
6. 桅杆（Mast）：垂直立柱

### 4.2 核心函数

**main.ts 核心函数**：
- `initScene()` - 初始化Three.js场景、相机、渲染器
- `createShipSegments()` - 根据modelData创建各船段网格
- `createLightBeams()` - 创建环绕船体的浅蓝色光束
- `animate()` - requestAnimationFrame动画循环
- `onWindowResize()` - 窗口大小变化处理

**interaction.ts 核心函数**：
- `initInteraction(renderer, camera, scene, shipSegments, controls)` - 初始化交互
- `onMouseClick(event)` - 鼠标点击事件处理，Raycaster检测
- `highlightSegment(segment)` - 高亮选中船段
- `resetSegments()` - 重置所有船段状态

**infoPanel.ts 核心函数**：
- `createPanel()` - 创建信息面板DOM
- `update(segmentData)` - 更新面板内容
- `show()` - 面板滑入动画
- `hide()` - 面板滑出动画
- `toggleDescription()` - 展开/收起详细描述

### 4.3 性能优化策略

1. **模型复杂度控制**：使用简单几何体（BoxGeometry为主），总三角面数控制在5000以内
2. **材质优化**：复用几何体和材质，程序生成纹理贴图（CanvasTexture）
3. **动画优化**：使用requestAnimationFrame，仅在需要时更新状态
4. **渲染优化**：禁用未选中船段降低透明度而非隐藏，减少draw call
5. **事件节流**：鼠标移动事件节流处理

## 5. 响应式设计断点

| 断点 | 布局模式 | 信息面板位置 |
|------|----------|--------------|
| ≥800px | 左右分栏 | 右侧占25%宽度 |
| <800px | 全屏叠加 | 底部弹出卡片 |

## 6. 动画参数

| 动画类型 | 时长 | 缓动函数 |
|----------|------|----------|
| 信息面板滑入/滑出 | 0.5s | ease-in-out |
| 船段高亮脉动 | 2s周期 | sine wave |
| 光束环绕旋转 | 20s/圈 | linear |
| 船段透明度变化 | 0.3s | ease-out |
