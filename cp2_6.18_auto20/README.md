# LitBoard - 书单协作与排行应用

> 面向线上读书会社群的书单分享平台

## 项目概述

LitBoard 是一个专为线上读书会社群设计的书单协作与排行应用。用户可以创建书单、分享阅读体验、发表评论和评分，系统会根据互动数据实时计算热度排行，帮助社群成员发现优质书单。

## 技术栈

| 技术 | 版本 | 用途 |
|------|------|------|
| React | 18.3.1 | UI 框架 |
| TypeScript | ~5.8.3 | 类型系统 |
| Vite | ^6.3.5 | 构建工具 |
| Zustand | ^5.0.3 | 状态管理 |
| React Router DOM | ^7.3.0 | 路由管理 |
| TailwindCSS | ^3.4.17 | CSS 框架 |
| Recharts | ^2.12.0 | 图表库 |
| Lucide React | ^0.511.0 | 图标库 |
| uuid | ^9.0.1 | ID 生成 |
| clsx | ^2.1.1 | 类名工具 |
| tailwind-merge | ^3.0.2 | Tailwind 类名合并 |

## 文件结构与职责

### 根目录配置文件

| 文件 | 职责 |
|------|------|
| `package.json` | 项目依赖管理、脚本配置 |
| `vite.config.ts` | Vite 构建配置、插件配置、路径别名 |
| `tsconfig.json` | TypeScript 编译配置 |
| `tailwind.config.js` | TailwindCSS 主题配置、自定义颜色 |
| `postcss.config.js` | PostCSS 配置 |
| `eslint.config.js` | ESLint 代码规范配置 |
| `index.html` | HTML 入口文件 |

### 源码核心文件

| 文件 | 职责 |
|------|------|
| `src/main.tsx` | 应用入口，挂载 React 应用 |
| `src/App.tsx` | 根组件，路由配置，全局布局 |
| `src/index.css` | 全局样式，Tailwind 指令 |

### 类型定义

| 文件 | 职责 |
|------|------|
| `src/types/index.ts` | 全局 TypeScript 类型定义（BookList, Comment, Rating 等） |

### 状态管理

| 文件 | 职责 |
|------|------|
| `src/store/index.ts` | Store 导出入口 |
| `src/store/bookStore.ts` | 核心状态管理，书单、评论、评分、排行数据 |

### 工具函数

| 文件 | 职责 |
|------|------|
| `src/utils/ranking.ts` | 排行计算纯函数（热度值、统计、排序） |
| `src/utils/format.ts` | 格式化工具（日期、数字等） |
| `src/lib/utils.ts` | 通用工具函数（cn 类名合并等） |

### 自定义 Hooks

| 文件 | 职责 |
|------|------|
| `src/hooks/useTheme.ts` | 主题切换 Hook |

### 组件

| 文件 | 职责 |
|------|------|
| `src/components/BookCard.tsx` | 书单卡片组件，展示书单摘要信息 |
| `src/components/StarRating.tsx` | 星级评分组件 |
| `src/components/CreateBookModal.tsx` | 创建书单弹窗 |
| `src/components/Sidebar.tsx` | 侧边栏导航（支持移动端汉堡菜单） |
| `src/components/Empty.tsx` | 空状态组件 |

### 页面

| 文件 | 职责 |
|------|------|
| `src/pages/Home.tsx` | 首页，热度排行展示 |
| `src/pages/BookList.tsx` | 书单列表页，全部书单展示 |
| `src/pages/BookDetail.tsx` | 书单详情页，评论、评分交互 |

## 调用关系与数据流向

```
UI 组件 → bookStore.ts → ranking.ts → bookStore.ts → UI 组件
                                    ↓
                              localStorage
```

### 详细说明

1. **单一数据通道**：`bookStore.ts` 作为唯一数据通道，所有组件都通过它读写数据，组件之间不直接传递状态
2. **纯函数分层**：`ranking.ts` 是纯函数模块，只被 store 调用，不直接接触 UI，确保逻辑可测试
3. **单向数据流**：用户操作 → store 更新 → 重新计算排名 → UI 刷新，数据流向清晰可追踪
4. **自动持久化**：store 变化后防抖 300ms 写入 localStorage，避免频繁 IO 操作

## 核心模块说明

### Store 模块（bookStore.ts）

#### 管理状态

- `bookLists` - 所有书单数据
- `comments` - 所有评论数据
- `ratings` - 所有评分数据
- `currentUser` - 当前用户信息
- `rankedBookLists` - 计算后的排行榜数据

#### 核心方法

```typescript
// 创建新书单
createBookList(data: CreateBookListData): void

// 添加评论
addComment(bookListId: string, content: string): void

// 添加评分
addRating(bookListId: string, score: number): void

// 切换点赞
toggleLike(bookListId: string): void

// 刷新排行（手动触发）
refreshRanking(): void
```

#### 自动行为

- 状态变化后自动调用 `ranking.ts` 重新计算排行
- 排行更新后触发 UI 响应式刷新
- 数据变更防抖 300ms 后持久化到 localStorage

### Ranking 模块（ranking.ts）

#### 设计原则

- 纯函数，无副作用
- 不依赖外部状态
- 输入相同则输出相同，易于测试

#### 核心函数

```typescript
// 计算热度值
// 热度值 = 平均评分 × 10 + 评论数 × 2 + 点赞数 × 1
function calculateHotScore(stats: BookListStats): number

// 计算单本书单的统计数据
function calculateBookListStats(
  bookList: BookList,
  comments: Comment[],
  ratings: Rating[]
): BookListStats

// 按热度排序
function sortByHotScore(bookLists: BookList[], comments: Comment[], ratings: Rating[]): RankedBookList[]
```

## 性能优化策略

### 1. 首屏渲染优化

- **目标**：< 2 秒完成首屏渲染
- **策略**：localStorage 预加载，同步读取本地缓存数据，无需等待网络请求
- **实现**：应用初始化时立即从 localStorage 恢复状态

### 2. 排行刷新优化

- **useMemo 缓存**：排行计算结果使用 useMemo 缓存，依赖不变时不重新计算
- **稳定 key**：列表渲染使用稳定的唯一 ID 作为 key，避免不必要的 DOM 重建
- **CSS transition**：排行变化时使用平滑过渡动画，避免视觉闪烁

### 3. 组件优化

- **React.memo**：纯展示组件使用 memo 包裹，props 不变时跳过重渲染
- **useMemo**：复杂计算结果缓存
- **useCallback**：事件处理函数引用稳定，避免子组件不必要重渲染

### 4. 动画优化

- 使用 `transform` 和 `opacity` 实现动画，触发 GPU 加速
- 避免在动画中修改 `width`、`height`、`top`、`left` 等会触发重排的属性

### 5. 持久化优化

- **防抖 300ms**：数据变化后等待 300ms 再写入 localStorage，避免频繁操作
- **增量更新**：只写入变化的部分，减少序列化开销

### 6. 自动刷新

- 热度排行每 30 秒自动刷新一次，确保数据实时性

## 启动方式

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 类型检查
npm run check

# 代码检查
npm run lint

# 构建生产版本
npm run build

# 预览生产构建
npm run preview
```

开发服务器默认运行在 `http://localhost:5173`

## 功能特性

### ✅ 书单管理
- 创建新书单（标题、描述、书籍列表、封面图）
- 书单列表展示
- 书单详情查看

### ✅ 互动系统
- 星级评分（1-5 星）
- 评论功能
- 点赞功能

### ✅ 热度排行
- 实时热度计算
- 30 秒自动刷新
- 热度变化动画

### ✅ 响应式设计
- 桌面端侧边栏导航
- 移动端汉堡菜单
- 适配各种屏幕尺寸

### ✅ 数据持久化
- localStorage 本地存储
- 页面刷新数据不丢失
- 防抖写入优化

### ✅ 用户体验
- 平滑过渡动画
- 空状态提示
- 加载状态反馈
