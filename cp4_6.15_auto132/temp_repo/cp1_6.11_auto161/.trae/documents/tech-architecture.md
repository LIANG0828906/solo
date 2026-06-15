## 1. 架构设计

```mermaid
graph TD
    "index.html 入口页面" --> "vite 构建工具"
    "vite 构建工具" --> "src/scene.ts 场景管理"
    "src/scene.ts 场景管理" --> "src/coral.ts 珊瑚模块"
    "src/scene.ts 场景管理" --> "src/fish.ts 鱼群模块"
    "src/scene.ts 场景管理" --> "洋流粒子系统"
    "src/scene.ts 场景管理" --> "海底平面"
    "src/scene.ts 场景管理" --> "lil-gui 控制面板"
    "src/coral.ts 珊瑚模块" --> "鹿角珊瑚"
    "src/coral.ts 珊瑚模块" --> "脑珊瑚"
    "src/coral.ts 珊瑚模块" --> "海扇珊瑚"
    "src/fish.ts 鱼群模块" --> "InstancedMesh 鱼群"
    "lil-gui 控制面板" --> "光照强度参数"
    "lil-gui 控制面板" --> "水温参数"
```

## 2. 技术说明

- 前端：Three.js + TypeScript + Vite + lil-gui
- 初始化工具：Vite
- 后端：无
- 数据库：无

### 依赖清单

| 依赖 | 版本 | 用途 |
|------|------|------|
| three | latest | 3D渲染引擎 |
| @types/three | latest | Three.js类型定义 |
| typescript | latest | TypeScript编译器 |
| vite | latest | 构建工具和开发服务器 |
| lil-gui | latest | 参数调节控制面板 |

### 文件结构

```
├── package.json
├── index.html
├── vite.config.js
├── tsconfig.json
└── src/
    ├── scene.ts
    ├── coral.ts
    └── fish.ts
```

## 3. 模块设计

### 3.1 scene.ts — 场景管理

- 创建Three.js场景、透视相机（FOV 60度）、WebGL渲染器
- 环境光（强度0.3）+ 方向光（强度0.8，位置5,10,7）
- 海底平面：BufferGeometry，深蓝渐变材质，sin波顶点动画
- 洋流粒子系统：200个粒子，Points + BufferGeometry，从左到右流动
- OrbitControls：旋转灵敏度0.5度/像素，缩放范围3-15，阻尼0.3秒
- lil-gui面板：光照强度（0.5-2.0）、水温（15-30°C）
- 渲染循环：requestAnimationFrame，统一更新所有动画
- 接收控制参数传递给珊瑚和鱼群模块

### 3.2 coral.ts — 珊瑚模块

- 鹿角珊瑚：递归分支圆柱体，CylinderGeometry，分支长度0.2-0.8，半径0.02-0.05，颜色#FF6B6B到#FF8C00
- 脑珊瑚：IcosahedronGeometry变形（面数12-20），颜色#4CAF50到#8BC34A
- 海扇珊瑚：PlaneGeometry扇形结构，半透明材质
- 每株珊瑚带摆动动画：频率0.2-0.5Hz，幅度0.05单位
- 光照强度参数：影响珊瑚颜色饱和度（饱和度 = 光照 × 0.3 + 0.7）
- 水温参数：影响鹿角珊瑚生长速度（0.5-2.0倍线性变化）
- 随机分布在半径5单位圆形区域
- BufferGeometry合并静态几何体优化性能

### 3.3 fish.ts — 鱼群模块

- 15-20条小鱼，使用InstancedMesh减少draw call
- 每条鱼：椭圆体（SphereGeometry拉伸）+ 三角形鱼尾（BufferGeometry）
- 颜色：HSV色环30°-60°随机暖色调，光泽度0.3
- 沿随机椭圆路径游动：周期8-15秒
- 鼠标悬停避让：向远离鼠标方向漂移（0.5单位/秒），1秒恢复过渡
- 更新InstancedMesh矩阵实现动画

## 4. 性能优化策略

| 优化项 | 方案 |
|--------|------|
| 静态几何体 | BufferGeometry合并同类型珊瑚 |
| 鱼群渲染 | InstancedMesh，1个draw call渲染所有鱼 |
| 顶点数控制 | 总计<5万顶点 |
| 动画更新 | requestAnimationFrame统一更新 |
| 内存管理 | 避免每帧创建新对象，复用Vector3/Matrix4 |
| 渲染帧率 | 目标55-60FPS（20条鱼时） |
