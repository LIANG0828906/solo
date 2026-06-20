## 1. 架构设计

```mermaid
flowchart LR
    subgraph "前端 (React + TypeScript)"
        A["App.tsx 主应用"]
        B["Dashboard.tsx 仪表盘页面"]
        C["CityCard.tsx 城市卡片"]
        D["TrendPanel.tsx 趋势对比面板"]
        E["airStore.ts Zustand状态"]
        F["airApi.ts API封装"]
        G["Ant Design组件库"]
        H["@ant-design/charts 图表"]
    end
    
    subgraph "后端 (FastAPI + Python)"
        I["main.py API路由"]
        J["data_generator.py 模拟数据"]
        K["/api/cities 城市列表"]
        L["/api/current/{city} 实时数据"]
        M["/api/history/{city} 历史数据"]
    end
    
    subgraph "构建与开发"
        N["Vite 构建工具"]
        O["TypeScript 类型系统"]
    end
    
    F -->|HTTP请求| I
    I --> J
    A --> B
    B --> C
    B --> D
    B --> E
    E --> F
    B --> G
    D --> H
    A --> N
    A --> O
```

## 2. 技术描述

- **前端框架**：React 18 + TypeScript 5
- **构建工具**：Vite 5（含路径别名 `@` 指向 `src`，代理 `/api` 到后端）
- **UI组件库**：Ant Design 5
- **图表库**：@ant-design/charts
- **状态管理**：Zustand 4
- **HTTP客户端**：Axios
- **日期处理**：dayjs
- **后端框架**：FastAPI（Python 3.9+）
- **ASGI服务器**：uvicorn
- **数据处理**：pandas（生成模拟数据）
- **数据源**：模拟数据生成器（生成过去7天每小时空气质量数据）

## 3. 路由定义

| 路由 | 用途 |
|-------|---------|
| / | 仪表盘首页，展示所有城市卡片和对比入口 |

## 4. API 定义

### 4.1 TypeScript 类型定义

```typescript
interface City {
  id: string;
  name: string;
  icon: string;
}

interface AirQualityCurrent {
  cityId: string;
  aqi: number;
  pm25: number;
  pm10: number;
  ozone: number;
  no2: number;
  timestamp: string;
}

interface AirQualityHourly {
  time: string;
  pm25: number;
  pm10: number;
  ozone: number;
  no2: number;
}

interface AirQualityHistory {
  cityId: string;
  data: AirQualityHourly[];
}
```

### 4.2 RESTful API 接口

| 方法 | 路径 | 描述 | 请求参数 | 响应格式 |
|------|------|------|----------|----------|
| GET | /api/cities | 获取城市列表 | 无 | `{ cities: City[] }` |
| GET | /api/current/{city_id} | 获取指定城市实时数据 | city_id: string | `AirQualityCurrent` |
| GET | /api/current | 获取所有城市实时数据 | 无 | `{ data: AirQualityCurrent[] }` |
| GET | /api/history/{city_id} | 获取指定城市7天历史数据 | city_id: string | `AirQualityHistory` |

## 5. 后端架构

```mermaid
flowchart TD
    A["FastAPI 应用入口 (main.py)"] --> B["路由层 /api/*"]
    B --> C["数据生成层 (data_generator.py)"]
    C --> D["模拟数据集 (内存)"]
    
    B --> E["GET /api/cities"]
    B --> F["GET /api/current/{city}"]
    B --> G["GET /api/current"]
    B --> H["GET /api/history/{city}"]
    
    E --> I["返回固定城市列表"]
    F --> C
    G --> C
    H --> C
    
    C --> J["基于城市ID+随机种子生成稳定数据"]
    C --> K["含自然波动+昼夜变化模式"]
```

## 6. 数据模型

### 6.1 数据模型定义

```mermaid
erDiagram
    CITY {
        string id PK
        string name
        string icon
    }
    
    AIR_CURRENT {
        string cityId FK
        int aqi
        int pm25
        int pm10
        int ozone
        int no2
        datetime timestamp
    }
    
    AIR_HISTORY {
        string cityId FK
        datetime time
        int pm25
        int pm10
        int ozone
        int no2
    }
    
    CITY ||--o{ AIR_CURRENT : has
    CITY ||--o{ AIR_HISTORY : has
```

### 6.2 AQI 等级标准

| AQI 范围 | 等级 | 颜色 |
|-----------|------|------|
| 0-50 | 优 | #00e400 |
| 51-100 | 良 | #ffff00 |
| 101-150 | 轻度污染 | #ff7e00 |
| 151-200 | 中度污染 | #ff0000 |
| 201-300 | 重度污染 | #99004c |
| >300 | 严重污染 | #7e0023 |

### 6.3 污染物浓度范围（用于进度条）

| 指标 | 单位 | 最小值 | 最大值 |
|------|------|--------|--------|
| PM2.5 | μg/m³ | 0 | 250 |
| PM10 | μg/m³ | 0 | 350 |
| 臭氧 O₃ | μg/m³ | 0 | 300 |
| 二氧化氮 NO₂ | μg/m³ | 0 | 200 |
