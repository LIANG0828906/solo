## 1. 架构设计

```mermaid
graph TD
    A["React App.tsx 主应用
    " --> B["GlobeView.tsx 3D地球视图
    "]
    A --> C["CityPanel.tsx 城市详情面板
    "]
    A --> D["AlbumTimeline.tsx 专辑时间轴
    "]
    A --> E["ShopCarousel.tsx 商品画廊
    "]
    B --> F["Three.js Canvas
    "]
    B --> G["@react-three/fiber
    "]
    B --> H["@react-three/drei
    "]
    C --> I["GSAP 动画
    "]
    E --> J["requestAnimationFrame
    "]
```

## 2. 技术栈描述

- 前端框架：React 18 + TypeScript
- 构建工具：Vite
- 3D渲染：Three.js + @react-three/fiber + @react-three/drei
- 动画库：GSAP + requestAnimationFrame
- 状态管理：React Hooks (useState, useEffect)
- 样式方案：CSS Modules / 内联样式 (styled-components不使用，保持原生CSS)

## 3. 文件结构

```
auto243/
├── index.html              # 入口HTML
├── package.json           # 项目依赖
├── vite.config.js        # Vite配置
├── tsconfig.json        # TypeScript配置
└── src/
    ├── App.tsx         # 主组件，布局组合，全局状态
    ├── GlobeView.tsx     # 3D地球渲染
    ├── CityPanel.tsx   # 城市信息面板
    ├── AlbumTimeline.tsx # 专辑时间轴
    ├── ShopCarousel.tsx # 商品画廊
    └── main.tsx        # 入口文件
```

## 4. 数据模型

### 4.1 类型定义

```typescript
interface City {
  id: string;
  name: string;
  lat: number;
  lng: number;
  date: string;
  venue: string;
  ticketUrl: string;
}

interface Album {
  id: string;
  title: string;
  releaseDate: string;
  isLatest: boolean;
  isUnreleased: boolean;
}

interface Merchandise {
  id: string;
  name: string;
  price: string;
}
```

## 5. 核心技术要点

1. **地球渲染**：使用@react-three/fiber的Canvas组件，结合drei的OrbitControls，Sphere几何体 + MeshStandardMaterial，高分辨率地球贴图
2. **城市标记**：经纬度转三维坐标，使用latLngToVector3工具函数，Sprite或Points材质，GSAP脉动动画
3. **面板定位**：使用project方法将3D坐标投影到2D屏幕坐标
4. **专辑光点**：在3D场景中创建PointLight或Sprite，使用useFrame实现轨道运动
5. **画廊滚动**：requestAnimationFrame实现ease-out平滑滚动动画
6. **响应式**：useEffect监听window.resize，动态调整尺寸参数
