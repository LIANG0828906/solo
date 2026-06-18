## 1. 架构设计

```mermaid
graph TD
    "用户界面层 (React)" --> "状态管理层 (Zustand)"
    "用户界面层 (React)" --> "3D渲染层 (@react-three/fiber)"
    "状态管理层 (Zustand)" --> "3D渲染层 (@react-three/fiber)"
    "3D渲染层 (@react-three/fiber)" --> "Three.js 引擎"
    "数据层 (moleculeData.ts)" --> "状态管理层 (Zustand)"
    "数据层 (moleculeData.ts)" --> "3D渲染层 (@react-three/fiber)"
    
    subgraph "组件结构"
        "App.tsx" --> "MoleculeViewer.tsx"
        "App.tsx" --> "UIPanel.tsx"
        "MoleculeViewer.tsx" --> "Atom组件"
        "MoleculeViewer.tsx" --> "Bond组件"
        "MoleculeViewer.tsx" --> "Label组件"
    end
```

## 2. 技术说明

- 前端框架：React 18 + TypeScript
- 构建工具：Vite 5 + @vitejs/plugin-react
- 3D渲染：Three.js + @react-three/fiber + @react-three/drei
- 状态管理：Zustand
- 无后端、无数据库，分子数据内置mock

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 主页面（唯一页面） |

## 4. 数据模型

### 4.1 分子数据结构

```typescript
interface Atom {
  id: string;
  element: 'O' | 'H' | 'C';
  position: [number, number, number];
  radius: number;
  color: string;
}

interface Bond {
  id: string;
  atom1: string;
  atom2: string;
}

interface Molecule {
  id: string;
  name: string;
  formula: string;
  atoms: Atom[];
  bonds: Bond[];
  bondAngles?: { atoms: [string, string, string]; angle: number }[];
}
```

### 4.2 预设分子数据

| 分子 | 原子配置 | 键配置 | 特殊属性 |
|------|----------|--------|----------|
| 水 H₂O | O(0.6, #FF4444)×1, H(0.4, #FFFFFF)×2 | O-H×2 | 键角104.5° |
| 甲烷 CH₄ | C(0.7, #666666)×1, H(0.4, #FFFFFF)×4 | C-H×4 | 键角109.5°球形对称 |
| 苯 C₆H₆ | C(0.5, #666666)×6, H(0.3, #FFFFFF)×6 | C-C×6, C-H×6 | 六元环，键长1.2单位 |

### 4.3 应用状态（Zustand Store）

```typescript
interface AppState {
  currentMoleculeId: string;
  isSplit: boolean;
  hoveredAtomId: string | null;
  isTransitioning: boolean;
  setCurrentMolecule: (id: string) => void;
  toggleSplit: () => void;
  setHoveredAtom: (id: string | null) => void;
  setTransitioning: (v: boolean) => void;
}
```

## 5. 文件结构

```
auto309/
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
└── src/
    ├── App.tsx              # 主组件，布局+状态切换
    ├── MoleculeViewer.tsx   # 3D场景，R3F Canvas+OrbitControls+原子/键渲染
    ├── uiPanel.tsx          # UI面板，下拉菜单+按钮+信息展示
    ├── moleculeData.ts      # 分子数据定义与解析函数
    └── store.ts             # Zustand状态管理（新增）
```
