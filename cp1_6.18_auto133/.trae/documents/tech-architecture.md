## 1. 架构设计

```mermaid
flowchart TD
    "React UI层" --> "Zustand Store"
    "Zustand Store" --> "VoteEngine"
    "Zustand Store" --> "FeedbackEngine"
    "VoteEngine" --> "锁定结果"
    "FeedbackEngine" --> "FeedbackPool"
    "FeedbackPool" --> "反馈数据"
    "锁定结果" --> "React UI层"
    "反馈数据" --> "React UI层"
```

纯前端架构，无后端服务。所有状态通过Zustand管理，投票逻辑和反馈逻辑分别在独立的引擎模块中处理。

## 2. 技术说明

- 前端：React@18 + TypeScript + Vite
- 状态管理：Zustand
- 唯一标识：uuid
- 初始化工具：vite-init (react-ts模板)
- 后端：无
- 数据库：无（使用内存状态 + 预设数据池）

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 投票主页，包含选项展示、投票、结果反馈 |

单页应用，无路由切换。

## 4. 数据模型

### 4.1 核心数据结构

```typescript
interface Option {
  id: string;
  title: string;
  description: string;
}

interface VoteState {
  optionsMap: Record<string, Option>;
  voteCounts: Record<string, number>;
  votedOptionId: string | null;
  lockedOptionId: string | null;
  feedback: FeedbackResult | null;
}

interface FeedbackResult {
  stageDesc: string;
  soundEffect: string;
  colorFilter: string;
}
```

### 4.2 文件结构

```
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── stores/
    │   └── selectionStore.ts
    ├── engine/
    │   ├── voteEngine.ts
    │   └── feedbackEngine.ts
    ├── data/
    │   └── feedbackPool.ts
    └── components/
        ├── SelectionCard.tsx
        └── ResultPanel.tsx
```

### 4.3 引擎逻辑

**VoteEngine**：
- 输入：voteCounts, optionsMap
- 计算：每个选项的得票百分比 = 该选项票数 / 总票数
- 锁定条件：某选项得票 > 总票数 × 60%
- 输出：锁定选项ID或null

**FeedbackEngine**：
- 输入：锁定选项的内容摘要
- 匹配：从feedbackPool中查找对应的反馈数据
- 输出：{ stageDesc, soundEffect, colorFilter }
