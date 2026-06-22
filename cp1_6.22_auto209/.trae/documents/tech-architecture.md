# 个人订阅服务管理应用 - 技术架构文档

## 1. 技术选型

### 1.1 前端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 5.x | 构建工具 |
| Recharts | 2.x | 图表库 |
| UUID | 9.x | 唯一ID生成 |

### 1.2 后端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Node.js | 18.x | 运行环境 |
| Express | 4.x | Web框架 |
| CORS | 2.x | 跨域处理 |

### 1.3 开发工具
- 包管理器：npm
- 浏览器：Chrome/Edge（支持LocalStorage）

---

## 2. 项目结构

```
auto209/
├── .trae/documents/          # 文档目录
│   ├── prd.md               # 产品需求文档
│   └── tech-architecture.md # 技术架构文档
├── server/
│   └── index.js             # Express后端服务
├── src/
│   ├── components/
│   │   ├── Dashboard.tsx          # 仪表盘组件
│   │   ├── AnalyticsPanel.tsx     # 分析面板组件
│   │   └── AddSubscriptionModal.tsx # 新增订阅模态窗
│   ├── utils/
│   │   └── subscriptionLogic.ts   # 业务逻辑工具
│   ├── App.tsx              # 主应用组件
│   └── main.tsx             # 应用入口
├── index.html               # HTML入口
├── vite.config.ts           # Vite配置
├── tsconfig.json            # TypeScript配置
└── package.json             # 项目依赖
```

---

## 3. 数据模型

### 3.1 订阅数据接口
```typescript
interface Subscription {
  id: string;           // UUID
  name: string;         // 服务名称
  category: 'streaming' | 'cloud' | 'fitness' | 'software' | 'other';
  cycle: 'monthly' | 'quarterly' | 'yearly';
  amount: number;       // 金额
  expiryDate: string;   // 到期日期 ISO格式
  isActive: boolean;    // 启用状态
  trialReminder: boolean; // 是否开启试用提醒
  createdAt: string;    // 创建时间
}

type CategoryType = 'streaming' | 'cloud' | 'fitness' | 'software' | 'other';
type CycleType = 'monthly' | 'quarterly' | 'yearly';
```

### 3.2 类别映射
| 英文标识 | 中文显示 | Emoji |
|----------|----------|-------|
| streaming | 流媒体 | 🎬 |
| cloud | 云存储 | ☁️ |
| fitness | 健身 | 💪 |
| software | 软件 | 💻 |
| other | 其他 | 📦 |

### 3.3 周期映射
| 英文标识 | 中文显示 | 月数 |
|----------|----------|------|
| monthly | 月 | 1 |
| quarterly | 季 | 3 |
| yearly | 年 | 12 |

---

## 4. 状态管理

### 4.1 React Context 设计
```typescript
interface AppState {
  subscriptions: Subscription[];
  activeTab: 'dashboard' | 'analytics';
  searchQuery: string;
  highlightedId: string | null;
  bannerVisible: boolean;
}

type Action =
  | { type: 'SET_SUBSCRIPTIONS'; payload: Subscription[] }
  | { type: 'ADD_SUBSCRIPTION'; payload: Subscription }
  | { type: 'UPDATE_SUBSCRIPTION'; payload: Subscription }
  | { type: 'DELETE_SUBSCRIPTION'; payload: string }
  | { type: 'SET_ACTIVE_TAB'; payload: 'dashboard' | 'analytics' }
  | { type: 'SET_SEARCH_QUERY'; payload: string }
  | { type: 'SET_HIGHLIGHTED_ID'; payload: string | null }
  | { type: 'SET_BANNER_VISIBLE'; payload: boolean };
```

### 4.2 数据流向
```
用户操作 → 组件 dispatch Action → Reducer 更新 State → Context 广播 → 组件重新渲染
     ↓                                                         ↑
LocalStorage 读写 ←───────────────────────────────────────────┘
```

---

## 5. 核心模块设计

### 5.1 subscriptionLogic.ts 工具模块
| 函数名 | 功能 | 参数 | 返回值 |
|--------|------|------|--------|
| `calculateDaysUntilExpiry` | 计算距离到期天数 | `expiryDate: string` | `number` |
| `getExpiryColor` | 获取到期日颜色 | `days: number` | `string` |
| `calculateYearlyCost` | 计算年均费用 | `amount: number, cycle: CycleType` | `number` |
| `groupByCategory` | 按类别分组统计 | `subscriptions: Subscription[]` | `CategoryStats[]` |
| `getMonthlyTrend` | 获取月度支出趋势 | `subscriptions: Subscription[]` | `MonthData[]` |
| `loadFromLocalStorage` | 从LocalStorage加载 | - | `Subscription[]` |
| `saveToLocalStorage` | 保存到LocalStorage | `subscriptions: Subscription[]` | `void` |
| `generateCSV` | 生成CSV内容 | `subscriptions: Subscription[]` | `string` |
| `filterSubscriptions` | 搜索过滤 | `subscriptions: Subscription[], query: string` | `Subscription[]` |

### 5.2 组件职责划分

#### App.tsx
- 管理全局State和Reducer
- 实现Context Provider
- 处理路由切换（仪表盘/分析）
- 管理到期提醒横幅状态
- 初始化数据（从LocalStorage或后端API）

#### Dashboard.tsx
- 订阅卡片网格布局
- 搜索过滤功能（防抖）
- 到期日期排序
- 卡片状态切换
- 到期高亮闪烁效果

#### AnalyticsPanel.tsx
- 总支出趋势折线图
- 类别占比折线图
- 堆叠柱状图（类别对比）
- 数据聚合处理

#### AddSubscriptionModal.tsx
- 表单输入验证
- 年均费用实时计算
- 模态窗动画
- 表单提交处理

---

## 6. 后端API设计

### 6.1 GET /api/subscriptions
- **功能**：获取初始订阅数据（模拟）
- **响应**：
```json
[
  {
    "id": "uuid",
    "name": "Netflix",
    "category": "streaming",
    "cycle": "monthly",
    "amount": 68,
    "expiryDate": "2026-06-25",
    "isActive": true,
    "trialReminder": false,
    "createdAt": "2026-01-01"
  }
]
```

### 6.2 POST /api/export-csv
- **功能**：生成CSV文件下载
- **请求体**：`Subscription[]`
- **响应**：CSV文件流，`Content-Type: text/csv`

---

## 7. 性能优化方案

### 7.1 列表性能
- 使用 `React.memo` 包裹卡片组件
- 搜索防抖（200ms）
- 避免不必要的重渲染

### 7.2 滚动性能
- CSS `will-change: transform`
- 硬件加速
- 避免滚动时的重排重绘

### 7.3 动画性能
- 使用 CSS transform 和 opacity
- 避免触发布局的动画
- 使用 `transition` 而非 `animation` 用于简单过渡

---

## 8. 样式方案

### 8.1 CSS变量定义
```css
:root {
  --bg-primary: #F8FAFC;
  --bg-card: #FFFFFF;
  --text-primary: #1E293B;
  --text-secondary: #64748B;
  --accent: #3B82F6;
  --error: #EF4444;
  --success: #10B981;
  --warning: #F97316;
  --banner-bg: #FEF3C7;
  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
}
```

### 8.2 响应式断点
```css
@media (max-width: 768px) {
  .card-grid { grid-template-columns: 1fr; }
  .sidebar { display: none; }
  .hamburger { display: block; }
}
```

---

## 9. 构建与部署

### 9.1 开发环境
- 前端端口：5173（Vite默认）
- 后端端口：3001
- Vite代理：`/api` → `http://localhost:3001`

### 9.2 启动脚本
```json
{
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  }
}
```

---

## 10. 安全考虑

1. **XSS防护**：用户输入内容进行转义
2. **LocalStorage数据**：不存储敏感信息
3. **CSV导出**：避免公式注入
4. **CORS配置**：仅允许可信源访问
