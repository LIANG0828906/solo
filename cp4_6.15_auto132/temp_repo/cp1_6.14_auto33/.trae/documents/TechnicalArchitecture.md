## 1. 架构设计

```mermaid
graph TB
    subgraph "浏览器端 (Frontend)"
        A["React 18 + TypeScript"]
        B["Vite 构建与HMR"]
        C["@react-three/fiber (R3F)"]
        D["@react-three/drei 辅助组件"]
        E["Leva 参数面板"]
        F["zustand 状态管理"]
        G["axios HTTP客户端"]
        H["react-router-dom 路由"]
    end
    subgraph "后端服务 (Backend)"
        I["Express 4 + CORS"]
        J["UUID 生成分享代码"]
        K["本地JSON文件存储"]
    end
    subgraph "数据流"
        L["/api/config POST 保存"]
        M["/api/config/:code GET 加载"]
    end
    A --> B
    A --> C
    C --> D
    A --> E
    A --> F
    A --> G
    A --> H
    G --> L
    G --> M
    L --> I
    M --> I
    I --> J
    I --> K
```

## 2. 技术描述
- **前端框架**：React@18 + TypeScript@5 + Vite@5
- **3D渲染层**：three@0.160 + @react-three/fiber@8 + @react-three/drei@9
- **参数控制UI**：leva@0.9
- **HTTP客户端**：axios@1.6
- **路由管理**：react-router-dom@6
- **后端服务**：Express@4 + cors + uuid
- **数据持久化**：server/data/configs.json 本地JSON文件存储
- **代码生成**：UUID取前6位大写字母数字组合作为分享代码

## 3. 路由定义
| 路由 | 用途 |
|-----|------|
| / | 主应用页面，包含3D场景和参数面板 |
| /api/config [POST] | 后端接口：保存地形配置，返回分享代码 |
| /api/config/:code [GET] | 后端接口：根据代码加载地形配置 |

## 4. API定义

### 4.1 类型定义
```typescript
interface TerrainConfig {
  heightScale: number;      // 地形高度倍率 0.1-5.0
  frequency: number;        // 地形噪声频率 1-10
  vegetationDensity: number;// 植被密度 0-100
  lightAngle: number;       // 光照角度(度) 0-360
  viewMode: 'first' | 'third'; // 视角模式
  cameraPosition: [number, number, number]; // 相机位置
  cameraTarget: [number, number, number];   // 相机朝向
  seed: number;             // 地形随机种子
}

interface SaveResponse {
  code: string;             // 6位分享代码
  success: boolean;
}

interface LoadResponse {
  config: TerrainConfig | null;
  success: boolean;
  message?: string;
}
```

### 4.2 POST /api/config
- 请求体：`TerrainConfig` JSON
- 响应：`SaveResponse { code: "A1B2C3", success: true }`
- 错误处理：参数校验失败返回 400 + message

### 4.3 GET /api/config/:code
- URL参数：`code` 6位字符
- 响应：`LoadResponse { config: {...}, success: true }`
- 错误处理：代码不存在返回 404 + message

## 5. 服务器架构图

```mermaid
sequenceDiagram
    participant Client as 浏览器React
    participant Server as Express Server
    participant FS as 本地JSON存储

    Note over Client,FS: 保存配置流程
    Client->>Server: POST /api/config (TerrainConfig)
    Server->>Server: 生成6位分享代码
    Server->>FS: 写入 configs.json { code: config }
    FS-->>Server: 写入成功
    Server-->>Client: 200 { code, success:true }

    Note over Client,FS: 加载配置流程
    Client->>Server: GET /api/config/:code
    Server->>FS: 读取 configs.json
    FS-->>Server: 返回JSON数据
    alt 找到对应代码
        Server-->>Client: 200 { config, success:true }
    else 代码不存在
        Server-->>Client: 404 { config:null, success:false, message }
    end
```

## 6. 数据模型

### 6.1 数据模型定义
```mermaid
erDiagram
    CONFIGS {
        string code PK "6位分享代码"
        number heightScale "高度倍率"
        number frequency "噪声频率"
        number vegetationDensity "植被密度"
        number lightAngle "光照角度"
        string viewMode "视角模式 first/third"
        array cameraPosition "[x,y,z]"
        array cameraTarget "[tx,ty,tz]"
        number seed "随机种子"
        datetime createdAt "创建时间"
    }
```

### 6.2 存储文件结构
`server/data/configs.json`:
```json
{
  "A1B2C3": {
    "heightScale": 2.0,
    "frequency": 3.5,
    "vegetationDensity": 60,
    "lightAngle": 135,
    "viewMode": "first",
    "cameraPosition": [0, 1.7, 10],
    "cameraTarget": [0, 1.7, 0],
    "seed": 42,
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
}
```
