# 促销活动实时追踪平台 - 技术架构文档

## 1. 技术选型

### 1.1 前端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| React | ^18.2.0 | UI框架 |
| TypeScript | ^5.0.0 | 类型安全 |
| Vite | ^5.0.0 | 构建工具 |
| @vitejs/plugin-react | ^4.2.0 | React支持 |
| uuid | ^9.0.0 | ID生成 |

### 1.2 后端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| Express | ^4.18.0 | API服务器 |
| cors | ^2.8.5 | 跨域支持 |
| TypeScript | ^5.0.0 | 类型安全 |

### 1.3 设计决策
- **图表渲染**：使用原生Canvas API，不依赖第三方图表库，确保轻量和性能
- **状态管理**：使用React内置useState/useEffect，不引入Redux等复杂状态管理
- **数据存储**：后端使用内存Map存储，无需数据库，快速原型验证
- **动画实现**：使用CSS动画和过渡，保证60fps帧率

---

## 2. 项目结构

```
auto181/
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
├── src/
│   ├── server.ts              # Express后端服务器
│   ├── dataSimulator.ts       # 数据模拟器
│   ├── chartEngine.ts         # Canvas图表渲染引擎
│   ├── styles.css             # 全局样式
│   └── components/
│       ├── App.tsx            # 主应用组件
│       ├── Dashboard.tsx      # 概览仪表盘
│       └── ActivityDetail.tsx # 活动详情页
```

---

## 3. 模块设计

### 3.1 后端模块 (src/server.ts)

**职责**：
- 提供REST API接口
- 管理内存数据存储
- 集成数据模拟器

**API接口**：
| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/activities | 获取所有活动列表 |
| GET | /api/activities/:id | 获取单个活动详情（含小时数据和热力图数据） |
| POST | /api/activities | 创建新活动 |

### 3.2 数据模拟器 (src/dataSimulator.ts)

**职责**：
- 生成模拟活动数据
- 按小时更新活动指标数据
- 生成用户点击热力图数据
- 数据每秒自动更新

**核心函数**：
```typescript
generateActivity(data: ActivityCreate): Activity
generateHourlyData(activityId: string, hours: number): HourlyData[]
generateHeatmapData(activityId: string): ClickPoint[]
updateData(): void  // 每秒调用，更新实时数据
```

### 3.3 图表引擎 (src/chartEngine.ts)

**职责**：
- 基于Canvas绘制折线图
- 基于Canvas绘制热力图
- 处理图表交互（悬停提示）

**导出函数**：
```typescript
drawLineChart(
  canvas: HTMLCanvasElement,
  data: HourlyData[],
  options?: LineChartOptions
): void

drawHeatmap(
  canvas: HTMLCanvasElement,
  data: ClickPoint[],
  options?: HeatmapOptions
): void
```

### 3.4 主应用组件 (src/components/App.tsx)

**职责**：
- 路由管理（仪表盘/详情页切换）
- 全局数据获取（5秒轮询）
- 状态传递给子组件

### 3.5 仪表盘组件 (src/components/Dashboard.tsx)

**职责**：
- 渲染活动卡片网格
- 实现筛选逻辑和动画
- 响应式布局管理
- 创建活动表单弹窗

### 3.6 活动详情组件 (src/components/ActivityDetail.tsx)

**职责**：
- 渲染实时数据面板
- 集成折线图和热力图
- 实现暂停/恢复控制

---

## 4. 数据流设计

```
┌─────────────────┐     5秒轮询     ┌─────────────────┐
│  Express Server │◄────────────────│  React Frontend │
│  (端口4000)     │                 │  (端口5173)     │
└────────┬────────┘                 └────────┬────────┘
         │                                   │
         │ 内存数据                           │ 渲染UI
         ▼                                   ▼
┌─────────────────┐                 ┌─────────────────┐
│  Data Simulator │                 │  Chart Engine   │
│  (每秒更新)     │                 │  (Canvas)       │
└─────────────────┘                 └─────────────────┘
```

---

## 5. 关键技术实现方案

### 5.1 响应式布局
使用CSS Grid和媒体查询实现三断点响应式：
```css
.cards-grid {
  display: grid;
  gap: 24px;
  grid-template-columns: repeat(3, 280px);
}

@media (max-width: 1200px) {
  .cards-grid { grid-template-columns: repeat(2, 280px); }
}

@media (max-width: 768px) {
  .cards-grid { grid-template-columns: 280px; }
}
```

### 5.2 筛选动画实现
使用CSS类切换配合React key管理：
- 移除：opacity 1→0，0.2s过渡
- 添加：transform translateY(20px)→0，opacity 0→1，0.3s过渡

### 5.3 实时数据更新
- 使用setInterval每5秒调用API
- 数据更新时使用稳定布局（固定卡片尺寸）避免抖动
- 详情页支持暂停更新（清除interval）

### 5.4 Canvas折线图实现
- 使用贝塞尔曲线实现平滑折线
- 圆点标记使用arc绘制
- 悬停检测使用getBoundingClientRect计算鼠标位置

### 5.5 热力图实现
- 将画布分成网格，统计每个网格的点击次数
- 使用径向渐变从#FDE68A到#EF4444绘制热力点
- 根据点击密度调整透明度

---

## 6. 性能优化策略

### 6.1 渲染性能
- 使用React.memo优化卡片组件重渲染
- Canvas绘制使用requestAnimationFrame
- 避免频繁的DOM操作

### 6.2 动画性能
- 使用transform和opacity属性（触发GPU加速）
- 避免在动画中改变width/height等触发重排的属性
- 使用will-change提示浏览器优化

### 6.3 数据性能
- 数据轮询使用防抖/节流
- 增量更新而非全量替换
- 离线数据缓存

---

## 7. 类型定义

```typescript
// 活动类型
type ActivityType = 'full_reduction' | 'discount' | 'flash_sale';
type ActivityStatus = 'upcoming' | 'ongoing' | 'ended';

interface Activity {
  id: string;
  name: string;
  type: ActivityType;
  budgetLimit: number;
  budgetUsed: number;
  startTime: number;
  endTime: number;
  status: ActivityStatus;
  impressions: number;
  clicks: number;
  conversions: number;
  revenue: number;
}

interface HourlyData {
  timestamp: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface ClickPoint {
  x: number;
  y: number;
  count: number;
}

interface ActivityDetail extends Activity {
  hourlyData: HourlyData[];
  heatmapData: ClickPoint[];
}
```

---

## 8. 启动配置

### 8.1 开发启动
```bash
npm install
npm run dev
```

### 8.2 端口配置
- 前端Vite开发服务器：5173端口
- 后端Express服务器：4000端口
- Vite配置代理：/api → http://localhost:4000
