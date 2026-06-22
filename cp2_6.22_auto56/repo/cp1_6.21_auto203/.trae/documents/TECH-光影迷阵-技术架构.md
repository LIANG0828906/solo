## 1. 架构设计

```mermaid
flowchart TD
    subgraph "用户交互层"
        A["用户输入（键盘/鼠标/触摸")
    end
    subgraph "UI控制层 (UIController.tsx)
        B["HUD面板渲染
        - 关卡/步数/重置
        - 角度滑块控件
        - 状态消息提示
    end
    subgraph "游戏核心层 (GameCore.tsx)
        C["Three.js 3D场景
        - 迷宫/机关/光线
        D["光线物理引擎
        - 光线投射与碰撞
        - 反射/色散/透射
        E["状态管理
        - 机关角度状态
        - 关卡数据
        - 通关判定
    end
    subgraph "渲染层 (@react-three/fiber)
        F["R3F Canvas
        - 相机（等距45°）
        G["后期处理
        - Bloom发光
    end
    subgraph "构建工具链
        H["Vite + TypeScript"]
    end

    A -->|DOM事件
    A -->|R3F事件
    B -->|操作意图
    B -->|机关角度变更
    E -->|游戏状态
    C -->|渲染调用
    C -->|输出HUD数据
    D -->|光线路径数据
    E -->|通关/中断状态
    C --> F
    F --> G
    G -->|合成输出
    H --> F
```

## 2. 技术描述

- **前端框架**：React@18 + ReactDOM@18
- **开发语言**：TypeScript@5（严格模式）
- **构建工具**：Vite@5 + @vitejs/plugin-react@4
- **3D渲染引擎**：three@0.160 + @react-three/fiber@8 + @react-three/drei@9
- **后期处理**：@react-three/postprocessing（Bloom/Vignette）
- **状态管理**：React useState/useReducer + Context（轻量级，无需额外库）
- **样式方案**：原生CSS + CSS Modules（避免额外依赖）
- **字体**：Google Fonts CDN（Orbitron + Noto Sans SC）
- **初始化方式**：手动搭建项目结构（不使用create-vite默认模板）

## 3. 目录结构与文件职责

```
auto203/
├── index.html                          入口HTML（全屏背景、字体引入）
├── package.json                      依赖与脚本
├── vite.config.js                    Vite 构建配置（TS严格模式）
├── tsconfig.json                   TS 配置（严格 + ESNext）
├── tsconfig.node.json              Node端TS配置
├── src/
│   ├── main.tsx                    React 入口
│   ├── App.tsx                     应用根组件
│   ├── GameCore.tsx                【游戏核心3D组件】
│   │   ├── Three场景、相机初始化
│   │   ├── 光线物理模拟（投射-碰撞-反射/色散/透射）
│   │   ├── 机关状态管理
│   │   ├── 关卡数据与切换
│   │   └── 通关/中断判定
│   ├── UIController.tsx           【UI控制面板组件】
│   │   ├── HUD渲染（关卡/步数/重置/操作说明）
│   │   ├── 机关选中时的角度滑块控件
│   │   ├── 状态提示（通关/中断消息）
│   │   └── 响应式适配
│   ├── types/
│   │   └── game.ts                  类型定义
│   ├── utils/
│   │   ├── levels.ts                关卡配置数据
│   │   ├── rayTracer.ts            光线追踪计算函数（纯函数，便于单元测试）
│   │   └── helpers.ts             通用工具函数
│   ├── components/
│   │   ├── three/
│   │   │   ├── Maze.tsx           迷宫墙体
│   │   │   ├── LightEmitter.tsx    光线发射器
│   │   │   ├── LightRay.tsx        光线路径渲染
│   │   │   ├── Mirror.tsx          反射镜
│   │   │   ├── Prism.tsx           棱镜
│   │   │   ├── TranslucentWall.tsx 半透明挡板
│   │   │   ├── LightSensor.tsx    光感应器
│   │   │   ├── AngleIndicator.tsx 角度指示环
│   │   │   ├── SelectionRing.tsx 选中高亮圆环
│   │   │   ├── VictoryParticles.tsx 胜利粒子
│   │   │   └── Starfield.tsx      背景星空
│   │   └── ui/
│   │       ├── HUDPanel.tsx         HUD面板
│   │       ├── AngleSlider.tsx     角度滑块控件
│   │       ├── StatusMessage.tsx   状态消息提示
│   │       └── MobileDial.tsx     移动端角度拨盘
│   └── styles/
│       ├── globals.css                全局样式（背景、字体、CSS变量）
│       └── ui.module.css         UI组件样式
```

### 文件间调用关系与数据流向

| 模块/文件 | 职责 | 输入 → 输出 |
|------------|------|-------------|
| `App.tsx` | 根组件，组合GameCore与UIController | 无 → 渲染两者并传递Context |
| `GameCore.tsx` | 游戏核心，管理状态与3D渲染 | 用户输入(通过props/Context) → 游戏状态 → UIController |
| `UIController.tsx` | UI面板与交互控件 | GameCore的状态(Context) → 用户操作意图回调 → GameCore |
| `levels.ts` | 关卡配置（纯数据，无逻辑 | 关卡索引 → 关卡对象 |
| `rayTracer.ts` | 光线追踪计算（纯函数） | 光线起点方向，方向，机关列表，墙体 → 线段数组 |
| `helpers.ts` | 工具（矩阵/向量/角度转换 | 通用数学运算辅助 |
| `Maze.tsx等3D子组件 | 渲染各3D元素 | props数据 → Three.js Mesh/Line |
| `HUDPanel.tsx等UI子组件 | 渲染UI元素 | state/props → React元素 |

数据流向总览：
用户输入 → GameCore（物理计算+状态更新）→ Context → UIController（渲染反馈）

## 4. 类型定义（TypeScript

```typescript
// types/game.ts
export type MechanismType = 'mirror' | 'prism' | 'translucent';

export interface Vector2 {
  x: number;
  y: number;
}

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Mechanism {
  id: string;
  type: MechanismType;
  position: Vector3; // 世界坐标
  rotation: number; // Y轴旋转角度（弧度或度，统一定义）
  size: Vector3;
}

export interface Wall {
  position: Vector3;
  size: Vector3;
}

export interface LightEmitter {
  position: Vector3;
  direction: Vector3; // 初始发射方向
}

export interface LightSensor {
  position: Vector3;
  radius: number; // 直径1单位→radius=0.5
}

export interface LevelConfig {
  id: number;
  name: string;
  mazeSize: { width: number; depth: number };
  walls: Wall[];
  mechanisms: Mechanism[];
  emitter: LightEmitter;
  sensor: LightSensor;
}

export interface LightSegment {
  start: Vector3;
  end: Vector3;
  color: string; // 十六进制颜色
  intensity: number; // 0-1 强度（用于半透射）
}

export interface GameState {
  currentLevel: number;
  steps: number;
  selectedMechanismId: string | null;
  mechanisms: Record<string, Mechanism>;
  lightPath: LightSegment[];
  isCompleted: boolean;
  isPathBroken: boolean;
  isVictoryAnimating: boolean;
}
```

## 5. 核心算法与性能策略

### 5.1 光线追踪算法（rayTracer.ts）
- **投射-碰撞检测**：使用光线-AABB相交测试（墙体、感应器），光线-平面相交测试（镜面/棱镜/半透）
- **反射计算**：基于入射向量与法向量计算反射方向 `R = D - 2(D·N)N`
- **棱镜色散**：模拟入射光分裂为RGB三束分光，折射角分别偏移±15°、0°、+15°（近似色散效果）
- **半透射处理**：光线能量分为透射（强度×0.6）+反射（强度×0.4）
- **递归深度限制**：最大递归10层，防止死循环
- **碰撞精度**：使用epsilon=0.001避免浮点误差

### 5.2 性能优化措施
- **光线重算触发节流**：使用 requestAnimationFrame 内单次计算，限制频率
- **对象池**：线段/向量对象复用，减少GC
- **离屏剔除**：仅对场景内可见墙体/机关参与碰撞
- **碰撞加速**：空间网格划分（简单关卡用遍历即可，3个关卡数据量小可不用复杂加速结构

## 6. 机关操控与状态管理策略

- **状态位置变化通过 React Context 传递 GameState
- **角度调整回滚**：临时角度存储 previousRotation，失败时恢复
- **机关旋转插值**：使用 useFrame 对旋转进行 lerp 平滑过渡
- **关卡切换**：重置 steps 归零，机关角度复原，光线路径重新计算

## 7. 响应式与触控适配方案

- **设备检测**：window.matchMedia / 触摸事件检测
- **鼠标滚轮**：wheel 事件，deltaY映射为角度增减，步长5°
- **触控手势**：PointerEvents 统一处理
- **移动端控件**：底部 AngleDial 组件，Canvas绘制角度拨盘
- **视口适配**：监听 resize 事件，更新 R3F camera aspect 自适应
