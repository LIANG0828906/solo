## 1. 架构设计

```mermaid
graph TD
    A["React 18 UI层"] --> B["Zustand 状态管理"]
    B --> C["IndexedDB 数据持久化"]
    A --> D["ECharts 图表渲染"]
    A --> E["React Router v6 路由"]
    B --> F["房源数据模块"]
    B --> G["日历预订模块"]
    B --> H["统计筛选模块"]
```

## 2. 技术描述

- 前端：React@18 + TypeScript + Vite
- 状态管理：zustand
- 数据持久化：IndexedDB（查询响应<100ms）
- 图表：echarts + echarts-for-react
- 路由：react-router-dom@6
- 工具库：uuid
- 样式：原生CSS + CSS变量

## 3. 路由定义

| 路由 | 用途 |
|-------|---------|
| /dashboard | 仪表盘主页，全局数据视图 |
| /detail/:propertyId | 单体房源详情数据视图 |
| / | 重定向至 /dashboard |

## 4. 数据模型

### 4.1 数据模型定义

```mermaid
erDiagram
    PROPERTY {
        string id PK "房源ID"
        string name "房源名称"
        string address "地址"
        string roomType "房型"
        number maxGuests "最多入住人数"
        number pricePerNight "每晚价格"
    }
    BOOKING {
        string id PK "预订ID"
        string propertyId FK "房源ID"
        string customerName "客户姓名"
        string date "日期 YYYY-MM-DD"
        string status "状态: booked/available/pending"
        number nights "入住天数"
        number totalPrice "总价"
    }
```

### 4.2 TypeScript 类型定义

```typescript
interface Property {
  id: string;
  name: string;
  address: string;
  roomType: string;
  maxGuests: number;
  pricePerNight: number;
}

type BookingStatus = 'booked' | 'available' | 'pending';

interface Booking {
  id: string;
  propertyId: string;
  customerName: string;
  date: string;
  status: BookingStatus;
  nights: number;
  totalPrice: number;
}

interface MonthlyStats {
  month: string;
  revenue: number;
  occupancyRate: number;
}
```

## 5. 文件结构

```
src/
├── App.tsx              # 根组件，路由与Provider
├── components/
│   ├── Dashboard.tsx    # 仪表盘主组件
│   ├── CalendarView.tsx # 房态日历组件
│   └── ChartPanel.tsx   # 双轴图表组件
├── store/
│   └── propertyStore.ts # Zustand状态管理
├── types/
│   └── index.ts         # 类型定义
└── utils/
    └── db.ts            # IndexedDB工具
```
