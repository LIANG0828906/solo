# 配方魔方 - 智能食材管理应用

## 项目简介

配方魔方是一款帮助家庭厨师根据冰箱内现有食材智能推荐可制作菜品的应用，并能自动生成采购清单。

## 技术栈

- **前端**: React 18 + TypeScript + Vite + Zustand + Axios
- **后端**: Python Flask
- **通信**: RESTful API

## 快速开始

### 前端启动

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

前端运行在 http://localhost:5173

### 后端启动

```bash
cd server

# 安装依赖
pip install -r requirements.txt

# 或者直接安装
pip install flask flask-cors

# 启动服务
python app.py
```

后端运行在 http://localhost:5000

## 功能特性

1. **食材库存管理**: 添加、删除食材，支持蔬菜、海鲜、主食、肉类分类
2. **智能推荐菜谱**: 根据现有食材推荐匹配度最高的菜谱
3. **采购清单**: 查看菜品所需食材，标记已采购项
4. **收藏菜谱**: 收藏喜欢的菜谱，支持筛选查看

## 文件结构

```
├── package.json          # 前端依赖配置
├── vite.config.js        # Vite配置
├── tsconfig.json         # TypeScript配置
├── index.html            # 入口HTML
├── src/
│   ├── main.tsx          # 应用入口
│   ├── App.tsx           # 主组件
│   ├── index.css         # 全局样式
│   ├── api/
│   │   └── recipeApi.ts  # API封装
│   ├── store/
│   │   └── useAppStore.ts # Zustand状态管理
│   └── components/
│       ├── InventoryPanel.tsx  # 库存面板
│       ├── RecipePanel.tsx     # 菜谱面板
│       ├── ShoppingList.tsx    # 采购清单
│       ├── IngredientCard.tsx  # 食材卡片
│       └── RecipeCard.tsx      # 菜谱卡片
└── server/
    ├── app.py            # Flask主程序
    ├── recipeEngine.py   # 推荐算法
    └── requirements.txt  # Python依赖
```

## API接口

### POST /api/guess
根据食材列表推荐菜谱

请求体:
```json
{
  "ingredients": ["西红柿", "鸡蛋"]
}
```

### GET /api/recipes
获取所有菜谱
