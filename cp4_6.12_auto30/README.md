# 匠艺皮具 - 定制订单与皮革原料库存管理应用

## 项目概述

这是一个为小型独立手工皮具工作室设计的全栈应用，帮助客户在线定制皮具，并为工作室提供订单管理、库存管理和工具档期管理功能。

## 技术栈

- **前端**: React 18 + TypeScript + Vite
- **后端**: Node.js + Express + TypeScript
- **数据库**: SQLite (better-sqlite3)
- **状态管理**: Zustand
- **HTTP客户端**: Axios
- **路由**: React Router DOM

## 项目结构

```
auto30/
├── package.json              # 项目依赖和启动脚本
├── vite.config.js            # Vite构建配置，代理/api到后端
├── tsconfig.json             # TypeScript配置（严格模式）
├── tsconfig.node.json        # Node环境TypeScript配置
├── index.html                # 入口HTML
├── favicon.svg               # 网站图标
├── data.db                   # SQLite数据库文件（运行后生成）
├── uploads/                  # 上传图片存储目录（运行后生成）
└── src/
    ├── types/
    │   └── index.ts          # 全局类型定义
    ├── client/               # 客户端展示模块
    │   ├── main.tsx          # 客户端入口
    │   ├── App.tsx           # 应用根组件
    │   ├── Navbar.tsx        # 导航栏组件
    │   ├── ProductList.tsx   # 皮具列表页面
    │   ├── ProductDetail.tsx # 皮具定制详情页
    │   ├── OrderConfirm.tsx  # 订单确认页面
    │   ├── store.ts          # Zustand状态管理
    │   └── styles.css        # 全局样式
    ├── admin/                # 后台管理模块
    │   ├── AdminLayout.tsx   # 后台布局组件
    │   ├── OrderDashboard.tsx    # 订单看板
    │   ├── InventoryManager.tsx  # 库存管理
    │   └── ToolManager.tsx       # 工具管理
    └── server/
        └── index.ts          # Express服务器入口
```

## 数据流向与调用关系

### 客户定制流程

```
客户浏览:
ProductList.tsx → GET /api/products → 后端查询products表 → 返回产品列表
    ↓ 点击产品
ProductDetail.tsx → GET /api/products/:id → 后端查询products表 → 返回产品详情
    ↓ 配置皮革/厚度/五金/上传草图
    │  → 前端实时计算预估面积和价格 (<100ms延迟)
    ↓ 提交订单
ProductDetail.tsx → POST /api/orders → 后端:
    1. checkInventory() 校验库存
    2. 库存充足 → deductInventory() 扣减库存
    3. 插入orders表
    4. 返回订单号
    ↓
OrderConfirm.tsx 显示订单确认信息
```

### 订单管理流程

```
OrderDashboard.tsx → GET /api/orders → 后端查询orders表 → 返回所有订单
    ↓ 按状态分组展示（10个状态）
    ↓ 点击订单查看详情
    ↓ 点击推进状态
OrderDashboard.tsx → PUT /api/orders/:id → 后端:
    1. 更新订单状态
    2. 追加状态历史记录（含时间戳）
    3. 更新orders表
```

### 库存管理流程

```
InventoryManager.tsx → GET /api/inventory → 后端查询inventory表 → 返回库存列表
    ↓ 实时过滤（150ms防抖）
    ↓ 新增入库:
    POST /api/inventory → 后端插入inventory表
    ↓ 编辑/标记用尽:
    PUT /api/inventory/:id → 后端更新inventory表
    ↓
底部分栏显示最近5笔订单的皮料消耗明细
```

### 工具管理流程

```
ToolManager.tsx → GET /api/tools → 后端查询tools表 → 返回工具列表
    ↓ 搜索过滤
    ↓ 借用:
    POST /api/tools/:id/borrow → 后端:
        1. 更新tools表状态为"借用中"
        2. 插入tool_borrow_records表记录
    ↓ 归还:
    POST /api/tools/:id/return → 后端:
        1. 更新tools表状态为"空闲"
        2. 更新tool_borrow_records表记录实际归还时间
```

## 数据库表结构

### products 产品表
- id, name, type, description, basePrice, thumbnail, images, leatherTypes, areaRangeMin, areaRangeMax

### inventory 库存表
- id, leatherType, color, colorCode, thickness, availableArea, grade, source, purchaseDate, status

### orders 订单表
- id, orderNo, customerName, customerPhone, items(JSON), status, statusHistory(JSON), estimatedHours, totalPrice, createdAt, updatedAt

### tools 工具表
- id, name, status, currentBorrower, borrowDate, expectedReturnDate, actualReturnDate

### tool_borrow_records 借用记录表
- id, toolId, toolName, borrower, borrowDate, expectedReturnDate, actualReturnDate

## 订单状态流转

```
待确认 → 已确认 → 皮料裁切 → 手工缝制 → 五金安装 → 边油处理 → 质检 → 待发货 → 已发货 → 已完成
```

## 智能皮料面积预估规则

- 钱包：1.5-2.0 平方分米
- 手提包：6-10 平方分米
- 背包：12-18 平方分米
- 腰带：0.8-1.2 平方分米
- 厚度系数：每增加0.5mm，面积增加5%

## 颜色规范

- 背景色：#FDF8F0（米白）
- 主色：#8B5E3C（深棕）
- 强调色：#D4A574（浅棕）
- 成功色：#5CB85C
- 警告色：#E57373
- 边框色：#E8DCC8

## 启动方式

```bash
# 安装依赖
npm install

# 启动开发服务器（同时启动前端和后端）
npm run dev

# 仅启动后端
npm run server

# 仅启动前端
npm run client

# 构建生产版本
npm run build
```

## 访问地址

- 客户端：http://localhost:3000
- 后台管理：http://localhost:3000/admin
- API服务：http://localhost:3001

## 性能优化

1. 厚度滑块和皮革种类切换使用本地计算，无网络请求，更新延迟<100ms
2. 库存过滤使用150ms防抖，实时响应
3. 订单列表使用useMemo分组，100条记录首次渲染<500ms
4. 所有动画使用0.2s ease-out过渡，体验流畅
5. 图片使用WebP格式和合理尺寸，加载快速

## 响应式设计

- 屏幕宽度≥768px：双栏布局，卡片网格多列
- 屏幕宽度<768px：单列布局，后台左栏折叠为顶部汉堡菜单
