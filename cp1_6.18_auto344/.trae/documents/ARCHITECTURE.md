# 校舍回声日志 - 技术架构文档

## 1. 技术选型

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | React 18 + TypeScript | 类型安全的组件开发 |
| 构建工具 | Vite | 快速开发构建 |
| 状态管理 | Zustand | 轻量级状态管理 |
| 路由 | React Router DOM | 单页路由 |
| HTTP客户端 | Axios | API请求封装 |
| 后端框架 | FastAPI | 高性能Python Web框架 |
| ORM | SQLAlchemy | 数据库操作 |
| 数据库 | SQLite | 轻量级关系数据库 |
| 异步支持 | aiosqlite | 异步SQLite驱动 |

## 2. 项目结构

```
auto344/
├── src/                          # 前端源代码
│   ├── components/             # React组件
│   │   ├── MapView.tsx     # 校园地图组件
│   │   └── ModalRecorder.tsx # 回忆添加模态框
│   ├── stores/             # 状态管理
│   │   └── recallStore.ts # Zustand store
│   ├── api/                # API封装
│   │   └── recallApi.ts   # 回忆相关API
│   ├── main.tsx            # React入口
│   └── App.tsx             # 路由配置
├── backend/                     # 后端源代码
│   ├── main.py             # FastAPI入口
│   ├── database.py         # 数据库配置
│   ├── heatmap_updater.py  # 热度更新后台任务
│   └── requirements.txt  # Python依赖
├── index.html               # HTML入口
├── vite.config.ts         # Vite配置
├── tsconfig.json        # TypeScript配置
└── package.json        # 前端依赖
```

## 3. 数据模型

### 3.1 Recall（回忆表）
| 字段 | 类型 | 说明 |
|------|------|------|
| id | Integer | 主键 |
| location_id | String | 地点ID |
| type | Enum | text/audio |
| content | String | 回忆内容 |
| timestamp | DateTime | 创建时间 |

### 3.2 HeatCache（热度缓存表）
| 字段 | 类型 | 说明 |
|------|------|------|
| location_id | String | 地点ID |
| heat_score | Float | 热度值0-100 |
| last_updated | DateTime | 最后更新时间 |

## 4. API接口设计

### 4.1 POST /recall
提交回忆
**请求体：
```json
{
  "location_id": "string",
  "type": "text" | "audio",
  "content": "string",
  "timestamp": "ISO8601
}
```

### 4.2 GET /recall/{location_id}
获取地点回忆列表

### 4.3 GET /heatmap
获取全地点热度数据

## 5. 核心模块设计

### 5.1 前端状态管理（Zustand）
- recallStore：管理回忆列表、热度数据、选中地点状态

### 5.2 热度计算逻辑
- 后端模块接收时间戳和地点ID
- 统计过去30天访问和留言总和
- 线性映射归一化为0-100
- JSON文件缓存，10分钟刷新

### 5.3 后台任务
- 每10分钟执行热度统计
- 更新到缓存表

## 6. 性能优化策略

### 6.1 前端
- Vite构建优化
- 组件懒加载
- 热度数据缓存
- SVG地图优化

### 6.2 后端
- 热度数据缓存到JSON文件
- 数据库查询优化
- 异步处理

## 7. 部署说明

### 7.1 前端启动
```bash
npm install
npm run dev
```

### 7.2 后端启动
```bash
pip install -r backend/requirements.txt
python backend/main.py
```
