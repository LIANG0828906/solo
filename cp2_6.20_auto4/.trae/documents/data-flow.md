# 读书俱乐部 - 文件调用关系与数据流向

## 项目文件结构

```
├── index.html                    # 入口HTML，加载 /src/main.tsx
├── package.json                  # 依赖：react, react-dom, react-router-dom, chart.js, react-chartjs-2, axios, date-fns
├── vite.config.ts                # Vite构建配置（React插件、路径别名）
├── tsconfig.json                 # TypeScript严格模式配置
├── tailwind.config.js            # TailwindCSS主题配置（cream/orange/green颜色体系）
│
├── src/
│   ├── main.tsx                  # 应用入口 → 渲染 <App /> 到 #root
│   ├── App.tsx                   # 主组件：React Router路由管理 + Suspense代码分割
│   │                             #   调用 → Navbar, 各Page组件（lazy加载）
│   │                             #   数据流 → 路由参数分发到各页面
│   │
│   ├── types/index.ts            # 全局类型定义：Book, CheckInRecord, Comment, Achievement, BookList
│   │                             #   被引用 ← api/index.ts, store/index.ts, 各组件
│   │
│   ├── api/index.ts              # API调用层：封装axios实例，统一请求/响应处理
│   │                             #   调用 → 后端 /api/* RESTful接口
│   │                             #   被引用 ← store/index.ts
│   │                             #   方法：getBookRecommendations, getBookById,
│   │                             #         getCheckInRecords, submitCheckIn, updateCheckIn,
│   │                             #         fetchComments, submitComment, likeComment, replyComment,
│   │                             #         getAchievements, getBookLists, createBookList,
│   │                             #         deleteBookList, addBookToBookList, reorderBookLists
│   │
│   ├── store/index.ts            # Zustand状态管理：统一store
│   │                             #   调用 → api/index.ts（所有API方法）
│   │                             #   调用 → mock/data.ts（API失败时的降级数据）
│   │                             #   被引用 ← 所有组件和页面
│   │                             #   状态切片：books, checkIn, comments, achievements, bookLists, ui
│   │
│   ├── mock/data.ts              # Mock数据：12本书、30天打卡、18条评论、6个成就、3个书单
│   │                             #   被引用 ← store/index.ts
│   │
│   ├── components/
│   │   ├── Navbar.tsx            # 导航栏：毛玻璃效果 + 滑动指示器 + 汉堡菜单
│   │   │                         #   调用 → store (mobileMenuOpen, setMobileMenuOpen)
│   │   │                         #   调用 → react-router-dom (Link, useLocation)
│   │   │
│   │   ├── BookRecommendation.tsx # 书籍推荐：横向滚动卡片，星级+豆瓣评分
│   │   │                         #   调用 → store (books, fetchRecommendations)
│   │   │                         #   数据流 → API获取书籍列表 → 渲染卡片 → 点击跳转/book/:id
│   │   │
│   │   ├── ReadingCheckIn.tsx    # 阅读打卡：日历热力图 + Chart.js折线图
│   │   │                         #   调用 → store (checkInRecords, fetchRecords, submitRecord, updateRecord)
│   │   │                         #   调用 → chart.js, react-chartjs-2 (Line组件)
│   │   │                         #   调用 → date-fns (日期格式化)
│   │   │                         #   数据流 → API获取打卡记录 → 渲染热力图和趋势图
│   │   │                         #           → 表单提交 → 更新store → 同步到后端
│   │   │
│   │   ├── BookReview.tsx        # 书评讨论：评论列表 + Markdown渲染 + 点赞回复
│   │   │                         #   调用 → store (comments, fetchComments, addComment,
│   │   │                         #              likeComment, replyComment, setSortType)
│   │   │                         #   数据流 → API获取评论列表 → 渲染评论树
│   │   │                         #           → 用户提交评论 → 更新UI并刷新列表
│   │   │                         #           → 点赞/回复 → 更新store → 同步到后端
│   │   │
│   │   ├── AchievementSystem.tsx # 成就系统：3×2徽章网格 + 进度弹窗
│   │   │                         #   调用 → store (achievements, fetchAchievements)
│   │   │                         #   数据流 → API获取成就数据 → 渲染已解锁(金色)/未解锁(灰色)徽章
│   │   │                         #           → 点击灰色徽章 → 弹出进度提示
│   │   │
│   │   └── BookListManager.tsx   # 书单管理：创建/删除/拖拽排序/添加书籍
│   │                             #   调用 → store (bookLists, books, fetchBookLists,
│   │                             #              createBookList, deleteBookList, addBookToList, reorderLists)
│   │                             #   数据流 → API获取书单 → 渲染书单卡片
│   │                             #           → 创建/删除书单 → 更新store → 同步后端
│   │                             #           → 拖拽排序 → 重算order → 调用reorderLists API
│   │                             #           → 添加书籍 → 更新书单books数组 → 同步后端
│   │
│   ├── pages/
│   │   ├── Home.tsx              # 首页：统计概览 + BookRecommendation + 快捷入口
│   │   │                         #   调用 → store (checkInRecords, bookLists, fetchRecords, fetchBookLists)
│   │   │                         #   调用 → BookRecommendation组件
│   │   │
│   │   ├── BookDetail.tsx        # 书籍详情：封面+信息+章节+评论
│   │   │                         #   调用 → store (currentBook, fetchBookById)
│   │   │                         #   调用 → BookReview组件（传入bookId）
│   │   │
│   │   ├── CheckInPage.tsx       # 打卡页：ReadingCheckIn组件容器
│   │   │                         #   调用 → ReadingCheckIn组件
│   │   │
│   │   ├── ReviewsPage.tsx       # 书评页：书籍选择器 + BookReview组件
│   │   │                         #   调用 → store (books, fetchRecommendations)
│   │   │                         #   调用 → BookReview组件（传入selectedBookId）
│   │   │
│   │   ├── AchievementsPage.tsx  # 成就页：AchievementSystem组件容器
│   │   │                         #   调用 → AchievementSystem组件
│   │   │
│   │   └── BookListsPage.tsx     # 书单页：BookListManager组件容器
│   │                             #   调用 → BookListManager组件
│   │
│   ├── lib/utils.ts              # 工具函数：cn()（clsx + tailwind-merge）
│   └── index.css                 # 全局样式：TailwindCSS + 自定义组件类 + 字体 + 滚动条
│
└── api/                          # FastAPI后端目录（Python）
    └── (待实现)
```

## 核心数据流向图

```
┌─────────────┐     HTTP请求      ┌──────────────┐     SQL查询     ┌──────────┐
│  前端组件    │ ──────────────→  │  API层        │ ─────────────→ │ SQLite   │
│  (React)    │ ←──────────────  │  (api/index)  │ ←───────────── │ 数据库   │
└──────┬──────┘     JSON响应      └──────────────┘     查询结果     └──────────┘
       │
       │ 读取/更新状态
       ▼
┌──────────────┐     API失败时     ┌──────────────┐
│  Zustand     │ ──────────────→  │  Mock数据     │
│  Store       │ ←──────────────  │  (mock/data)  │
└──────────────┘     降级数据      └──────────────┘
```

## 页面级数据流

### 首页 (/)
```
Home.tsx
  ├─ useStore.fetchRecords() → checkInRecords → 计算月度统计
  ├─ useStore.fetchBookLists() → bookLists → 计算已读书籍数
  └─ BookRecommendation → useStore.fetchRecommendations() → books → 渲染卡片
```

### 书籍详情页 (/book/:id)
```
BookDetail.tsx
  ├─ useStore.fetchBookById(id) → currentBook → 渲染书籍信息
  └─ BookReview(bookId) → useStore.fetchComments(bookId) → comments → 渲染评论
```

### 打卡页 (/checkin)
```
ReadingCheckIn.tsx
  ├─ useStore.fetchRecords() → checkInRecords → 日历热力图 + Chart.js折线图
  ├─ 表单提交 → useStore.submitRecord() → API → 更新checkInRecords
  └─ 编辑打卡 → useStore.updateRecord() → API → 更新checkInRecords
```

### 书评页 (/reviews)
```
ReviewsPage.tsx
  ├─ useStore.fetchRecommendations() → books → 书籍选择器
  └─ BookReview(selectedBookId) → useStore.fetchComments() → comments
       ├─ addComment() → API → 更新comments
       ├─ likeComment() → API → 更新comments中的likes
       └─ replyComment() → API → 更新comments中的replies
```

### 成就页 (/achievements)
```
AchievementSystem.tsx
  └─ useStore.fetchAchievements() → achievements → 渲染徽章网格
       └─ 点击锁定徽章 → 弹出进度Popover
```

### 书单页 (/booklists)
```
BookListManager.tsx
  ├─ useStore.fetchBookLists() → bookLists → 渲染书单卡片
  ├─ createBookList() → API → 更新bookLists
  ├─ deleteBookList() → API → 更新bookLists
  ├─ addBookToList() → API → 更新bookLists中的books
  └─ reorderLists() → API → 更新bookLists中的order
```
