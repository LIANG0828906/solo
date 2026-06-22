## 1. 架构设计

```mermaid
flowchart TB
    subgraph "前端层"
        A["TerrainViewer.vue<br/>Vue组件"]
        B["interactionHandler.ts<br/>交互处理"]
        C["terrainRenderer.ts<br/>渲染引擎"]
    end
    subgraph "数据层"
        D["tileManager.ts<br/>切片管理"]
        E["terrainLoader.ts<br/>数据加载"]
    end
    subgraph "外部服务"
        F["远程高程API"]
    end

    A --> "用户操作" --> B
    B --> "经纬度坐标" --> A
    A --> "更新tile坐标" --> D
    D --> "请求高程数据" --> E
    E --> "HTTP请求" --> F
    F --> "JSON响应" --> E
    E --> "Float32Array" --> D
    D --> "BufferGeometry" --> C
    C --> "Mesh→场景" --> A
    A --> "相机/LOD" --> C
```

### 数据流向
1. **用户操作** → `TerrainViewer.vue` 捕获事件
2. **交互检测** → `interactionHandler.ts` 射线检测 → 输出经纬度
3. **切片请求** → `tileManager.ts` 检查缓存 → 命中则直接返回，未命中则调用 `terrainLoader.ts`
4. **数据加载** → `terrainLoader.ts` 调用远程API → 解析JSON → 返回 `Float32Array`
5. **网格构建** → `tileManager.ts` 将高程数据转为 `BufferGeometry`
6. **场景更新** → `terrainRenderer.ts` 接收几何体 → 创建Mesh → 添加到场景

## 2. 技术说明
- 前端：Vue 3 + TypeScript + Three.js + Vite
- 初始化工具：vite-init（vue-ts模板）
- 状态管理：Vue 3 reactive/ref（组件内状态）
- 样式：Tailwind CSS + 自定义CSS变量
- 后端：无（纯前端，数据从远程API获取）
- 数据库：无（使用内存缓存）

### 核心依赖
| 依赖 | 用途 |
|------|------|
| three | 3D渲染引擎 |
| vue | 前端框架 |
| @vue/compiler-sfc | Vue SFC编译 |
| lodash | 工具函数（防抖、缓存等） |
| tailwindcss | CSS工具类 |

## 3. 路由定义
| 路由 | 用途 |
|------|------|
| / | 主页面，包含3D地形视图和控制面板 |

## 4. API定义

### 4.1 远程高程数据API
```typescript
interface ElevationRequest {
  lat: number;
  lon: number;
  resolution: number;
}

interface ElevationResponse {
  lat: number;
  lon: number;
  width: number;
  height: number;
  elevations: number[];
}
```

### 4.2 城市搜索API
```typescript
interface GeoSearchResult {
  name: string;
  country: string;
  lat: number;
  lon: number;
}
```

## 5. 文件结构及调用关系

```
project/
├── index.html                          # 入口HTML
├── package.json                        # 依赖和脚本
├── vite.config.js                      # Vite构建配置
├── tsconfig.json                       # TypeScript配置
└── src/
    ├── main.ts                         # Vue应用入口
    ├── App.vue                         # 根组件
    ├── data/
    │   ├── terrainLoader.ts            # 高程数据加载（调用外部API）
    │   └── tileManager.ts              # 切片缓存管理（调用terrainLoader）
    ├── renderer/
    │   ├── terrainRenderer.ts          # Three.js渲染引擎（接收tileManager几何体）
    │   └── interactionHandler.ts       # 交互处理（射线检测→输出经纬度）
    ├── components/
    │   └── TerrainViewer.vue           # 主组件（整合所有模块）
    ├── composables/
    │   ├── useTerrain.ts               # 地形逻辑组合式函数
    │   └── usePerformance.ts           # 性能监控组合式函数
    ├── utils/
    │   └── geo.ts                      # 地理坐标转换工具
    └── types/
        └── index.ts                    # TypeScript类型定义
```

### 调用关系图
```
TerrainViewer.vue
  ├── terrainRenderer.ts（初始化场景、接收几何体、渲染循环）
  │     └── tileManager.ts（获取几何体）
  │           └── terrainLoader.ts（获取高程数据）
  ├── interactionHandler.ts（鼠标事件→射线检测→经纬度输出）
  ├── useTerrain.ts（管理切片加载和LOD逻辑）
  └── usePerformance.ts（FPS监控、自动降级）
```

## 6. 关键技术实现

### 6.1 LOD级别切换
- 近距离（<50单位）：512×512顶点
- 中距离（50-150单位）：256×256顶点
- 远距离（150-300单位）：128×128顶点
- 超远距离（>300单位）：64×64顶点

### 6.2 切片缓存策略
- LRU缓存，最多缓存64个切片
- 每个切片以 `${lat}_${lon}_${lod}` 为缓存键
- 缓存内容为 Three.js BufferGeometry

### 6.3 相机过渡动画
- 使用 TWEEN 或自定义 lerp 实现1.5秒平滑过渡
- easeInOutCubic 缓动函数

### 6.4 性能监控
- FPS：requestAnimationFrame 计时
- 顶点数：遍历场景 Mesh 统计
- 自动降级：FPS连续3秒<30时降低LOD
