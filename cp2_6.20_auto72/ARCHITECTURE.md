# 在线交互式答题与即时评分统计应用 - 架构说明

## 项目概述

这是一个全栈在线教育答题应用，支持教师创建测验、学生在线作答、自动评分和多维度数据分析。

---

## 技术栈

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite 5
- **路由**: React Router DOM 6
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **图表库**: Recharts
- **日期处理**: Day.js
- **ID生成**: UUID

### 后端
- **框架**: FastAPI (Python)
- **服务器**: Uvicorn (ASGI)
- **数据验证**: Pydantic 2

---

## 文件结构与职责

```
auto72/
├── index.html                      # 入口HTML
├── package.json                    # 前端依赖与脚本
├── tsconfig.json                   # TypeScript配置（严格模式）
├── tsconfig.node.json              # Node环境TypeScript配置
├── vite.config.js                  # Vite构建配置（代理/api到后端）
│
├── src/
│   ├── main.tsx                    # 应用入口，挂载React和Router
│   ├── App.tsx                     # 主组件，路由配置，导航栏
│   ├── index.css                   # 全局样式与动画定义
│   ├── types.ts                    # TypeScript类型定义
│   ├── api.ts                      # Axios API封装层
│   ├── store.ts                    # Zustand状态管理
│   │
│   └── components/
│       ├── QuizList.tsx            # 测验卡片列表（学生端首页）
│       ├── QuizPlayer.tsx          # 答题界面（逐题作答）
│       ├── ResultDashboard.tsx     # 成绩统计仪表盘
│       ├── TeacherDashboard.tsx    # 教师端成绩概览
│       └── CreateQuiz.tsx          # 教师端创建测验
│
└── backend/
    ├── main.py                     # FastAPI后端主程序
    └── requirements.txt            # Python依赖
```

---

## 数据流向与调用关系

```
                                 ┌──────────────────┐
                                 │  用户界面交互     │
                                 │  (浏览器)         │
                                 └────────┬─────────┘
                                          │
                                          ▼
┌───────────────────────────────────────────────────────────────────┐
│                     React 组件层                                  │
│  ┌─────────────┐   ┌─────────────┐   ┌────────────────────────┐ │
│  │ QuizList    │   │ QuizPlayer  │   │ ResultDashboard        │ │
│  │ (浏览测验)  │   │ (答题)      │   │ (成绩统计)             │ │
│  └──────┬──────┘   └──────┬──────┘   └───────────┬────────────┘ │
│         │                 │                        │              │
│         ▼                 ▼                        ▼              │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              Zustand 状态管理 (store.ts)                │    │
│  │  - quizzes: 测验列表                                    │    │
│  │  - currentQuizId: 当前测验ID                            │    │
│  │  - currentQuestionIndex: 当前题目索引                   │    │
│  │  - userAnswers: 用户答案                                │    │
│  │  - scoreResult: 评分结果                                │    │
│  │  - allScores: 所有成绩                                  │    │
│  │  - questionStartTime: 题目开始时间戳                    │    │
│  └─────────────────────────────┬────────────────────────────┘    │
│                                │                                 │
│                                ▼                                 │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              Axios API 层 (api.ts)                      │    │
│  │  - getQuizzes(): 获取测验列表（支持If-Modified-Since）   │    │
│  │  - getQuiz(id): 获取单个测验                            │    │
│  │  - createQuiz(): 创建测验                               │    │
│  │  - submitQuiz(): 提交答案并获取评分                     │    │
│  │  - getAllScores(): 获取成绩（支持增量since参数）         │    │
│  │  - getScoreDetail(): 获取成绩详情                       │    │
│  └─────────────────────────────┬────────────────────────────┘    │
└────────────────────────────────│─────────────────────────────────┘
                                 │
                          HTTP /api
                                 │
                                 ▼
┌───────────────────────────────────────────────────────────────────┐
│                     FastAPI 后端层 (backend/main.py)              │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                  数据模型 (Pydantic)                     │    │
│  │  Question, Quiz, Answer, QuestionStat, Score            │    │
│  │  QuestionCreate, QuizCreateRequest                      │    │
│  │  QuestionAnswerRecord, QuizAnswerRecord                 │    │
│  └─────────────────────────────┬────────────────────────────┘    │
│                                │                                 │
│                                ▼                                 │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                   API 端点                               │    │
│  │  GET    /api/quizzes          获取测验列表               │    │
│  │  GET    /api/quizzes/{id}     获取测验详情               │    │
│  │  POST   /api/quizzes          创建测验                   │    │
│  │  POST   /api/quizzes/submit   提交答案并评分             │    │
│  │  GET    /api/scores           获取成绩列表（增量）        │    │
│  │  GET    /api/scores/{id}      获取成绩详情               │    │
│  └─────────────────────────────┬────────────────────────────┘    │
│                                │                                 │
│                                ▼                                 │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │              业务逻辑与数据存储                          │    │
│  │  - quizzes_db: 内存测验数据库                           │    │
│  │  - scores_db: 内存成绩数据库                            │    │
│  │  - answer_records_db: 答题记录数据库                    │    │
│  │  - question_time_aggregates: 答题时长聚合数据           │    │
│  │  - last_modified: 最后修改时间戳                        │    │
│  │  - 评分计算逻辑                                         │    │
│  │  - 答题时长聚合计算逻辑                                 │    │
│  │  - 正确率统计逻辑                                       │    │
│  └──────────────────────────────────────────────────────────┘    │
└───────────────────────────────────────────────────────────────────┘
```

---

## 详细数据流说明

### 1. 教师创建测验流程
```
教师点击"创建测验"
    ↓
访问 /teacher/create → CreateQuiz.tsx
    ↓
填写标题、添加10+道题（选择/判断/填空）
    ↓
点击"创建测验" → quizApi.createQuiz(request)
    ↓
POST /api/quizzes → FastAPI
    ↓
验证：题目类型、选项数量、必填字段
    ↓
生成UUID，存入 quizzes_db
    ↓
更新 last_modified 时间戳
    ↓
返回创建成功 → 跳转到 /teacher
    ↓
前端通过轮询获取新测验 → 出现在学生端列表
```

### 2. 学生答题流程
```
学生浏览测验列表 → QuizList.tsx
    ↓
点击测验卡片 → 进入 /quiz/{id}
    ↓
输入姓名 → 开始答题
    ↓
逐题作答 (QuizPlayer.tsx)
  • 记录 questionStartTime 时间戳
  • 选择/输入答案 → 计算 timeSpent
  • 记录 startTime、endTime、timeSpent
  • 即时反馈：绿色脉冲/红色抖动
  • 进度条颜色通过HSL从红→绿渐变
  • 自动跳转下一题
    ↓
最后一题提交 → quizApi.submitQuiz()
    ↓
POST /api/quizzes/submit
    ↓
后端计算：
  • 每题正误判断
  • 总分、正确率、总用时
  • 每题答题时长存入 answer_records_db
  • 聚合计算 avgTimeSpent（供热力图）
  • 聚合计算 accuracy（全班正确率）
    ↓
返回 Score 对象 → 跳转到 /result/{id}
```

### 3. 成绩统计展示流程
```
ResultDashboard.tsx 加载
    ↓
数字滚动动画：
  • 从0递增到实际得分
  • easeOut 缓动函数
  • 1500ms 动画时长
    ↓
展示关键指标：
  • 总得分（带数字滚动）
  • 正确率百分比
  • 答对题数
  • 总用时（X分Y秒）
    ↓
Recharts 图表渲染：
  • 柱状图：每题正确率分布（颜色红→绿渐变）
  • 热力图：每题平均答题时长（浅黄→深红）
```

### 4. 教师端轮询更新流程
```
TeacherDashboard.tsx 加载
    ↓
首次加载：全量拉取所有成绩
    ↓
每30秒轮询：
  • 带 If-Modified-Since 头
  • 带 since 参数（上次拉取时间）
    ↓
GET /api/scores?since=xxx
    ↓
后端检查：
  • 304 Not Modified → 无更新
  • 200 OK → 返回增量数据
    ↓
前端对比已有数据，仅添加新成绩
    ↓
新成绩行：从右向左滑入动画
```

---

## 关键设计模式

### 1. 状态管理模式 (Zustand)
- 采用 **单原子状态树** 模式
- 组件通过 selector 按需订阅状态
- 避免不必要的重渲染

### 2. API 层封装模式
- **统一错误处理**：请求失败降级到 Mock 数据
- **缓存控制**：If-Modified-Since 条件请求
- **增量更新**：since 参数减少数据传输

### 3. 颜色渐变算法 (HSL)
```typescript
// 正确率 0% → 红色 (Hue=0)
// 正确率 50% → 黄色 (Hue=60)
// 正确率 100% → 绿色 (Hue=120)
hue = (accuracy / 100) * 120
color = hslToRgb(hue/360, 0.7, 0.45)
```

### 4. 动画缓动函数
```typescript
// easeOut 缓动：先快后慢
progress = Math.min(elapsed / duration, 1)
easeOut = 1 - Math.pow(1 - progress, 3)
currentValue = targetValue * easeOut
```

---

## 性能优化策略

1. **包体积控制**:
   - Gzip 后 ≈ 189 KB (< 300KB 要求)
   - 生产构建 Tree Shaking

2. **答题页面切换**:
   - 纯状态驱动，无 DOM 重排
   - 切换时间 < 100ms

3. **图表渲染**:
   - Recharts 轻量级 Canvas/SVG 渲染
   - 首屏图表 < 1s 渲染完成

4. **网络优化**:
   - 304 条件请求避免全量拉取
   - 增量更新只传输新增数据
   - 30秒轮询间隔平衡实时性与性能

5. **答题时长数据**:
   - 后端预聚合 avgTimeSpent
   - 前端直接使用，无需计算

---

## 配置文件说明

### package.json
```json
{
  "dependencies": {
    "react": "^18.2.0",           // UI框架
    "react-dom": "^18.2.0",       // DOM渲染
    "react-router-dom": "^6.20.0",// 路由
    "axios": "^1.6.0",            // HTTP客户端
    "zustand": "^4.4.0",          // 状态管理
    "recharts": "^2.10.0",        // 图表
    "uuid": "^9.0.0",             // ID生成
    "dayjs": "^1.11.10"           // 日期处理
  },
  "scripts": {
    "dev": "vite",                // 开发服务器
    "build": "tsc && vite build", // 生产构建
    "preview": "vite preview"     // 预览构建结果
  }
}
```

### vite.config.js
- 开发服务器端口：5173
- 代理 `/api` → `http://localhost:8000`
- React 插件启用 HMR

### tsconfig.json
- 严格模式：`strict: true`
- ESNext 模块/目标
- 不检查未使用变量/参数（`noUnusedLocals`, `noUnusedParameters`）
- JSX 转换：react-jsx

---

## 启动方式

### 前端开发
```bash
npm install
npm run dev
# 访问 http://localhost:5173
```

### 后端启动
```bash
cd backend
pip install -r requirements.txt
python main.py
# 访问 http://localhost:8000/docs (API文档)
```

### 生产构建
```bash
npm run build
# 输出到 dist/ 目录
```

---

## 各模块调用关系矩阵

| 模块 | 依赖 | 被依赖 | 核心功能 |
|------|------|--------|----------|
| types.ts | - | 所有组件、api、store | 类型定义 |
| store.ts | types | App, 所有组件 | 状态管理 |
| api.ts | types, axios | App, 所有组件 | 后端通信 |
| App.tsx | store, api, 所有组件 | main.tsx | 路由与导航 |
| QuizList.tsx | store, api, types | App | 测验列表展示 |
| QuizPlayer.tsx | store, api, types | App | 答题交互 |
| ResultDashboard.tsx | store, api, types, recharts | App | 成绩统计 |
| TeacherDashboard.tsx | store, api, types | App | 教师端管理 |
| CreateQuiz.tsx | api, types | App | 创建测验表单 |
