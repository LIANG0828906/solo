## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        A["App.vue<br/>根组件：布局与状态管理"]
        B["ColorInput.vue<br/>颜色输入组件"]
        C["ResultDisplay.vue<br/>结果展示组件"]
        D["contrastCalculator.ts<br/>对比度计算工具"]
    end

    subgraph "数据层"
        E["localStorage<br/>历史记录持久化"]
    end

    A --> "v-model绑定" --> B
    A --> "props传递" --> C
    B --> "emit update事件" --> A
    A --> "调用计算函数" --> D
    C --> "渲染结果与推荐" --> A
    A --> "读写" --> E
```

## 2. 技术说明

- 前端：Vue@3 + TypeScript + Vite + Tailwind CSS
- 初始化工具：vite-init（vue-ts模板）
- 色彩处理库：chroma-js（色彩转换与对比度计算）
- 后端：无
- 数据库：无（使用localStorage持久化历史记录）

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 主面板页（颜色输入、对比度检测、预览、推荐、历史记录） |

## 4. 文件结构与调用关系

```
project/
├── index.html                    # 入口页面
├── package.json                  # 依赖：vue@3, chroma-js, vite
├── vite.config.ts                # Vite构建配置，Vue插件
├── tsconfig.json                 # 严格模式，目标ES2020
└── src/
    ├── main.ts                   # 应用入口
    ├── App.vue                   # 根组件：布局+状态管理
    │   ├── 调用 → ColorInput.vue
    │   ├── 调用 → ResultDisplay.vue
    │   └── 调用 → contrastCalculator.ts
    ├── components/
    │   ├── ColorInput.vue        # 颜色输入组件
    │   │   └── 通过v-model双向绑定，调用chroma-js验证
    │   └── ResultDisplay.vue     # 结果展示组件
    │       └── 接收props，渲染对比度/徽章/推荐色值
    └── utils/
        └── contrastCalculator.ts # 对比度计算工具
            └── 导出calculateContrastRatio，使用chroma-js
```

### 数据流向

1. **用户输入** → `ColorInput.vue`接收hex/rgba输入或拾取器选择
2. **颜色验证** → `ColorInput.vue`内部调用`chroma-js`验证合法性，非法则显示红色边框
3. **状态更新** → `ColorInput.vue`通过`emit('update')`向上通知`App.vue`
4. **对比度计算** → `App.vue`调用`contrastCalculator.ts`的`calculateContrastRatio`
5. **结果渲染** → `App.vue`将结果通过props传递给`ResultDisplay.vue`
6. **推荐色值** → `contrastCalculator.ts`根据当前色相调整亮度生成推荐
7. **历史记录** → `App.vue`将检测记录写入localStorage，侧栏读取展示

## 5. 核心类型定义

```typescript
interface ContrastResult {
  ratio: number;
  wcagLevel: {
    aa: { normal: boolean; large: boolean; graphics: boolean };
    aaa: { normal: boolean; large: boolean; graphics: boolean };
  };
}

interface HistoryRecord {
  foreground: string;
  background: string;
  ratio: number;
  timestamp: number;
}

interface RecommendedColor {
  hex: string;
  ratio: number;
  level: string;
}
```
