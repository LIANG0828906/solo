# 团队代码提交活跃度热力图看板 - 技术架构文档

## 1. 技术选型

| 层级 | 技术 | 版本要求 | 说明 |
|------|------|---------|------|
| 前端框架 | React | ^18.x | 组件化UI |
| 语言 | TypeScript | ^5.x | 严格类型检查 |
| 构建工具 | Vite | ^5.x | 快速开发服务器 |
| 可视化 | D3.js | ^7.x | SVG热力图渲染 |
| HTTP | Axios | ^1.x | API请求封装 |
| 后端 | Node.js + http模块 | 18+ | 模拟数据API |

---

## 2. 文件结构与职责

```
auto10/
├── package.json              # 项目依赖与脚本
├── vite.config.js            # Vite配置（含/api代理）
├── tsconfig.json             # TS严格模式配置
├── index.html                # 应用入口HTML
├── server/
│   └── index.ts              # 后端服务：模拟数据API
└── src/
    ├── main.tsx              # React入口挂载
    ├── App.tsx               # 主组件：布局、数据请求、状态管理
    ├── api.ts                # 数据请求模块：Axios封装、类型定义
    ├── Heatmap.tsx           # 核心组件：D3.js热力图渲染
    ├── DetailPanel.tsx       # 详情面板：提交列表展示
    └── index.css             # 全局样式
```

---

## 3. 调用关系与数据流向

### 3.1 整体数据流
```
用户交互 → App.tsx(状态管理) → Heatmap.tsx(渲染) → DetailPanel.tsx(详情)
              ↑
              └── api.ts → server/index.ts(API)
```

### 3.2 模块调用详解

#### server/index.ts
- **输入**：接收 `GET /api/activity` HTTP请求
- **处理**：生成5-8名成员、7天的随机提交数据（含时间戳、提交描述）
- **输出**：JSON格式 `ActivityData`
- **调用者**：前端通过代理 `/api/activity` 调用

#### src/api.ts
- **类型定义**：`Member`, `DayActivity`, `CommitRecord`, `ActivityData`
- **导出函数**：`fetchActivity(): Promise<ActivityData>`
- **被调用**：`App.tsx` 挂载时 useEffect 调用
- **数据流向**：`fetchActivity()` → `axios.get('/api/activity')` → 返回数据给App

#### src/App.tsx
- **状态**：
  - `activityData`: ActivityData | null
  - `selectedCell`: {memberId, date} | null
  - `searchKeyword`: string
- **数据流**：
  1. 挂载 → 调用 `fetchActivity()` → 存入 `activityData`
  2. 计算统计值（总提交/人均）→ 渲染统计栏
  3. 过滤成员 → 传给 `Heatmap`
  4. 接收Heatmap的cellClick → 打开 `DetailPanel`
- **子组件**：Heatmap、DetailPanel、StatsBar、SearchBox

#### src/Heatmap.tsx
- **Props**: 
  - `members`: Member[]（已过滤）
  - `activityMap`: Map<memberId_date, DayActivity>
  - `onCellClick`: callback
- **渲染**：D3.js操作SVG创建网格
- **事件**：
  - mouseover → tooltip
  - click → 调用 onCellClick
- **动画**：D3 transition实现过滤、hover

#### src/DetailPanel.tsx
- **Props**:
  - `visible`: boolean
  - `memberName`: string
  - `date`: string
  - `commits`: CommitRecord[]
  - `onClose`: callback
- **动画**：CSS transform + opacity，0.3s过渡
- **效果**：backdrop-filter毛玻璃

---

## 4. 核心数据结构定义

```typescript
// 单条提交记录
interface CommitRecord {
  id: string;
  timestamp: number;      // 毫秒时间戳
  message: string;        // 提交信息摘要
  hash: string;           // 提交hash（模拟）
}

// 某成员某日的提交数据
interface DayActivity {
  memberId: string;
  memberName: string;
  date: string;           // YYYY-MM-DD
  commitCount: number;
  commits: CommitRecord[];
}

// 成员信息
interface Member {
  id: string;
  name: string;
  avatar?: string;
}

// API响应结构
interface ActivityData {
  startDate: string;      // 本周开始日期
  endDate: string;        // 本周结束日期
  dates: string[];        // 7天日期数组
  members: Member[];
  activities: DayActivity[];
}
```

---

## 5. 性能优化策略

1. **热力图渲染**：
   - 使用D3 data join而非全量重绘
   - 使用virtualization处理大数据（当前≤8人×7天=56格，无需虚拟化）
   - CSS transform: translate3d 提升动画性能

2. **搜索过滤**：
   - 成员名匹配使用简单字符串`includes`（≤8人，无需debounce）
   - DOM opacity动画而非display切换，保证流畅

3. **动画**：
   - 数字递增使用`requestAnimationFrame` + EaseOut函数
   - 所有过渡使用GPU加速属性（transform、opacity）

---

## 6. API接口定义

### GET /api/activity

**响应示例**：
```json
{
  "startDate": "2026-06-06",
  "endDate": "2026-06-12",
  "dates": ["2026-06-06","2026-06-07",...],
  "members": [
    {"id":"m1","name":"张三"},
    {"id":"m2","name":"李四"}
  ],
  "activities": [
    {
      "memberId":"m1",
      "memberName":"张三",
      "date":"2026-06-06",
      "commitCount":3,
      "commits":[
        {"id":"c1","timestamp":1717632000000,"message":"修复登录bug","hash":"a1b2c3d"},
        ...
      ]
    }
  ]
}
```

---

## 7. 构建与启动

- **开发**：`npm run dev` → Vite前端 + Node后端API（通过代理）
- **代理规则**：`/api/*` → `http://localhost:3001`
- **后端端口**：3001
- **前端端口**：5173（Vite默认）
