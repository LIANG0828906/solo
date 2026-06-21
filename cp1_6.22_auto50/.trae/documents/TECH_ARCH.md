## 1. 架构设计

```mermaid
graph TB
    subgraph "前端层"
        A["App.tsx<br/>主组件/全局状态/路由"]
        B["CodeEditor.tsx<br/>代码编辑器"]
        C["OutputPanel.tsx<br/>输出面板"]
        D["HistoryChart.tsx<br/>趋势图表"]
        E["HistoryList.tsx<br/>历史列表(虚拟滚动)"]
    end
    subgraph "后端API层"
        F["Express Server<br/>server/index.ts"]
        G["POST /api/run<br/>代码执行"]
        H["POST /api/history<br/>保存记录"]
        I["GET /api/history/:userId<br/>获取历史"]
    end
    subgraph "执行/存储层"
        J["vm 沙盒执行器"]
        K["内存数据存储<br/>Map<userId, History[]>"]
    end
    A -->|"代码字符串"| B
    B -->|"onRun回调"| A
    A -->|"POST /api/run"| F
    F -->|"执行代码"| G
    G -->|"vm.runInContext"| J
    J -->|"stdout/error"| G
    G -->|"{status,output,error,time}"| A
    A -->|"结果对象"| C
    A -->|"POST /api/history"| F
    F -->|"保存记录"| H
    H -->|"写入内存"| K
    A -->|"GET /api/history/:userId"| F
    F -->|"查询记录"| I
    I -->|"读取内存"| K
    K -->|"排序后数组"| I
    I -->|"History[]"| A
    A -->|"历史数据"| E
    A -->|"正确率数据"| D
```

## 2. 技术描述
- **前端框架**：React@18 + TypeScript@5 + Vite@6
- **构建工具**：Vite + @vitejs/plugin-react
- **状态管理**：React useState/useEffect（组件级），无全局状态库
- **后端框架**：Express@4 + TypeScript@5
- **代码执行**：Node.js vm 模块（沙盒环境）
- **图表库**：d3@7（折线图渲染）
- **图标库**：lucide-react
- **数据存储**：内存 Map（无需持久化数据库）
- **样式方案**：原生CSS（CSS Modules风格类名，CSS变量主题）
- **包管理器**：npm

## 3. 路由定义
| 路由 | 用途 |
|-------|---------|
| / | 主应用页面（单页应用，无路由跳转） |

## 4. API 定义

### 4.1 TypeScript 类型

```typescript
// 前端类型
interface RunResult {
  status: 'success' | 'error';
  output: string;
  error?: string;
  executionTime: number;
}

interface HistoryRecord {
  id: string;
  userId: string;
  timestamp: number;
  code: string;
  status: 'success' | 'error';
  output: string;
  error?: string;
}

interface AccuracyPoint {
  index: number;
  accuracy: number;
}

// API 请求/响应
// POST /api/run
interface RunRequest { code: string; }
interface RunResponse extends RunResult {}

// POST /api/history
interface HistoryRequest {
  userId: string;
  code: string;
  status: 'success' | 'error';
  output: string;
  error?: string;
}
interface HistoryResponse { id: string; timestamp: number; }

// GET /api/history/:userId
interface HistoryListResponse { records: HistoryRecord[]; }
```

### 4.2 后端沙盒执行逻辑
```
代码执行流程：
1. 创建 vm.Script，捕获语法错误
2. 构造 context：{ console: { log: 捕获函数 }, ...内置对象 }
3. 重定向 console.log 输出到内存缓冲区
4. 使用 vm.runInContext，设置 timeout 限制
5. 捕获异常（SyntaxError, Error），记录 stack
6. 返回 { status, output, error, executionTime }
```

## 5. 服务器架构图

```mermaid
graph LR
    A["HTTP 请求"] --> B["Express App"]
    B --> C["CORS 中间件"]
    C --> D["JSON BodyParser"]
    D --> E["路由分发"]
    E -->|"POST /api/run"| F["RunController"]
    E -->|"POST /api/history"| G["HistoryController"]
    E -->|"GET /api/history/:id"| H["HistoryController"]
    F --> I["CodeExecutor (vm沙盒)"]
    I --> J["stdout 捕获"]
    I --> K["异常捕获"]
    G --> L["HistoryService"]
    H --> L
    L --> M["InMemoryStore<br/>Map<userId, HistoryRecord[]>"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    USER ||--o{ HISTORY_RECORD : has
    USER {
        string id PK "uuid"
    }
    HISTORY_RECORD {
        string id PK "uuid"
        string userId FK "用户ID"
        number timestamp "提交时间戳"
        string code "代码内容"
        string status "success/error"
        string output "标准输出"
        string error "错误信息(可选)"
    }
```

### 6.2 内存存储结构
```typescript
// 内存数据结构
const store = {
  histories: new Map<string, HistoryRecord[]>()
};

// 操作方法
// - addHistory(userId, record): void  (插入后按timestamp降序排序)
// - getHistories(userId): HistoryRecord[]
// - computeAccuracy(records): AccuracyPoint[]  (累积正确率序列)
```
