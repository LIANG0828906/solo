## 1. 架构设计

```mermaid
graph TD
    "React App (App.tsx)" --> "FarmGrid.tsx (Canvas农场)"
    "React App (App.tsx)" --> "WeatherSystem.ts (天气状态机)"
    "React App (App.tsx)" --> "InfoPanel.tsx (信息面板)"
    "WeatherSystem.ts" -->|"天气数据+粒子配置"| "FarmGrid.tsx"
    "WeatherSystem.ts" -->|"天气预报数据"| "InfoPanel.tsx"
    "FarmGrid.tsx" -->|"作物状态/收获事件"| "App.tsx"
    "App.tsx" -->|"金币/库存/体力"| "InfoPanel.tsx"
```

## 2. 技术说明

- **前端框架**：React 18 + TypeScript（严格模式）
- **构建工具**：Vite + @vitejs/plugin-react
- **渲染方式**：Canvas 2D 渲染农场主场景，React DOM 渲染 UI 叠加层
- **状态管理**：React useState/useReducer（游戏状态规模适中，无需 Zustand）
- **样式方案**：内联样式 + CSS Modules（像素风格需要精确像素控制）
- **后端**：无（纯前端单页应用）
- **数据库**：无（所有状态运行时维护）

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 游戏主页面（单页应用，唯一路由） |

## 4. 核心模块设计

### 4.1 WeatherSystem.ts（天气状态机）

```
状态: sunny | cloudy | rainy | stormy | windy
切换间隔: 30秒
输出:
  - 当前天气状态
  - 粒子配置（类型、密度、速度、方向）
  - 背景颜色（当前/目标，用于插值过渡）
  - 未来3天天气预报数组
事件:
  - weatherChange(newWeather, particleConfig, bgColor)
```

### 4.2 FarmGrid.tsx（Canvas农场渲染）

```
Canvas层:
  - 底层: 8x8土地格子（湿度变色）
  - 中层: 作物像素图（4阶段渲染）
  - 顶层: 采收动画粒子

交互:
  - 点击格子 → 计算格子坐标 → 弹出操作面板
  - 操作执行 → 更新格子状态 → 重绘Canvas

作物生长:
  - 4阶段: seed → sprout → flowering → mature
  - 番茄: 2x2绿点 → 4x4#32CD32 → 6x6+黄色#FFD700 → 8x8#FF4500
  - 生长速度受天气影响
```

### 4.3 InfoPanel.tsx（信息面板）

```
内容:
  - 当前天气详情（图标+文字+温度感）
  - 3天天气预报（像素图标行）
  - 金币数量
  - 作物库存列表

响应式:
  - 桌面: 右侧固定30%宽度
  - 移动: 底部抽屉，上滑展开0.3s弹簧动画
```

## 5. 数据模型

### 5.1 核心类型定义

```typescript
type WeatherState = 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'windy';

type CropStage = 'seed' | 'sprout' | 'flowering' | 'mature';

type CropType = 'tomato' | 'carrot' | 'wheat' | 'corn';

interface FarmCell {
  id: string;
  crop: CropType | null;
  stage: CropStage;
  moisture: number; // 0-1, 影响土地颜色
  health: number; // 0-1
  growthProgress: number; // 0-1
}

interface WeatherConfig {
  state: WeatherState;
  particles: ParticleConfig;
  bgColor: string;
  growthMultiplier: number;
  autoWater: boolean;
  damageChance: number;
}

interface GameState {
  grid: FarmCell[][]; // 8x8
  weather: WeatherState;
  weatherForecast: WeatherState[];
  stamina: number;
  gold: number;
  inventory: Record<CropType, number>;
  selectedCell: { row: number; col: number } | null;
}
```

## 6. 文件结构

```
├── package.json
├── index.html
├── vite.config.ts
├── tsconfig.json
└── src/
    ├── App.tsx          # 主组件，管理游戏状态和模块调度
    ├── farm/
    │   └── FarmGrid.tsx # Canvas农场渲染+格子交互+作物生长
    ├── weather/
    │   └── WeatherSystem.ts # 天气状态机+粒子配置+颜色过渡
    └── ui/
        └── InfoPanel.tsx    # 右侧信息面板+天气预报+金币库存
```
