## 1. 架构设计

```mermaid
flowchart LR
    A["用户界面层 (React组件)
    B["状态管理层 (Zustand Store"]
    C["情感分析模块 (sentimentAnalyzer)"]
    D["3D渲染层 (Three.js)"]
    A --> B
    B --> C
    B --> D
```

## 2. 技术说明
- **前端框架**：React 18 + TypeScript + Vite
- **3D渲染**：Three.js + @types/three
- **状态管理**：Zustand
- **构建工具**：Vite
- **语言**：TypeScript（严格模式，ESNext模块）

## 3. 文件结构
```
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
└── src/
│   ├── sentimentAnalyzer.ts   # 情感分析模块
│   ├── particleScene.ts    # 粒子场景模块
│   ├── store.ts           # Zustand状态管理
│   ├── App.tsx           # 主应用组件
│   ├── main.tsx          # 入口文件
│   └── index.css         # 全局样式
```

## 4. 数据模型

### 4.1 类型定义

```typescript
// 情感词数据
interface SentimentWord {
  text: string;
  value: number;      // -5 到 5
  intensity: number;      // 0 到 5
}

// 粒子数据
interface ParticleData {
  id: string;
  word: SentimentWord;
  position: { x: number; y: number; z: number };
  targetPosition: { x: number; y: number; z: number };
  color: string;
  size: number;
  speed: number;
  createdAt: number;
  opacity: number;
  selected: boolean;
}

// Store状态
interface AppState {
  inputText: string;
  sentimentResults: SentimentWord[];
  particles: ParticleData[];
  selectedParticle: ParticleData | null;
  setInputText: (text: string) => void;
  analyzeText: () => void;
  addParticles: (words: SentimentWord[]) => void;
  selectParticle: (particle: ParticleData | null) => void;
  removeParticle: (id: string) => void;
  clearParticles: () => void;
}
```

## 5. 模块说明

### 5.1 sentimentAnalyzer.ts
- 接收文本输入，进行分词处理
- 基于情感词典为每个词分配情感值
- 积极词：1-5
- 消极词：-1 到 -5
- 中性词：0
- 输出每个词的对象数组

### 5.2 particleScene.ts
- 封装Three.js场景管理
- 创建/更新粒子系统（BufferGeometry + Points）
- 粒子动画（生成、运动、淡出、移除）
- 相机控制（旋转、缩放）
- 射线检测（粒子点击交互）

### 5.3 store.ts
- Zustand状态管理
- 输入文本状态
- 情感分析结果
- 粒子列表
- 选中粒子状态
