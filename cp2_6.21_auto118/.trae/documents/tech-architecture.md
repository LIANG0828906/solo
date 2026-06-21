## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        UI["ui.ts<br/>浮动工具栏DOM"]
        INT["interaction.ts<br/>鼠标/键盘交互"]
        SCENE["scene.ts<br/>Three.js场景管理"]
    end
    subgraph "数据层"
        GRID["grid.ts<br/>体素网格数据模型"]
        CFG["config.ts<br/>常量配置"]
    end
    subgraph "渲染层"
        THREE["Three.js<br/>WebGL渲染"]
    end

    INT --> "调用方法" --> GRID
    UI --> "派发操作" --> INT
    UI --> "读取状态" --> GRID
    GRID --> "通知变更" --> SCENE
    SCENE --> "更新" --> THREE
    CFG --> "被引用" --> SCENE
    CFG --> "被引用" --> GRID
    CFG --> "被引用" --> INT
    CFG --> "被引用" --> UI
```

## 2. 技术说明

- 前端：TypeScript + Three.js + Vite
- 构建工具：Vite
- 无后端、无数据库、纯前端应用
- 初始化：`npm install && npm run dev`

## 3. 文件结构

| 文件 | 职责 |
|------|------|
| package.json | 依赖：three, typescript, vite, @types/three；脚本：npm run dev |
| index.html | 入口页面，含meta viewport和标题 |
| tsconfig.json | TypeScript strict模式配置 |
| vite.config.js | Vite构建配置 |
| src/config.ts | 常量配置：颜色列表、网格尺寸、相机初始位置、动画时长等 |
| src/scene.ts | 场景/相机/渲染器/轨道控制初始化与循环，接收grid状态变更→更新Three.js场景 |
| src/grid.ts | 体素网格数据模型：方块添加/移除/撤销重做栈/碰撞检测 |
| src/interaction.ts | 鼠标点击/拖拽框选/键盘快捷键交互逻辑 |
| src/ui.ts | 浮动工具栏DOM构建/色板/视角切换，读取grid状态→更新UI，派发操作至interaction |

## 4. 数据流

### 4.1 放置方块
```
用户点击 → interaction.ts(Raycasting检测) → grid.ts(addVoxel+碰撞检测) → scene.ts(创建Mesh+动画)
```

### 4.2 移除方块
```
用户点击/R键 → interaction.ts(切换模式/Raycasting) → grid.ts(removeVoxel) → scene.ts(动画+移除Mesh)
```

### 4.3 框选批量删除
```
鼠标拖拽 → interaction.ts(计算选区矩形) → grid.ts(查询选区内方块) → scene.ts(高亮闪烁+批量删除)
```

### 4.4 撤销/重做
```
Ctrl+Z/Ctrl+Shift+Z → interaction.ts(快捷键) → grid.ts(undo/redo栈操作) → scene.ts(更新场景)
```

### 4.5 视角切换
```
下拉菜单选择 → ui.ts(派发事件) → scene.ts(相机平滑过渡)
```

## 5. 性能策略

- 使用InstancedMesh或合批渲染减少DrawCall
- 网格数据使用Map<string, VoxelData>实现O(1)查询
- Raycasting仅在鼠标事件时触发，不做持续轮询
- 动画使用requestAnimationFrame统一调度
- 目标：2000方块30FPS+，操作响应<50ms

## 6. 关键数据结构

```typescript
interface VoxelData {
  x: number;
  y: number;
  z: number;
  color: string;
  mesh: THREE.Mesh;
}

interface GridState {
  voxels: Map<string, VoxelData>;
  undoStack: VoxelOperation[];
  redoStack: VoxelOperation[];
}

type VoxelOperation = {
  type: 'add' | 'remove';
  voxels: VoxelData[];
};
```
