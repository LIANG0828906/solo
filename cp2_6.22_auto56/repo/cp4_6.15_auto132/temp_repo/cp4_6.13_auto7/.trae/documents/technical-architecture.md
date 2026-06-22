## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层"
        A["React 18 + TypeScript"]
        B["Vite 构建工具"]
        C["React Router 路由"]
        D["Leaflet 地图组件"]
        E["Zustand 状态管理"]
    end
    
    subgraph "通信层"
        F["HTTP/HTTPS API"]
        G["WebSocket 实时通信"]
    end
    
    subgraph "后端层"
        H["Express Server"]
        I["Multer + Sharp 图片处理"]
        J["ws WebSocket服务"]
        K["匹配引擎 Matcher"]
        L["WS消息处理器"]
    end
    
    subgraph "数据层"
        M["内存数据库(Map)"]
    end
    
    A --> F
    A --> G
    F --> H
    G --> J
    H --> I
    H --> M
    J --> L
    K --> M
    K --> J
    L --> M
```

## 2. 技术说明

- **前端框架**：React 18 + TypeScript 5，严格模式开启
- **构建工具**：Vite 5 + @vitejs/plugin-react
- **路由管理**：React Router DOM v6
- **地图服务**：Leaflet 1.9 + react-leaflet
- **状态管理**：Zustand 4
- **后端框架**：Express 4 + TypeScript
- **实时通信**：ws 库 (WebSocket)
- **图片处理**：Multer (上传) + Sharp (压缩裁剪)
- **数据库**：内存 Map 存储（无持久化）
- **UI样式**：Tailwind CSS 3 + 自定义CSS变量

## 3. 路由定义

| 前端路由 | 页面组件 | 用途 |
|----------|----------|------|
| / | MapPage | 首页地图，展示餐食标记和推荐卡片 |
| /publish | PublishPage | 发布餐食页面 |
| /matches | MatchesPage | 匹配列表页，懒加载和下拉刷新 |
| /messages | MessagesPage | 消息列表页 |
| /messages/:chatId | ChatRoomPage | 临时聊天室页面 |
| /profile | ProfilePage | 个人中心，偏好设置 |
| /login | LoginPage | 用户登录注册页 |

| 后端API | 方法 | 用途 |
|----------|------|------|
| /api/auth/register | POST | 用户注册 |
| /api/auth/login | POST | 用户登录 |
| /api/users/:id | GET/PUT | 获取/更新用户资料 |
| /api/meals | POST | 发布餐食 |
| /api/meals | GET | 获取餐食列表 |
| /api/meals/:id | GET | 获取餐食详情 |
| /api/meals/:id/like | POST | 点赞餐食 |
| /api/meals/:id/comment | POST | 评论餐食 |
| /api/match-requests | POST | 发起拼饭请求 |
| /api/match-requests/:id/accept | POST | 接受拼饭请求 |
| /api/upload | POST | 上传图片 |

## 4. WebSocket 消息协议

### 4.1 客户端 → 服务端消息

```typescript
type WSClientMessage =
  | { type: 'CONNECT_USER'; userId: string }
  | { type: 'JOIN_CHAT'; chatId: string; userId: string }
  | { type: 'SEND_MESSAGE'; chatId: string; senderId: string; content: MessageContent }
  | { type: 'MARK_READ'; chatId: string; userId: string; messageId: string }
  | { type: 'LEAVE_CHAT'; chatId: string; userId: string }
```

### 4.2 服务端 → 客户端消息

```typescript
type WSServerMessage =
  | { type: 'MEAL_PUSH'; meal: MealWithUser; matchScore: number }
  | { type: 'NEW_MESSAGE'; chatId: string; message: ChatMessage }
  | { type: 'MESSAGE_READ'; chatId: string; messageId: string; readerId: string }
  | { type: 'MATCH_REQUEST'; request: MatchRequest }
  | { type: 'REQUEST_ACCEPTED'; chatId: string; partner: User }
  | { type: 'NOTIFICATION'; title: string; body: string }
```

## 5. 服务器架构图

```mermaid
graph LR
    subgraph "Express App"
        A["HTTP 中间件(CORS)"]
        B["Auth 控制器"]
        C["User 控制器"]
        D["Meal 控制器"]
        E["Upload 控制器"]
    end
    
    subgraph "WebSocket 层"
        F["连接管理器"]
        G["房间(聊天室)管理器"]
        H["消息处理器"]
    end
    
    subgraph "后台任务"
        I["匹配引擎(每15s)"]
        J["聊天室清理器(每小时)"]
    end
    
    subgraph "内存存储"
        K["Users Map"]
        L["Meals Map"]
        M["Chats Map"]
        N["Requests Map"]
        O["Connections Map"]
    end
    
    A --> B --> K
    A --> C --> K
    A --> D --> L
    A --> E
    F --> O
    F --> H
    H --> M
    H --> O
    I --> L
    I --> K
    I --> O
    J --> M
```

## 6. 数据模型

### 6.1 ER 图

```mermaid
erDiagram
    USER ||--o{ MEAL : publishes
    USER ||--o{ MATCH_REQUEST : sends
    USER ||--o{ MATCH_REQUEST : receives
    MEAL ||--o{ MATCH_REQUEST : related_to
    MATCH_REQUEST ||--|| CHAT : creates
    USER ||--o{ CHAT_MESSAGE : sends
    CHAT ||--o{ CHAT_MESSAGE : contains
    USER ||--o{ USER_TASTE_TAG : has
    USER ||--o{ USER_AVAILABLE_SLOT : has
    MEAL ||--o{ MEAL_IMAGE : has
    MEAL ||--o{ MEAL_TAG : has
    MEAL ||--o{ MEAL_COMMENT : has
    MEAL ||--o{ MEAL_LIKE : has
```

### 6.2 TypeScript 类型定义

```typescript
interface User {
  id: string;
  username: string;
  password: string;
  avatar: string;
  bio: string;
  location: { lat: number; lng: number };
  tastePrefs: {
    spiciness: 0 | 1 | 2 | 3;
    cuisines: string[];
    restrictions: string[];
  };
  availableSlots: ('breakfast' | 'lunch' | 'dinner' | 'supper')[];
  deliveryRadius: number;
  createdAt: number;
}

interface Meal {
  id: string;
  publisherId: string;
  name: string;
  description: string;
  tags: string[];
  images: string[];
  servings: number;
  remainingServings: number;
  location: { lat: number; lng: number };
  address: string;
  mealTime: 'breakfast' | 'lunch' | 'dinner' | 'supper';
  expiresAt: number;
  createdAt: number;
  likes: string[];
  comments: MealComment[];
}

interface MealComment {
  id: string;
  userId: string;
  content: string;
  createdAt: number;
}

interface MatchRequest {
  id: string;
  requesterId: string;
  receiverId: string;
  mealId: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: number;
}

interface Chat {
  id: string;
  requestId: string;
  participants: string[];
  expiresAt: number;
  messages: ChatMessage[];
}

interface ChatMessage {
  id: string;
  senderId: string;
  type: 'text' | 'emoji' | 'image';
  content: string;
  createdAt: number;
  readBy: string[];
}
```
