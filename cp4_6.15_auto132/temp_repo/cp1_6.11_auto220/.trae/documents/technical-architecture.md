
## 1. 架构设计

这是一个纯前端的3D可视化应用，采用模块化架构设计，使用TypeScript进行类型安全开发。

```mermaid
graph TD
    "A[入口 main.ts]" --> "B[场景初始化 SceneManager]"
    "B" --> "C[地形模块 terrain.ts]"
    "B" --> "D[单位模块 units.ts]"
    "B" --> "E[天气模块 weather.ts]"
    "B" --> "F[战斗控制模块 battle.ts]"
    "B" --> "G[UI控制面板 ui.ts]"
    "B" --> "H[回放系统 replay.ts]"
    "C" --> "I[Three.js Renderer]"
    "D" --> "I"
    "E" --> "I"
    "F" --> "D"
    "G" --> "F"
    "G" --> "E"
    "H" --> "F"
```

## 2. 技术描述

- **前端框架**：原生 TypeScript + Three.js（不使用React/Vue，遵循用户明确要求）
- **构建工具**：Vite 5.x
- **核心依赖**：
  - three@^0.160.0：3D渲染引擎
  - @types/three@^0.160.0：Three.js类型定义
  - typescript@^5.3.0：类型系统
  - vite@^5.0.0：构建与开发服务器

## 3. 项目文件结构

```
auto220/
├── package.json
├── index.html
├── vite.config.js
├── tsconfig.json
└── src/
    ├── main.ts          # 入口文件，初始化场景、相机、渲染器、动画循环
    ├── terrain.ts       # 地形生成模块（水域、平原、丘陵、树丛、土路）
    ├── units.ts         # 单位模块（Unit类、三方势力创建、移动、战斗）
    ├── weather.ts       # 天气系统（晴天、浓雾、雷雨、粒子、闪电）
    ├── battle.ts        # 战斗控制（阶段切换、AI逻辑、伤害计算）
    ├── ui.ts            # UI控制（面板、按钮、信息弹窗、战损报告）
    └── replay.ts        # 战役回放系统（记录、重播、暂停）
```

## 4. 核心模块定义

### 4.1 类型定义

```typescript
// 单位类型
type UnitType = 'ship' | 'infantry' | 'cavalry';
type Faction = 'wu' | 'wei' | 'shu';
type UnitState = 'idle' | 'march' | 'engage' | 'retreat' | 'dead';
type WeatherType = 'sunny' | 'fog' | 'storm';
type BattlePhase = 'march' | 'engage' | 'retreat';

interface UnitData {
  id: string;
  name: string;
  type: UnitType;
  faction: Faction;
  position: THREE.Vector3;
  health: number;
  maxHealth: number;
  attack: number;
  speed: number;
  state: UnitState;
  mesh: THREE.Group;
  target: THREE.Vector3 | null;
  enemy: Unit | null;
}

interface BattleStats {
  faction: Faction;
  initialCount: number;
  remainingCount: number;
  totalLoss: number;
  winRate: number;
}

interface ReplayFrame {
  timestamp: number;
  units: Array<{ id: string; position: [number, number, number]; rotation: number; health: number; state: UnitState }>;
  weather: WeatherType;
  phase: BattlePhase;
}
```

### 4.2 地形模块（terrain.ts）
- 使用 `PlaneGeometry` 200x200单位，64x64细分
- 区域划分：左侧水域（宽50）、中部平原、右侧丘陵
- 水域：正弦波顶点动画，频率0.5Hz，振幅0.3
- 平原：随机分布60棵树（树干+两层圆锥树冠）
- 丘陵：高度起伏2-8单位
- 土路：三条TubeGeometry，宽6单位，连接三区域

### 4.3 单位模块（units.ts）
- **吴国战船**：5艘楼船（BoxGeometry船体+Cylinder桅杆+Plane帆布+旗帜布料），间距15单位
- **魏国步兵**：10人方阵（宽20单位），银灰盔甲，长矛+盾牌
- **蜀国骑兵**：6骑楔形阵（宽25单位），马匹+绿色披风
- 移动：朝向目标平滑插值，避障逻辑
- 战斗：距离<5单位触发，伤害±15%波动，每秒更新

### 4.4 天气模块（weather.ts）
- **晴天**：DirectionalLight从左上照射，椭圆阴影
- **浓雾**：FogExp2雾效（密度1.5），灰白色调，视距80
- **雷雨**：AmbientLight变暗，雨粒子系统（最多500），随机闪电（5-10秒/次）

### 4.5 战斗模块（battle.ts）
- 行军阶段：各单位按速度移动（吴0.8/魏1.5/蜀2.5）
- 接战阶段：自动索敌，面朝敌人，伤害数字飘出
- 撤退阶段：1.5倍速度向边界撤退，3秒渐隐
- 胜负判定：一方全灭触发结束

### 4.6 UI模块（ui.ts）
- 天气控制区（顶部中央，三圆形按钮）
- 战斗控制面板（右下角，三按钮+时间滑块）
- 单位信息面板（古风卷轴220x160px）
- 战损报告（居中弹窗400x300px）
- FPS计数器（左上角）

### 4.7 回放模块（replay.ts）
- 每帧记录所有单位状态、天气、阶段
- 重演：2倍速完整回放
- 暂停/继续控制

## 5. 性能优化策略

1. **几何复用**：相同单位使用BufferGeometry实例化
2. **材质共享**：同类型单位共享材质实例
3. **视锥剔除**：Three.js自动启用
4. **粒子池**：雨粒子对象池复用，避免频繁GC
5. **插值优化**：单位移动lerp率0.1，平衡平滑与性能
6. **LOD**：远距离单位减少细节渲染
7. **帧率监控**：动态调整粒子数量维持目标帧率

## 6. 构建配置

### Vite配置（vite.config.js）
- 入口：index.html
- 端口：3000
- sourcemap：开启
- 优化依赖：three预构建

### TypeScript配置（tsconfig.json）
- target: ES2020
- moduleResolution: bundler
- strict: true
- 声明输出：禁用（应用项目）
