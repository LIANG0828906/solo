# 社区种子交换平台 - 架构说明

## 文件结构与调用关系

```
┌─────────────────────────────────────────────────────────────────┐
│                        index.html                               │
│  入口页面，加载React应用                                         │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  src/client/main.tsx                            │
│  React应用入口，渲染App组件                                      │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  src/client/App.tsx                             │
│  主应用组件                                                      │
│  - 管理路由(首页/个人主页)                                       │
│  - 管理全局状态(当前用户、模态框)                                 │
│  - 调用api.ts进行所有后端请求                                     │
└───────────┬───────────────────┬───────────────────┬─────────────┘
            │                   │                   │
            ▼                   ▼                   ▼
┌────────────────────┐ ┌────────────────────┐ ┌────────────────────┐
│  Header.tsx        │ │  LoginModal.tsx     │ │  PublishModal.tsx  │
│  头部导航栏        │ │  登录弹窗           │ │  发布条目弹窗      │
│  调用App导航方法   │ │  调用api.login()    │ │  调用api.createItem()│
└────────────────────┘ └────────────────────┘ └────────────────────┘
            │                                       ▲
            │                                       │
            ▼                                       │
┌───────────────────────────────────────────────────┴────────────┐
│                   src/client/components/                        │
├────────────────────┬────────────────────┬────────────────────┤
│  HomePage.tsx      │ │  ProfilePage.tsx   │ │  ExchangeDialog.tsx│
│  首页              │ │  个人主页          │ │  交换确认弹窗      │
│  显示统计、搜索、   │ │  显示我的条目、    │ │  调用api.createRequest()│
│  瀑布流卡片         │ │  请求、历史记录    │ │                    │
│                    │ │  调用多个API       │ │                    │
└──────────┬─────────┘ └──────────┬─────────┘ └────────────────────┘
           │                       │
           ▼                       ▼
┌────────────────────┐ ┌────────────────────┐
│  SearchFilter.tsx  │ │  StatsBanner.tsx   │
│  搜索过滤组件      │ │  统计横幅组件      │
│  触发HomePage      │ │  数字滚动动画      │
│  重新加载数据      │ │  由AnimatedNumber  │
│                    │ │  组件实现          │
└────────────────────┘ └──────────┬─────────┘
                                  │
                                  ▼
                        ┌────────────────────┐
                        │ AnimatedNumber.tsx │
                        │ 数字滚动动画组件   │
                        └────────────────────┘
           │                       │
           ▼                       ▼
┌────────────────────┐ ┌────────────────────┐
│  VirtualGrid.tsx   │ │  SeedCard.tsx      │
│  虚拟滚动瀑布流    │ │  种子卡片组件      │
│  仅渲染视口内      │ │  悬停显示交换按钮  │
│  卡片              │ │                    │
└──────────┬─────────┘ └──────────┬─────────┘
           │                       │
           └───────────┬───────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────────┐
│                  src/client/api.ts                              │
│  封装所有后端API请求，返回Promise                                │
│  所有组件通过此文件与后端通信                                     │
└─────────────────────────────────┬───────────────────────────────┘
                                  │ REST API
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  src/server/index.ts                            │
│  Express服务器                                                    │
│  定义所有REST接口                                                 │
│  操作内存数据(users, seedItems, exchangeRequests)                │
└─────────────────────────────────┬───────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                  src/types.ts                                    │
│  共享TypeScript类型定义                                           │
│  SeedItem, ExchangeRequest, User, Stats                          │
└─────────────────────────────────────────────────────────────────┘
```

## 数据流向

### 1. 用户登录流程
```
LoginModal.tsx
    ↓ 调用 api.login(nickname)
    ↓ POST /api/login
src/server/index.ts
    ↓ 创建/查找用户
    ↓ 返回用户信息
App.tsx
    ↓ 保存 currentUser 状态
    ↓ 渲染首页
```

### 2. 发布条目流程
```
PublishModal.tsx
    ↓ 收集表单数据
    ↓ 调用 api.createItem(item)
    ↓ POST /api/items
src/server/index.ts
    ↓ 生成UUID, 创建SeedItem
    ↓ 存入seedItems数组
    ↓ 返回新条目
App.tsx
    ↓ 更新refreshKey
    ↓ HomePage重新加载数据
```

### 3. 搜索过滤流程
```
SearchFilter.tsx
    ↓ 用户输入搜索条件
    ↓ 防抖200ms
HomePage.tsx
    ↓ 调用 api.getItems(filters)
    ↓ GET /api/items?search=...&variety=...
src/server/index.ts
    ↓ 过滤seedItems数组
    ↓ 返回过滤结果
HomePage.tsx
    ↓ 更新items状态
    ↓ VirtualGrid渲染可见卡片
```

### 4. 交换请求流程
```
SeedCard.tsx
    ↓ 点击"我想交换"
    ↓ 传递item给App
App.tsx
    ↓ 打开ExchangeDialog
ExchangeDialog.tsx
    ↓ 确认数量
    ↓ 调用 api.createRequest(data)
    ↓ POST /api/requests
src/server/index.ts
    ↓ 验证库存
    ↓ 创建ExchangeRequest(状态pending)
    ↓ 存入exchangeRequests数组
    ↓ 返回请求
App.tsx
    ↓ 更新refreshKey
```

### 5. 确认交换流程
```
ProfilePage.tsx
    ↓ 接收方查看"收到的请求"
    ↓ 点击"确认交换"
    ↓ 调用 api.confirmRequest(id)
    ↓ PUT /api/requests/:id/confirm
src/server/index.ts
    ↓ 验证请求状态为pending
    ↓ 扣除对应数量(seedItem.quantity -= quantity)
    ↓ 更新请求状态为confirmed
    ↓ 返回更新后的请求
ProfilePage.tsx
    ↓ 刷新页面数据
```

### 6. 统计数据更新流程
```
HomePage.tsx
    ↓ 每5秒轮询
    ↓ 调用 api.getStats()
    ↓ GET /api/stats
src/server/index.ts
    ↓ 计算今日新增条目数
    ↓ 计算今日成功交换数
    ↓ 计算总条目数
    ↓ 返回Stats对象
StatsBanner.tsx
    ↓ AnimatedNumber组件
    ↓ 数字滚动动画更新
```

## 内存数据结构

### users (User[])
```typescript
{ nickname: string, createdAt: number }
```

### seedItems (SeedItem[])
```typescript
{
  id: string,              // UUID
  ownerNickname: string,
  seedName: string,
  variety: string,
  quantity: number,
  expectedExchange: string,
  photoUrl: string,
  location: string,
  createdAt: number
}
```

### exchangeRequests (ExchangeRequest[])
```typescript
{
  id: string,
  fromUser: string,        // 发起方昵称
  toUser: string,          // 接收方昵称
  seedItemId: string,
  seedItem: SeedItem,      // 快照
  exchangeQuantity: number,
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected',
  createdAt: number,
  updatedAt: number
}
```

## REST API 接口列表

| 方法 | 路径 | 描述 |
|------|------|------|
| POST | /api/login | 用户登录 |
| GET | /api/items | 获取种子列表(支持过滤) |
| GET | /api/items/varieties | 获取所有品种 |
| GET | /api/items/locations | 获取所有地区 |
| POST | /api/items | 创建新条目 |
| GET | /api/items/user/:nickname | 获取用户发布的条目 |
| POST | /api/requests | 创建交换请求 |
| GET | /api/requests/from/:nickname | 获取用户发出的请求 |
| GET | /api/requests/to/:nickname | 获取用户收到的请求 |
| PUT | /api/requests/:id/confirm | 确认交换请求 |
| PUT | /api/requests/:id/cancel | 取消交换请求 |
| PUT | /api/requests/:id/reject | 拒绝交换请求 |
| GET | /api/stats | 获取统计数据 |
| GET | /api/history/completed/:nickname | 获取用户完成的交换历史 |

## 性能优化点

1. **虚拟滚动**：VirtualGrid组件仅渲染视口内的卡片，大幅减少DOM节点
2. **搜索防抖**：200ms防抖延迟，避免频繁API调用
3. **请求节流**：fetchData函数100ms节流，防止重复请求
4. **统计轮询**：每5秒轮询一次统计数据，平衡实时性和性能
5. **useMemo优化**：可见卡片计算、总高度计算使用useMemo缓存
6. **useCallback优化**：事件处理函数使用useCallback缓存，避免不必要的重渲染
7. **key属性**：列表使用唯一id作为key，优化React重渲染
