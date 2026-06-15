## 1. 架构设计

```mermaid
graph TD
    subgraph "前端 (React + TypeScript + Vite)"
        A1["src/main.tsx (入口)"]
        A2["src/App.tsx (主应用)"]
        A3["src/components/"]
        A4["src/store.ts (zustand状态管理)"]
        A5["src/types.ts (类型定义)"]
        A6["src/styles.css (全局样式)"]
        A3 --> A31["TitleStore.tsx (盐引库)"]
        A3 --> A32["InspectionDesk.tsx (稽查台)"]
        A3 --> A33["IronCertStore.tsx (铁券架)"]
    end

    subgraph "后端 (Node.js + Express + TypeScript)"
        B1["server/index.ts (API服务端口3001)"]
        B2["内存数据存储 (mock)"]
    end

    subgraph "数据持久化"
        C1["localStorage (账册模拟)"]
    end

    A1 --> A2
    A2 --> A3
    A2 --> A4
    A4 --> B1
    B1 --> B2
    A4 --> C1

    style A1 fill:#e8f4fd
    style A2 fill:#e8f4fd
    style A31 fill:#fff5e6
    style A32 fill:#fff5e6
    style A33 fill:#fff5e6
    style B1 fill:#f0f8e8
    style B2 fill:#f0f8e8
    style C1 fill:#fdf2e8
```

## 2. 技术栈说明

| 层级      | 技术选型             | 版本       | 用途            |
| ------- | ---------------- | -------- | ------------- |
| 前端框架    | React            | ^18.2.0  | UI组件库         |
| 语言      | TypeScript       | ^5.2.0   | 类型安全          |
| 构建工具    | Vite             | ^5.0.0   | 构建与开发服务器      |
| 路由      | react-router-dom | ^6.20.0  | 单页路由          |
| 状态管理    | zustand          | ^4.4.7   | 全局状态管理        |
| 动画      | framer-motion    | ^10.16.5 | 拖拽、过渡、布局动画    |
| 图表      | recharts         | ^2.10.3  | 柱状图数据可视化      |
| HTTP客户端 | axios            | ^1.6.2   | 前后端通信         |
| 后端框架    | Express          | ^4.18.2  | RESTful API服务 |
| 跨域      | cors             | ^2.8.5   | 跨域资源共享        |
| ID生成    | uuid             | ^9.0.1   | 唯一标识生成        |

## 3. 目录结构

```
auto58/
├── .trae/documents/           # 项目文档
├── src/                       # 前端源码
│   ├── main.tsx              # React入口
│   ├── App.tsx               # 主应用组件
│   ├── types.ts              # TypeScript类型定义
│   ├── store.ts              # zustand状态管理
│   ├── styles.css            # 全局样式
│   └── components/           # 组件目录
│       ├── TitleStore.tsx    # 盐引库组件
│       ├── InspectionDesk.tsx # 稽查台组件
│       └── IronCertStore.tsx # 铁券架组件
├── server/                    # 后端源码
│   └── index.ts              # Express服务器
├── index.html                 # HTML入口
├── vite.config.js             # Vite配置
├── tsconfig.json              # TypeScript配置
└── package.json               # 项目依赖
```

## 4. 路由定义

| 路由  | 页面/组件   | 用途                      |
| --- | ------- | ----------------------- |
| `/` | App.tsx | 主稽查厅（盐引库+稽查台+铁券架+转运司面板） |

## 5. API 定义

### 5.1 盐引相关接口

| 方法   | 路径                           | 描述     | 请求参数                                    | 响应                  |
| ---- | ---------------------------- | ------ | --------------------------------------- | ------------------- |
| GET  | `/api/salt-certificates`     | 获取盐引列表 | `query`: search(可选), sort(可选: asc/desc) | `SaltCertificate[]` |
| POST | `/api/salt-certificates`     | 新增盐引   | `body`: SaltCertificate                 | `SaltCertificate`   |
| PUT  | `/api/salt-certificates/:id` | 更新盐引状态 | `body`: { status, inspectionResult }    | `SaltCertificate`   |

### 5.2 铁券相关接口

| 方法   | 路径                           | 描述     | 请求参数                                    | 响应                  |
| ---- | ---------------------------- | ------ | --------------------------------------- | ------------------- |
| GET  | `/api/iron-certificates`     | 获取铁券列表 | `query`: search(可选), sort(可选: asc/desc) | `IronCertificate[]` |
| POST | `/api/iron-certificates`     | 新增铁券   | `body`: IronCertificate                 | `IronCertificate`   |
| PUT  | `/api/iron-certificates/:id` | 更新铁券   | `body`: IronCertificate                 | `IronCertificate`   |

### 5.3 报表接口

| 方法  | 路径            | 描述       | 请求参数                     | 响应           |
| --- | ------------- | -------- | ------------------------ | ------------ |
| GET | `/api/report` | 生成月终对账报表 | `query`: month(可选, 默认当月) | `ReportData` |

## 6. 数据模型

### 6.1 ER图

```mermaid
erDiagram
    SALT_CERTIFICATE {
        string id PK "盐引编号"
        number saltWeight "盐斤数"
        date issueDate "签发日期"
        string region "行盐地域"
        string seal "钤印"
        string secretMark "暗记"
        string status "状态: pending/verified/rejected"
        string inspectionResult "稽查结果"
        date createdAt "创建时间"
        date updatedAt "更新时间"
    }

    IRON_CERTIFICATE {
        string id PK "铁券编号"
        string grade "品级: 免死/减罪/免役"
        string holderName "持券人姓名"
        string officialTitle "官职"
        date issueDate "颁发日期"
        date expireDate "有效期限"
        string holderAvatar "持券人头像"
        string status "状态: active/inactive"
        date createdAt "创建时间"
        date updatedAt "更新时间"
    }

    INSPECTION_LOG {
        string id PK "日志编号"
        string recordId "关联盐引/铁券ID"
        string recordType "类型: salt/iron"
        string operation "操作类型"
        string operator "操作人"
        string result "处理结果"
        date timestamp "操作时间"
    }

    SALT_CERTIFICATE ||--o{ INSPECTION_LOG : "产生"
    IRON_CERTIFICATE ||--o{ INSPECTION_LOG : "产生"
```

### 6.2 TypeScript类型定义

```typescript
// src/types.ts
export interface SaltCertificate {
  id: string;
  saltWeight: number;
  issueDate: string;
  region: string;
  seal: string;
  secretMark: string;
  status: 'pending' | 'verified' | 'rejected';
  inspectionResult?: '验讫' | '驳';
  createdAt: string;
  updatedAt: string;
}

export interface IronCertificate {
  id: string;
  grade: '免死' | '减罪' | '免役';
  holderName: string;
  officialTitle: string;
  issueDate: string;
  expireDate: string;
  holderAvatar: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface InspectionLog {
  id: string;
  recordId: string;
  recordType: 'salt' | 'iron';
  operation: string;
  operator: string;
  result: string;
  timestamp: string;
}

export interface ReportData {
  month: string;
  saltCertificates: {
    issued: number;
    verified: number;
    rejected: number;
    totalWeight: number;
  };
  ironCertificates: {
    issued: number;
    changed: number;
  };
  anomalies: Array<{
    id: string;
    type: string;
    description: string;
  }>;
  dailyStats: Array<{
    date: string;
    issued: number;
    verified: number;
    complianceRate: number;
  }>;
}

export interface StoreState {
  saltCertificates: SaltCertificate[];
  ironCertificates: IronCertificate[];
  inspectionLogs: InspectionLog[];
  currentInspecting: SaltCertificate | null;
  searchResults: Array<SaltCertificate | IronCertificate>;
  selectedIronCert: IronCertificate | null;
  showReport: boolean;
  reportData: ReportData | null;
}
```

## 7. 状态管理设计（zustand）

```typescript
// src/store.ts
import { create } from 'zustand';

const useStore = create<StoreState & StoreActions>((set, get) => ({
  // ...状态
  addSaltCert: (cert) => set(/* ... */),
  inspectSaltCert: (id) => {
    // 防伪校验逻辑
    const cert = get().saltCertificates.find(c => c.id === id);
    if (cert && cert.seal === cert.secretMark) {
      // 验讫
    } else {
      // 驳回
    }
  },
  toggleIronCertDetail: (cert) => set(/* ... */),
  searchRecords: (keyword) => set(/* ... */),
  generateReport: () => set(/* ... */),
}));
```

## 8. 核心组件数据流

```mermaid
sequenceDiagram
    participant U as 用户
    participant TS as TitleStore
    participant ID as InspectionDesk
    participant IS as IronCertStore
    participant ST as Store
    participant API as 后端API
    participant LS as localStorage

    U->>TS: 拖拽盐引
    TS->>ST: inspectSaltCert(id)
    ST->>ST: 防伪校验(seal === secretMark)
    alt 校验通过
        ST->>ST: status=verified, result=验讫
        ST->>API: PUT /api/salt-certificates/:id
        ST->>LS: 写入账册
        ST->>ID: 更新当前校验状态
        ID->>U: 金色钤印 + 验讫红章 + 光晕动画
    else 校验不通过
        ST->>ST: status=rejected, result=驳
        ST->>API: PUT /api/salt-certificates/:id
        ST->>LS: 写入账册
        ST->>ID: 更新当前校验状态
        ID->>U: 暗红钤印 + 驳黑章 + 警示音
    end
    ST->>ID: 更新统计图表与日志

    U->>IS: 点击铁券
    IS->>ST: toggleIronCertDetail(cert)
    ST->>IS: selectedIronCert=cert
    IS->>U: 详情弹窗从底部上滑

    U->>IS: 点击月终结算
    IS->>ST: generateReport()
    ST->>API: GET /api/report
    API-->>ST: 返回报表数据
    ST->>IS: reportData=数据
    IS->>U: PDF风格报表预览
```

## 9. 后端服务架构

```mermaid
graph TD
    server/index.ts --> R1["GET /api/salt-certificates"]
    server/index.ts --> R2["POST /api/salt-certificates"]
    server/index.ts --> R3["PUT /api/salt-certificates/:id"]
    server/index.ts --> R4["GET /api/iron-certificates"]
    server/index.ts --> R5["POST /api/iron-certificates"]
    server/index.ts --> R6["PUT /api/iron-certificates/:id"]
    server/index.ts --> R7["GET /api/report"]
    
    R1 --> S1["内存数组 saltCerts"]
    R2 --> S1
    R3 --> S1
    R4 --> S2["内存数组 ironCerts"]
    R5 --> S2
    R6 --> S2
    R7 --> S3["报表生成逻辑"]
    S3 --> S1
    S3 --> S2
    
    style server/index.ts fill:#f0f8e8
    style S1 fill:#fff5e6
    style S2 fill:#fff5e6
```

## 10. 性能优化要点

1. **动画性能**：使用 `transform` 和 `opacity` 属性实现动画，避免触发重排重绘
2. **拖拽优化**：framer-motion drag 启用 `dragMomentum={false}` 减少计算
3. **列表渲染**：使用 `React.memo` 包装列表项，配合 `useMemo` 优化数据计算
4. **状态更新**：zustand 选择器订阅避免不必要的重渲染
5. **本地存储**：localStorage 写入使用防抖，避免频繁IO
6. **图表性能**：recharts 使用 `isAnimationActive={false}` 在数据量大时关闭动画

