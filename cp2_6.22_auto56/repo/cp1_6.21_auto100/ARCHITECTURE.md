# 流动数据瀑布图 - 项目架构说明

## 项目文件结构

```
auto100/
├── package.json              # 项目依赖和脚本配置
├── vite.config.js            # Vite构建配置
├── tsconfig.json             # TypeScript严格模式配置
├── index.html                # 应用入口页面
├── ARCHITECTURE.md           # 架构说明文档（本文件）
└── src/
    ├── main.ts               # 前端应用入口
    ├── WaterfallController.ts # 3D瀑布图核心控制器
    ├── dataParser.ts         # 数据解析与归一化模块（前后端共用）
    ├── server.ts             # Express后端服务入口
    ├── style.css             # 全局样式
    └── vite-env.d.ts         # Vite类型声明
```

## 模块职责与调用关系

### 1. 数据流向图

```
用户输入 (手动/CSV)
    ↓
[前端] main.ts → POST /api/parse
    ↓
[后端] server.ts → 路由处理
    ↓
[后端] dataParser.ts → 解析 + 归一化
    ↓
[前端] main.ts → 接收 DataPoint[]
    ↓
[前端] WaterfallController.ts → 3D渲染
    ↓
Three.js 场景 → 浏览器显示
```

### 2. 模块详细说明

#### `src/dataParser.ts` - 数据处理核心模块
**职责**: 解析输入数据，进行归一化处理  
**类型**: 前后端共用模块  
**导出**:
- `parseTextInput(text: string): number[]` - 解析逗号分隔的文本
- `parseCsvContent(csvContent: string): Promise<number[]>` - 解析CSV内容
- `normalizeValues(values: number[]): number[]` - 将数值映射到0-10范围
- `createDataPoints(values: number[]): DataPoint[]` - 创建带时间戳的数据点
- `parseData(request: ParseRequest): Promise<ParseResponse>` - 统一解析入口

**数据结构**:
```typescript
interface DataPoint {
  timestamp: number;        // 时间戳 (ms)
  value: number;            // 归一化后的值 (0-10)
  normalizedValue: number;  // 归一化后的值 (同value，冗余用于清晰)
  originalValue: number;    // 原始数值
}
```

#### `src/server.ts` - 后端服务
**职责**: Express服务器，提供REST API  
**端口**: 3000  
**API接口**:
- `POST /api/parse` - 解析数据请求
  - 请求体: `{ rawText?: string; csvContent?: string }`
  - 响应: `{ success: boolean; data?: DataPoint[]; error?: string }`
- `GET /api/health` - 健康检查

**调用关系**:
- 导入 `parseData` 从 `dataParser.ts`
- 被 `vite.config.js` 代理 (5173端口 → 3000端口)

#### `src/main.ts` - 前端应用入口
**职责**: 初始化应用，协调UI交互与3D渲染  
**核心功能**:
1. DOM元素引用管理
2. 初始化 `WaterfallController`
3. 事件监听（按钮点击、文件上传、键盘输入）
4. API调用（POST /api/parse）
5. UI状态管理（侧面板展开/收起、消息提示）
6. 信息面板更新（时间戳、最新数值）
7. Tooltip显示（点击列时）

**调用关系**:
- 导入 `WaterfallController` 进行3D渲染
- 通过 `fetch` 调用后端 `/api/parse` 接口
- 导入 `DataPoint` 类型定义

#### `src/WaterfallController.ts` - 3D渲染控制器
**职责**: Three.js场景管理，瀑布图动态渲染  
**核心组件**:
1. **场景初始化**:
   - THREE.Scene, THREE.PerspectiveCamera, THREE.WebGLRenderer
   - 相机: 45度俯视，半径25，高度20，Y轴缓慢旋转 (0.01rad/s)
   - 灯光: 环境光 + 方向光(阴影) + 2个点光源

2. **地面与粒子**:
   - 半透明网格平面 (颜色#64FFDA，透明度0.2)
   - 四角粒子光晕 (20个粒子，随机漂浮动画)

3. **柱体管理**:
   - 长方体 (宽1.5, 深0.8, 高0-10)
   - 渐变色 (底部#64FFDA → 顶部#1E90FF)
   - 入场动画 (0.5s ease-out 从底部升起)
   - 退场动画 (0.5s 淡出)
   - 选中高亮 (白色发光)

4. **连接平面**:
   - 半透明平面 (透明度0.3, 颜色#64FFDA)
   - 平滑过渡相邻柱体高度差
   - 10段细分实现曲面效果

5. **动画循环**:
   - `requestAnimationFrame` 驱动
   - 从右向左平移 (每秒2.5单位 × 速度系数)
   - 生命周期管理 (超过100列自动裁剪)

**公共API**:
- `setData(data: DataPoint[]): void` - 设置数据并重建场景
- `setScrollSpeed(speed: number): void` - 设置滚动速度 (0.5-2x)
- `togglePause(): boolean` - 暂停/继续滚动
- `setOnColumnSelect(callback: (data: DataPoint | null) => void)` - 列点击回调
- `getLatestData(): DataPoint | null` - 获取最新可见数据
- `destroy(): void` - 清理资源

**调用关系**:
- 被 `main.ts` 实例化和调用
- 导入 `DataPoint` 类型定义
- 内部使用 `THREE.js` 进行渲染

#### `vite.config.js` - 构建配置
- 开发服务器端口: 5173
- API代理: `/api` → `http://localhost:3000`
- 别名: `@` → `./src`

## 启动流程

1. `npm run dev` 启动:
   - 后端服务: `tsx watch src/server.ts` (端口3000)
   - 前端开发服务器: `vite` (端口5173)

2. 前端初始化:
   - `main.ts` → 创建 `WaterfallController` 实例
   - 自动加载演示数据 (30个随机数值)
   - 调用 `/api/parse` 解析数据
   - 渲染瀑布图

3. 用户交互:
   - 输入数值/上传CSV → 点击"解析数据"
   - 调用后端API → 接收解析后数据
   - 更新3D场景 → 显示新的瀑布图

## 性能优化

- 最大列数限制: 100列（超过自动裁剪最早的列）
- 视口裁剪: 仅渲染可见区域内的列
- 像素比限制: `Math.min(devicePixelRatio, 2)`
- 阴影优化: PCFSoftShadowMap + 合理的阴影相机范围
- 资源清理: 移除的几何体和材质及时 `dispose()`
- DeltaTime限制: 最大0.1秒，防止跳帧

## 响应式适配

- 屏幕宽度 < 768px:
  - 侧面板改为底部横条
  - 3D场景缩放至85%
  - 信息面板移至左侧
