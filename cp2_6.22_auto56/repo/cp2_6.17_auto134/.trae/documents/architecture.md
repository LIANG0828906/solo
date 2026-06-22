# VoteHub 技术架构文档

## 1. 技术选型

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | React | 18.x | UI 组件化开发 |
| 类型系统 | TypeScript | 最新 | 类型安全 |
| 构建工具 | Vite | 最新 | 快速构建和热更新 |
| 状态管理 | Zustand | 最新 | 轻量级状态管理 |
| 图表库 | Recharts | 最新 | React 图表组件库 |
| 工具库 | uuid | 最新 | 生成唯一 ID |
| 数据持久化 | localStorage | - | 浏览器本地存储 |

---

## 2. 目录结构

```
votehub/
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
└── src/
    ├── main.tsx              # 应用入口
    ├── App.tsx               # 根组件（布局路由）
    └── modules/
        ├── 投票模块/
        │   ├── voteSlice.ts  # Zustand slice（投票数据 CRUD）
        │   └── VoteList.tsx  # 投票列表组件
        └── 统计模块/
            ├── statsSlice.ts # Zustand slice（统计计算）
            └── VoteChart.tsx # 统计图表组件
```

---

## 3. 数据模型

### 3.1 VoteOption（投票选项）
```typescript
interface VoteOption {
  id: string;
  text: string;
  votes: number;
}
```

### 3.2 Vote（投票）
```typescript
interface Vote {
  id: string;
  title: string;
  options: VoteOption[];
  createdAt: number;
}
```

### 3.3 VoteState（全局投票状态）
```typescript
interface VoteState {
  votes: Vote[];
  votedIds: string[]; // 用户已投票的投票ID列表
  createVote: (title: string, options: string[]) => void;
  castVote: (voteId: string, optionId: string) => void;
  hasVoted: (voteId: string) => boolean;
}
```

---

## 4. 数据流向

### 4.1 投票模块数据流
```
用户操作 (VoteList.tsx)
    ↓
调用 voteSlice 方法 (createVote / castVote)
    ↓
更新 Zustand store 状态
    ↓
持久化到 localStorage
    ↓
触发 UI 重新渲染
```

### 4.2 统计模块数据流
```
voteSlice (votes 数据)
    ↓
statsSlice (计算统计结果)
    ↓
VoteChart.tsx (渲染图表)
```

---

## 5. 文件调用关系

```
main.tsx
  └─→ App.tsx
        ├─→ voteSlice.ts (获取全局状态)
        ├─→ VoteList.tsx
        │     └─→ voteSlice.ts (读取数据 / 调用方法)
        └─→ VoteChart.tsx
              └─→ statsSlice.ts (读取计算结果)
                    └─→ voteSlice.ts (读取原始投票数据)
```

---

## 6. 状态管理设计

### 6.1 voteSlice
- 职责：管理投票数据的 CRUD 和状态
- 方法：
  - `createVote(title, options)`：创建新投票
  - `castVote(voteId, optionId)`：为指定选项投票
  - `hasVoted(voteId)`：检查用户是否已投票
- 持久化：每次状态变更同步到 localStorage

### 6.2 statsSlice
- 职责：从 voteSlice 读取数据，计算投票统计结果
- 计算结果：
  - 各投票的总票数
  - 各选项的票数分布
- 输出：给 VoteChart 组件提供标准化的图表数据

---

## 7. 性能优化策略

1. **Zustand 选择器**：使用选择器精确订阅需要的状态，避免不必要的重渲染
2. **useMemo / useCallback**：对计算密集型数据和回调函数进行缓存
3. **搜索防抖**：搜索输入使用 300ms 防抖延迟，减少过滤频率
4. **虚拟列表**：500+ 卡片时考虑虚拟滚动（根据性能测试决定）
5. **CSS 硬件加速**：动画使用 transform 和 opacity 属性触发 GPU 加速

---

## 8. 运行方式

```bash
npm install
npm run dev
```
