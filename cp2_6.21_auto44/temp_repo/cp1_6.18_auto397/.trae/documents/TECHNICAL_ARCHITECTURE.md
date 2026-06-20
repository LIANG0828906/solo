## 1. 架构设计

```mermaid
flowchart LR
    A["用户交互层<br/>React Components"] --> B["状态管理层<br/>Zustand Store"]
    B --> C["物理引擎层<br/>PhysicsEngine"]
    C --> D["渲染层<br/>Three.js / R3F"]
    E["UI组件"] --> A
    D --> F["Canvas输出"]
```

### 层次说明
- **用户交互层**：处理鼠标点击、拖拽、触摸等用户输入，触发状态变更
- **状态管理层**：使用Zustand管理天体列表、模拟模式、速度倍率、选中天体等全局状态
- **物理引擎层**：纯函数模块，实现引力计算、位置更新、碰撞检测、边界反弹
- **渲染层**：使用React Three Fiber将天体数据渲染为3D/2D可视化效果

## 2. 技术描述

- **前端框架**：React@18 + TypeScript
- **构建工具**：Vite@5
- **3D渲染**：three@0.160 + @react-three/fiber@8 + @react-three/drei@9
- **状态管理**：zustand@4
- **工具库**：uuid@9（生成唯一ID）
- **类型定义**：@types/react, @types/react-dom
- **开发服务器**：Vite内置开发服务器，端口默认5173

## 3. 项目文件结构

| 文件路径 | 职责描述 |
|----------|----------|
| `package.json` | 项目依赖配置，启动脚本 `npm run dev` |
| `vite.config.js` | Vite配置，React插件，开发服务器设置 |
| `tsconfig.json` | TypeScript严格模式配置，target ES2020 |
| `index.html` | 入口HTML页面，挂载React根节点 |
| `src/App.tsx` | 根组件，初始化Three场景，挂载UI和控制面板 |
| `src/store/SimulationStore.ts` | Zustand状态管理，天体列表、模式、速度、选中状态 |
| `src/engine/PhysicsEngine.ts` | 物理引擎纯函数，引力计算、Verlet积分、碰撞、边界 |
| `src/components/CelestialBody.tsx` | R3F天体组件，渲染球体、标签、速度箭头、选中圆环 |
| `src/components/ControlPanel.tsx` | React控制面板组件，模式切换、创建按钮、速度滑块 |

## 4. 数据模型

### 4.1 天体数据结构

```typescript
interface CelestialBody {
  id: string;
  name: string;
  type: 'star' | 'planet';
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  previousPosition?: { x: number; y: number };
  mass: number;
  radius: number;
  color: string;
}
```

### 4.2 模拟状态

```typescript
interface SimulationState {
  bodies: CelestialBody[];
  mode: 'free' | 'stable' | 'demo';
  speed: number; // 0.1 - 3.0
  selectedBodyId: string | null;
  fps: number;
  maxBodies: number; // 12
}
```

### 4.3 模拟模式枚举

```typescript
type SimulationMode = 'free' | 'stable' | 'demo';

// 自由模式：无边界，天体可飞出可视区域
// 稳定模式：画布边缘反弹，速度衰减为0.8倍
// 演示模式：加载内置预设场景
```

## 5. 物理引擎核心算法

### 5.1 万有引力计算
```
F = G * M1 * M2 / r²
其中 G = 100 (引力常数，为可视化效果调整)
r 为两天体中心距离
```

### 5.2 Verlet积分
```
x_next = x_current + (x_current - x_previous) + a * dt²
v = (x_next - x_previous) / (2 * dt)
```

### 5.3 碰撞检测
```
距离检测：distance(body1, body2) < body1.radius + body2.radius
碰撞后合并：质量相加，动量守恒计算新速度
```

### 5.4 边界反弹（稳定模式）
```
if x < radius or x > canvasWidth - radius:
    vx = -vx * 0.8
if y < radius or y > canvasHeight - radius:
    vy = -vy * 0.8
```

## 6. 性能优化策略

1. **批量渲染**：使用Three.js InstancedMesh减少draw call
2. **物理计算优化**：O(n²)引力计算限制n≤12，使用TypedArray加速计算
3. **自适应渲染精度**：天体数量>10时，缩小描边宽度和标签字号至80%
4. **FPS统计**：使用requestAnimationFrame时间戳计算帧率，平滑显示
5. **状态更新**：Zustand状态变更使用浅比较，避免不必要的重渲染

## 7. 预设场景数据

### 7.1 双星系统
- 恒星A：质量1000，位置(400, 400)，速度(0, -0.5)
- 恒星B：质量800，位置(800, 400)，速度(0, 0.5)

### 7.2 三体运动
- 天体A：质量500，位置(600, 200)，速度(1, 0)
- 天体B：质量500，位置(300, 600)，速度(-0.5, 0.866)
- 天体C：质量500，位置(900, 600)，速度(-0.5, -0.866)

### 7.3 太阳系缩影
- 太阳：质量2000，位置(600, 400)，速度(0, 0)
- 水星：质量1，位置(680, 400)，速度(0, 3)
- 金星：质量1.5，位置(750, 400)，速度(0, 2.5)
- 地球：质量2，位置(820, 400)，速度(0, 2)
- 火星：质量1，位置(890, 400)，速度(0, 1.7)
