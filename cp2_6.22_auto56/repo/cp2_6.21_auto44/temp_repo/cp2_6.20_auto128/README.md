# Campus Club Platform - 校园社团管理与活动招募平台

## 项目结构

```
campus-club-platform/
├── package.json              # 前端依赖与启动脚本
├── vite.config.js            # Vite配置（代理转发API到8000端口）
├── tsconfig.json             # TypeScript严格模式配置
├── tsconfig.node.json        # Vite配置文件的TS声明
├── index.html                # 入口页面 (div#root)
├── backend/
│   ├── requirements.txt      # FastAPI后端依赖
│   └── main.py               # FastAPI应用 + SQLite数据库
└── src/
    ├── main.tsx              # React入口，挂载App，初始化ConfigProvider
    ├── App.tsx               # 主应用组件，包含路由、导航布局
    ├── api/
    │   └── index.ts          # Axios封装的API接口（clubApi, userApi）
    ├── types/
    │   └── index.ts          # TypeScript类型定义（Club, Activity等）
    ├── stores/
    │   └── useClubStore.ts   # Zustand状态管理（社团/活动/申请状态）
    ├── styles/
    │   └── global.css        # 全局样式 + 动画 + 响应式规则
    ├── components/
    │   ├── Navbar.tsx        # 顶部毛玻璃导航栏
    │   ├── Sidebar.tsx       # 左侧侧边导航菜单
    │   └── ClubCard.tsx      # 社团卡片组件（悬停动画）
    └── pages/
        ├── Home.tsx          # 首页：社团列表 + 筛选
        ├── ClubDetail.tsx    # 社团详情页：活动日程 + 成员 + 报名
        └── MyClubs.tsx       # 我的社团：分类折叠列表
```

## 文件调用关系 & 数据流向

### 前端数据流向
```
用户交互 → 页面组件 (Home/ClubDetail/MyClubs)
               ↓ 调用 action
       useClubStore (Zustand)
               ↓ 调用 api
          api/index.ts (Axios)
               ↓ HTTP请求 (Vite代理)
          backend/main.py (FastAPI)
               ↓ 查询/写入
          SQLite 数据库
               ↓ 返回JSON
          页面组件自动重渲染
```

### 调用链示例
1. **首页加载社团列表**：
   `Home.tsx useEffect → useClubStore.fetchClubs() → clubApi.list() → GET /api/clubs → SQLite`

2. **查看社团详情**：
   `ClubDetail.tsx useParams → useClubStore.fetchClubDetail(id) → clubApi.detail(id) → GET /api/clubs/{id}`

3. **报名社团**：
   `ClubDetail.tsx 按钮点击 → useClubStore.applyClub(id, reason) → clubApi.apply() → POST /api/clubs/{id}/apply`

4. **查看我的社团**：
   `MyClubs.tsx useEffect → useClubStore.fetchApplications() → userApi.applications() → GET /api/user/applications`

### 后端数据流向
```
HTTP Request → FastAPI Router Handler → SQLite Query → JSON Response
                     ↓
               业务逻辑校验
               (是否已报名/是否满员/理由长度)
```

## 启动步骤

### 方式一：分别启动前后端

**1. 启动后端（需要Python 3.8+）**
```bash
cd backend
pip install -r requirements.txt
python main.py
# 后端运行在 http://localhost:8000
# API文档 http://localhost:8000/docs
```

**2. 启动前端（新开终端）**
```bash
# 在项目根目录
npm install
npm run dev
# 前端运行在 http://localhost:5173
```

### 方式二：Windows一键启动
```powershell
# 后端
cd backend ; pip install -r requirements.txt ; python main.py

# 新终端启动前端
npm install ; npm run dev
```

## 功能清单

✅ **社团探索首页**
- 响应式卡片网格（4→3→2→1列）
- 类别筛选（学术/体育/文艺/公益）
- 活动频次筛选（每周/每两周/每月）
- 卡片悬停动画：上移8px + 阴影加深0.15（0.3s ease-out）
- 卡片底部渐变装饰条

✅ **社团详情页**
- 渐变色封面大图
- 完整介绍 + 社团信息
- 近期活动日程（时间倒序 + 分页）
- 成员头像（前8个 + 展开全部）
- 报名按钮状态反馈

✅ **报名与状态管理**
- 普通社团：直接报名 → "已报名"
- 满员社团：按钮禁用 → "已满"
- 受限社团（舞蹈社/辩论社）：弹窗填写50-200字理由 → "待审核"
- 状态分类：待审核 / 已通过 / 未通过

✅ **我的社团面板**
- 顶部状态统计卡片
- 三个折叠面板（待审核/已通过/未通过）
- 社团卡片展示成员数、报名时间
- 点击跳转到社团详情

## 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | React 18 + TypeScript |
| UI 组件 | Ant Design 5 |
| 状态管理 | Zustand |
| HTTP 客户端 | Axios |
| 路由 | React Router v6 |
| 日期处理 | Day.js |
| 构建工具 | Vite 5 |
| 后端框架 | FastAPI |
| 数据库 | SQLite (内置) |
| ORM | 原生 SQL (sqlite3) |
