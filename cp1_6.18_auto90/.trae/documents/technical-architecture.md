# 风味轮盘 (Flavor Wheel) 技术架构文档

## 1. 技术选型

### 1.1 核心技术栈
| 技术 | 版本 | 用途 | 选型理由 |
|------|------|------|----------|
| React | 18.x | UI框架 | 组件化开发，生态成熟，性能优异 |
| TypeScript | 5.x | 类型系统 | 严格类型检查，提升代码质量和可维护性 |
| Vite | 5.x | 构建工具 | 极速冷启动，HMR热更新，打包优化 |
| Zustand | 4.x | 状态管理 | 轻量级，API简洁，支持中间件和持久化 |
| html-to-image | 最新 | DOM转图片 | 将分享名片DOM节点转换为PNG图片 |
| file-saver | 最新 | 文件下载 | 触发浏览器下载生成的分享图片 |
| uuid | 最新 | 唯一标识 | 生成品鉴记录唯一ID |

### 1.2 开发规范
- TypeScript严格模式（strict: true）
- ESNext模块系统
- JSX转换：react-jsx
- 代码风格：保持一致的缩进和命名规范

## 2. 项目目录结构

```
auto90/
├── package.json              # 项目依赖配置
├── index.html                # HTML入口文件
├── tsconfig.json             # TypeScript配置
├── vite.config.js            # Vite配置
├── .trae/
│   └── documents/
│       ├── PRD.md           # 产品需求文档
│       └── technical-architecture.md # 技术架构文档
└── src/
    ├── main.tsx              # React应用入口
    ├── stores/
    │   └── appStore.ts      # Zustand全局状态管理
    ├── hooks/
    │   └── useWheelEngine.ts # 轮盘交互逻辑Hook
    ├── components/
    │   ├── WheelCanvas.tsx   # 风味轮盘Canvas组件
    │   ├── FlavorRadar.tsx   # 极坐标雷达图组件
    │   ├── TastingForm.tsx   # 品鉴记录表单组件
    │   ├── HistoryPanel.tsx  # 历史记录面板组件
    │   └── ShareCard.tsx     # 分享名片生成组件
    ├── utils/
    │   └── cropImage.ts      # 图片裁剪工具函数
    └── styles/
        └── global.css        # 全局样式
```

## 3. 核心模块设计

### 3.1 状态管理层 (appStore.ts)

#### 3.1.1 类型定义
```typescript
// 风味轮盘数据类型
interface FlavorWheel {
  sweet: number;    // 甜 0-9
  sour: number;     // 酸 0-9
  bitter: number;   // 苦 0-9
  spicy: number;    // 辣 0-9
  salty: number;    // 咸 0-9
  umami: number;    // 鲜 0-9
}

// 品鉴记录类型
interface TastingNote {
  id: string;
  dishName: string;
  date: string;
  description: string;
  photoUrl: string;
  wheelData: FlavorWheel;
}

// 排序类型
type SortType = 'date-desc' | 'date-asc' | 'sweet' | 'sour' | 'bitter' | 'spicy' | 'salty' | 'umami';
```

#### 3.1.2 状态接口
```typescript
interface AppState {
  currentWheel: FlavorWheel;
  notes: TastingNote[];
  sortType: SortType;
  selectedNoteId: string | null;
}
```

#### 3.1.3 Actions
- `setWheelValue(dimension: keyof FlavorWheel, value: number): void`
- `resetWheel(): void`
- `addNote(note: Omit<TastingNote, 'id'>): void`
- `deleteNote(id: string): void`
- `sortNotes(sortType: SortType): void`
- `selectNote(id: string | null): void`

#### 3.1.4 持久化
使用Zustand的persist中间件，将notes数组持久化到localStorage。

### 3.2 轮盘交互引擎 (useWheelEngine.ts)

#### 3.2.1 核心状态
- `pointerPositions: Record<FlavorDimension, number>` - 各维度指针角度
- `draggingDimension: FlavorDimension | null` - 当前拖拽的维度
- `hoveredDimension: FlavorDimension | null` - 当前悬停的维度

#### 3.2.2 坐标计算
- 极坐标转笛卡尔坐标：`(angle, radius) → {x, y}`
- 角度范围映射到维度：每个维度占用60° (360°/6)
- 角度到数值映射：0°-180° 对应 0-9

#### 3.2.3 事件处理
- `onMouseDown(e, dimension)`: 开始拖拽
- `onMouseMove(e)`: 拖拽中更新角度
- `onMouseUp()`: 结束拖拽
- `onClick(e, dimension)`: 点击直接设置数值

#### 3.2.4 数据流
```
用户事件 → 坐标计算 → 角度映射 → 更新Store → 组件重渲染
```

### 3.3 Canvas轮盘组件 (WheelCanvas.tsx)

#### 3.3.1 绘制流程
1. 清除画布
2. 绘制背景径向渐变
3. 绘制六个扇区（带半透明渐变填充）
4. 绘制分割线
5. 绘制刻度
6. 绘制指针
7. 悬停高亮效果

#### 3.3.2 性能优化
- 使用 `requestAnimationFrame` 实现流畅动画
- 避免不必要的重绘：只在数据变化时重绘
- 离屏Canvas缓存静态元素

#### 3.3.3 事件转发
将Canvas上的鼠标事件转发给useWheelEngine处理。

### 3.4 雷达图组件 (FlavorRadar.tsx)

#### 3.4.1 绘制内容
- 六边形网格（3层）
- 网格线（半透明白色）
- 数据点连线（2px白色实线）
- 填充区域（半透明白色0.3）
- 数据点标记

#### 3.4.2 动画过渡
- 使用线性插值（lerp）实现数值变化平滑过渡
- 动画时长：300ms

### 3.5 品鉴表单组件 (TastingForm.tsx)

#### 3.5.1 表单字段
| 字段 | 类型 | 校验规则 |
|------|------|----------|
| dishName | string | 必填，非空校验 |
| date | string | 必填，日期格式 |
| description | string | 可选，最多200字 |
| photo | File | 可选，jpg/png，≤5MB |

#### 3.5.2 校验逻辑
- 实时校验：onChange触发
- 错误提示：红色边框 + 闪烁动画
- 字数统计：实时显示剩余字数

#### 3.5.3 图片处理
- FileReader读取为Base64
- 调用cropImage工具裁剪为正方形
- 最大边长200px

### 3.6 历史记录面板 (HistoryPanel.tsx)

#### 3.6.1 卡片列表
- 固定宽度300px，垂直滚动
- 每张卡片高100px
- 左边缘4px色条（对应主味维度）
- 显示菜品名、日期、主味数值

#### 3.6.2 详情弹窗
- 宽度400px，居中显示
- 渐入动画0.3s ease
- 显示完整轮盘、雷达图、描述、照片

#### 3.6.3 排序功能
- 下拉选择器
- 排序选项：日期降序/升序、各维度数值
- 排序时播放过渡动画

### 3.7 分享名片组件 (ShareCard.tsx)

#### 3.7.1 名片规格
- 尺寸：384x216px
- 背景：径向渐变#2D2D44到#1A1A2E
- 内容：轮盘缩略图、菜品名、评语、时间、二维码占位

#### 3.7.2 生成流程
1. 渲染隐藏的DOM节点
2. 使用html-to-image转换为PNG
3. 提供下载和复制到剪贴板选项

### 3.8 图片裁剪工具 (cropImage.ts)

#### 3.8.1 功能
- 读取上传的图片文件
- 裁剪为正方形（居中裁剪）
- 调整尺寸到最大边长200px
- 返回Base64字符串

## 4. 数据流架构

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  WheelCanvas    │────▶│ useWheelEngine  │────▶│                 │
│  (用户交互)     │     │  (事件处理)     │     │   Zustand       │
└─────────────────┘     └─────────────────┘     │   Store         │
                                                │  (全局状态)     │
┌─────────────────┐     ┌─────────────────┐     │                 │
│  TastingForm    │────▶│    addNote      │────▶│                 │
│  (表单提交)     │     │  (保存记录)     │     └────────┬────────┘
└─────────────────┘     └─────────────────┘              │
                                                         │
┌─────────────────┐     ┌─────────────────┐              │
│  HistoryPanel   │◀────│   selectNote    │◀─────────────┘
│  (列表展示)     │     │  (读取记录)     │
└─────────────────┘     └─────────────────┘
       │
       ▼
┌─────────────────┐     ┌─────────────────┐
│  FlavorRadar    │◀────│  currentWheel   │
│  (雷达图)       │     │  (实时数据)     │
└─────────────────┘     └─────────────────┘

┌─────────────────┐     ┌─────────────────┐
│  ShareCard      │────▶│  html-to-image  │
│  (生成图片)     │     │  (导出PNG)      │
└─────────────────┘     └─────────────────┘
```

## 5. 性能优化策略

### 5.1 渲染性能
- **Canvas重绘优化**：只在数据变化时重绘，使用requestAnimationFrame
- **组件记忆化**：使用React.memo避免不必要重渲染
- **状态选择器**：Zustand使用selector精确订阅需要的状态

### 5.2 动画性能
- **CSS动画优先**：使用transform和opacity实现GPU加速
- **避免布局抖动**：批量读写DOM操作
- **RAF批量更新**：多个动画合并到同一帧

### 5.3 内存优化
- **图片压缩**：上传图片自动压缩到200px
- **事件清理**：组件卸载时移除事件监听
- **避免内存泄漏**：正确清理定时器和引用

### 5.4 打包优化
- **代码分割**：Vite自动代码分割
- **Tree Shaking**：移除未使用代码
- **按需加载**：动态导入非核心模块

## 6. 响应式设计

### 6.1 断点设计
| 断点 | 宽度 | 布局 |
|------|------|------|
| xs | <375px | 单列布局，底部抽屉 |
| sm | 375-767px | 单列布局，底部抽屉 |
| md | 768-1023px | 双列布局，自适应 |
| lg | 1024-1919px | 三栏布局，右侧固定面板 |
| xl | ≥1920px | 三栏布局，内容居中最大宽度 |

### 6.2 布局策略
- Flexbox为主，Grid为辅
- CSS变量管理断点和间距
- 移动端优先或桌面端优先：桌面端优先

## 7. 动画系统

### 7.1 动画规范
| 动画类型 | 时长 | 缓动函数 |
|----------|------|----------|
| 轮盘旋转 | 0.4s | cubic-bezier(0.23, 1, 0.32, 1) |
| 面板滑入 | 0.3s | ease-out |
| 弹窗渐入 | 0.3s | ease |
| 按钮点击 | 0.1s | ease |
| 数值过渡 | 0.3s | linear |

### 7.2 关键帧定义
- 闪烁动画（错误提示）
- 滑入动画（侧边栏）
- 渐入动画（弹窗）
- 脉冲动画（分享按钮）

## 8. 构建与部署

### 8.1 脚本配置
- `npm run dev`: 启动开发服务器
- `npm run build`: 生产构建
- `npm run preview`: 预览构建结果

### 8.2 Vite配置
- React插件
- 路径别名：@ → src
- 构建目标：ES2020
- Sourcemap：开发环境开启

### 8.3 TypeScript配置
- 严格模式：strict: true
- 模块：ESNext
- 目标：ES2020
- JSX：react-jsx
- 路径别名：@/*

## 9. 测试策略

### 9.1 单元测试
- 工具函数：cropImage
- 状态管理：appStore actions
- Hook逻辑：useWheelEngine计算逻辑

### 9.2 集成测试
- 轮盘交互流程
- 表单提交流程
- 历史记录增删改查

### 9.3 E2E测试
- 完整用户流程：评分→填写→保存→查看→分享
- 响应式布局测试
- 性能测试：帧率监控

## 10. 风险与应对

| 风险 | 影响 | 概率 | 应对措施 |
|------|------|------|----------|
| Canvas性能问题 | 高 | 中 | 使用RAF、离屏缓存、减少绘制区域 |
| html-to-image兼容性 | 中 | 低 | 提供降级方案，测试主流浏览器 |
| 移动端触摸事件 | 中 | 中 | 同时支持mouse和touch事件 |
| localStorage容量限制 | 中 | 低 | 图片压缩，提供清理功能 |
