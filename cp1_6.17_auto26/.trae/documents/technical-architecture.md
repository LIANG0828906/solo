## 1. 架构设计

```mermaid
graph TD
    subgraph "前端 (React + TypeScript"
        A["App.tsx 主布局"]
        B["Zustand Store"]
        C["组件层"]
        D["API 调用"]
    end
    
    subgraph "后端 (Express.js)"
        E["Express Server (端口3001"]
        F["lowdb 数据持久化
    end
    
    A --> B
    A --> C
    C --> B
    D --> E
    E --> F
```

## 2. 技术描述

- **前端框架**：React 18 + TypeScript
- **构建工具**：Vite
- **UI 组件库**：Ant Design + @ant-design/icons
- **状态管理**：Zustand
- **动画库**：framer-motion + CSS Animation
- **后端框架**：Express.js 4
- **数据持久化**：lowdb
- **跨域处理**：cors
- **唯一ID生成**：uuid

## 3. 项目结构

```
.
├── package.json
├── vite.config.js
├── tsconfig.json
├── index.html
├── src/
│   ├── main.tsx
│   ├── App.tsx
│   ├── stores/
│   │   └── dashboardStore.ts
│   ├── components/
│   │   ├── GiftPanel.tsx
│   │   ├── DanmakuPanel.tsx
│   │   ├── RankingTable.tsx
│   │   └── TestTool.tsx
│   └── api/
│       └── mockServer.ts
```

## 4. API 定义

### 4.1 类型定义

```typescript
interface Gift {
  id: string;
  name: string;
  iconUrl: string;
  price: number;
  sales: number;
}

interface Danmaku {
  id: string;
  nickname: string;
  avatar: string;
  content: string;
  timestamp: number;
}

interface GiftRecord {
  id: string;
  nickname: string;
  avatar: string;
  giftId: string;
  giftName: string;
  giftIcon: string;
  count: number;
  timestamp: number;
}

interface RankingItem {
  rank: number;
  userId: string;
  nickname: string;
  avatar: string;
  coins: number;
}
```

### 4.2 接口列表

| 方法 | 路径 | 描述 |
|------|------|------|
| GET | /api/gifts | 获取礼物列表 |
| POST | /api/gifts | 新增礼物 |
| PUT | /api/gifts/:id | 更新礼物 |
| DELETE | /api/gifts/:id | 删除礼物 |
| GET | /api/danmakus | 获取弹幕列表 |
| GET | /api/gift-records | 获取礼物记录 |
| GET | /api/ranking | 获取排行榜数据 |
| POST | /api/simulate/danmaku | 模拟发送弹幕 |
| POST | /api/simulate/gift | 模拟发送礼物 |

### 4.3 请求/响应示例

**GET /api/gifts**
```json
{
  "code": 0,
  "data": [
    {
      "id": "uuid",
      "name": "火箭",
      "iconUrl": "https://example.com/rocket.png",
      "price": 100,
      "sales": 50
    }
  ]
}
```

**POST /api/simulate/gift**
```json
// Request
{
  "nickname": "用户A",
  "giftId": "gift-uuid",
  "count": 1
}

// Response
{
  "code": 0,
  "data": {
    "id": "record-uuid",
    "nickname": "用户A",
    "giftId": "gift-uuid",
    "giftName": "火箭",
    "giftIcon": "...",
    "count": 1,
    "timestamp": 1234567890
  }
}
```

**GET /api/ranking?type=today**
```json
{
  "code": 0,
  "data": [
    {
      "rank": 1,
      "userId": "user-1",
      "nickname": "土豪大哥",
      "avatar": "...",
      "coins": 9999
    }
  ]
}
```

## 5. 状态管理 (Zustand Store)

### Store 结构

```typescript
interface DashboardState {
  gifts: Gift[];
  danmakus: Danmaku[];
  giftRecords: GiftRecord[];
  ranking: RankingItem[];
  rankingType: 'today' | 'week' | 'all';
  loading: boolean;
  fetchGifts: () => Promise<void>;
  addGift: (gift: Omit<Gift, 'id' | 'sales'>) => Promise<void>;
  updateGift: (id: string, gift: Partial<Gift>) => Promise<void>;
  deleteGift: (id: string) => Promise<void>;
  fetchDanmakus: () => Promise<void>;
  fetchGiftRecords: () => Promise<void>;
  fetchRanking: () => Promise<void>;
  setRankingType: (type: 'today' | 'week' | 'all') => void;
  sendDanmaku: (data: { nickname: string; content: string }) => Promise<void>;
  sendGift: (data: { nickname: string; giftId: string; count: number }) => Promise<void>;
}
```

## 6. 数据模型 (lowdb)

### 数据库结构

```json
{
  "gifts": [
    {
      "id": "string",
      "name": "string",
      "iconUrl": "string",
      "price": "number",
      "sales": "number"
    }
  ],
  "danmakus": [
    {
      "id": "string",
      "nickname": "string",
      "avatar": "string",
      "content": "string",
      "timestamp": "number"
    }
  ],
  "giftRecords": [
    {
      "id": "string",
      "nickname": "string",
      "avatar": "string",
      "giftId": "string",
      "giftName": "string",
      "giftIcon": "string",
      "count": "number",
      "timestamp": "number"
    }
  ],
  "users": [
    {
      "id": "string",
      "nickname": "string",
      "avatar": "string",
      "totalCoins": "number",
      "todayCoins": "number",
      "weekCoins": "number"
    }
  ]
}
```

## 7. 性能优化

- 弹幕与礼物列表更新响应时间低于 100ms
- 排行榜刷新间隔 5 秒
- 动画 FPS 稳定在 60fps
- 使用 CSS transform 和 will-change 优化动画性能
- 列表虚拟滚动优化（长列表时考虑）

