## 1. 架构设计

```mermaid
graph TD
    subgraph "前端层"
        A["React + TypeScript"] --> B["Vite 构建系统"]
        A --> C["Three.js (3D渲染")
        A --> D["@react-three/fiber"]
        A --> E["@react-three/drei"]
        A --> F["Framer Motion (动画)"]
        A --> G["Zustand (状态管理)"]
    end
    
    subgraph "组件层"
        H["锻造场景组件<br/>ForgeSetup.tsx"]
        I["交互控制组件<br/>ForgeControls.tsx"]
        J["矿石拖拽组件"]
        K["熔炉系统组件"]
        L["锻打铁砧组件"]
        M["淬火槽组件"]
        N["磨刀石组件"]
        O["成品展示组件"]
    end
    
    subgraph "状态层"
        P["gameStore.ts<br/>全局状态"]
    end
    
    subgraph "工具层"
        Q["forgePhysics.ts<br/>物理计算"]
    end
    
    G --> P
    P --> H
    P --> I
    Q --> P
    I --> J
    I --> K
    I --> L
    I --> M
    I --> N
    I --> O
    H --> C
    H --> D
    H --> E
```

## 2. 技术描述

* **前端框架**：React\@18 + TypeScript\@5

* **构建工具**：Vite\@5 + @vitejs/plugin-react

* **3D引擎**：Three.js + @react-three/fiber + @react-three/drei

* **状态管理**：Zustand

* **动画库**：Framer Motion

* **音频处理**：Web Audio API

* **样式方案**：CSS Modules + 内联样式（动画）

## 3. 核心目录结构

```
auto22/
├── package.json
├── index.html
├── tsconfig.json
├── vite.config.js
└── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── index.css
│   ├── scene/
│   │   └── ForgeSetup.tsx
│   ├── components/
│   │   ├── ForgeControls.tsx
│   │   ├── OreRack.tsx
│   │   ├── Furnace.tsx
│   │   ├── Anvil.tsx
│   │   ├── QuenchTank.tsx
│   │   ├── Grindstone.tsx
│   │   └── BladeDisplay.tsx
│   │   └── ParticleSystem.tsx
│   ├── store/
│   │   └── gameStore.ts
│   ├── utils/
│   │   └── forgePhysics.ts
│   ├── hooks/
│   │   └── useDragDrop.ts
│   │   └── useAudio.ts
│   └── types/
│       └── index.ts
```

## 4. 状态模型定义

### 4.1 核心状态

| 状态变量             | 类型                     | 范围                                                                     | 说明       |
| ---------------- | ---------------------- | ---------------------------------------------------------------------- | -------- |
| currentPhase     | enum                   | ORE\_SELECTION → MELTING → FORGING → QUENCHING → SHARPENING → FINISHED | 当前锻造阶段   |
| selectedOre      | string                 | hematite / magnetite / limonite / null                                 | 已选矿石类型   |
| fireTemperature  | number                 | 800-1500                                                               | 炉温（摄氏度）  |
| carbonContent    | number                 | 0.2-4.3                                                                | 铁水含碳量（%） |
| oxygenSupply     | number                 | 0-100                                                                  | 供氧量（%）   |
| fuelAmount       | number                 | 0-10                                                                   | 燃料量      |
| ingotTemperature | number                 | 600-1200                                                               | 铁锭温度     |
| ingotShape       | {width, height, depth} | -                                                                      | 铁锭尺寸比例   |
| hammerCount      | number                 | 0-200                                                                  | 锤击次数     |
| lastHammerTime   | number                 | -                                                                      | 上次锤击时间戳  |
| deviationRate    | number                 | 0-100                                                                  | 形状偏差率（%） |
| quenchLiquid     | string                 | water / oil / null                                                     | 淬火液类型    |
| hardness         | number                 | 20-60                                                                  | 洛氏硬度HRC  |
| toughness        | number                 | 10-40                                                                  | 冲击韧性J    |
| roughness        | number                 | 10-100                                                                 | 表面粗糙度    |
| patternType      | string                 | wave / straight / spiral / null                                        | 开光纹理类型   |
| isQualityPass    | boolean                | -                                                                      | 品质是否合格   |
| bladeFinalized   | boolean                | -                                                                      | 成品是否完成   |

### 4.2 类型定义

```typescript
type OreType = 'hematite' | 'magnetite' | 'limonite';
type FuelType = 'charcoal' | 'coal';
type QuenchLiquidType = 'water' | 'oil';
type PatternType = 'wave' | 'straight' | 'spiral';
type ForgePhase = 'ORE_SELECTION' | 'MELTING' | 'FORGING' | 'QUENCHING' | 'SHARPENING' | 'FINISHED';

interface OreInfo {
  type: OreType;
  name: string;
  color: string;
  ironContent: number;
}

interface IngotShape {
  width: number;
  height: number;
  depth: number;
}

interface BladeQuality {
  hardness: number;
  toughness: number;
  isPass: boolean;
  isTooBrittle: boolean;
  isTooFragile: boolean;
}

interface GameState {
  currentPhase: ForgePhase;
  selectedOre: OreType | null;
  fireTemperature: number;
  carbonContent: number;
  oxygenSupply: number;
  fuelAmount: number;
  ingotTemperature: number;
  ingotShape: IngotShape;
  hammerCount: number;
  deviationRate: number;
  quenchLiquid: QuenchLiquidType | null;
  hardness: number;
  toughness: number;
  roughness: number;
  patternType: PatternType | null;
  isQualityPass: boolean;
  bladeFinalized: boolean;
  setOre: (ore: OreType) => void;
  addFuel: (fuel: FuelType) => void;
  pumpBellow: (level: number) => void;
  hammerBlow: () => void;
  quench: (liquid: QuenchLiquidType) => void;
  sharpen: (distance: number) => void;
  finalizeBlade: () => void;
  resetForge: () => void;
}
```

## 5. 数据校验规则

| 参数    | 校验规则              |
| ----- | ----------------- |
| 含碳量   | 0.2% - 4.3%       |
| 炉温    | 800℃ - 1500℃      |
| 硬度    | HRC 20 - 60       |
| 韧性    | J 10 - 40         |
| 供氧量   | 0% - 100%         |
| 锤击次数  | 0 - 200（超过需重置）    |
| 粗糙度   | 10 - 100          |
| 形状偏差率 | < 10% 为优质         |
| 合格判定  | 硬度45-55 且 韧性25-35 |

## 6. 性能优化策略

1. **状态更新批处理**：使用 Zustand 批量更新状态，减少重渲染
2. **requestAnimationFrame**：所有动画统一使用 RAF 驱动
3. **粒子对象池**：粒子特效复用对象，避免频繁GC
4. **Web Worker**：物理计算移入Worker线程
5. **CSS 硬件加速**：transform/opacity 动画优先
6. **Three.js 优化**：InstancedMesh 处理粒子，LOD 优化
7. **memo 优化**：React.memo 包裹纯展示组件
8. **事件节流**：鼠标移动/拖动事件节流5ms

