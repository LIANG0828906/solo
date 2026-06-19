# 🌸 萌宠花园 - 虚拟宠物养成与社交社区

一个有趣的在线虚拟宠物养成与社交花园社区应用，用户可以领养并照顾虚拟宠物，在共享的花园社区中与其他用户的宠物互动。

## ✨ 功能特性

- 🐾 **宠物领养**：猫、狗、龙三种宠物，各有3种颜色变体
- 🍖 **宠物养成**：饥饿、快乐、精力三条属性，随时间自然衰减
- 🎮 **宠物互动**：喂食、玩耍、清洁，带精美动画反馈
- 🌳 **共享花园**：2.5D等距透视花园，实时拖拽移动宠物
- 💃 **社交互动**：挥手、跳舞、送礼物，实时同步双方动画
- 🛒 **礼物商店**：8种精美礼物，使用游戏币购买
- 🏆 **排行榜**：全服宠物快乐度排名，前三名带皇冠动画
- 🏅 **成就系统**：六边形徽章墙，金属光泽与粒子闪烁效果

## 🛠️ 技术栈

**前端:**
- React 18 + TypeScript
- Vite (构建工具)
- Zustand (状态管理)
- Socket.IO Client (实时通信)
- Recharts (图表)
- Day.js (时间处理)

**后端:**
- FastAPI (RESTful API)
- python-socketio (WebSocket实时通信)
- Uvicorn (ASGI服务器)
- Pydantic (数据验证)

## 📁 项目结构

```
auto56/
├── frontend/                 # 前端 React 应用
│   ├── src/
│   │   ├── modules/
│   │   │   ├── api/          # API 客户端
│   │   │   ├── pet/          # 宠物模块
│   │   │   ├── garden/       # 花园模块
│   │   │   └── user/         # 用户状态管理
│   │   ├── components/       # 通用组件
│   │   ├── pages/            # 页面组件
│   │   ├── styles/           # 全局样式
│   │   ├── types/            # TypeScript 类型
│   │   ├── App.tsx           # 主应用
│   │   └── main.tsx          # 入口文件
│   ├── index.html
│   ├── vite.config.js
│   ├── tsconfig.json
│   └── package.json
└── backend/                  # 后端 FastAPI 应用
    ├── main.py               # 主应用入口
    ├── models.py             # 数据模型
    └── requirements.txt      # Python 依赖
```

## 🚀 快速开始

### 启动后端服务

```bash
cd backend
pip install -r requirements.txt
python main.py
```

后端将在 http://localhost:8000 启动

### 启动前端开发服务器

```bash
cd frontend
npm install
npm run dev
```

前端将在 http://localhost:5173 启动

## 🎨 设计特色

- 柔和暖色调 (浅米黄背景 #fef8ed)
- 半透明磨砂玻璃导航栏
- 圆角胶囊按钮，带按压缩放反馈
- 宠物呼吸浮动动画
- 高属性时的星尘粒子特效
- 低属性时的乌云雨滴动画
- 底部标签栏水波扩散过渡
- 响应式设计，支持移动端
