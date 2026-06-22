# 社区图书馆管理系统 - 技术架构文档

## 1. 技术选型

| 类别 | 技术 | 版本 | 说明 |
|------|------|------|------|
| 前端框架 | React | ^18.2.0 | 核心UI框架 |
| 开发语言 | TypeScript | ^5.0.0 | 类型安全 |
| 构建工具 | Vite | ^5.0.0 | 快速构建与HMR |
| UI组件库 | Ant Design | ^5.12.0 | 企业级组件库，按需加载 |
| 图标库 | @ant-design/icons | ^5.2.0 | Ant Design图标 |
| 路由 | react-router-dom | ^6.20.0 | 单页应用路由 |

## 2. 项目结构

```
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
└── src/
    ├── App.tsx                    # 根组件，路由与上下文管理
    ├── types/                     # TypeScript类型定义
    │   └── index.ts
    ├── context/
    │   └── AppContext.tsx         # 全局状态管理
    ├── data/
    │   └── mockData.ts            # 模拟数据
    ├── components/
    │   └── Dashboard.tsx          # 统计看板组件
    └── modules/
        ├── BookManager/
        │   ├── BookManager.tsx    # 图书管理主模块
        │   └── BookCard.tsx       # 图书卡片组件
        └── ReaderManager/
            ├── ReaderManager.tsx  # 读者管理主模块
            ├── ReaderCard.tsx     # 读者卡片组件
            └── BorrowRecord.tsx   # 借阅记录组件
```

## 3. 核心模块设计

### 3.1 BookManager 模块
- **职责**：图书数据CRUD、搜索逻辑、推荐算法
- **核心方法**：
  - `addBook(book: Book): void` - 添加图书
  - `searchBooks(keyword: string): Book[]` - 模糊搜索图书
  - `getRecommendations(readerId: string): Book[]` - 生成个性化推荐
  - `getHotBooks(limit: number): Book[]` - 获取热门图书

### 3.2 ReaderManager 模块
- **职责**：读者数据管理、借阅记录、逾期检测
- **核心方法**：
  - `addReader(reader: Reader): void` - 添加读者
  - `borrowBook(readerId: string, bookId: string): void` - 借阅图书
  - `returnBook(recordId: string): void` - 归还图书
  - `checkOverdue(): BorrowRecord[]` - 检测逾期记录

### 3.3 AppContext 上下文
- **作用**：跨模块数据传递
- **状态**：
  - `books: Book[]` - 图书列表
  - `readers: Reader[]` - 读者列表
  - `borrowRecords: BorrowRecord[]` - 借阅记录

## 4. 数据模型

```typescript
interface Book {
  id: string;
  title: string;
  author: string;
  isbn: string;
  category: string;
  stock: number;
  borrowCount: number;
  coverColor: string;
  hotLevel: number; // 1-5 星标
}

interface Reader {
  id: string;
  name: string;
  borrowCount: number;
  overdueCount: number;
  preferredCategories: string[];
  preferredAuthors: string[];
}

interface BorrowRecord {
  id: string;
  readerId: string;
  bookId: string;
  borrowDate: Date;
  dueDate: Date;
  returnDate?: Date;
  isOverdue: boolean;
}
```

## 5. 性能优化策略

### 5.1 搜索性能
- 使用二分查找 + 前缀索引优化模糊搜索
- 搜索结果防抖处理（200ms）
- 1000条数据基准测试保证 <200ms 响应

### 5.2 加载性能
- Vite 代码分割
- Ant Design 按需加载（通过 vite-plugin-antd 实现）
- 组件懒加载

## 6. 构建配置

### 6.1 Vite 配置要点
- React 插件启用
- Ant Design 按需加载配置
- 别名配置 `@` 指向 src 目录

### 6.2 TypeScript 配置
- 严格模式 `strict: true`
- 目标 ES2020
- JSX: react-jsx
