## 1. 架构设计

```mermaid
graph TB
    subgraph "前端应用"
        A["App.tsx<br/>应用入口与布局"] --> B["InterviewSession.tsx<br/>面试控制模块"]
        A --> C["ScoringPanel.tsx<br/>评分记录模块"]
        A --> D["PlaybackPanel.tsx<br/>面试回放面板"]
        B --> E["Timer.tsx<br/>倒计时组件"]
        C --> F["ScoringStore.ts<br/>Zustand状态管理"]
        D --> F
        B -->|"面试ID/题目ID"| C
        B -->|"面试状态"| A
    end

    subgraph "数据层"
        G["questions.json<br/>题目数据"] -->|"加载"| B
        F -->|"持久化"| H["localStorage"]
        H -->|"读取"| F
    end
```

## 2. 技术说明

- 前端：React@18 + TypeScript + Vite + Zustand
- 初始化工具：vite-init（react-ts模板）
- 样式：Tailwind CSS + 自定义CSS（倒计时闪烁动画、滑块样式）
- 后端：无，题目数据通过JSON文件模拟
- 数据库：无，使用Zustand + localStorage持久化

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 主页面，包含面试控制、评分记录、回放面板 |

> 本应用为单页应用，所有模块在同一页面通过组件组合展示

## 4. API定义

无后端API。题目数据通过本地JSON文件加载，评分数据通过Zustand store管理并持久化到localStorage。

## 5. 数据模型

### 5.1 数据模型定义

```mermaid
erDiagram
    InterviewRecord {
        string interviewId PK "面试UUID"
        string date "面试日期时间"
    }
    QuestionScore {
        string interviewId FK "关联面试ID"
        string questionId FK "题目ID"
        number timestamp "评分时间戳"
        number techDepth "技术深度1-10"
        number expression "表达能力1-10"
        number logic "逻辑思维1-10"
        number adaptability "应变能力1-10"
        string comment "批注文本"
        boolean submitted "是否已提交冻结"
    }
    Question {
        string id PK "题目ID"
        string content "题目内容"
        number duration "默认时长(秒)"
    }
    InterviewRecord ||--o{ QuestionScore : "包含"
    Question ||--o{ QuestionScore : "被评分"
```

### 5.2 数据定义语言

```typescript
interface Question {
  id: string;
  content: string;
  duration: number;
}

interface ScoreRecord {
  interviewId: string;
  questionId: string;
  timestamp: number;
  techDepth: number;
  expression: number;
  logic: number;
  adaptability: number;
  comment: string;
  submitted: boolean;
}

interface InterviewMeta {
  interviewId: string;
  date: string;
  questionIds: string[];
}
```

## 6. 文件结构与调用关系

```
src/
├── App.tsx                          # 应用入口，挂载三大模块
├── main.tsx                         # React根渲染
├── data/
│   └── questions.json               # 题目数据（10+道技术题）
├── modules/
│   ├── interview/
│   │   ├── InterviewSession.tsx     # 面试控制主组件
│   │   └── Timer.tsx                # 倒计时组件
│   ├── scoring/
│   │   ├── ScoringPanel.tsx         # 评分记录主组件
│   │   └── ScoringStore.ts          # Zustand store
│   └── playback/
│       └── PlaybackPanel.tsx        # 面试回放面板
├── types/
│   └── index.ts                     # 全局类型定义
└── styles/
    └── animations.css               # 闪烁动画等自定义样式
```

### 数据流向

1. **题目加载**：`questions.json` → `InterviewSession` → `Timer`（持续时间）+ `ScoringPanel`（题目ID）
2. **评分写入**：`ScoringPanel` → `ScoringStore.addScore()` → `localStorage`
3. **评分读取**：`PlaybackPanel` ← `ScoringStore.getAllScores()` ← `localStorage`
4. **面试状态**：`InterviewSession`（面试ID、当前题目索引）→ `ScoringPanel`（关联评分）
