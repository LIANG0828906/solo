## 1. 架构设计

```mermaid
graph TD
    "index.html 入口页面" --> "src/main.ts 应用入口"
    "src/main.ts 应用入口" --> "src/galaxy.ts 星系生成"
    "src/main.ts 应用入口" --> "src/controls.ts UI控制"
    "src/controls.ts UI控制" --> "src/galaxy.ts 星系生成"
    "src/galaxy.ts 星系生成" --> "Three.js 渲染层"
    "Three.js 渲染层" --> "WebGL Canvas"
```

纯前端架构，无后端服务。所有计算和渲染在浏览器端完成。

## 2. 技术说明

- 前端：TypeScript + Three.js + Vite
- 初始化工具：Vite
- 构建工具：Vite（原生ES模块）
- 后端：无
- 数据库：无

### 依赖清单

| 包名 | 用途 |
|------|------|
| three | 3D渲染引擎 |
| @types/three | Three.js类型定义 |
| typescript | 类型系统 |
| vite | 构建与开发服务器 |

## 3. 路由定义

单页面应用，无路由。

| 路径 | 用途 |
|------|------|
| / | 星系可视化主页面 |

## 4. 模块职责

### src/main.ts
- 初始化Three.js场景、相机（PerspectiveCamera）、WebGL渲染器
- 加载galaxy模块生成粒子系统
- 启动requestAnimationFrame动画循环
- 接收controls模块的UI事件，触发galaxy重新生成
- 处理窗口resize事件
- 实现OrbitControls视角控制
- 实现双击重置视角
- 实现鼠标悬停高亮（Raycaster + ShaderMaterial）

### src/galaxy.ts
- 螺旋星系生成算法（对数螺旋分布）
- 创建BufferGeometry + ShaderMaterial粒子系统
- 颜色渐变计算（中心到边缘）
- 粒子大小随距离变化
- 旋臂随机偏移
- 导出生成函数供main调用
- 性能自适应：超10万粒子降频更新

### src/controls.ts
- 动态创建UI控制面板DOM
- 滑块控件：旋臂数、粒子总数、旋转速度、扩散程度
- 颜色选择器：主色1、主色2
- 监听参数变化，回调通知main重新生成
- 响应式：检测屏幕宽度切换面板布局
- 齿轮图标折叠/展开

## 5. 着色器设计

### 顶点着色器
- 接收粒子位置、颜色、大小属性
- 传递颜色和距离信息到片段着色器
- 计算gl_PointSize（含sizeAttenuation）

### 片段着色器
- 绘制圆形粒子（discard方形角落）
- 应用颜色渐变
- 鼠标悬停高亮：uniform传入悬停位置，距离阈值内亮度提升20%
- 粒子边缘柔和衰减

## 6. 性能策略

| 粒子数 | 更新频率 | 目标帧率 |
|--------|----------|----------|
| <100,000 | 每帧 | 60fps |
| ≥100,000 | 每2帧 | 60fps |
| ≥150,000 | 每2帧 | 30fps |

- 内存限制：<500MB
- 使用BufferAttribute避免每帧创建新对象
- dispose旧的geometry和material防止内存泄漏
