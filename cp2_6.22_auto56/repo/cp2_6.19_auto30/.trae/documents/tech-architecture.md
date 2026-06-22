## 1. 架构设计

```mermaid
graph TD
    A["React App"] --> B["状态管理层 (Zustand)
    B --> C["旅行项目模块
    B --> D["开销记录模块"]
    C --> E["TripManager 组件
    C --> F["TripCard 组件
    D --> G["ExpenseTracker 组件
    D --> H["ChartPanel 组件
    I["货币换算工具
    J["图表库"]
```

## 2. 技术描述

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **状态管理**：Zustand
- **图表库**：Chart.js + react-chartjs-2
- **唯一ID生成**：uuid
- **样式方案**：原生 CSS（CSS 变量 + 全局样式
- **路径别名**：@ 指向 src 目录

## 3. 目录结构

```
src/
├── modules/
│   ├── trip/
│   │   ├── types.ts          # Trip 类型定义
│   │   ├── TripManager.tsx   # 旅行项目管理主组件
│   │   └── TripCard.tsx      # 旅行项目卡片组件
│   └── expense/
│       ├── store.ts           # Zustand 状态管理
│       ├── ExpenseTracker.tsx # 开销记录主组件
│       └── ChartPanel.tsx     # 图表面板组件
├── utils/
│   └── currency.ts            # 货币换算工具
├── styles/
│   └── global.css             # 全局样式
├── App.tsx
└── main.tsx
```

## 4. 数据模型

### 4.1 Trip 接口

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| destination | string | 目的地 |
| currency | string | 货币符号 |
| budget | number | 总预算金额 |
| startDate | string | 开始日期 |
| endDate | string | 结束日期 |

### 4.2 Expense 接口

| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | 唯一标识 |
| tripId | string | 关联旅行项目ID |
| category | string | 类别（交通/住宿/餐饮/景点/购物）
| amount | number | 金额（目标货币） |
| originalAmount | number | 原始金额 |
| originalCurrency | string | 原始货币 |
| note | string | 备注 |
| date | string | 发生时间 |

## 5. 状态管理

Store 提供以下方法：
- `addTrip(trip)`：添加旅行项目
- `switchTrip(tripId)`：切换当前项目
- `addExpense(expense)`：添加开销
- `getExpensesByTrip(tripId)`：获取项目开销
- `getTotalSpent(tripId)`：获取总花费
- `getBudgetStatus(tripId)`：获取预算状态

## 6. 性能要求

- 页面初始加载时间 ≤ 2秒（50条模拟数据
- 图表数据更新响应 ≤ 200ms
- 图表帧率 ≥ 30fps

## 7. 构建配置

### Vite 配置
- React 插件
- @ 路径别名配置

### TypeScript 配置
- 严格模式
- target: ESNext
- 路径别名 @

## 8. 依赖清单

- react
- react-dom
- @types/react
- @types/react-dom
- typescript
- vite
- @vitejs/plugin-react
- uuid
- zustand
- chart.js
- react-chartjs-2
