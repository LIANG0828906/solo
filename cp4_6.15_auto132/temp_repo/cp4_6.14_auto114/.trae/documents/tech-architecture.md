## 1. 架构设计

```mermaid
flowchart TD
    "用户界面层" --> "Zustand Store"
    "Zustand Store" --> "序列化模块"
    "序列化模块" --> "JSON 导入/导出"
    subgraph "用户界面层"
        "ParamsPanel"
        "PreviewArea"
        "TargetButton"
    end
    subgraph "Zustand Store"
        "参数配置"
        "快照列表"
        "当前选中快照"
    end
    subgraph "序列化模块"
        "导出 JSON"
        "导入解析"
    end
```

## 2. 技术说明

- 前端框架：React 18 + TypeScript
- 构建工具：Vite
- 状态管理：Zustand
- 样式方案：CSS Modules（内联样式 + CSS 变量）
- 包管理器：npm
- 依赖库：react, react-dom, zustand, uuid, typescript, vite, @vitejs/plugin-react

## 3. 文件结构

```
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx
    ├── modules/
    │   ├── params/
    │   │   └── ParamsPanel.tsx
    │   └── preview/
    │       ├── PreviewArea.tsx
    │       └── TargetButton.tsx
    ├── store/
    │   └── paramsStore.ts
    └── utils/
        └── serializer.ts
```

## 4. 数据模型

### 4.1 参数定义

```typescript
interface ParamItem {
  id: string;
  name: string;
  type: 'string' | 'number' | 'boolean' | 'enum';
  defaultValue: string;
  currentValue: string;
  enumOptions?: string[];
}
```

### 4.2 快照定义

```typescript
interface Snapshot {
  id: string;
  name: string;
  params: ParamItem[];
}
```

### 4.3 Store 状态

```typescript
interface ParamsStoreState {
  params: ParamItem[];
  snapshots: Snapshot[];
  activeSnapshotId: string | null;
  addParam: (param: Omit<ParamItem, 'id'>) => void;
  removeParam: (id: string) => void;
  updateParam: (id: string, updates: Partial<ParamItem>) => void;
  reorderParams: (startIndex: number, endIndex: number) => void;
  addSnapshot: (name: string) => void;
  removeSnapshot: (id: string) => void;
  switchSnapshot: (id: string) => void;
  updateParamValue: (id: string, value: string) => void;
}
```

## 5. 序列化模块

- `exportConfig(state)`: 将当前参数配置和快照列表序列化为 JSON 字符串
- `importConfig(jsonString)`: 解析 JSON 字符串，返回参数配置和快照列表，校验数据结构合法性

## 6. 性能策略

- Zustand 使用 selector 精确订阅，避免不必要的重渲染
- 参数修改直接更新 store，React 的调度机制确保 50ms 内完成渲染
- 拖拽排序使用 HTML5 Drag and Drop API，无需额外依赖
- CSS transition 实现状态切换动画，避免 JavaScript 动画开销
