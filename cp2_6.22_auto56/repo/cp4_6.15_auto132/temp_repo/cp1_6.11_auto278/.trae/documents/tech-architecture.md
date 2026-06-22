## 1. 架构设计

```mermaid
graph TB
    subgraph "前端 (React + Vite)"
        A["App.tsx 主组件"] --> B["LanternList.tsx 灯笼列表"]
        A --> C["SimulationPanel.tsx 模拟控制面板"]
        A --> D["Canvas 巡游动画渲染"]
        D --> E["S形路径计算"]
        D --> F["烛火闪烁逻辑"]
        D --> G["粒子系统"]
        D --> H["光晕渲染"]
    end

    subgraph "后端 (Express)"
        I["app.ts Express服务"] --> J["巡游队列管理"]
        I --> K["灯笼样式配置"]
        I --> L["实时状态接口"]
    end

    B -->|"POST /api/queue"| I
    C -->|"PATCH /api/settings"| I
    A -->|"GET /api/queue (1.5s轮询)"| I
    I -->|"队列数据+配置+状态"| A
```

## 2. 技术说明

- 前端：React@18 + TypeScript + Vite + Tailwind CSS
- 初始化工具：vite-init (react-express-ts 模板)
- 后端：Express@4 + TypeScript
- 数据库：无（内存数据存储，模拟巡游队列）
- 状态管理：Zustand
- 图标库：lucide-react

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 花灯巡游主页面（唯一页面） |

## 4. API定义

### 4.1 数据类型

```typescript
type LanternShape = 'circle' | 'square' | 'fish' | 'lotus' | 'hexagon' | 'diamond' | 'rabbit' | 'star' | 'palace' | 'barrel';

type LanternColor = '#FF4444' | '#FFD700' | '#44FF44' | '#4444FF' | '#AA44FF' | '#FF69B4';

type LanternPattern = 'auspicious_cloud' | 'auspicious_beast' | 'floral';

interface Lantern {
  id: string;
  shape: LanternShape;
  color: LanternColor;
  pattern: LanternPattern;
  isLit: boolean;
}

interface ParadeQueue {
  lanterns: Lantern[];
  speed: number;
  brightness: number;
}

interface SettingsPayload {
  speed?: number;
  brightness?: number;
}
```

### 4.2 接口定义

| 方法 | 路径 | 请求体 | 响应 | 用途 |
|------|------|--------|------|------|
| GET | /api/queue | - | `{ lanterns: Lantern[], speed: number, brightness: number }` | 获取当前队列和配置 |
| POST | /api/queue | `{ lanternIds: string[] }` 或 `{ lantern: Lantern }` | `{ lanterns: Lantern[], speed: number, brightness: number }` | 更新队列（重排/添加） |
| DELETE | /api/queue/:id | - | `{ lanterns: Lantern[], speed: number, brightness: number }` | 从队列移除灯笼 |
| PATCH | /api/queue/:id/toggle | - | `{ lanterns: Lantern[] }` | 切换灯笼亮灭 |
| PATCH | /api/settings | `{ speed?: number, brightness?: number }` | `{ speed: number, brightness: number }` | 更新速度或亮度 |

## 5. 服务端架构图

```mermaid
graph LR
    A["Express Router"] --> B["Queue Controller"]
    B --> C["Queue Service (内存存储)"]
    B --> D["Settings Service (内存存储)"]
    C --> E["ParadeQueue 对象"]
    D --> F["Settings 对象"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    PARADE_QUEUE ||--o{ LANTERN : contains
    PARADE_QUEUE {
        number speed
        number brightness
    }
    LANTERN {
        string id PK
        string shape
        string color
        string pattern
        boolean isLit
    }
```

### 6.2 初始数据

后端启动时初始化一个空队列，speed=1.0，brightness=80%，等待前端添加灯笼。
