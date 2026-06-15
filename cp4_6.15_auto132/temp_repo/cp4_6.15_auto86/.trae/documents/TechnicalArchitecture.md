## 1. 架构设计

```mermaid
flowchart TD
    subgraph "前端层"
        A["App.tsx (主组件)"] --> B["MoleculeViewer.tsx (3D渲染)"]
        A --> C["ControlPanel.tsx (控制面板)"]
        B --> D["@react-three/fiber"]
        B --> E["@react-three/drei"]
        D --> F["Three.js"]
    end
    
    subgraph "状态管理层"
        G["moleculeStore.ts (React Context)"]
        G --> H["当前分子状态"]
        G --> I["选中原子列表"]
        G --> J["振动参数"]
        G --> K["渲染状态"]
    end
    
    subgraph "工具层"
        L["moleculeParser.ts (分子解析)"]
        M["vibrationEngine.ts (振动计算)"]
        L --> N["d3.js (坐标计算)"]
    end
    
    subgraph "类型定义"
        O["molecule.ts (类型定义)"]
    end
    
    B <--> G
    C <--> G
    L --> G
    M --> G
    O --> L
    O --> M
    O --> G
```

## 2. 技术描述

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **3D渲染**: Three.js + @react-three/fiber + @react-three/drei
- **数据计算**: d3.js
- **状态管理**: React Context
- **样式**: Sass + CSS Modules
- **图标**: lucide-react
- **录制导出**: MediaRecorder API

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 主页面，包含3D分子展示和控制面板 |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    ATOM {
        string id "原子唯一标识"
        string element "元素符号"
        number x "X坐标"
        number y "Y坐标"
        number z "Z坐标"
        number radius "原子半径"
        string color "CPK颜色"
    }
    
    BOND {
        string id "键唯一标识"
        string atom1Id "原子1 ID"
        string atom2Id "原子2 ID"
        number order "键级(1-单键, 2-双键, 3-三键)"
    }
    
    MOLECULE {
        string id "分子唯一标识"
        string name "分子名称"
        string formula "分子式"
        ATOM[] atoms "原子列表"
        BOND[] bonds "化学键列表"
    }
    
    VIBRATION_MODE {
        string id "模式ID"
        string name "模式名称"
        string description "描述"
        number frequency "频率"
    }
    
    VIBRATION_FRAME {
        number time "时间戳"
        object displacements "原子位移向量"
    }
    
    MOLECULE ||--|{ ATOM : contains
    MOLECULE ||--|{ BOND : contains
    VIBRATION_MODE ||--|{ VIBRATION_FRAME : generates
```

### 4.2 核心类型定义

```typescript
// Atom - 原子接口
interface Atom {
  id: string;
  element: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  color: string;
}

// Bond - 化学键接口
interface Bond {
  id: string;
  atom1Id: string;
  atom2Id: string;
  order: number;
}

// Molecule - 分子接口
interface Molecule {
  id: string;
  name: string;
  formula: string;
  atoms: Atom[];
  bonds: Bond[];
}

// VibrationMode - 振动模式接口
interface VibrationMode {
  id: string;
  name: string;
  description: string;
  frequency: number;
}

// VibrationFrame - 振动帧接口
interface VibrationFrame {
  time: number;
  displacements: Record<string, { x: number; y: number; z: number }>;
}

// MoleculeStoreState - 全局状态接口
interface MoleculeStoreState {
  currentMolecule: Molecule | null;
  selectedAtoms: string[];
  vibrationMode: VibrationMode | null;
  vibrationAmplitude: number;
  isVibrating: boolean;
  isRecording: boolean;
  isPanelCollapsed: boolean;
  atomInfoCard: { atomId: string; position: { x: number; y: number } } | null;
}
```

## 5. 预置分子数据

应用内置以下分子的3D坐标数据：

| 分子名称 | SMILES | 分子式 | 原子数 |
|----------|--------|--------|--------|
| 水 | O | H2O | 3 |
| 二氧化碳 | O=C=O | CO2 | 3 |
| 苯 | c1ccccc1 | C6H6 | 12 |
| DNA双螺旋片段 | - | - | ~60 |

## 6. CPK原子颜色标准

| 元素 | 颜色 | 半径 |
|------|------|------|
| H | #FFFFFF | 0.32 |
| C | #909090 | 0.75 |
| N | #3050F8 | 0.71 |
| O | #FF0D0D | 0.68 |
| F | #90E050 | 0.57 |
| P | #FF8000 | 1.06 |
| S | #FFFF30 | 1.02 |
| Cl | #1FF01F | 0.99 |

## 7. 项目文件结构

```
d:\P\tasks\auto86/
├── package.json
├── index.html
├── vite.config.js
├── tsconfig.json
├── src/
│   ├── types/
│   │   └── molecule.ts          # 类型定义
│   ├── utils/
│   │   ├── moleculeParser.ts    # 分子解析模块
│   │   └── vibrationEngine.ts   # 振动计算模块
│   ├── store/
│   │   └── moleculeStore.ts     # 状态管理
│   ├── components/
│   │   ├── MoleculeViewer.tsx   # 3D渲染组件
│   │   └── ControlPanel.tsx     # 控制面板组件
│   ├── data/
│   │   └── presetMolecules.ts   # 预置分子数据
│   ├── styles/
│   │   ├── globals.scss         # 全局样式
│   │   └── variables.scss       # 样式变量
│   ├── App.tsx                  # 主组件
│   └── main.tsx                 # 入口文件
```

## 8. 性能优化策略

1. **InstancedMesh**: 对于大量原子使用实例化网格渲染
2. **Frustum Culling**: 视锥体剔除不可见对象
3. **WebWorker**: 将分子解析和振动计算移至WebWorker
4. **requestAnimationFrame**: 使用R3F内置的帧循环
5. **对象池**: 复用Three.js对象避免频繁GC
6. **LOD**: 根据距离切换原子模型细节级别
