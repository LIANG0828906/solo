## 1. 架构设计

```mermaid
graph TD
    subgraph 前端层
        A["React 18 + TypeScript"]
        B["Vite 构建工具"]
        C["React Router DOM 路由"]
        D["Zustand 状态管理"]
        E["Chart.js + react-chartjs-2 图表"]
        F["Tailwind CSS 样式"]
    end
    
    subgraph 后端层
        G["Node.js + Express 4"]
        H["JWT 鉴权中间件"]
        I["CORS 跨域中间件"]
        J["RESTful API 控制器"]
    end
    
    subgraph 数据层
        K["SQLite 数据库"]
        L["better-sqlite3 驱动"]
    end
    
    subgraph 浏览器API
        M["Notification API 通知"]
        N["IndexedDB 本地缓存"]
    end
    
    A --> B
    A --> C
    A --> D
    A --> E
    A --> F
    A --> |fetch| J
    J --> H
    J --> I
    J --> G
    G --> L
    L --> K
    A --> M
    A --> N
```

## 2. 技术说明
- **前端框架**：React 18 + TypeScript（strict模式）
- **构建工具**：Vite 5（@vitejs/plugin-react）
- **后端服务**：Node.js + Express 4
- **数据库**：SQLite（better-sqlite3 同步驱动）
- **路由**：react-router-dom v6
- **状态管理**：Zustand
- **图表库**：Chart.js 4 + react-chartjs-2 5
- **样式方案**：Tailwind CSS 3
- **图标库**：lucide-react
- **鉴权方案**：JWT（jsonwebtoken）
- **拖拽（预留）**：react-beautiful-dnd
- **唯一ID**：uuid

## 3. 路由定义
| 路由路径 | 页面组件 | 用途说明 | 是否需鉴权 |
|----------|----------|----------|------------|
| /login | Login.tsx | 用户登录页 | 否 |
| /register | Register.tsx | 用户注册页 | 否 |
| / | Dashboard.tsx | 仪表盘主页（甘特图+统计） | 是 |
| /trends | Trends.tsx | 趋势分析页面 | 是 |
| /weekly | WeeklyReport.tsx | 学习周报页面 | 是 |
| /profile | Profile.tsx | 个人中心页面 | 是 |
| * | NotFound.tsx | 404页面 | - |

## 4. API 定义

### 4.1 类型定义
```typescript
interface User {
  id: number;
  username: string;
  password?: string;
  nickname: string;
  avatar: string;
  reminder_time: string | null;
  created_at: string;
}

interface Subject {
  id: number;
  user_id: number;
  name: string;
  weekly_goal_hours: number;
  color: string;
  created_at: string;
}

interface StudySession {
  id: number;
  user_id: number;
  subject_id: number;
  start_time: string;
  end_time: string;
  duration_seconds: number;
  notes: string;
  rating: number;
  created_at: string;
}

interface Achievement {
  id: number;
  user_id: number;
  type: 'streak' | 'hours';
  level: 'bronze' | 'silver' | 'gold' | 'extra';
  name: string;
  description: string;
  unlocked_at: string;
}
```

### 4.2 接口列表
| Method | Path | 请求参数 | 响应格式 | 说明 |
|--------|------|----------|----------|------|
| POST | /api/register | {username, password, nickname} | {token, user} | 用户注册 |
| POST | /api/login | {username, password} | {token, user} | 用户登录 |
| GET | /api/subjects | - | Subject[] | 获取用户科目列表 |
| POST | /api/subjects | {name, weekly_goal_hours, color} | Subject | 创建学习科目 |
| PUT | /api/subjects/:id | {name, weekly_goal_hours, color} | Subject | 更新科目信息 |
| DELETE | /api/subjects/:id | {success: true} | - | 删除科目 |
| GET | /api/sessions | ?start_date=&end_date= | StudySession[] | 查询专注会话记录 |
| POST | /api/sessions | {subject_id, start_time, end_time, duration_seconds, notes, rating} | StudySession | 保存专注会话 |
| GET | /api/statistics | ?range=7\|30\|90 | {trend, weekly, streak} | 获取统计数据 |
| GET | /api/achievements | - | Achievement[] | 获取已解锁成就列表 |
| PUT | /api/profile | {nickname, avatar, reminder_time} | User | 更新用户信息 |
| POST | /api/export-pdf | {week_start} | binary PDF | 导出周报PDF |

## 5. 服务端架构图

```mermaid
graph LR
    A["客户端请求"] --> B["CORS 中间件"]
    B --> C["JWT 鉴权中间件<br/>（需鉴权路由）"]
    C --> D["路由分发器<br/>express Router"]
    D --> E["AuthController<br/>认证相关"]
    D --> F["SubjectController<br/>科目管理"]
    D --> G["SessionController<br/>会话管理"]
    D --> H["StatsController<br/>统计分析"]
    D --> I["AchievementController<br/>成就系统"]
    D --> J["UserController<br/>用户信息"]
    E --> K["SQLite DB<br/>better-sqlite3"]
    F --> K
    G --> K
    H --> K
    I --> K
    J --> K
```

## 6. 数据模型

### 6.1 ER图

```mermaid
erDiagram
    USERS {
        INTEGER id PK "自增主键"
        TEXT username UK "用户名（唯一）"
        TEXT password "密码哈希"
        TEXT nickname "昵称"
        TEXT avatar "头像URL/Base64"
        TEXT reminder_time "每日提醒时间"
        TEXT created_at "创建时间"
    }
    
    SUBJECTS {
        INTEGER id PK "自增主键"
        INTEGER user_id FK "用户ID"
        TEXT name "科目名称"
        REAL weekly_goal_hours "每周目标学时"
        TEXT color "颜色标识HEX"
        TEXT created_at "创建时间"
    }
    
    STUDY_SESSIONS {
        INTEGER id PK "自增主键"
        INTEGER user_id FK "用户ID"
        INTEGER subject_id FK "科目ID"
        TEXT start_time "开始时间ISO"
        TEXT end_time "结束时间ISO"
        INTEGER duration_seconds "时长（秒）"
        TEXT notes "学习备注"
        INTEGER rating "星级1-3"
        TEXT created_at "创建时间"
    }
    
    ACHIEVEMENTS {
        INTEGER id PK "自增主键"
        INTEGER user_id FK "用户ID"
        TEXT type "streak/hours"
        TEXT level "bronze/silver/gold/extra"
        TEXT name "成就名称"
        TEXT description "成就描述"
        TEXT unlocked_at "解锁时间"
    }
    
    USERS ||--o{ SUBJECTS : "拥有"
    USERS ||--o{ STUDY_SESSIONS : "产生"
    SUBJECTS ||--o{ STUDY_SESSIONS : "属于"
    USERS ||--o{ ACHIEVEMENTS : "解锁"
```

### 6.2 DDL语句

```sql
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  nickname TEXT NOT NULL,
  avatar TEXT DEFAULT '',
  reminder_time TEXT,
  created_at TEXT DEFAULT (datetime('now', 'localtime'))
);

CREATE TABLE IF NOT EXISTS subjects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  weekly_goal_hours REAL NOT NULL DEFAULT 5,
  color TEXT NOT NULL DEFAULT '#7c6fff',
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);

CREATE TABLE IF NOT EXISTS study_sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  subject_id INTEGER NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration_seconds INTEGER NOT NULL,
  notes TEXT DEFAULT '',
  rating INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_user_date ON study_sessions(user_id, start_time);
CREATE INDEX IF NOT EXISTS idx_sessions_subject ON study_sessions(subject_id);

CREATE TABLE IF NOT EXISTS achievements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL,
  level TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  unlocked_at TEXT DEFAULT (datetime('now', 'localtime')),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(user_id, type, level)
);
CREATE INDEX IF NOT EXISTS idx_achievements_user ON achievements(user_id);
```
