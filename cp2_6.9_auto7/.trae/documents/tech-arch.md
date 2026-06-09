## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层"
        A["App.tsx (主组件)
        B["UI组件层"]
        C["3D场景层"]
    end
    
    subgraph "状态管理层"
        D["React Context / useState"]
    end
    
    subgraph "渲染引擎层"
        E["Three.js"]
        F["@react-three/fiber"]
        G["@react-three/drei"]
    end
    
    subgraph "动画层"
        H["framer-motion"]
        I["Three.js Animation"]
    end
    
    A --> B
    A --> C
    B --> D
    C --> D
    C --> E
    C --> F
    C --> G
    B --> H
    C --> I
```

## 2. 技术描述

* **前端框架**：React\@18 + TypeScript\@5

* **构建工具**：Vite\@5 + @vitejs/plugin-react\@4

* **3D渲染**：three\@0.160 + @react-three/fiber\@8 + @react-three/drei\@9

* **UI动画**：framer-motion\@11

* **样式方案**：CSS Modules + 内联样式

* **无后端，无数据库，所有数据为前端模拟**

## 3. 目录结构

```
src/
├── App.tsx              # 主组件，全局状态管理
├── main.tsx             # 入口文件
├── index.css            # 全局样式
├── scene/
│   ├── SeaBattle.tsx  # 3D场景核心组件
│   ├── Warship.tsx     # 战船组件
│   ├── Sea.tsx         # 海面组件
│   ├── Cannonball.tsx  # 炮弹组件
│   └── Particles.tsx  # 粒子系统
├── ui/
│   ├── Panel.tsx       # UI面板组件
│   ├── FormationCard.tsx  # 阵型卡片
│   ├── InfoPanel.tsx   # 信息面板
│   └── ControlPanel.tsx  # 控制面板
├── types/
│   └── index.ts        # 类型定义
└── utils/
    ├── formations.ts   # 阵型配置
    └── animation.ts    # 动画工具函数
    └── math.ts         # 数学计算
```

## 4. 核心类型定义

```typescript
// 阵型类型
type FormationType = 'yanxing' | 'yulin' | 'yanyue';

// 战船接口
interface Warship {
  id: number;
  position: [number, number, number];
  targetPosition: [number, number, number];
  health: number;
  isMoving: boolean;
  isSelected: boolean;
}

// 炮弹接口
interface Cannonball {
  id: number;
  startPos: [number, number, number];
  targetPos: [number, number, number];
  progress: number;
  speed: number;
}

// 阵型配置接口
interface FormationConfig {
  name: string;
  nameEn: string;
  description: string;
  totalFirepower: number;
  hitProbability: number;
  positions: [number, number, number][];
}

// 全局状态接口
interface AppState {
  currentFormation: FormationType;
  isPaused: boolean;
  selectedShipId: number | null;
  isFiring: boolean;
  windStrength: number;
  windDirection: [number, number, number];
}
```

## 5. 核心模块设计

### 5.1 阵型系统

* 预定义三种阵型的20艘战船位置坐标

* 切换阵型时计算每艘船的移动路径

* 使用lerp插值实现0.5秒平滑移动动画

* 移动时绘制半透明虚线路径

### 5.2 战船渲染

* 使用Three.js基本几何体组合构建木制帆船模型（船体、桅杆、船帆）

* 船体尺寸：长3单位、高1.5单位、宽1单位

* 每艘船左右各3门炮，共6门炮

* 上方显示HTML Sprite编号和血量条

* 选中时显示金色脉冲光环

### 5.3 炮击系统

* 抛物线轨迹计算：y = y0 + v0*t - 0.5*g\*t²

* 每艘船左右舷随机选择1-3门炮同时发射

* 炮弹对象池管理，最多50颗同时存在

* 尾烟粒子系统，水柱碰撞特效

### 5.4 海面系统

* 顶点着色器实现正弦波动画：y = A\*sin(2πx/λ + t)

* 波长8单位，振幅0.2单位

* 风向影响波浪方向偏移

* 白色波浪反光线条

### 5.5 交互系统

* Raycaster实现3D物体拾取

* 拖拽战船使用平面投影计算位置

* 键盘空格键暂停/恢复

* 事件委托优化性能

## 6. 性能优化策略

1. **实例化渲染**：使用InstancedMesh渲染20艘战船，减少Draw Call
2. **对象池**：炮弹和粒子使用对象池复用，避免频繁GC
3. **LOD**：远距离战船简化模型
4. **帧率控制**：requestAnimationFrame使用deltaTime控制动画速度
5. **状态合并**：减少React重渲染，使用useMemo/useCallback
6. **WebGL优化**：开启抗锯齿，合理设置像素比，避免显存泄漏
7. **帧率目标**：60FPS正常渲染，30FPS最低保障

