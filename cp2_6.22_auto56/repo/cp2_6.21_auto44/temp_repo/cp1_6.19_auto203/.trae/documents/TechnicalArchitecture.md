## 1. 架构设计

```mermaid
graph TD
    A[前端 React 层 --> B[UI组件层]
    A --> C[状态管理层]
    A --> D[路由层]
    B --> B1[页面组件]
    B --> B2[通用组件]
    C --> C1[Zustand Store]
    D --> D1[React Router]
    E[工具函数层]
    E --> E1[二维码生成]
    E --> E2[日期处理]
    E --> E3[ID生成]
```

## 2. 技术栈描述

- **前端框架**：React 18 + TypeScript 5
- **构建工具**：Vite 5
- **路由管理**：react-router-dom 6
- **状态管理**：zustand 4
- **动画库**：framer-motion 11
- **UI样式**：Tailwind CSS 3
- **图标库**：lucide-react
- **二维码生成**：qrcode
- **唯一ID**：uuid

## 3. 路由定义

| 路由 | 页面组件 | 功能 |
|------|---------|------|
| / | ActivityList | 活动列表页 |
| /create | CreateActivity | 活动创建页 |
| /activity/:id | ActivityDetail | 活动详情页 |
| /checkin/:activityId | CheckIn | 签到页面 |

## 4. 数据模型

### 4.1 类型定义

```typescript
interface Participant {
  id: string;
  nickname: string;
  avatarColor: string;
  signedUpAt: number;
  checkedIn: boolean;
  checkedInAt?: number;
}

interface Activity {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  coverUrl?: string;
  coverGradient: string;
  description: string;
  maxParticipants: number;
  participants: Participant[];
  createdAt: number;
}

interface ActivityStore {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt' | 'participants' | 'coverGradient'>) => string;
  addParticipant: (activityId: string, nickname: string) => boolean;
  checkIn: (activityId: string, participantId: string) => boolean;
  getActivityById: (id: string) => Activity | undefined;
}
```

### 4.2 数据持久化

使用zustand的persist中间件将数据存储到localStorage，实现页面刷新后数据不丢失。

## 5. 项目结构

```
src/
├── pages/
│   ├── ActivityList.tsx      # 活动列表页
│   ├── CreateActivity.tsx    # 活动创建页
│   ├── ActivityDetail.tsx    # 活动详情页
│   └── CheckIn.tsx           # 签到页面
├── store/
│   └── activityStore.ts       # Zustand状态管理
├── components/
│   ├── Navbar.tsx           # 导航栏组件
│   ├── ActivityCard.tsx       # 活动卡片组件
│   ├── Modal.tsx            # 通用弹窗组件
│   └── QRCodeModal.tsx     # 二维码弹窗组件
├── hooks/
│   ├── useQRCode.ts         # 二维码生成hook
│   └── useWindowSize.ts      # 窗口尺寸hook
├── utils/
│   ├── colors.ts            # 颜色工具函数
│   ├── date.ts              # 日期工具函数
│   └── id.ts                # ID生成工具
├── types/
│   └── index.ts             # 类型定义
├── App.tsx                  # 应用入口
├── main.tsx                 # React入口
└── index.css                # 全局样式
```

## 6. 关键技术点

### 6.1 性能优化策略

1. **卡片懒加载**：使用Intersection Observer API实现活动卡片的懒加载，超过20个活动时仅渲染可视区域内的卡片
2. **二维码缓存**：生成的二维码使用useMemo缓存，避免重复渲染
3. **列表虚拟化**：考虑使用react-window实现虚拟滚动（如活动数量超过50个）
4. **状态选择器**：使用zustand的selectors避免不必要的重渲染

### 6.2 动画实现

1. **卡片入场动画**：framer-motion的staggerChildren实现瀑布流卡片依次入场
2. **弹窗动画**：AnimatePresence实现弹窗的透明度和缩放动画
3. **签到成功动画**：CSS关键帧实现对号图标的外发光脉冲效果
4. **悬停动画**：CSS transition实现卡片和按钮的悬停过渡

### 6.3 二维码生成

使用qrcode库生成二维码，配置：
- 颜色：#1A365D（深蓝）
- 边距：16px
- 纠错级别：H
- 尺寸：240x240
