# 🌿 花园小管家

一个用于管理家庭植物养护计划的全栈 Web 应用。

## 功能特性

- 📋 **植物列表管理**：以网格方式展示所有植物，支持添加、删除操作
- 💧 **智能浇水提醒**：自动计算下一次浇水时间，逾期植物红色高亮提醒
- 📝 **生长记录时间线**：记录每棵植物的生长状态变化（每24小时一条）
- 🏷️ **植物分类管理**：多肉/观叶/开花/其他四种分类
- 📸 **照片上传**：支持为植物上传 JPG/PNG 照片（2MB以内，Base64存储）
- 🔔 **今日待办横幅**：顶部实时显示需要浇水的植物数量

## 技术栈

- **前端**：React 18 + TypeScript + Vite
- **状态管理**：Zustand
- **路由**：React Router v6
- **后端**：Node.js + Express + TypeScript
- **数据库**：lowdb（JSON 文件持久化）

## 项目结构

```
garden-keeper/
├── package.json          # 前后端统一依赖配置
├── vite.config.js        # Vite 配置 + API 代理
├── tsconfig.json         # TypeScript 配置（严格模式）
├── tsconfig.node.json    # Node 端 TS 配置
├── index.html            # 入口 HTML
├── server/
│   └── server.ts         # Express 后端服务器
└── src/
    ├── main.tsx          # React 入口
    ├── App.tsx           # 主应用（路由+导航栏）
    ├── types/
    │   └── index.ts      # TypeScript 类型定义
    ├── store/
    │   └── plantStore.ts # Zustand 状态管理
    ├── styles/
    │   └── global.css    # 全局样式 + 动画
    ├── utils/
    │   └── dateUtils.ts  # 日期/倒计时工具函数
    ├── components/
    │   ├── PlantCard.tsx     # 植物卡片组件
    │   ├── AddPlantModal.tsx # 添加植物弹窗
    │   └── Icons.tsx         # SVG 图标集合
    └── pages/
        ├── PlantListPage.tsx   # 植物列表页（/）
        └── PlantDetailPage.tsx # 植物详情页（/plant/:id）
```

## 快速开始

### 一键启动（推荐）

```bash
# 1. 安装依赖
npm install

# 2. 同时启动前后端（Vite 5173端口 + Express 3001端口）
npm run dev
```

访问 http://localhost:5173 即可使用应用。

### 分别启动

```bash
# 安装依赖
npm install

# 启动后端（端口 3001）
npm run dev:server

# 另开一个终端，启动前端（端口 5173）
npm run dev:client
```

## REST API 接口

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/plants` | 获取所有植物列表 |
| POST | `/api/plants` | 新增植物 |
| PATCH | `/api/plants/:id` | 更新植物信息 |
| DELETE | `/api/plants/:id` | 删除植物 |
| GET | `/api/today-reminders` | 获取今日待浇水植物 |
| POST | `/api/plants/:id/water` | 标记植物已浇水 |
| POST | `/api/plants/:id/records` | 添加生长记录 |

## 界面设计规范

- **主色调**：#4CAF50（Material Green 500）
- **辅助色**：#8BC34A（Light Green 500）
- **背景色**：#FAFAFA
- **强调色**：#FF5722（操作按钮/重点提示）
- **卡片**：圆角16px + 渐变背景 + 悬浮阴影加深
- **动画**：页面切换左滑入（0.3s）、模态框 fadeIn/Out、按钮点击反馈

## 性能说明

- 列表页 30 条数据渲染 < 2s
- API 响应时间 < 500ms（本地开发环境）
- 所有 CSS 动画采用 transform / opacity，保证 30fps+

## 数据存储

后端数据存储在 `server/db.json` 文件中（首次运行自动创建）。
照片以 Base64 字符串形式存储在 JSON 中，同时在 localStorage 保留副本。
