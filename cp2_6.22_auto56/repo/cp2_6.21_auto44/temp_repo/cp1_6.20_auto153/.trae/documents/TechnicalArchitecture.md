## 1. 架构设计

```mermaid
graph TD
    A["index.html (入口页面)"] --> B["src/main.ts (程序入口)
    B --> C["src/sceneSetup.ts (3D场景管理)
    B --> D["src/controls.ts (UI交互控制)
    B --> E["src/cameraControl.ts (相机控制)
    C --> F["src/planetaryData.ts (行星数据)
    D --> C
    D --> E
    E --> C
    F --> C
```

## 2. 技术栈说明

- **前端框架**: 原生HTML/CSS + TypeScript
- **3D引擎**: Three.js (three + @types/three)
- **构建工具**: Vite
- **无后端，纯前端项目

### 依赖版本：
- typescript: ^5.x
- three: ^0.160.x
- vite: ^5.x
- @types/three: ^0.160.x

## 3. 文件结构

```
auto153/
├── package.json          # 项目配置与依赖
├── index.html           # 入口HTML
├── tsconfig.json       # TypeScript严格模式配置
├── vite.config.js       # Vite构建配置(base: './')
└── src/
    ├── main.ts             # 程序入口，动画循环调度
    ├── sceneSetup.ts       # 3D场景创建与更新
    ├── controls.ts       # UI交互逻辑
    ├── cameraControl.ts  # 相机视角控制
    └── planetaryData.ts # 行星数据定义
```

## 4. 模块职责与接口

### 4.1 planetaryData.ts
- 定义PlanetData接口
- 导出八颗行星的完整数据数组
- 数据字段：name, color, orbitRadius, orbitalPeriod, rotationPeriod, inclination, equatorialRadius, mass, temperature, isGasGiant, sizeScale

### 4.2 sceneSetup.ts
- createSun(scene: Scene): {sun, sunLight, sunGlowElement}
  - 创建太阳网格、点光源、CSS光晕元素
- createPlanets(scene: Scene, planetaryData: PlanetData[]): PlanetObject[]
  - 创建行星及其纹理、公转组、轨道线
- createStarfield(scene: Scene): Points
  - 创建星空粒子背景
- createOrbitLines(scene: Scene, data: PlanetData[]): Line[]
  - 创建轨道线
- updatePlanets(planets: PlanetObject[], time: number, speedMultiplier: number): void
  - 更新行星公转与自转位置
- toggleOrbits(visible: boolean, glow: boolean): void
  - 切换轨道线显示与发光效果
- updateSelectedPlanetIndicator(planetName: string | null): void
  - 更新选中行星的光环指示器

### 4.3 cameraControl.ts
- initOrbitControls(camera: PerspectiveCamera, domElement: HTMLElement): OrbitControls
  - 初始化自由视角拖拽与缩放（带阻尼）
- flyToPlanet(camera: PerspectiveCamera, planet: Object3D, controls: OrbitControls, duration: number): Promise<void>
  - 1.5s ease-out飞行动画
- switchViewMode(mode: 'free' | 'top' | 'side', camera: PerspectiveCamera, controls: OrbitControls): Promise<void>
  - 500ms视角模式切换动画

### 4.4 controls.ts
- setupControls(params): 初始化所有UI控件事件监听
- updateSpeedDisplay(value: number): 更新速度显示
- togglePause(isPaused: boolean): 切换暂停状态与按钮图标
- setupPlanetList(planets: PlanetObject[], onSelect: (name: string) => void): 设置行星列表点击
- setupViewModeDropdown(onChange: (mode: string) => void): 视角下拉菜单

### 4.5 main.ts
- 初始化Scene、PerspectiveCamera、WebGLRenderer
- 调用sceneSetup创建所有3D对象
- 调用cameraControl初始化相机控制
- 调用controls绑定UI事件
- requestAnimationFrame动画循环：
  - 若未暂停则更新行星位置
  - 更新控制器阻尼
  - 渲染画面

## 5. 关键技术实现

### 5.1 行星纹理生成（Canvas绘制）
- 岩石行星（水星、金星、地球、火星）：噪点+渐变模拟岩石纹理
- 气态行星（木星、土星、天王星、海王星）：水平色带模拟大气条纹
- 使用CanvasTexture将Canvas转为Three.js纹理

### 5.2 轨道倾角实现
- 每个行星放在一个THREE.Group中
- Group绕X轴旋转对应轨道倾角（弧度）
- 行星在Group内Y轴方向上公转

### 5.3 相机动画
- 使用requestAnimationFrame + 手动插值实现平滑过渡
- ease-out缓动：t => 1 - Math.pow(1 - t, 3)
- 飞行动画同时移动相机位置和控制器target

### 5.4 性能优化
- 复用SphereGeometry（不同尺寸通过scale实现）
- 粒子系统使用BufferGeometry高效渲染星点
- 轨道线使用BufferGeometry + LineBasicMaterial
- 帧率监测与自适应

## 6. 构建与运行

- 开发: `npm run dev` (Vite开发服务器)
- 构建: `npm run build` (输出到dist目录)
