# 匠心工坊 - 线上手工皮具工作坊

一个让DIY爱好者能一步步跟着互动教程完成手工钱包制作的线上平台，同时支持作品分享、点赞和评论。

## 技术栈

- **前端**: React 18 + TypeScript + Vite + React Router
- **后端**: Flask (轻量 RESTful API)
- **样式**: 复古工坊风格，植鞣革棕黄 + 旧纸张米白

## 功能特性

### 🎓 教程模块
- 6 步图文教程，内容从 JSON 读取
- 每步骤独立计时面板，支持开始/暂停/重置
- 自动记录每步骤花费的时间
- 步骤进度条可视化

### 📊 成绩报告
- 根据总耗时和完成度计算评分（0-100）
- 各步骤耗时明细
- 智能鼓励语生成
- 成品照片上传入口

### 🎨 社区模块
- 作品照片墙，瀑布式网格布局
- 点赞功能，实时更新计数
- 评论系统，按时间倒序排列
- 支持匿名浏览和登录互动

### 🎨 UI 设计
- 复古工坊风格：植鞣革棕黄色 (#8B5E3C) + 旧纸张米白色 (#F5F0E8)
- 皮革纹理按钮，点击凹陷 3D 效果
- 导航栏滚动渐变透明
- 完全响应式设计，手机端友好
- 页面切换平滑动画，60FPS

## 快速启动

### 前端开发

```bash
# 安装依赖
npm install

# 启动开发服务器 (默认 http://localhost:5173)
npm run dev

# 生产构建
npm run build
```

### 后端服务 (可选)

前端使用 localStorage 做数据持久化，后端非必需。如需启用真实 API：

```bash
cd server

# 安装依赖
pip install -r requirements.txt

# 启动服务 (默认 http://localhost:5000)
python app.py
```

Vite 已配置代理 `/api` 到 Flask 后端。

## 项目结构

```
.
├── src/
│   ├── modules/
│   │   ├── tutorial/
│   │   │   ├── TutorialStep.tsx    # 教程步骤 + 计时面板
│   │   │   └── TutorialReport.tsx  # 成绩报告 + 图片上传
│   │   └── community/
│   │       └── PhotoGallery.tsx    # 作品墙 + 点赞评论
│   ├── services/
│   │   ├── TimingService.ts        # 计时与评分逻辑
│   │   ├── LikeService.ts          # 点赞 API
│   │   └── CommentService.ts       # 评论 API
│   ├── pages/
│   │   ├── TutorialPage.tsx
│   │   ├── CommunityPage.tsx
│   │   └── LoginPage.tsx
│   ├── data/
│   │   └── tutorialSteps.json      # 教程数据
│   ├── styles/
│   │   └── global.css
│   ├── App.tsx
│   └── main.tsx
├── server/
│   ├── app.py                      # Flask API
│   └── requirements.txt
├── index.html
├── vite.config.js
├── tsconfig.json
└── package.json
```

## 评分算法

评分由三部分组成：
- **时间分 (40%)**: 与教程预计总耗时对比
- **完成度分 (50%)**: 已完成步骤占比
- **一致性分 (10%)**: 完成全部步骤额外加分
