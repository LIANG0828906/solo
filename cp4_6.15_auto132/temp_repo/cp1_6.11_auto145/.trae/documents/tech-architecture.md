## 1. 架构设计

```mermaid
flowchart TD
    "index.html" --> "src/main.ts"
    "src/main.ts" --> "Three.js Scene"
    "src/main.ts" --> "Plant.ts"
    "src/main.ts" --> "lil-gui"
    "Three.js Scene" --> "Camera + OrbitControls"
    "Three.js Scene" --> "Renderer"
    "Three.js Scene" --> "Lights"
    "Three.js Scene" --> "花盆 + 台面"
    "Plant.ts" --> "种子几何体"
    "Plant.ts" --> "茎几何体"
    "Plant.ts" --> "叶片几何体"
    "Plant.ts" --> "花朵几何体"
    "Plant.ts" --> "果实几何体"
    "lil-gui" --> "光照参数"
    "lil-gui" --> "水分参数"
    "lil-gui" --> "温度参数"
```

## 2. 技术说明

- 前端：TypeScript + Three.js + lil-gui + Vite
- 构建工具：Vite（端口3000）
- 无后端，纯前端应用
- 依赖：three, typescript, vite, @types/three, lil-gui

## 3. 路由定义

| 路由 | 用途 |
|------|------|
| / | 单页应用，3D植物模拟器 |

## 4. 文件结构

```
├── package.json          # 依赖和启动脚本
├── index.html            # 入口页面
├── vite.config.js        # Vite构建配置
├── tsconfig.json         # TypeScript配置
└── src/
    ├── main.ts           # 主入口：场景初始化、GUI、动画循环
    └── Plant.ts          # 植物类：几何体构建、生长逻辑、形态变化
```

## 5. 核心模块设计

### 5.1 main.ts 职责

- 初始化Three.js场景、相机(3,2,5)、渲染器
- 创建OrbitControls（阻尼0.1）
- 创建灯光系统（环境光 + 方向光）
- 创建花盆（圆形，半径1.5，高0.8，颜色#5C4033，金色镶边）和台面（6x6x0.1，颜色#D3D3D3）
- 创建lil-gui面板（3个滑块：光照0-100默认60，水分0-100默认50，温度0-40默认22）
- 创建Plant实例
- 动画循环：计算生长速率、更新植物、渲染
- 重置按钮逻辑
- 生长阶段和时间显示

### 5.2 Plant.ts 职责

- 使用自定义几何体组合构建植物各部分
- 根据生长阶段参数(0-1总进度)动态调整：
  - 种子(0-0.25)：棕色扁椭圆，半径0.3
  - 幼苗(0.25-0.5)：高度0.5-1.5，绿色茎，2片嫩叶
  - 成熟(0.5-0.75)：高度2-3，深绿茎，4-6片弯曲大叶
  - 花果(0.75-1.0)：高度2.5-4，棕绿茎，5瓣粉色渐变花，黄色花心，红色果实
- 叶片变黄逻辑：参数<20或>80时叶绿素减少
- 叶片掉落逻辑：参数<10或>90时2%概率掉落，自由落体动画
- 平滑过渡动画

### 5.3 生长速率计算

```
baseRate = 0.02 / 帧
normalizedScore = (光照 + 水分 + 温度归一化) / 3
growthRate = normalizedScore * baseRate
if (任一参数 < 20 或 > 80): growthRate *= 0.5
if (任一参数 < 10 或 > 90): 触发叶片掉落
```

## 6. 性能约束

- 目标帧率：60fps
- 植物叶片数：≤20
- 粒子数：≤500（花粉/水滴效果）
- 几何体使用BufferGeometry，共享材质实例
