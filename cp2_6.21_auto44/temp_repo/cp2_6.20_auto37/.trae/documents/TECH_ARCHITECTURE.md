# 在线促销活动管理与A/B测试应用 - 技术架构文档

## 1. 技术栈选型

### 1.1 前端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.x | UI框架 |
| TypeScript | 5.x | 类型安全 |
| Vite | 5.x | 构建工具 |
| React Router | 6.x | 路由管理 |
| Zustand | 4.x | 状态管理 |
| Axios | 1.x | HTTP客户端 |
| Recharts | 2.x | 图表库 |
| date-fns | 3.x | 日期处理 |
| uuid | 9.x | ID生成 |

### 1.2 后端技术栈
| 技术 | 版本 | 用途 |
|------|------|------|
| FastAPI | 0.109.x | Web框架 |
| Python | 3.11 | 开发语言 |
| Uvicorn | 0.27.x | ASGI服务器 |

## 2. 项目结构

### 2.1 前端目录结构
```
auto37/
├── package.json          # 依赖配置
├── vite.config.js        # Vite配置
├── tsconfig.json         # TypeScript配置
├── index.html            # 入口HTML
└── src/
    ├── api.ts            # API请求封装
    ├── store.ts          # Zustand状态管理
    ├── App.tsx           # 主应用组件
    ├── main.tsx          # 入口文件
    └── components/
        ├── ActivityForm.tsx     # 活动表单组件
        ├── TestDashboard.tsx    # 测试仪表盘
        ├── ActivityList.tsx     # 活动列表
        ├── ActivityCard.tsx     # 活动卡片
        ├── Navbar.tsx           # 导航栏
        ├── ProgressRing.tsx     # 进度环组件
        └── RippleButton.tsx     # 波纹按钮组件
```

### 2.2 后端目录结构
```
auto37/
└── backend/
    ├── main.py           # FastAPI主应用
    ├── requirements.txt  # Python依赖
    └── mock_data.py      # 模拟数据
```

## 3. 前端架构设计

### 3.1 状态管理（Zustand）
```typescript
// store.ts 核心状态
interface AppState {
  promotions: Promotion[];
  currentPromotion: Promotion | null;
  abTests: ABTest[];
  currentTest: ABTest | null;
  realtimeStats: RealtimeStats | null;
  loading: boolean;
  // actions
  fetchPromotions: () => Promise<void>;
  createPromotion: (data: CreatePromotionDto) => Promise<void>;
  updatePromotion: (id: string, data: UpdatePromotionDto) => Promise<void>;
  togglePromotion: (id: string) => Promise<void>;
  fetchRealtimeStats: (testId: string) => Promise<void>;
  startPolling: (testId: string) => void;
  stopPolling: () => void;
}
```

### 3.2 API层设计
```typescript
// api.ts - 所有后端请求封装
export const api = {
  // 活动CRUD
  getPromotions: () => axios.get<Promotion[]>('/api/promotions'),
  createPromotion: (data: CreatePromotionDto) => axios.post('/api/promotions', data),
  updatePromotion: (id: string, data: UpdatePromotionDto) => axios.put(`/api/promotions/${id}`, data),
  deletePromotion: (id: string) => axios.delete(`/api/promotions/${id}`),
  togglePromotion: (id: string) => axios.post(`/api/promotions/${id}/toggle`),
  
  // A/B测试
  getABTests: () => axios.get<ABTest[]>('/api/abtests'),
  createABTest: (data: CreateABTestDto) => axios.post('/api/abtests', data),
  getRealtimeStats: (testId: string) => axios.get<RealtimeStats>(`/api/abtests/${testId}/stats`),
  getHistoryData: (testId: string) => axios.get<HistoryData[]>(`/api/abtests/${testId}/history`),
  exportStats: (testId: string) => axios.get(`/api/abtests/${testId}/export`, { responseType: 'blob' }),
  
  // 用户分组
  getUserGroups: () => axios.get<UserGroup[]>('/api/groups'),
};
```

### 3.3 组件层级
```
App.tsx (路由+布局)
├── Navbar.tsx (固定导航栏)
└── Routes
    ├── / -> ActivityList.tsx (活动列表页)
    │   └── ActivityCard.tsx (活动卡片)
    ├── /create -> ActivityForm.tsx (创建活动)
    ├── /edit/:id -> ActivityForm.tsx (编辑活动)
    └── /dashboard/:id -> TestDashboard.tsx (测试仪表盘)
        ├── ProgressRing.tsx (转化率环)
        ├── BarChart (recharts) (客单价柱图)
        └── LineChart (recharts) (趋势折线图)
```

## 4. 后端架构设计

### 4.1 API接口设计
```python
# main.py
from fastapi import FastAPI, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# CORS配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# 路由
@app.get("/api/promotions")
async def get_promotions(page: int = 1, page_size: int = 500):
    # 返回活动列表，模拟500条数据

@app.post("/api/promotions")
async def create_promotion(data: PromotionCreate):
    # 创建活动

@app.put("/api/promotions/{promotion_id}")
async def update_promotion(promotion_id: str, data: PromotionUpdate):
    # 更新活动

@app.post("/api/promotions/{promotion_id}/toggle")
async def toggle_promotion(promotion_id: str):
    # 切换活动状态

@app.get("/api/abtests/{test_id}/stats")
async def get_realtime_stats(test_id: str):
    # 模拟延迟 ≤ 500ms
    await asyncio.sleep(random.uniform(0.1, 0.5))
    # 返回实时统计数据

@app.get("/api/abtests/{test_id}/export")
async def export_stats(test_id: str):
    # 生成CSV并返回
```

## 5. 性能优化策略

### 5.1 前端优化
1. **虚拟滚动**：活动列表使用react-window实现虚拟滚动，处理500条数据
2. **数据缓存**：API请求使用axios缓存策略
3. **防抖节流**：表单输入防抖，滚动事件节流
4. **代码分割**：React.lazy实现路由级代码分割
5. **图片优化**：使用webp格式，懒加载

### 5.2 渲染性能
1. **React.memo**：优化列表项组件
2. **useMemo/useCallback**：避免不必要重渲染
3. **will-change**：动画元素优化GPU加速
4. **transform**：使用transform而非top/left实现动画

### 5.3 轮询优化
1. **间隔控制**：5秒固定间隔，页面不可见时暂停
2. **请求取消**：组件卸载时取消未完成请求
3. **错误重试**：指数退避重试机制

## 6. 样式架构

### 6.1 CSS变量定义
```css
:root {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-tertiary: #0f3460;
  --accent-gold: #e2b714;
  --accent-green-start: #00c853;
  --accent-green-end: #00e676;
  --accent-blue-start: #2962ff;
  --accent-blue-end: #448aff;
  --glass-bg: rgba(255, 255, 255, 0.1);
  --glass-blur: blur(10px);
  --border-radius: 12px;
}
```

### 6.2 动画关键帧
```css
@keyframes slideUp {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes ripple {
  from { transform: scale(0); opacity: 1; }
  to { transform: scale(4); opacity: 0; }
}

@keyframes numberRoll {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
```

## 7. 安全考虑

1. **输入验证**：前后端双重验证
2. **XSS防护**：React自动转义，危险HTML使用DOMPurify
3. **CSRF防护**：FastAPI内置CSRF保护
4. **CORS配置**：严格限制跨域来源
5. **速率限制**：API接口限流

## 8. 部署说明

### 8.1 前端启动
```bash
npm install
npm run dev
```

### 8.2 后端启动
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### 8.3 代理配置
Vite配置代理 `/api` 到 `http://localhost:8000`
